const config = require('../config');
const logger = require('./logger');

/**
 * Email delivery service (nodemailer).
 *
 * Three modes, chosen automatically:
 *   1. Real SMTP   — when SMTP_HOST + SMTP_USER are set (e.g. Brevo, Mailjet, Gmail).
 *                    Delivers to the real recipient inbox.
 *   2. Ethereal    — when SMTP is NOT configured. A free, zero-signup test inbox is
 *                    created on the fly; mail is "sent" and a preview URL is returned
 *                    so you can SEE the rendered email (not delivered to a real inbox).
 *   3. Disabled    — only if nodemailer itself can't load.
 *
 * sendMail never throws — failures are reported in the return value so callers can
 * fall back to in-app notifications.
 */

let transporter = null;
let isTest = false;          // true when using the Ethereal test inbox
let initError = null;
let initPromise = null;
let nodemailer = null;

async function initTransporter() {
    try {
        nodemailer = require('nodemailer');
    } catch (e) {
        initError = 'nodemailer-unavailable';
        logger.warn('nodemailer not available — email disabled', { error: e.message });
        return;
    }

    // 1) Real SMTP relay (production / real delivery)
    if (config.smtp.host && config.smtp.user) {
        transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            auth: { user: config.smtp.user, pass: config.smtp.pass }
        });
        logger.info('SMTP mailer initialized (real delivery)', { host: config.smtp.host, port: config.smtp.port });
        return;
    }

    // 2) No SMTP configured → free Ethereal test inbox (preview URL, no signup)
    try {
        const testAcct = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAcct.user, pass: testAcct.pass }
        });
        isTest = true;
        logger.info('Ethereal test mailer initialized — no SMTP configured; emails go to a preview URL (set SMTP_* in .env for real delivery)', { user: testAcct.user });
    } catch (e) {
        initError = 'ethereal-init-failed';
        logger.warn('Could not init Ethereal test mailer (no network?) — email falls back to in-app only', { error: e.message });
    }
}

async function getTransporter() {
    if (!initPromise) initPromise = initTransporter();
    await initPromise;
    return transporter;
}

/**
 * @returns {Promise<{sent: boolean, reason?: string, messageId?: string, previewUrl?: string, test?: boolean}>}
 */
async function sendMail({ to, subject, text, html }) {
    const tx = await getTransporter();
    if (!tx) return { sent: false, reason: initError || 'smtp-not-configured' };

    try {
        const info = await tx.sendMail({
            from: config.smtp.from || 'Onboarding Hub <onboarding@enterprisehub.com>',
            to,
            subject,
            text,
            html: html || undefined
        });
        const previewUrl = isTest && nodemailer ? nodemailer.getTestMessageUrl(info) : undefined;
        logger.info('Email sent', { to, subject, messageId: info.messageId, previewUrl });
        return { sent: true, messageId: info.messageId, previewUrl, test: isTest };
    } catch (err) {
        logger.error('Email send failed', { to, subject, error: err.message });
        return { sent: false, reason: err.message };
    }
}

// "Configured" for real delivery (Ethereal test mode is not counted as configured).
function isConfigured() {
    return Boolean(config.smtp.host && config.smtp.user);
}

module.exports = { sendMail, isConfigured };
