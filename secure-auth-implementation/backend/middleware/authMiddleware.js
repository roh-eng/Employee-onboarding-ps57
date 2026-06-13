/**
 * backend/middleware/authMiddleware.js
 * ════════════════════════════════════════════════════════════════════════
 * Protects routes by requiring a valid app session token (JWT).
 *
 * How it works:
 *   1. Read the `Authorization: Bearer <token>` header.
 *   2. Verify the token's signature + expiry with our JWT secret.
 *   3. Attach a clean `req.user` for downstream handlers, OR
 *   4. Respond 401 if the token is missing / malformed / invalid / expired.
 *
 * Usage:
 *     const auth = require('./backend/middleware/authMiddleware');
 *     router.get('/protected', auth, handler);                 // any logged-in user
 *     router.get('/admin', auth, auth.requireRole('hr'), fn);  // + role check
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  // 1) Expect exactly "Bearer <token>".
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      error: 'Missing or malformed Authorization header. Expected "Bearer <token>".',
    });
  }

  // 2) Verify. jwt.verify throws on a bad signature, tampering, or expiry.
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // 3) Expose only what handlers need — never the raw token.
    req.user = {
      id: payload.sub,    // ServiceNow sys_id of the user
      name: payload.name,
      role: payload.role,
    };
    return next();
  } catch (err) {
    // 4) Distinguish "expired" (client should re-login) from other failures,
    //    without leaking cryptographic details.
    const reason = err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
    return res.status(401).json({ success: false, error: reason });
  }
}

/**
 * Optional add-on: require a specific role AFTER authentication.
 * Returns 403 if the authenticated user lacks the role.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions.' });
    }
    next();
  };
}

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
