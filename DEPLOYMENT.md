# Deployment Guide — Enterprise Workflow Hub

The app is a single Node.js/Express server that **also serves the frontend** and holds a
**WebSocket** (`/ws`) + in-memory state. Deploy it as **one always-on Node web service**
(not serverless). Recommended: **Render** (free, easy) or **Azure App Service** (enterprise).

The frontend now calls the API **same-origin** (`/api`) and connects the WebSocket to the
page's own host, so **no code changes are needed per environment** — only env vars.

---

## Required environment variables

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` (disables demo logins) |
| `APP_BASE_URL` | your public HTTPS URL, e.g. `https://your-app.onrender.com` (used for CORS + email/onboarding links) |
| `JWT_SECRET` | a long random secret |
| `JWT_EXPIRES_IN` | e.g. `8h` |
| `SERVICENOW_INSTANCE` | `https://<instance>.service-now.com` |
| `SERVICENOW_USERNAME` / `SERVICENOW_PASSWORD` | the **service account** (least privilege) |
| `SERVICENOW_SCOPE` | `x_1850353_employ_0` |
| `SERVICENOW_VALIDATE_PATH` | `/api/<ns>/secure_auth/validate` (if using the Scripted REST auth) |
| `GEMINI_API_KEY` | Google Gemini key (optional; assistant degrades gracefully without it) |
| `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` | SMTP for onboarding emails (optional) |

> `PORT` is injected by the platform automatically — the app reads `process.env.PORT`.
> **Never commit `.env`.** Set these in the platform's dashboard.

---

## Option A — Render (recommended, ~5 min)

1. Push the repo to GitHub.
2. Render → **New → Web Service** → connect the repo.
3. **Root directory:** `EnterpriseWorkflowHub`
   **Build command:** `npm install`
   **Start command:** `node backend/server.js`
4. Add all env vars above; set `APP_BASE_URL` to the Render URL Render gives you.
5. Deploy. Render provides HTTPS automatically and supports WebSockets out of the box.

*(Note: the free instance sleeps after idle and cold-starts on the next request — fine for a demo.)*

## Option B — Azure App Service

1. Create an **App Service** (Linux, Node 18+).
2. Deploy via GitHub Actions / `az webapp up` / VS Code Azure extension.
3. **Configuration → Application settings:** add the env vars above (`APP_BASE_URL` = the azurewebsites URL or custom domain).
4. **Configuration → General settings → Web sockets: On.**
5. Startup command: `node backend/server.js`.

## Option C — Docker (any host)

A `Dockerfile` is included. Build & run:
```bash
docker build -t workflow-hub .
docker run -p 3000:3000 --env-file .env workflow-hub
```

---

## Production checklist

- [ ] `NODE_ENV=production` (demo logins off) and a strong `JWT_SECRET`.
- [ ] `APP_BASE_URL` = the real HTTPS URL (CORS + onboarding/email links depend on it).
- [ ] Env vars set in the platform; `.env` **not** committed.
- [ ] **Single instance** (do not horizontally scale) — the rate limiter + WebSocket are in-memory; multi-instance would need sticky sessions or a shared store.
- [ ] HTTPS enabled (automatic on Render/Azure).
- [ ] Point at a **stable ServiceNow instance** — a free PDI hibernates/can be reclaimed after inactivity.
- [ ] Verify the custom fields + Scripted REST API exist on the target ServiceNow instance.
- [ ] Smoke test on the live URL: **New Hire → set-password → login → complete tasks → HR approve → status Onboarded**.

---

## How requests resolve after these changes
- Browser loads `https://<app>/login.html` (served by Express static).
- Frontend calls `https://<app>/api/...` (same-origin → no CORS preflight issues).
- WebSocket connects to `wss://<app>/ws` (same host/port as the page).
- Onboarding/welcome emails link to `${APP_BASE_URL}/login.html` and `/set-password.html`.
