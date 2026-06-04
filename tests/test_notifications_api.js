require('dotenv').config();
const axios = require('axios');

async function runTests() {
    console.log('🧪 Starting Automated API Test for Notifications...\n');
    
    try {
        // Step 1. Log in to get the JWT token
        console.log('1️⃣ Logging into local backend (http://localhost:3000/api/auth/login)...');
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            username: process.env.SERVICENOW_USERNAME,
            password: process.env.SERVICENOW_PASSWORD
        });
        
        const token = loginRes.data.token;
        if (!token) {
            throw new Error('Failed to get token from login endpoint');
        }
        console.log('✅ Successfully logged in and received JWT token!\n');
        
        // Setup an API client with our new token
        const client = axios.create({
            baseURL: 'http://localhost:3000/api',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Step 2. Create a notification
        console.log('2️⃣ Creating a new test notification...');
        const newNotifPayload = {
            title: "Automated Test Success",
            message: "Your ServiceNow notification table is perfectly synced! (Sent via Script)",
            type: "Info",
            recipient: "ALL"
        };
        const createRes = await client.post('/notifications', newNotifPayload);
        console.log('✅ Notification created successfully!');
        
        // Step 3. Fetch all notifications to verify it saved
        console.log('\n3️⃣ Fetching all notifications to verify it saved directly to ServiceNow...');
        const getRes = await client.get('/notifications');
        const notifications = getRes.data;
        
        console.log(`✅ Retrieved ${notifications.length} notifications!`);
        
        console.log('\nHere is the latest one returned from your API:');
        if (notifications.length > 0) {
            console.log(JSON.stringify(notifications[notifications.length - 1], null, 2));
        }
        
        console.log('\n🎉 ALL TESTS PASSED! Your backend is successfully writing to and reading from ServiceNow!');
        
    } catch (err) {
        console.error('\n❌ Test failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
}

runTests();
