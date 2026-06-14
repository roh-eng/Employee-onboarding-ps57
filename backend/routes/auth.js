const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');
const logger = require('../services/logger');
const { loginRules, handleValidationErrors } = require('../middleware/validate');
const { authLimiter } = require('../middleware/security');
const snowClient = require('../services/snowClient');
const { hashSecret, verifySecret } = require('../services/portalAuth');

const router = express.Router();
const EMP_TABLE = `${config.snowScope}_employee`;

router.post('/login', authLimiter, loginRules, handleValidationErrors, async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // ── Demo / test accounts (work WITHOUT ServiceNow — for presentations/local demos) ──
        // These let you sign in and explore the app even when the ServiceNow PDI is asleep
        // or unreachable. They are also mirrored as real users in the ServiceNow sys_user
        // table (see secure-auth-implementation/TEST_CREDENTIALS.md). All three are regular
        // EMPLOYEES — sign in with your own ServiceNow admin login to demo the admin side.
        // Disable these for a real production deployment.
        // Demo logins are DISABLED in production (gate on NODE_ENV). In production set
        // NODE_ENV=production so these hardcoded accounts never authenticate; an explicit
        // ALLOW_DEMO_LOGINS=true can re-enable them if ever needed.
        const demoLoginsEnabled = config.nodeEnv !== 'production' || process.env.ALLOW_DEMO_LOGINS === 'true';
        const DEMO_USERS = {
            sarah_employee: { password: 'Sarah@5678', name: 'Sarah Johnson', role: 'employee', email: 'sarah.johnson@enterprisehub.com' },
            john_employee:  { password: 'John@9012',  name: 'John Carter',   role: 'employee', email: 'john.carter@enterprisehub.com' },
            emma_employee:  { password: 'Emma@3456',  name: 'Emma Wilson',   role: 'employee', email: 'emma.wilson@enterprisehub.com' },
        };
        const demo = demoLoginsEnabled ? DEMO_USERS[(username || '').trim().toLowerCase()] : null;
        if (demo && demo.password === password) {
            const demoId = `demo-${(username || '').trim().toLowerCase()}`;
            const token = jwt.sign(
                { userId: demoId, userName: demo.name, role: demo.role, email: demo.email },
                config.jwtSecret,
                { expiresIn: config.jwtExpiresIn }
            );
            logger.info(`Demo user authenticated: ${username} (${demo.role})`);
            return res.json({ success: true, token, userName: demo.name, userId: demoId, role: demo.role, email: demo.email });
        }

        // ── Portal employees: authenticate against the app credential they set via the
        // onboarding link (stored as a scrypt hash on their employee record), NOT against
        // ServiceNow Basic auth. Looked up by email; data still flows via the service account. ──
        try {
            const empRes = await snowClient.get(`/${EMP_TABLE}?sysparm_query=email=${encodeURIComponent(username)}&sysparm_fields=sys_id,name,email,u_password_hash&sysparm_limit=1`);
            const emp = (empRes.data.result || [])[0];
            if (emp && emp.u_password_hash) {
                if (!verifySecret(password, emp.u_password_hash)) {
                    return res.status(401).json({ success: false, error: 'Invalid credentials.' });
                }
                const token = jwt.sign(
                    { userId: emp.sys_id, userName: emp.name, role: 'employee', email: emp.email },
                    config.jwtSecret, { expiresIn: config.jwtExpiresIn }
                );
                logger.info(`Portal employee authenticated: ${emp.email}`);
                return res.json({ success: true, token, userName: emp.name, userId: emp.sys_id, role: 'employee', email: emp.email });
            }
        } catch (e) {
            logger.warn('Portal credential lookup failed, continuing to staff auth', { error: e.message });
        }

        // ── Option B: validate via a ServiceNow Scripted REST endpoint ───────────────
        // Works for users with NO ServiceNow roles (who can't read the sys_user table).
        // The endpoint runs AS the calling user, so a wrong password is rejected (401)
        // by ServiceNow before the script runs; a valid one returns identity + roles.
        // Opt-in via SERVICENOW_VALIDATE_PATH; on any non-auth error we fall back below.
        if (config.snowValidatePath) {
            try {
                const vr = await axios.get(`${config.snowInstance}${config.snowValidatePath}`, {
                    auth: { username, password },
                    headers: { 'Accept': 'application/json' }
                });
                const u = (vr.data && (vr.data.result || vr.data)) || {};
                if (u.valid === true || u.sysId) {
                    // Prefer the role resolved server-side by the validate script; fall back
                    // to mapping a raw roles[] array if an older endpoint returns that instead.
                    let resolvedRole = String(u.role || '').toLowerCase();
                    if (!['hr', 'manager', 'employee'].includes(resolvedRole)) {
                        const roles = (u.roles || []).map(r => String(r).toLowerCase());
                        resolvedRole = 'employee';
                        if (roles.some(r => r.includes('admin') || r.includes('hr_manager') || r.includes('x_1850353_employ_0.admin'))) resolvedRole = 'hr';
                        else if (roles.some(r => r.includes('manager') || r.includes('project_manager') || r.includes('itil') || r.includes('x_1850353_employ_0.manager'))) resolvedRole = 'manager';
                    }
                    const token = jwt.sign(
                        { userId: u.sysId, userName: u.name || username, role: resolvedRole, email: u.email },
                        config.jwtSecret, { expiresIn: config.jwtExpiresIn }
                    );
                    logger.info(`User authenticated via validate endpoint: ${username} (${resolvedRole})`);
                    return res.json({ success: true, token, userName: u.name || username, userId: u.sysId, role: resolvedRole, email: u.email });
                }
                return res.status(401).json({ success: false, error: 'Invalid credentials.' });
            } catch (vErr) {
                const status = vErr.response && vErr.response.status;
                if (status === 401 || status === 403) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
                logger.warn(`Validate endpoint unavailable for ${username}, using legacy flow`, { error: vErr.message });
                // fall through to the legacy Basic-auth flow
            }
        }

        const tempClient = axios.create({
            baseURL: `${config.snowInstance}/api/now/table`,
            auth: { username, password },
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });

        const response = await tempClient.get(`/sys_user?sysparm_query=user_name=${encodeURIComponent(username)}&sysparm_limit=1`);

        if (response.data.result && response.data.result.length > 0) {
            const user = response.data.result[0];

            // ── Server-side role lookup from ServiceNow ─────────────────────────
            let resolvedRole = 'employee';
            try {
                const roleRes = await tempClient.get(`/sys_user_has_role?sysparm_query=user=${user.sys_id}&sysparm_fields=role.name,role&sysparm_display_value=true`);
                const roles = (roleRes.data.result || []).map(r => (r.role && r.role.display_value) || r.role || '').map(r => r.toLowerCase());
                logger.info(`ServiceNow roles for ${username}: ${roles.join(', ')}`);

                // Map ServiceNow roles to app roles (highest privilege wins)
                if (roles.some(r => r.includes('admin') || r.includes('hr_manager') || r.includes('x_1850353_employ_0.admin'))) {
                    resolvedRole = 'hr';
                } else if (roles.some(r => r.includes('manager') || r.includes('project_manager') || r.includes('itil') || r.includes('x_1850353_employ_0.manager'))) {
                    resolvedRole = 'manager';
                } else if (roles.some(r => r.includes('user') || r.includes('employee') || r.includes('x_1850353_employ_0.user'))) {
                    resolvedRole = 'employee';
                }
            } catch (roleErr) {
                logger.warn(`Role lookup failed for ${username}, defaulting to employee`, { error: roleErr.message });
            }

            const token = jwt.sign(
                { userId: user.sys_id, userName: user.name || username, role: resolvedRole },
                config.jwtSecret,
                { expiresIn: config.jwtExpiresIn }
            );

            logger.info(`User authenticated: ${username} with role ${resolvedRole}`);
            res.json({
                success: true,
                token,
                userName: user.name || username,
                userId: user.sys_id,
                role: resolvedRole
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
    } catch (err) {
        logger.error(`Login failed for ${req.body.username}`, { error: err.message });
        res.status(401).json({ success: false, error: 'Invalid credentials or ServiceNow unreachable.' });
    }
});

// One-time onboarding "set password" — consumes the token from the email link and
// stores a scrypt hash of the chosen password on the employee record. Single-use.
router.post('/set-password', authLimiter, async (req, res) => {
    try {
        const { email, token, newPassword } = req.body || {};
        if (!email || !token || !newPassword || String(newPassword).length < 8) {
            return res.status(400).json({ success: false, error: 'email, token and an 8+ character password are required.' });
        }
        const r = await snowClient.get(`/${EMP_TABLE}?sysparm_query=email=${encodeURIComponent(email)}&sysparm_fields=sys_id,u_setup_token_hash,u_setup_token_expires&sysparm_limit=1`);
        const emp = (r.data.result || [])[0];
        const valid = emp && emp.u_setup_token_hash && verifySecret(token, emp.u_setup_token_hash)
            && emp.u_setup_token_expires && new Date(emp.u_setup_token_expires) >= new Date();
        if (!valid) return res.status(400).json({ success: false, error: 'Invalid or expired setup link.' });

        await snowClient.patch(`/${EMP_TABLE}/${emp.sys_id}`, {
            u_password_hash: hashSecret(newPassword),
            u_setup_token_hash: '',
            u_setup_token_expires: ''
        });
        logger.info(`Portal password set for ${email}`);
        res.json({ success: true, message: 'Password set. You can now log in with your email.' });
    } catch (err) {
        logger.error('Set-password failed', { error: err.message });
        res.status(500).json({ success: false, error: 'Could not set password.' });
    }
});

router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/session', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token.' });

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        res.json({ success: true, user: decoded });
    } catch (err) {
        res.status(401).json({ success: false, error: 'Invalid token.' });
    }
});

module.exports = router;
