/**
 * middleware/authMiddleware.js
 * ────────────────────────────────────────────────────────────────────────
 * Protects routes by requiring a valid app session token (JWT).
 *
 * Flow:
 *   1. Read the `Authorization: Bearer <token>` header.
 *   2. Verify the token's signature and expiry with our JWT secret.
 *   3. Attach a clean `req.user` for downstream handlers, or
 *   4. Respond 401 if the token is missing / malformed / invalid / expired.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

function authMiddleware(req, res, next) {
  // 1) Expect exactly: "Bearer <token>"
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
    const payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });

    // 3) Expose only what handlers need — never the raw token.
    req.user = {
      id: payload.sub,    // ServiceNow sys_id of the user
      name: payload.name,
      role: payload.role,
    };
    return next();
  } catch (err) {
    // 4) Distinguish "expired" (client should re-login) from other failures,
    //    but never leak crypto details.
    const reason = err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
    return res.status(401).json({ success: false, error: reason });
  }
}

/**
 * Optional add-on: require a specific role AFTER authentication.
 * Usage:  router.get('/admin', authMiddleware, requireRole('hr'), handler)
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
