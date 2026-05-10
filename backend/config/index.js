require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    snowInstance: process.env.SERVICENOW_INSTANCE,
    snowUser: process.env.SERVICENOW_USERNAME,
    snowPass: process.env.SERVICENOW_PASSWORD,
    snowScope: process.env.SERVICENOW_SCOPE,
    geminiKey: process.env.GEMINI_API_KEY,
    jwtSecret: process.env.JWT_SECRET || 'enterprise-workflow-hub-jwt-secret-2026',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h'
};
