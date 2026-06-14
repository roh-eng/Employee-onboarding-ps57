const crypto = require('crypto');

/**
 * Portal credential helpers — employees authenticate against the PORTAL (this app),
 * not against ServiceNow Basic auth (whose API-set passwords are rejected by instance
 * policy). Passwords + one-time setup tokens are hashed with scrypt before storage.
 * No external dependencies — Node's built-in crypto only.
 */

// "scrypt$<saltHex>$<hashHex>"
function hashSecret(secret) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(String(secret), salt, 64);
    return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifySecret(secret, stored) {
    if (!stored || typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    try {
        const hash = crypto.scryptSync(String(secret), Buffer.from(parts[1], 'hex'), 64);
        const expected = Buffer.from(parts[2], 'hex');
        return expected.length === hash.length && crypto.timingSafeEqual(expected, hash);
    } catch (e) { return false; }
}

// One-time onboarding token (delivered to the employee; only its hash is stored).
function randomToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = { hashSecret, verifySecret, randomToken };
