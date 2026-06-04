/**
 * ServiceNow Menu & Module Creation Script
 * Run: node servicenow/create_menu_module.js
 * Creates an Application Menu and a Module via REST API
 */
require('dotenv').config();
const axios = require('axios');

const config = {
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: { username: process.env.SERVICENOW_USERNAME, password: process.env.SERVICENOW_PASSWORD },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
};
const client = axios.create(config);
const SCOPE = process.env.SERVICENOW_SCOPE || 'global';

async function createMenuAndModule() {
    try {
        console.log('Creating Application Menu...');
        
        // Step 1: Create Application Menu (sys_app_application)
        const appMenuPayload = {
            title: 'Custom Workflow App', // Name of the menu in the navigator
            sys_scope: SCOPE,
            active: true
        };
        const appMenuRes = await client.post('/sys_app_application', appMenuPayload);
        const appMenuId = appMenuRes.data.result.sys_id;
        console.log(`Application Menu created! sys_id: ${appMenuId}`);

        console.log('Creating Module underneath the Menu...');
        
        // Step 2: Create a Module (sys_app_module) that points to a table
        const modulePayload = {
            title: 'My Active Incidents', // Name of the link
            application: appMenuId, // Link it to the menu we just created
            sys_scope: SCOPE,
            link_type: 'LIST', // 'LIST' means it points to a list of records in a table
            name: 'incident', // The table it points to
            filter: 'active=true', // Example filter (shows only active tickets)
            order: 100,
            active: true
        };
        
        // Note: If you wanted a URL instead of a table, you would use:
        // link_type: 'URI', 
        // query: 'https://www.google.com' (instead of name and filter)

        const moduleRes = await client.post('/sys_app_module', modulePayload);
        console.log(`Module created! sys_id: ${moduleRes.data.result.sys_id}`);

        console.log('\nDone! Refresh your ServiceNow Application Navigator to see "Custom Workflow App".');
    } catch (err) {
        console.error('Error:', err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
}

createMenuAndModule();
