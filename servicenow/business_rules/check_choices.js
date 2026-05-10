require('dotenv').config();
const axios = require('axios');

const snowClient = axios.create({
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: {
        username: process.env.SERVICENOW_USERNAME,
        password: process.env.SERVICENOW_PASSWORD
    }
});

async function checkChoices() {
    try {
        console.log("Fetching choices for delay_risk and sla_status...");
        const res = await snowClient.get('/sys_choice?sysparm_query=name=x_1850353_employ_0_project_sprint_task^elementINdelay_risk,sla_status&sysparm_fields=element,label,value');
        console.log("Choices found:", res.data.result);
    } catch(err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

checkChoices();
