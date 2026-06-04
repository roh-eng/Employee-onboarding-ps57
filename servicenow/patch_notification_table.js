require('dotenv').config();
const axios = require('axios');

const config = {
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: { username: process.env.SERVICENOW_USERNAME, password: process.env.SERVICENOW_PASSWORD },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
};
const client = axios.create(config);
const SCOPE = process.env.SERVICENOW_SCOPE;
const TABLE_NAME = `${SCOPE}_notification`;

async function patchNotificationTable() {
    console.log(`Patching ${TABLE_NAME} to match the Node.js backend requirements...`);
    
    // The backend (routes/notifications.js) specifically expects these exact column names to exist:
    // title, type, recipient, read
    const missingColumns = [
        { column_label: 'Title', element: 'title', internal_type: 'string', max_length: 100 },
        { column_label: 'Type', element: 'type', internal_type: 'string', max_length: 40 },
        { column_label: 'Recipient', element: 'recipient', internal_type: 'string', max_length: 100 },
        { column_label: 'Read', element: 'read', internal_type: 'boolean' }
    ];

    for (const col of missingColumns) {
        try {
            const colPayload = {
                name: TABLE_NAME,
                ...col,
                sys_scope: SCOPE
            };
            await client.post('/sys_dictionary', colPayload);
            console.log(`✅ Added missing column: ${col.element}`);
        } catch (err) {
            const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
            if (errorMsg.includes('already exists')) {
                 console.log(`⚠️ Column ${col.element} already exists. Skipping.`);
            } else {
                 console.error(`❌ Error adding column ${col.element}:`, errorMsg);
            }
        }
    }
    console.log('\n🎉 Patch complete! Notifications will now correctly save to ServiceNow instead of the in-memory fallback!');
}

patchNotificationTable();
