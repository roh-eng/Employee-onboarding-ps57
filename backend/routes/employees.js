const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const logger = require('../services/logger');
const { verifyToken, requireRole } = require('../middleware/auth');
const { employeeRules, handleValidationErrors } = require('../middleware/validate');
const { fireEvent } = require('./webhooks');
const { sendMail } = require('../services/mailer');
const { hashSecret, randomToken } = require('../services/portalAuth');
const crypto = require('crypto');

// Create a one-time onboarding token, store only its hash + a 7-day expiry on the
// employee record, and return the raw token (delivered to the hire via the email link).
async function createOnboardingToken(employeeId) {
    const token = randomToken();
    const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    await snowClient.patch(`/${config.snowScope}_employee/${employeeId}`, {
        u_setup_token_hash: hashSecret(token),
        u_setup_token_expires: expires,
        u_password_hash: ''
    });
    return token;
}

const router = express.Router();
const TABLE = `${config.snowScope}_employee`;
const TASK_TABLE = `${config.snowScope}_onboarding_task`;
const NOTIF_TABLE = `${config.snowScope}_notification`;
const ONBOARDING_TASKS = ['Laptop Provisioning', 'VPN Access', 'ID Card Issuance', 'Desk Setup'];

const DEPT_LABELS = {
    it: 'IT',
    hr: 'HR',
    security: 'Security',
    facility: 'Facilities',
    facilities: 'Facilities',
    sales: 'Sales',
    marketing: 'Marketing',
    finance: 'Finance',
    engineering: 'Engineering',
    product: 'Product',
    design: 'Design',
    operations: 'Operations'
};

function getValue(value, fallback = '') {
    if (value && typeof value === 'object') return value.display_value ?? value.value ?? fallback;
    return value ?? fallback;
}

function deptLabel(department) {
    if (!department) return 'the team';
    const key = department.toString().toLowerCase();
    return DEPT_LABELS[key] || (department.charAt(0).toUpperCase() + department.slice(1));
}

const formatEmployee = (sysObj) => ({
    id: getValue(sysObj.sys_id),
    name: getValue(sysObj.name),
    email: getValue(sysObj.email),
    department: getValue(sysObj.department),
    joiningDate: getValue(sysObj.joining_date),
    status: getValue(sysObj.status),
    teamName: getValue(sysObj.u_team_name),
    teamLead: getValue(sysObj.u_team_lead),
    manager: getValue(sysObj.u_manager),
    workLocation: getValue(sysObj.u_work_location)
});

// Generate a strong temporary password (guaranteed upper/lower/digit/symbol, 12 chars).
function genTempPassword() {
    const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ', L = 'abcdefghijkmnpqrstuvwxyz', D = '23456789', S = '@#$%&*';
    const pick = (s) => s[crypto.randomInt(s.length)];
    const chars = [pick(U), pick(L), pick(D), pick(S)];
    const all = U + L + D + S;
    while (chars.length < 12) chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    return chars.join('');
}

// Least-privilege roles every provisioned employee receives:
//  - snc_basic_auth_api_access → lets them authenticate via Basic-auth REST (login)
//  - <scope>.user             → access to the onboarding app, resolved as 'employee'
const PROVISION_ROLES = ['snc_basic_auth_api_access', `${config.snowScope}.user`];

async function grantProvisioningRoles(userSysId) {
    const granted = [];
    for (const roleName of PROVISION_ROLES) {
        try {
            const r = await snowClient.get(`/sys_user_role?sysparm_query=name=${encodeURIComponent(roleName)}&sysparm_fields=sys_id&sysparm_limit=1`);
            const roleId = r.data.result && r.data.result[0] && r.data.result[0].sys_id;
            if (!roleId) { logger.warn(`Provisioning role not found: ${roleName}`); continue; }
            await snowClient.post('/sys_user_has_role', { user: userSysId, role: roleId });
            granted.push(roleName);
        } catch (err) {
            logger.warn(`Could not grant provisioning role ${roleName}`, { error: err.message });
        }
    }
    return granted;
}

// Option A: auto-provision a ServiceNow sys_user login for a new hire.
// Username is derived from the email local-part (kept unique); the temp password is
// delivered to the hire in the welcome email. Linked to the employee record by email.
async function provisionUserAccount(employee) {
    if (!employee.email) return { provisioned: false, reason: 'no-email' };
    const base = (String(employee.email).split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '')) || `user${Date.now()}`;
    let username = base;
    try {
        for (let i = 0; i < 6; i++) {
            const check = await snowClient.get(`/sys_user?sysparm_query=user_name=${encodeURIComponent(username)}&sysparm_fields=sys_id&sysparm_limit=1`);
            if (!check.data.result || !check.data.result.length) break;   // available
            username = `${base}${i + 2}`;
        }
    } catch (err) { /* lookup failed — proceed with the derived name */ }

    const tempPassword = genTempPassword();
    const [firstName, ...rest] = (employee.name || '').trim().split(/\s+/);
    try {
        const res = await snowClient.post('/sys_user', {
            user_name: username,
            first_name: firstName || (employee.name || username),
            last_name: rest.join(' '),
            name: employee.name || username,
            email: employee.email,
            user_password: tempPassword,
            active: 'true',
            title: 'Onboarding Employee'
        });
        const sysId = res.data.result?.sys_id;
        const roles = await grantProvisioningRoles(sysId);
        logger.info('Provisioned sys_user for new hire', { username, sysId, roles, employee: employee.name });
        return { provisioned: true, username, tempPassword, sysId, roles };
    } catch (err) {
        logger.warn('Could not provision sys_user login', { error: err.message, employee: employee.name });
        return { provisioned: false, reason: err.message };
    }
}

async function sendOnboardingWelcome(employee, opts = {}) {
    const firstName = (employee.name || '').split(' ')[0] || 'there';
    const dept = deptLabel(employee.department);

    try {
        await snowClient.post(`/${NOTIF_TABLE}`, {
            message: `${employee.name} has joined ${dept} - onboarding started.`,
            recipient: 'ALL'
        });
    } catch (err) {
        logger.warn('Onboarding notification could not be created', { error: err.message });
    }

    if (!employee.email) return { sent: false, reason: 'no-email' };

    const taskText = ONBOARDING_TASKS.map((task) => `  - ${task}`).join('\n');
    const taskHtml = ONBOARDING_TASKS.map((task) => `<li>${task}</li>`).join('');
    // Secure onboarding: the hire SETS their own password via a one-time link, then
    // logs in with their email. No password is sent by email.
    const loginText = opts && opts.setupUrl
        ? `\nSet your password to activate your account (link valid 7 days):\n  ${opts.setupUrl}\n\nAfter that, log in with your email: ${employee.email}\n`
        : '';
    const loginHtml = opts && opts.setupUrl
        ? `<div style="margin:0 0 18px;padding:14px 16px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;">
            <div style="font-weight:600;margin-bottom:8px;">Activate your account</div>
            <a href="${opts.setupUrl}" style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Set your password</a>
            <div style="color:#64748b;font-size:.82rem;margin-top:8px;">Link valid for 7 days. Then sign in with your email: <strong>${employee.email}</strong>.</div>
        </div>`
        : '';
    const subject = `Welcome to Enterprise Workflow Hub, ${firstName}!`;
    const text = `Hi ${firstName},\n\nWelcome aboard! Your onboarding has started in the Enterprise Workflow Hub.\n\n  Department:   ${dept}\n  Joining date: ${employee.joiningDate || '-'}\n\nYour onboarding checklist has been created:\n${taskText}\n${loginText}\nLog in to track and complete your tasks:\n${config.appBaseUrl}/login.html\n\nSee you soon,\nThe People Team`;
    const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
        <div style="background:linear-gradient(135deg,#0e7490,#0369a1);color:#fff;padding:28px 24px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:1.4rem;">Welcome aboard, ${firstName}!</h1>
            <p style="margin:8px 0 0;opacity:.9;">Your onboarding has started.</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
            <p>We're excited to have you join <strong>${dept}</strong>.</p>
            <p style="margin:0 0 4px;color:#64748b;font-size:.9rem;">Joining date</p>
            <p style="margin:0 0 16px;font-weight:600;">${employee.joiningDate || '-'}</p>
            <p style="margin:0 0 6px;">Your onboarding checklist:</p>
            <ul style="margin:0 0 18px;padding-left:20px;line-height:1.8;">${taskHtml}</ul>
            ${loginHtml}
            <a href="${config.appBaseUrl}/login.html" style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Open the Onboarding Hub</a>
            <p style="margin:22px 0 0;color:#64748b;font-size:.85rem;">The People Team</p>
        </div>
    </div>`;

    return sendMail({ to: employee.email, subject, text, html });
}

async function completeEmployeeOnboardingTasks(employeeId) {
    // ServiceNow stores the status choice value lowercase ('completed'/'pending'), so the
    // query and the value we set must be lowercase too, or nothing matches/updates.
    const query = encodeURIComponent(`employee=${employeeId}^status!=completed`);
    const response = await snowClient.get(`/${TASK_TABLE}?sysparm_query=${query}&sysparm_display_value=all`);
    const tasks = response.data.result || [];
    const completed = [];

    for (const task of tasks) {
        const taskId = getValue(task.sys_id);
        if (!taskId) continue;
        const result = await snowClient.put(`/${TASK_TABLE}/${taskId}`, { status: 'completed' });
        completed.push({ id: taskId, status: getValue(result.data.result?.status, 'completed') });
    }

    return completed;
}

// HR/Manager only — the directory carries names/emails/departments for all staff.
// (Employees never call this; their "Employees" view shows only their own profile.)
router.get('/', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${TABLE}`);
        res.json((response.data.result || []).map(formatEmployee));
    } catch (err) { next(err); }
});

// The logged-in employee's OWN onboarding data (real status + task completion).
// Any authenticated user; returns {found:false} for demo/staff with no employee record
// so the frontend can fall back to its demo dataset.
router.get('/me', verifyToken, async (req, res) => {
    try {
        const id = req.user && req.user.userId;
        if (!id || String(id).startsWith('demo-')) return res.json({ found: false });
        const empRes = await snowClient.get(`/${TABLE}/${id}?sysparm_fields=sys_id,name,email,department,joining_date,status,u_team_name,u_team_lead,u_manager,u_work_location`);
        const e = empRes.data.result;
        if (!e || !e.sys_id) return res.json({ found: false });
        // Ownership: only THIS employee's tasks (server-side filter by their record id).
        const tRes = await snowClient.get(`/${TASK_TABLE}?sysparm_query=employee=${id}&sysparm_display_value=all&sysparm_fields=sys_id,task_type,assigned_to,status`);
        const tasks = (tRes.data.result || []).map(t => ({
            id: getValue(t.sys_id), taskType: getValue(t.task_type), assignedTo: getValue(t.assigned_to), status: getValue(t.status)
        }));
        const total = tasks.length;
        const completed = tasks.filter(t => String(t.status).toLowerCase() === 'completed').length;
        res.json({
            found: true,
            profile: {
                id: e.sys_id, name: e.name, email: e.email, department: e.department, joiningDate: e.joining_date, status: e.status,
                teamName: e.u_team_name, teamLead: e.u_team_lead, manager: e.u_manager, workLocation: e.u_work_location
            },
            tasks, total, completed,
            progress: total ? Math.round((completed / total) * 100) : 0
        });
    } catch (err) {
        logger.warn('GET /employees/me failed', { error: err.message });
        res.json({ found: false });
    }
});

router.post('/', verifyToken, requireRole('hr'), employeeRules, handleValidationErrors, async (req, res, next) => {
    try {
        const payload = {
            name: req.body.name,
            email: req.body.email,
            department: req.body.department,
            joining_date: req.body.joiningDate,
            status: 'pending',
            // Team information (HR-assigned at creation; employees view read-only)
            u_team_name: req.body.teamName || '',
            u_team_lead: req.body.teamLead || '',
            u_manager: req.body.manager || '',
            u_work_location: req.body.workLocation || ''
        };
        const response = await snowClient.post(`/${TABLE}`, payload);
        logger.info('Employee created', { id: response.data.result?.sys_id });
        const employee = formatEmployee(response.data.result);
        fireEvent('employee.created', employee).catch(() => {});

        // Preserve provisioning (creates the ServiceNow user/identity + roles).
        let account = { provisioned: false };
        try { account = await provisionUserAccount(employee); }
        catch (err) { logger.warn('User provisioning failed', { error: err.message }); }

        // Secure portal credential: issue a one-time "set password" onboarding link.
        let setupUrl = null;
        try {
            const token = await createOnboardingToken(employee.id);
            setupUrl = `${config.appBaseUrl}/set-password.html?e=${encodeURIComponent(employee.email)}&t=${token}`;
        } catch (err) { logger.warn('Onboarding token creation failed', { error: err.message }); }

        let onboardingEmail = { sent: false };
        try { onboardingEmail = await sendOnboardingWelcome(employee, { setupUrl }); }
        catch (err) { logger.warn('Onboarding welcome failed', { error: err.message }); }

        res.status(201).json({
            ...employee,
            account: { provisioned: account.provisioned, username: account.username || null, roles: account.roles || [] },
            setupUrl,
            onboardingEmail
        });
    } catch (err) { next(err); }
});

router.post('/:id/approve', verifyToken, requireRole('hr'), async (req, res, next) => {
    try {
        const employeeId = req.params.id;
        const completedTasks = await completeEmployeeOnboardingTasks(employeeId);
        const response = await snowClient.patch(`/${TABLE}/${employeeId}`, { status: 'onboarded' });
        const employee = formatEmployee(response.data.result);
        fireEvent('employee.onboarding_approved', { employee, completedTasks }).catch(() => {});
        logger.info('Employee onboarding approved', {
            id: employeeId,
            approvedBy: req.user.userName,
            completedTaskCount: completedTasks.length
        });
        res.json({ success: true, employee, completedTasks });
    } catch (err) { next(err); }
});

module.exports = router;