# Secure Authentication — Employee Onboarding

A production-shaped pattern for authenticating a **Node.js + Vanilla JS +
ServiceNow** app **without ever putting credentials in the frontend.**

> Reference / template. Drop the files into your existing Express backend and
> static frontend. (No `git` actions were taken — commit it yourself.)

---

## 1. The security problem

Calling ServiceNow **directly from the browser** — or shipping a ServiceNow
username/password/token to the frontend — is dangerous:

- Anything in frontend JavaScript is **fully visible** to the user (View Source,
  DevTools, the network tab). A token in the browser is a **leaked** token.
- Those credentials usually have **broad ServiceNow permissions**, so a leak
  exposes far more than one user's data.
- You cannot rotate, scope, or revoke a credential that's been handed out to
  every visitor.

**Rule of thumb:** the browser must never hold a long-lived or privileged secret.

---

## 2. The solution

Put a thin **backend** between the browser and ServiceNow:

- The **ServiceNow API token** lives **only on the server** (in `.env`) and is
  used as a `Bearer` token by the backend integration — never sent to the browser.
- The browser authenticates to **our backend**, which verifies the user against
  ServiceNow and returns a **short-lived, signed JWT**.
- Every protected request carries that **JWT** (not ServiceNow creds). Middleware
  verifies it before any handler runs.

So the browser only ever holds **our own** session token, which is short-lived,
scoped, and revocable.

---

## 3. Architecture

```
┌──────────┐   1. username/password   ┌──────────────┐   2. API token (Bearer)  ┌────────────┐
│ Browser  │ ───────────────────────► │  Node/Express│ ───────────────────────► │ ServiceNow │
│(login.html)│ ◄─────────────────────── │   backend    │ ◄─────────────────────── │            │
└──────────┘   3. short-lived JWT      └──────────────┘   user record + roles    └────────────┘
     │
     │  4. Authorization: Bearer <JWT>
     └───────────────────────────────► protected routes (GET /api/tasks …)
                                         authMiddleware verifies → handler runs
```

| File | Role |
|---|---|
| `.env.example` | All secrets/config (copy → `.env`, never commit) |
| `backend/routes/auth.js` | `POST /api/auth/login` → validates via ServiceNow token → returns JWT |
| `backend/middleware/authMiddleware.js` | Verifies the JWT, attaches `req.user`, 401 otherwise |
| `backend/routes/tasks.js` | Example protected route, guarded by the middleware |
| `frontend/login.html` | Vanilla login form: posts creds, stores JWT, redirects |

---

## 4. Setup

### a. ServiceNow token
Create an integration token in ServiceNow (an **OAuth access token** or a
**REST API Key** via API Access Policies), scoped least-privilege. Put it in
`SERVICENOW_API_TOKEN`. It stays on the server only.

### b. Credential-validation endpoint
A static token can read records but **cannot read a user's password** (hashed
in `sys_user`). So `auth.js` calls a small **ServiceNow Scripted REST API** to
verify credentials. Create one (e.g. `POST /api/x_auth/secure_auth/validate`):

```javascript
// ServiceNow Scripted REST Resource — POST validate
(function process(request, response) {
  var body = request.body.data;                       // { username, password }
  var ok = new GlideAuthenticate().authenticate(body.username, body.password);
  if (!ok) { return { valid: false }; }

  var user = new GlideRecord('sys_user');
  user.get('user_name', body.username);

  var roles = [];
  var r = new GlideRecord('sys_user_has_role');
  r.addQuery('user', user.getUniqueValue());
  r.query();
  while (r.next()) { roles.push(r.role.name.toString()); }

  return {
    valid: true,
    sysId: user.getUniqueValue(),
    name: user.getDisplayValue('name'),
    email: user.getDisplayValue('email'),
    roles: roles
  };
})(request, response);
```

Point `SERVICENOW_VALIDATE_PATH` at it.
*(Alternative: ServiceNow OAuth "password" grant — only `validateUserCredentials()`
in `auth.js` changes.)*

### c. Wire it into your Express app
```js
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json({ limit: '10kb' }));

app.use(express.static('frontend'));                       // serves login.html
app.use('/api/auth',  require('./backend/routes/auth'));   // public
app.use('/api/tasks', require('./backend/routes/tasks'));  // protected

app.listen(process.env.PORT || 5000);
```

### d. Configure
```bash
cp .env.example .env       # fill in instance, token, and a JWT secret
npm install express jsonwebtoken axios dotenv
```

---

## 5. How to test

**Login (cURL):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jdoe","password":"secret"}'
# → { "success": true, "token": "<JWT>", "user": { ... } }
```

**Call a protected route with the JWT:**
```bash
TOKEN="<paste JWT>"
curl http://localhost:5000/api/tasks -H "Authorization: Bearer $TOKEN"
# → { "success": true, "count": N, "tasks": [ ... ] }
```

**Prove it's protected (no token → 401):**
```bash
curl -i http://localhost:5000/api/tasks
# → HTTP/1.1 401 Unauthorized
```

**Browser:** open `login.html`, sign in, confirm it redirects and the dashboard
loads tasks (DevTools → Network shows `Authorization: Bearer …`, never ServiceNow creds).

---

## 6. Why this is secure

| Measure | Where |
|---|---|
| ServiceNow credentials **never reach the browser** | token stays server-side in `.env` |
| Browser holds only a **short-lived, signed JWT** | `auth.js` (`expiresIn`), `authMiddleware.js` |
| **Signature + expiry verified** on every protected request | `authMiddleware.js` (`jwt.verify`, HS256) |
| **Login rate limiting** (anti brute-force) | `auth.js` |
| **Generic auth errors** (no user-enumeration) | `auth.js` |
| **Input validation** | `auth.js` |
| **Least-privilege, rotatable token** | ServiceNow integration token |
| **User-scoped queries** (can only read own tasks) | `tasks.js` (`req.user.id`) |

**For real production, also:**
- Serve over **HTTPS only** (a login posts a password).
- Prefer an **httpOnly + Secure + SameSite cookie** over `localStorage` for the
  JWT (localStorage is exposed to XSS); add CSRF protection if you do.
- **Rotate** the ServiceNow token and `JWT_SECRET` periodically; consider refresh tokens.
- Add `helmet()` and a CORS allow-list at the app level.
