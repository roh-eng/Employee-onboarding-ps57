/**
 * Basic API Smoke Tests
 * Run: node tests/api.test.js
 */
const assert = require('assert');

const BASE = 'http://localhost:3000/api';

async function testHealth() {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'OK');
    console.log('✅ Health check passed');
}

async function testAuthValidation() {
    const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '', password: '' })
    });
    assert.strictEqual(res.status, 400);
    console.log('✅ Auth validation passed');
}

async function testProtectedRoute() {
    const res = await fetch(`${BASE}/employees`);
    assert.strictEqual(res.status, 401);
    console.log('✅ Protected route check passed');
}

async function runTests() {
    console.log('Running API smoke tests...\n');
    try {
        await testHealth();
        await testAuthValidation();
        await testProtectedRoute();
        console.log('\n🎉 All tests passed!');
    } catch (err) {
        console.error('\n❌ Test failed:', err.message);
        process.exit(1);
    }
}

runTests();
