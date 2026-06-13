# Secure Auth Reference — ServiceNow token → JWT → protected API

A small, **production-shaped** reference for authenticating an Employee
Onboarding app against **ServiceNow using a server-side integration token**
(not per-user Basic auth, and **never** ServiceNow credentials in the frontend).

> This is a **standalone learning/reference template**. It does not touch or
> depend on the main app — it lives entirely inside `examples/secure-auth/`.

---

## The core idea

```
┌──────────┐   username/password    ┌──────────────┐   API token (Bearer)   ┌────────────┐
│ Browser  │ ─────────────────────► │  Express API │ ─────────────────────► │ ServiceNow │
│ (vanilla │ ◄───────────────────── │  (this app)  │ ◄───────────────────── │            │
│   JS)    │     short-lived JWT     └──────────────┘   user record + roles  └────────────┘
└──────────┘
     │  Authorization: Bearer <JWT>
     └──────────────────────────────► protected routes (/api/tasks …)
```

- The **browser never sees ServiceNow credentials.** It only handles our own
  short-lived **JWT**.
- The **ServiceNow API token lives only on the server** (in `.env`), is used by
  the backend as a trusted integration, and can be scoped to least-privilege
  and rotated independently.
- Every protected request carries the **JWT** in the `Authorization` header;
  middleware verifies it before any handler runs.

---

## File structure

```
examples/secure-auth/
├── .env.example              # all config placeholders (copy → .env)
├── package.json              # standalone, runnable (npm install && npm start)
├── config.js                 # loads + validates env (fails fast)
├── server.js                 # wires everything together (the runnable example)
├── services/
│   └── serviceNowClient.js   # Axios client with Bearer-token auth
├── middleware/
│   └── authMiddleware.js     # verifies the JWT on protected routes
├── routes/
│   ├── auth.js               # POST /api/auth/login  → JWT
│   └── tasks.js              # GET  /api/tasks        → protected resource
├── public/
│   ├── login.html            # vanilla login form (stores JWT, redirects)
│   └── dashboard.html        # protected page (sends JWT, fetches tasks)
└── example-client.js         # Node demo: login → JWT → fetch protected data
```

---

## The flow, step by step

1. **Login** — `public/login.html` POSTs `{ username, password }` to
   `POST /api/auth/login`.
2. **Validate** — `routes/auth.js` calls ServiceNow (using the integration
   token) to verify the credentials and read the user's roles.
3. **Mint a session** — on success, the server signs a short-lived **JWT**
   (`{ sub, name, role }`) and returns it. On failure → **401** with a generic
   message (so it never reveals whether a username exists).
4. **Store** — the browser saves the JWT (`localStorage` in this demo; see
   *Security notes* for the more secure cookie option).
5. **Call protected APIs** — every request to `/api/tasks` sends
   `Authorization: Bearer <JWT>`.
6. **Verify** — `middleware/authMiddleware.js` verifies the JWT (signature +
   expiry) and attaches `req.user`, or returns **401**.
7. **Fetch data** — `routes/tasks.js` uses the integration token to fetch the
   **authenticated user's** tasks from ServiceNow and returns a clean shape.

---

## Setup

### 1. Create the ServiceNow integration token
In your instance, create a token the backend will use (any one of):
- **OAuth access token** (OAuth API endpoint for external clients), or
- a **REST API Key** via *API Access Policies* (Tokyo+),

scoped with least privilege (read the tables you need). Put it in
`SERVICENOW_API_TOKEN`. **Never** expose it to the browser.

### 2. Create the credential-validation endpoint
A static integration token can read records but **cannot read a user's
password** (it's hashed). So credential checking is delegated to a tiny
**Scripted REST API** the token is allowed to call. Create one resource
(e.g. `POST /api/x_auth/secure_auth/validate`) with a script like:

```javascript
// ServiceNow Scripted REST Resource — POST validate
(function process(request, response) {
  var body = request.body.data;                 // { username, password }
  var ga = new GlideAuthenticate();
  // Returns true only if the username + password are valid in this instance.
  var ok = ga.authenticate(body.username, body.password);

  if (!ok) { return { valid: false }; }

  var gr = new GlideRecord('sys_user');
  gr.get('user_name', body.username);
  var roles = [];
  var rr = new GlideRecord('sys_user_has_role');
  rr.addQuery('user', gr.getUniqueValue());
  rr.query();
  while (rr.next()) { roles.push(rr.role.name.toString()); }

  return { valid: true, sysId: gr.getUniqueValue(), name: gr.getDisplayValue('name'), roles: roles };
})(request, response);
```

Point `SERVICENOW_VALIDATE_PATH` at it.

> **Alternative (no scripted endpoint):** use ServiceNow's OAuth *password*
> grant to verify the password. Only `validateUserCredentials()` in
> `routes/auth.js` changes; everything else stays the same.

### 3. Configure and run
```bash
cd examples/secure-auth
cp .env.example .env        # then edit .env with your real values
npm install
npm start                   # serves http://localhost:4000/login.html
```

Try the end-to-end script in another terminal:
```bash
DEMO_USER=youruser DEMO_PASS=yourpass npm run demo
```

---

## Integrating into an existing Express app

1. Copy `services/serviceNowClient.js`, `middleware/authMiddleware.js`, and the
   two `routes/` files into your project.
2. Mount them:
   ```js
   app.use('/api/auth',  require('./routes/auth'));
   app.use('/api/tasks', require('./routes/tasks'));      // protected by authMiddleware
   ```
3. Protect any route by adding the middleware:
   ```js
   const auth = require('./middleware/authMiddleware');
   router.get('/secret', auth, handler);                  // 401 without a valid JWT
   router.get('/admin',  auth, auth.requireRole('hr'), handler);   // 403 without the role
   ```
4. Add the env keys from `.env.example` to your own config.

---

## Security best practices used here

| Practice | Where |
|---|---|
| **No credentials in the frontend** | browser only ever holds a JWT |
| **Secrets only on the server, via env** | `config.js` (fails fast if missing) |
| **Required `JWT_SECRET` in production** | `config.js` |
| **Short-lived, signed JWTs (HS256)** | `routes/auth.js`, `authMiddleware.js` |
| **Login rate limiting** | `express-rate-limit` in `routes/auth.js` |
| **Generic auth errors** (no user-enumeration) | `routes/auth.js` |
| **Input validation** | `routes/auth.js` |
| **Security headers** | `helmet()` in `server.js` |
| **CORS allow-list** | `server.js` |
| **Body-size limit** | `express.json({ limit: '10kb' })` |
| **Least-privilege, rotatable token** | ServiceNow integration token |
| **Output escaping** (defense in depth) | `public/dashboard.html` |

### Hardening notes for real production
- **Serve over HTTPS only** — a login posts a password; never over plain HTTP.
- **Prefer an httpOnly + Secure + SameSite cookie** over `localStorage` for the
  JWT. `localStorage` is readable by any script on the page (XSS risk); an
  httpOnly cookie is not. The trade-off is you must add CSRF protection. This
  demo uses `localStorage` purely for clarity.
- **Rotate** the ServiceNow token and `JWT_SECRET` periodically; support
  refresh tokens if you need long sessions without long-lived access tokens.
- **Scope** the ServiceNow token to only the tables/operations you need.
```
