/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ServiceNow Business Rules — Consolidated Extract
 * Source: Employee Workflow Hub (x_1850353_employ_0)
 * Extracted from: update/sys_script_*.xml files in the application update set
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * These scripts run server-side on the ServiceNow platform.
 * Table: x_1850353_employ_0_project_sprint_task
 * When: before insert / before update
 * Advanced: true
 */

/* ──────────────────────────────────────────────────────────────────────────────
 * BUSINESS RULE 1 of 2
 * Name        : AI Bottleneck Risk Predictor
 * Sys ID      : da7bdbd4c3f4471028b37cec0501317e
 * Table       : x_1850353_employ_0_project_sprint_task
 * When        : before
 * Insert      : true
 * Update      : true
 * Order       : 100
 * Active      : true
 * Created     : 2026-05-08 06:39:29 by admin
 * Updated     : 2026-05-09 16:48:57 by admin
 * Description : AI-driven risk escalation based on progress percentage vs SLA status.
 *               Automatically elevates delay_risk to High/Medium/Low.
 * ───────────────────────────────────────────────────────────────────────────── */

function aiBottleneckRiskPredictor(current, previous) {
    // 1. Ensure we only run logic if the task is actually active
    if (current.sla_status == 'Met' || current.sla_status == 'Breached') {
        return;
    }

    // 2. Grab the current progress from the field
    var progress = parseInt(current.progress, 10);

    // Safety check if progress is empty
    if (isNaN(progress)) {
        progress = 0;
    }

    // 3. AI LOGIC: If progress is dangerously low while in progress
    if (progress < 50 && current.sla_status == 'In Progress') {

        // Elevate risk to High automatically
        current.delay_risk = 'High';
        gs.addErrorMessage('AI Warning: Task escalated to High Risk due to slow progress.');

    }
    // 4. AI LOGIC: If progress is okay but not done
    else if (progress >= 50 && progress < 90) {
        current.delay_risk = 'Medium';
    }
    // 5. AI LOGIC: If progress is great
    else if (progress >= 90) {
        current.delay_risk = 'Low';
    }
}

/* ──────────────────────────────────────────────────────────────────────────────
 * BUSINESS RULE 2 of 2
 * Name        : AI Bottleneck Risk Predictor Auto
 * Sys ID      : fd46c8e8c33c471028b37cec050131e7
 * Table       : x_1850353_employ_0_project_sprint_task
 * When        : before
 * Insert      : true
 * Update      : true
 * Order       : 100
 * Active      : true
 * Created     : 2026-05-08 09:43:46 by admin
 * Updated     : 2026-05-09 16:55:17 by admin
 * Description : Companion auto-rule with lowercase choice values for robustness.
 *               Same AI logic as Rule 1 but uses lowercase internal values.
 * ───────────────────────────────────────────────────────────────────────────── */

function aiBottleneckRiskPredictorAuto(current, previous) {
    var progress = parseInt(current.progress, 10);
    if (isNaN(progress)) progress = 0;

    if (current.sla_status == 'met' || current.sla_status == 'breached') {
        return;
    }

    if (progress < 50 && current.sla_status == 'in_progress') {
        current.delay_risk = 'high';
        gs.addErrorMessage('AI Warning: Task escalated to High Risk due to slow progress.');
    }
    else if (progress >= 50 && progress < 90) {
        current.delay_risk = 'medium';
    }
    else if (progress >= 90) {
        current.delay_risk = 'low';
    }
}

/* ──────────────────────────────────────────────────────────────────────────────
 * EXPORTS (for documentation / reference only)
 * In ServiceNow these are invoked as:
 *   (function executeRule(current, previous) { ... })(current, previous);
 * ───────────────────────────────────────────────────────────────────────────── */

module.exports = {
    aiBottleneckRiskPredictor,
    aiBottleneckRiskPredictorAuto
};
