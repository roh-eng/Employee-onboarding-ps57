require('dotenv').config();
const axios = require('axios');

const snowClient = axios.create({
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: {
        username: process.env.SERVICENOW_USERNAME,
        password: process.env.SERVICENOW_PASSWORD
    }
});

async function checkFields() {
    try {
        console.log("Fetching dictionary for table x_1850353_employ_0_project_sprint_task...");
        const res = await snowClient.get('/sys_dictionary?sysparm_query=name=x_1850353_employ_0_project_sprint_task^elementISNOTEMPTY&sysparm_fields=element,column_label');
        console.log("Fields found:", res.data.result);
    } catch(err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

checkFields();
