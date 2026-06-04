require('dotenv').config();
const axios = require('axios');

const config = {
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: { username: process.env.SERVICENOW_USERNAME, password: process.env.SERVICENOW_PASSWORD },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
};
const client = axios.create(config);

async function checkMenus() {
    try {
        console.log('Querying ServiceNow for all menu modules...');
        
        // Fetch all modules from the sys_app_module table
        const res = await client.get('/sys_app_module?sysparm_fields=title,link_type,name&sysparm_limit=5000');
        const modules = res.data.result;
        
        let withTable = 0;
        let withoutTable = 0;
        
        modules.forEach(m => {
            // The 'name' field in sys_app_module stores the table name.
            // If it is empty, the menu does NOT point to a table.
            if (m.name) {
                withTable++;
            } else {
                withoutTable++;
            }
        });
        
        console.log(`\n--- SERVICENOW MENU STATISTICS ---`);
        console.log(`Total Menus (Modules) Analyzed: ${modules.length}`);
        console.log(`Menus attached to a Table: ${withTable}`);
        console.log(`Menus NOT attached to any Table: ${withoutTable}`);
        console.log(`----------------------------------\n`);
        
        console.log('Here are 5 examples of menus in your instance that DO NOT use a table:');
        const examples = modules.filter(m => !m.name).slice(0, 5);
        examples.forEach(ex => {
            console.log(`- Menu Title: "${ex.title}" | Link Type: ${ex.link_type}`);
        });
        
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

checkMenus();
