require('dotenv').config();

/**
 * SECURITY: JWT_SECRET must be provided via environment variable.
 * A hardcoded fallback secret is a critical security risk in production.
 * The server will refuse to start if JWT_SECRET is not set in production.
 */
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging')) {
    console.error('FATAL: JWT_SECRET environment variable is required in production/staging environments.');
    process.exit(1);
}
if (!jwtSecret && process.env.NODE_ENV !== 'test') {
    console.warn('WARNING: JWT_SECRET not set. Using insecure default — do NOT use in production!');
}

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    snowInstance: process.env.SERVICENOW_INSTANCE,
    snowUser: process.env.SERVICENOW_USERNAME,
    snowPass: process.env.SERVICENOW_PASSWORD,
    snowScope: process.env.SERVICENOW_SCOPE,
    geminiKey: process.env.GEMINI_API_KEY,
    jwtSecret: jwtSecret || 'dev-only-insecure-jwt-secret-do-not-use-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h'
};
