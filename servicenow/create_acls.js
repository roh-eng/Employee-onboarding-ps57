/**
 * ServiceNow ACL Creation Script for Daily Menu
 * Run: node servicenow/create_acls.js
 */
require('dotenv').config();
const axios = require('axios');

const client = axios.create({
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: { username: process.env.SERVICENOW_USERNAME, password: process.env.SERVICENOW_PASSWORD },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
});

const SCOPE = process.env.SERVICENOW_SCOPE;
const TABLE_NAME = `${SCOPE}_daily_menu`;

async function createACLs() {
    const acls = [
        { operation: 'read', name: TABLE_NAME, admin_overrides: true, active: true, description: 'Allow all users to read daily menu' },
        { operation: 'write', name: TABLE_NAME, admin_overrides: true, active: true, description: 'Allow HR to manage daily menu' },
        { operation: 'create', name: TABLE_NAME, admin_overrides: true, active: true, description: 'Allow HR to create daily menu items' },
        { operation: 'delete', name: TABLE_NAME, admin_overrides: true, active: true, description: 'Allow HR to delete daily menu items' }
    ];

    for (const acl of acls) {
        try {
            const res = await client.post('/sys_security_acl', { ...acl, sys_scope: SCOPE });
            console.log(`ACL created: ${acl.operation} -> ${res.data.result.sys_id}`);
        } catch (err) {
            console.error(`ACL ${acl.operation} failed:`, err.response ? err.response.data.error.message : err.message);
        }
    }
}

createACLs();
