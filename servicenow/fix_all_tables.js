require('dotenv').config();
const axios = require('axios');

const config = {
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: { username: process.env.SERVICENOW_USERNAME, password: process.env.SERVICENOW_PASSWORD },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
};
const client = axios.create(config);
const SCOPE = process.env.SERVICENOW_SCOPE;

async function createTableWithColumns(tableNameSuffix, label, columns) {
    const TABLE_NAME = `${SCOPE}_${tableNameSuffix}`;
    try {
        console.log(`\n--- Processing Table: ${label} (${TABLE_NAME}) ---`);
        
        // Step 1: Create table definition
        const tablePayload = {
            name: TABLE_NAME,
            label: label,
            extends_table: '',
            create_modules: false, // Prevents creating duplicate menus
            sys_scope: SCOPE
        };
        const tableRes = await client.post('/sys_db_object', tablePayload);
        console.log(`✅ Table created successfully. sys_id: ${tableRes.data.result.sys_id}`);

        // Step 2: Create columns
        for (const col of columns) {
            const colPayload = {
                name: TABLE_NAME,
                ...col,
                sys_scope: SCOPE
            };
            await client.post('/sys_dictionary', colPayload);
            console.log(`  + Column created: ${col.element}`);
        }
        console.log(`🎉 Finished provisioning ${label} table.`);
    } catch (err) {
        const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
        if (errorMsg.includes('already exists')) {
             console.log(`⚠️ Table ${TABLE_NAME} already exists! Skipping.`);
        } else {
             console.error(`❌ Error creating ${TABLE_NAME}:`, errorMsg);
        }
    }
}

async function fixEverything() {
    console.log('🚀 Starting full sync: Provisioning missing tables to ServiceNow...');

    // 1. Provision employee_feedback table
    const feedbackCols = [
        { column_label: 'Employee Name', element: 'employee_name', internal_type: 'string', max_length: 100 },
        { column_label: 'Feedback Text', element: 'feedback', internal_type: 'string', max_length: 1000 },
        { column_label: 'Rating', element: 'rating', internal_type: 'integer', max_length: 40 }
    ];
    await createTableWithColumns('employee_feedback', 'Employee Feedback', feedbackCols);

    // 2. Provision notification table (migrating from in-memory to DB)
    const notificationCols = [
        { column_label: 'User Name', element: 'user_name', internal_type: 'string', max_length: 100 },
        { column_label: 'Message', element: 'message', internal_type: 'string', max_length: 500 },
        { column_label: 'Is Read', element: 'is_read', internal_type: 'boolean' }
    ];
    await createTableWithColumns('notification', 'Notification', notificationCols);

    console.log('\n======================================================');
    console.log('✅ PHASE 1 COMPLETE: Missing tables are now live in your PDI!');
    console.log('======================================================');
    
    console.log('\n⚠️ PHASE 2: Manual Cleanup Required for "sprint_task"');
    console.log('Deleting a table via the REST API is restricted for security reasons (to prevent accidental data loss).');
    console.log('To finish fixing everything, you must delete the duplicate table manually:');
    console.log('  1. Log into your ServiceNow PDI in your browser.');
    console.log('  2. In the filter navigator, type: sys_db_object.list');
    console.log('  3. Search for "sprint_task" in the Name column.');
    console.log('  4. Open it, and click the "Delete" button at the top right.');
    console.log('======================================================\n');
}

fixEverything();
