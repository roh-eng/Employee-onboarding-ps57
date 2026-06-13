/**
 * example-client.js
 * ────────────────────────────────────────────────────────────────────────
 * A complete, runnable demonstration of the whole flow from a CLIENT's view
 * (here: a Node script, but the steps are identical for the browser or any
 * HTTP client). Uses Node 18+'s built-in global `fetch`.
 *
 *   Run:  node example-client.js
 *   (Start the server first: `npm start`)
 */

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const USERNAME = process.env.DEMO_USER || 'jdoe';
const PASSWORD = process.env.DEMO_PASS || 'changeme';

async function main() {
  // ── STEP 1: Log in → receive a JWT ──────────────────────────────────────
  console.log(`→ POST ${BASE}/api/auth/login`);
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const login = await loginRes.json();

  if (!loginRes.ok || !login.success) {
    throw new Error(`Login failed (${loginRes.status}): ${login.error}`);
  }
  const token = login.token;
  console.log(`✓ Logged in as ${login.user.name} (role: ${login.user.role})`);
  console.log(`  JWT: ${token.slice(0, 24)}…\n`);

  // ── STEP 2: Call a PROTECTED endpoint, sending the JWT ──────────────────
  console.log(`→ GET ${BASE}/api/tasks  (Authorization: Bearer <token>)`);
  const tasksRes = await fetch(`${BASE}/api/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tasks = await tasksRes.json();

  if (!tasksRes.ok || !tasks.success) {
    throw new Error(`Fetch tasks failed (${tasksRes.status}): ${tasks.error}`);
  }
  console.log(`✓ Fetched ${tasks.count} protected task(s):`);
  tasks.tasks.forEach((t) => console.log(`    • ${t.title}  [${t.status}]`));
  console.log('');

  // ── STEP 3: Prove the endpoint REJECTS requests with no token ───────────
  console.log(`→ GET ${BASE}/api/tasks  (no token)`);
  const noAuth = await fetch(`${BASE}/api/tasks`);
  console.log(`✓ Without a token → HTTP ${noAuth.status} (expected 401)\n`);

  console.log('Done.');
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
