require('dotenv').config();
const axios = require('axios');

const snowClient = axios.create({
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: {
        username: process.env.SERVICENOW_USERNAME,
        password: process.env.SERVICENOW_PASSWORD
    }
});

const brScript = `(function executeRule(current, previous /*null when async*/) {

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

})(current, previous);`;

async function createBR() {
    try {
        console.log("Creating AI Business Rule in ServiceNow...");
        const payload = {
            name: "AI Bottleneck Risk Predictor Auto",
            collection: "x_1850353_employ_0_project_sprint_task",
            action_update: true,
            action_insert: true,
            when: "before",
            advanced: true,
            active: true,
            script: brScript,
            sys_scope: "x_1850353_employ_0"
        };
        const res = await snowClient.post('/sys_script', payload);
        console.log("Business Rule created successfully! Sys ID:", res.data.result.sys_id);
    } catch(err) {
        console.error("Error creating Business Rule:", err.response ? err.response.data : err.message);
    }
}

createBR();
