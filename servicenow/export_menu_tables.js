require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const config = {
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: { username: process.env.SERVICENOW_USERNAME, password: process.env.SERVICENOW_PASSWORD },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
};
const client = axios.create(config);

async function exportMenus() {
    try {
        console.log('Querying ServiceNow for all menus... This might take a few seconds.');
        
        // Fetch modules with their parent Application Menu title, their own title, and the table name
        // We use sysparm_display_value=true to get the readable text name of the Application Menu
        const res = await client.get('/sys_app_module?sysparm_fields=application,title,name,link_type&sysparm_display_value=true&sysparm_limit=10000');
        const modules = res.data.result;
        
        // Create the CSV Header
        let csvContent = 'Application Menu,Module (Link Name),Target Table,Link Type\n';
        
        modules.forEach(m => {
            // Some modules might not have a parent application or name, so we provide fallbacks
            const appMenu = m.application ? m.application.display_value : 'Unknown';
            const moduleTitle = m.title || 'Untitled';
            const tableName = m.name || 'NO TABLE'; // Shows "NO TABLE" if it doesn't use one!
            const linkType = m.link_type || 'Unknown';
            
            // Escape commas so the CSV doesn't break
            const safeApp = `"${appMenu.replace(/"/g, '""')}"`;
            const safeTitle = `"${moduleTitle.replace(/"/g, '""')}"`;
            
            csvContent += `${safeApp},${safeTitle},${tableName},${linkType}\n`;
        });
        
        // Save to a file
        fs.writeFileSync('menu_tables_report.csv', csvContent);
        
        console.log(`\nDone! Successfully exported ${modules.length} menu items.`);
        console.log(`Open 'menu_tables_report.csv' in VS Code to see exactly which table every single menu uses!`);
        
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

exportMenus();
