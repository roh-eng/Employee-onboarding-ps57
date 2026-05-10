/**
 * ServiceNow Table Creation Script
 * Run: node servicenow/create_table.js
 * Creates the x_..._daily_menu table via REST API
 */
require('dotenv').config();
const axios = require('axios');

const config = {
    baseURL: process.env.SERVICENOW_INSTANCE + '/api/now/table',
    auth: { username: process.env.SERVICENOW_USERNAME, password: process.env.SERVICENOW_PASSWORD },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
};
const client = axios.create(config);
const SCOPE = process.env.SERVICENOW_SCOPE;
const TABLE_NAME = `${SCOPE}_daily_menu`;

async function createTable() {
    try {
        // Step 1: Create sys_db_object (table definition)
        const tablePayload = {
            name: TABLE_NAME,
            label: 'Daily Menu',
            extends_table: '',
            create_modules: true,
            sys_scope: SCOPE
        };
        const tableRes = await client.post('/sys_db_object', tablePayload);
        console.log('Table created:', tableRes.data.result.sys_id);

        // Step 2: Create columns
        const columns = [
            { column_label: 'Item Name', element: 'item_name', internal_type: 'string', max_length: 100, mandatory: true },
            { column_label: 'Category', element: 'category', internal_type: 'choice', max_length: 40, mandatory: true },
            { column_label: 'Calories', element: 'calories', internal_type: 'integer', max_length: 40, mandatory: true },
            { column_label: 'Available', element: 'available', internal_type: 'boolean', max_length: 40, mandatory: true }
        ];

        for (const col of columns) {
            const colPayload = {
                name: TABLE_NAME,
                ...col,
                sys_scope: SCOPE
            };
            await client.post('/sys_dictionary', colPayload);
            console.log(`Column created: ${col.element}`);
        }

        // Step 3: Create choice values for category
        const choices = ['Breakfast', 'Lunch', 'Snack', 'Beverage'];
        for (const choice of choices) {
            await client.post('/sys_choice', {
                name: TABLE_NAME,
                element: 'category',
                value: choice.toLowerCase(),
                label: choice,
                language: 'en',
                sys_scope: SCOPE
            });
        }
        console.log('Choices created for category.');
        console.log(`\nDone! Table ${TABLE_NAME} is ready in ServiceNow.`);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

createTable();
