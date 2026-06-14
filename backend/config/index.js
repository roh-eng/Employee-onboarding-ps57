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
    // Base URL used to build the employee "set password" onboarding link.
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    // Optional: path to a ServiceNow Scripted REST endpoint that validates a user's
    // credentials and returns their identity + roles. When set, it lets users WITHOUT
    // ServiceNow roles (e.g. freshly provisioned employees) log in. Unset = legacy flow.
    snowValidatePath: process.env.SERVICENOW_VALIDATE_PATH || '',
    geminiKey: process.env.GEMINI_API_KEY,
    jwtSecret: jwtSecret || 'dev-only-insecure-jwt-secret-do-not-use-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

    // Shared secret used to verify inbound HRMS webhook signatures (optional)
    hrmsWebhookSecret: process.env.HRMS_WEBHOOK_SECRET,

    // SMTP settings for real email alerts (optional — falls back to in-app only)
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM || process.env.SMTP_USER
    }
};
