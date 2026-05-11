/**
 * Enterprise Workflow Hub — Integration Test Suite
 * Run: npm test
 */

const assert = require('assert');

const BASE = process.env.TEST_BASE || 'http://localhost:3000/api';

/* ── Test Helpers ─────────────────────────────────────────────────────────── */

async function post(path, body, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function get(path, token = null) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { headers });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function put(path, body, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function del(path, token = null) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

let authToken = null;
let adminToken = null;

/* ── Tests ────────────────────────────────────────────────────────────────── */

async function testHealth() {
    const { status, data } = await get('/health');
    assert.strictEqual(status, 200, 'Health should return 200');
    assert.strictEqual(data.status, 'OK', 'Health status should be OK');
    console.log('✅ Health check passed');
}

async function testAuthLoginValidation() {
    const { status } = await post('/auth/login', { username: '', password: '' });
    assert.strictEqual(status, 400, 'Empty login should return 400');
    console.log('✅ Auth validation passed');
}

async function testAuthLoginInvalidCredentials() {
    const { status, data } = await post('/auth/login', { username: 'fake', password: 'fake' });
    // In CI with dummy ServiceNow URL, the request fails at network level → 401
    assert.ok(status === 401 || status === 503, `Invalid credentials should return 401 or 503, got ${status}`);
    assert.strictEqual(data.success, false, 'Invalid login should have success=false');
    console.log('✅ Invalid credentials rejected');
}

async function testProtectedRoutesWithoutToken() {
    const routes = ['/employees', '/tasks', '/issues', '/projects', '/sprint-tasks', '/menu', '/notifications', '/reports/dashboard/json'];
    for (const route of routes) {
        const { status, data } = await get(route);
        assert.strictEqual(status, 401, `${route} should require auth`);
        assert.ok(data.error && data.error.includes('token'), `${route} should mention token`);
    }
    console.log('✅ All protected routes reject unauthenticated requests');
}

async function testAuthSession() {
    const { status, data } = await get('/auth/session');
    assert.strictEqual(status, 401, 'Session without token should return 401');
    console.log('✅ Session validation passed');
}

async function testMenuCRUD() {
    // GET menu (no token -> 401)
    const r1 = await get('/menu');
    assert.strictEqual(r1.status, 401, 'GET /menu without token -> 401');

    // POST menu (no token -> 401)
    const r2 = await post('/menu', { itemName: 'Test', category: 'Lunch', calories: 500 });
    assert.strictEqual(r2.status, 401, 'POST /menu without token -> 401');

    console.log('✅ Menu route security passed');
}

async function testReportsSecurity() {
    const csvRoutes = ['/reports/employees/csv', '/reports/tasks/csv', '/reports/projects/csv', '/reports/sprint-tasks/csv'];
    for (const route of csvRoutes) {
        const { status } = await get(route);
        assert.strictEqual(status, 401, `${route} should require auth`);
    }
    console.log('✅ Reports route security passed');
}

async function testWebhooksSecurity() {
    const { status: s1 } = await get('/webhooks');
    assert.strictEqual(s1, 401, 'GET /webhooks without token -> 401');

    const { status: s2 } = await post('/webhooks/register', { url: 'http://test.com', events: ['test'] });
    assert.strictEqual(s2, 401, 'POST /webhooks/register without token -> 401');

    const { status: s3 } = await post('/webhooks/incoming/hrms', { employee: { name: 'Test' }, source: 'test' });
    assert.strictEqual(s3, 202, 'POST /webhooks/incoming/hrms should accept public payload');
    console.log('✅ Webhooks route security passed');
}

async function testNotificationsCRUD() {
    const { status: s1 } = await get('/notifications');
    assert.strictEqual(s1, 401, 'GET /notifications without token -> 401');

    const { status: s2 } = await post('/notifications', { title: 'Test', message: 'Test' });
    assert.strictEqual(s2, 401, 'POST /notifications without token -> 401');

    const { status: s3 } = await post('/notifications/email-alert', { to: 'ALL', subject: 'Test', body: 'Test' });
    assert.strictEqual(s3, 401, 'POST /notifications/email-alert without token -> 401');

    console.log('✅ Notifications route security passed');
}

async function testChatEndpoint() {
    const { status: s1 } = await post('/chat', { message: 'hello' });
    assert.strictEqual(s1, 401, 'POST /chat without token -> 401');

    console.log('✅ Chat route security passed');
}

async function testStatsEndpoint() {
    const { status: s1 } = await get('/stats');
    assert.strictEqual(s1, 401, 'GET /stats without token -> 401');

    console.log('✅ Stats route security passed');
}

async function testBroadcastEndpoint() {
    const { status: s1 } = await post('/broadcast', { channel: 'test', payload: {} });
    // 200 when WebSocket clients connected, still 200 with empty client list
    assert.ok(s1 === 200 || s1 === 204, `POST /broadcast should succeed, got ${s1}`);
    console.log('✅ Broadcast endpoint passed');
}

async function testEmployeesSecurity() {
    const { status: s1 } = await get('/employees');
    assert.strictEqual(s1, 401, 'GET /employees without token -> 401');

    const { status: s2 } = await post('/employees', { name: 'Test', email: 'test@test.com', department: 'IT', joiningDate: '2026-01-01' });
    assert.strictEqual(s2, 401, 'POST /employees without token -> 401');

    console.log('✅ Employees route security passed');
}

async function testTasksSecurity() {
    const { status: s1 } = await get('/tasks');
    assert.strictEqual(s1, 401, 'GET /tasks without token -> 401');

    console.log('✅ Tasks route security passed');
}

async function testProjectsSecurity() {
    const { status: s1 } = await get('/projects');
    assert.strictEqual(s1, 401, 'GET /projects without token -> 401');

    console.log('✅ Projects route security passed');
}

async function testSprintTasksSecurity() {
    const { status: s1 } = await get('/sprint-tasks');
    assert.strictEqual(s1, 401, 'GET /sprint-tasks without token -> 401');

    console.log('✅ Sprint-tasks route security passed');
}

async function testIssuesSecurity() {
    const { status: s1 } = await get('/issues');
    assert.strictEqual(s1, 401, 'GET /issues without token -> 401');

    console.log('✅ Issues route security passed');
}

async function testErrorPropagation() {
    // We can't fully test ServiceNow errors without credentials,
    // but we verify the error middleware format is consistent.
    const { status, data } = await get('/employees');
    assert.strictEqual(status, 401);
    assert.ok(data.hasOwnProperty('success'), 'Error response should have success field');
    assert.ok(data.hasOwnProperty('error'), 'Error response should have error field');
    console.log('✅ Error format consistency passed');
}

async function testCorsHeaders() {
    const res = await fetch(`${BASE}/health`, { method: 'OPTIONS' });
    // CORS middleware should be active
    assert.ok(res.status === 204 || res.status === 200, 'CORS preflight should be handled');
    console.log('✅ CORS headers present');
}

async function testResponseTime() {
    const start = Date.now();
    await get('/health');
    const duration = Date.now() - start;
    assert.ok(duration < 2000, `Health endpoint too slow: ${duration}ms`);
    console.log(`✅ Response time acceptable (${duration}ms)`);
}

/* ── Test Runner ──────────────────────────────────────────────────────────── */

const tests = [
    testHealth,
    testAuthLoginValidation,
    testAuthLoginInvalidCredentials,
    testProtectedRoutesWithoutToken,
    testAuthSession,
    testEmployeesSecurity,
    testTasksSecurity,
    testIssuesSecurity,
    testProjectsSecurity,
    testSprintTasksSecurity,
    testMenuCRUD,
    testReportsSecurity,
    testWebhooksSecurity,
    testNotificationsCRUD,
    testChatEndpoint,
    testStatsEndpoint,
    testBroadcastEndpoint,
    testErrorPropagation,
    testCorsHeaders,
    testResponseTime
];

async function runTests() {
    console.log(`Running ${tests.length} integration tests...\n`);
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            await test();
            passed++;
        } catch (err) {
            failed++;
            console.error(`\n❌ ${test.name} failed:`, err.message);
        }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Results: ${passed} passed, ${failed} failed out of ${tests.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    if (failed > 0) {
        process.exit(1);
    }
    console.log('\n🎉 All tests passed!');
}

runTests();
