const config = require('../config');
const logger = require('./logger');

/**
 * Email delivery service (nodemailer over SMTP).
 *
 * Sends real email when SMTP_* env vars are configured; otherwise reports
 * `sent: false` with a reason so callers can fall back to in-app notifications.
 * nodemailer is required lazily so the server still boots if it isn't installed.
 */

let transporter = null;
let initError = null;

function getTransporter() {
    if (transporter || initError) return transporter;
    if (!config.smtp.host || !config.smtp.user) {
        initError = 'smtp-not-configured';
        return null;
    }
    try {
        const nodemailer = require('nodemailer');
        transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            auth: { user: config.smtp.user, pass: config.smtp.pass }
        });
        logger.info('SMTP mailer initialized', { host: config.smtp.host, port: config.smtp.port });
    } catch (e) {
        initError = 'nodemailer-unavailable';
        logger.warn('nodemailer not available — email alerts will fall back to in-app only', { error: e.message });
    }
    return transporter;
}

/**
 * @returns {Promise<{sent: boolean, reason?: string, messageId?: string}>}
 * Never throws — failures are reported in the return value.
 */
async function sendMail({ to, subject, text, html }) {
    const tx = getTransporter();
    if (!tx) return { sent: false, reason: initError || 'smtp-not-configured' };

    try {
        const info = await tx.sendMail({
            from: config.smtp.from,
            to,
            subject,
            text,
            html: html || undefined
        });
        logger.info('Email sent', { to, subject, messageId: info.messageId });
        return { sent: true, messageId: info.messageId };
    } catch (err) {
        logger.error('Email send failed', { to, subject, error: err.message });
        return { sent: false, reason: err.message };
    }
}

function isConfigured() {
    return Boolean(config.smtp.host && config.smtp.user);
}

module.exports = { sendMail, isConfigured };
