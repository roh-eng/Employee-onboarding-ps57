# Enterprise Workflow Hub
### An AI-Assisted Employee Onboarding Platform on ServiceNow
**A B.Tech Project Report**

Live demo: https://enterprise-workflow-hub.onrender.com/login.html

---

## 1. Title Page

| | |
|---|---|
| **Project Title** | Enterprise Workflow Hub — AI-Assisted Employee Onboarding Platform on ServiceNow |
| **Domain** | Enterprise Web Application / ServiceNow Integration |
| **Technology** | Node.js, Express.js, ServiceNow (PDI), Vanilla JavaScript, Chart.js |
| **Submitted By** | _[Student Name(s) / Roll No(s)]_ |
| **Guide** | _[Guide Name]_ |
| **Department** | _[Department], [College Name]_ |
| **Academic Year** | _[Year]_ |

---

## 2. Abstract

The Enterprise Workflow Hub is a full-stack web application that automates the **employee
onboarding lifecycle** using **ServiceNow** as the system of record and workflow engine. HR
registers a new hire; ServiceNow's **Flow Designer** automatically generates the onboarding
checklist; the platform **provisions the employee**, emails a **secure set-password link**,
and tracks task completion and **HR approval** until the employee's status becomes *Onboarded*.

The system enforces **role-based access control** (HR/Admin, Manager, Employee), provides an
**AI Assistant** and a **first-login guided tour**, and integrates with **Google Gemini** (AI)
and **SMTP** (email). A key contribution is a **secure authentication design** that lets newly
provisioned employees log in **without weakening any ServiceNow security policy**, by making the
portal an identity provider that stores **scrypt-hashed** credentials and issues **JWTs**. The
solution is verified end-to-end against a live ServiceNow instance and is deployment-ready.

---

## 3. Introduction

Employee onboarding involves HR, IT, and managers performing many small, coordinated tasks —
account creation, equipment provisioning, document collection, training, and approvals. Done
manually, it is slow, error-prone, and opaque. ServiceNow is an enterprise platform widely used
for IT Service Management and workflow automation. This project builds a **modern web portal on
top of ServiceNow** that unifies onboarding into a single, automated, secure, role-aware
experience for all stakeholders.

The application has three layers: a **Vanilla-JS single-page frontend**, a **Node.js/Express
backend** (security, business logic, integration), and a **ServiceNow Personal Developer
Instance** (data tables, Flow Designer automation, Business Rules, and a Scripted REST API).

---

## 4. Problem Statement

- Onboarding is **manual and fragmented** across spreadsheets, email, and disconnected tools.
- There is **no single source of truth** for an employee's status, tasks, and progress.
- **Identity provisioning is separate** from record creation — a new hire often cannot log in.
- **Access control is weak** — shared/ad-hoc credentials and no enforced role separation.
- HR lacks **real-time visibility**; employees lack **guidance** on what to do next.

**Goal:** an automated, secure, role-aware onboarding platform that takes a new hire from
"record created" to "onboarded and logged in" with minimal manual effort.

---

## 5. Existing System

- **Manual / email-driven onboarding:** checklists tracked in spreadsheets; approvals over email.
- **Disjoint tools:** HRMS for records, IT ticketing for provisioning, no unifying view.
- **Native ServiceNow forms only:** powerful automation but a generic, non-tailored UX, and no
  employee-facing self-service portal for onboarding progress.

**Limitations:** no end-to-end automation, no unified employee dashboard, manual credential
hand-off, no role-scoped self-service, and limited visibility into progress.

---

## 6. Proposed System

A purpose-built web portal that:
- **Automates** task creation via ServiceNow Flow Designer on new-hire insert.
- **Provisions** the employee and delivers a **secure self-service set-password link**.
- Provides **role-based dashboards** — HR sees all; employees see only their own data.
- Lets HR **approve onboarding** in one click, completing tasks and updating status.
- Adds an **AI Assistant**, a **guided tour**, **notifications**, and **email**.
- Uses a **service account** for all ServiceNow calls — credentials never reach the browser.

---

## 7. Objectives

1. Automate generation and tracking of onboarding tasks.
2. Securely provision employee identities and self-service login.
3. Enforce least-privilege, role-based access control.
4. Give HR real-time visibility and one-click approval.
5. Give employees a guided, self-service experience (dashboard, AI help, tour).
6. Integrate cleanly with ServiceNow, Gemini, and SMTP.
7. Be secure, tested end-to-end, and deployment-ready.

---

## 8. System Architecture

```
 ┌─────────────────────────────────────────────────────────┐
 │ Browser — Single Page App                                │
 │ login.html · set-password.html · dashboard (app.js)      │
 └───────────────┬─────────────────────────────────────────┘
                 │  HTTPS — same-origin /api + /ws (WebSocket)
 ┌───────────────▼─────────────────────────────────────────┐
 │ Node.js / Express                                        │
 │  Security: Helmet · CORS · Rate-limit · JWT · RBAC       │
 │  Services: snowClient · mailer · realtime(WS) · portalAuth│
 │  Routes: auth, employees, tasks, stats, notifications,…  │
 └───────────────┬───────────────────────┬─────────────────┘
        service account (REST)            │ Gemini API (AI)
 ┌───────────────▼──────────┐             │ SMTP (email)
 │ ServiceNow PDI           │◄────────────┘
 │ Tables · Flow Designer   │
 │ Business Rules · Scripted REST (auth) │
 └──────────────────────────┘
```

**Pattern:** Express is the experience + security layer and the *only* holder of the ServiceNow
service-account credentials; ServiceNow performs data storage and workflow automation.

---

## 9. ServiceNow Components Used

| Component | Purpose |
|---|---|
| **Scoped App** `x_1850353_employ_0` | Container for the onboarding application |
| **Tables** | `_employee`, `_onboarding_task`, `_project`, `_project_sprint_task`, `_employee_feedback`, `_notification`, `_issue`, `_daily_menu` |
| **Flow Designer** | *Auto Onboarding Tasks* — creates the checklist on new-hire insert |
| **Business Rules** | *AI Bottleneck Risk Predictor* — sets delay-risk from progress/SLA on sprint tasks |
| **Scripted REST API** | `secure_auth/validate` — credential validation endpoint |
| **REST Table API** | All CRUD performed by the backend service account |
| **`sys_user` / `sys_user_has_role`** | Identity + role resolution |

---

## 10. Database Design

Primary tables (scope `x_1850353_employ_0`):

- **Employee** (`_employee`): `name`, `email`, `department`, `joining_date`, `status`
  (`pending`/`onboarded`), and custom fields `u_team_name`, `u_team_lead`, `u_manager`,
  `u_work_location`, plus auth fields `u_password_hash`, `u_setup_token_hash`,
  `u_setup_token_expires`.
- **Onboarding Task** (`_onboarding_task`): `employee` (reference → Employee), `task_type`,
  `assigned_to`, `status`, `due_date`, `priority`.
- **Project / Project Sprint Task**: delivery tracking with `progress`, `sla_status`, `delay_risk`.
- **Employee Feedback** (`_employee_feedback`): `employee_name`, `feedback`, `rating`.
- **Notification** (`_notification`): `message`, `recipient`, `read`.

**Relationship:** `Onboarding Task.employee → Employee.sys_id` (one employee → many tasks).
Onboarding progress = completed tasks ÷ total tasks for that employee.

---

## 11. Authentication Flow

**Root cause solved:** ServiceNow's instance policy rejects **API-set passwords** for Basic auth,
so provisioned employees could not log in. Disabling that policy was rejected (security).

**Design — portal-issued credentials (set-password onboarding):**
1. On provisioning, generate a one-time **token**; store its **scrypt hash** + 7-day expiry on
   the employee record; email a **set-password link**.
2. Employee opens the link, sets a password → stored as a **scrypt hash** (`u_password_hash`).
3. **Login:** the app verifies email + password against the hash → issues a **short-lived JWT**.
4. **HR/Admin** authenticate via ServiceNow (role resolved server-side from `sys_user_has_role`).
5. All ServiceNow data calls use the **service account** — browser never holds ServiceNow creds.

```
HR creates hire → token(hashed)+expiry stored → email link
Employee → set-password (scrypt hash) → login (verify) → JWT → dashboard
```

---

## 12. Employee Onboarding Workflow

1. **HR registers** a new hire (with team details).
2. ServiceNow **Flow Designer** auto-creates the checklist: *Laptop Provisioning, VPN Access,
   ID Card Issuance, Desk Setup*.
3. App **provisions the user** + sends **welcome + set-password** email; an in-app notification
   is broadcast.
4. Employee **completes tasks**; progress updates on their dashboard.
5. **HR approves** (one click) → pending tasks marked **completed** → employee status → **Onboarded**.

Verified live: status `pending → onboarded`, tasks `pending → completed`, progress `0% → 100%`.

---

## 13. Team Information Module

- HR assigns **Team Name, Team Lead, Manager, Work Location** (+ Department) at creation.
- Stored as custom fields on the ServiceNow employee record.
- Employee dashboard shows a **"My Team Information"** card — **read-only** ("managed by HR").
- Enforced server-side: create/edit endpoints are **HR-only**; employees can only **view** their own.

---

## 14. AI Assistant Module

- In-app chat assistant backed by **Google Gemini** for onboarding questions.
- **Resilient design:** greetings (*hi/hello/help*) and common intents (tasks, status, password,
  feedback, menu) are answered **locally** — no external call — so the assistant always responds.
- **Graceful degradation:** on quota/timeout/error, returns a meaningful message + guidance,
  never a dead-end ("[object Object]" and generic-failure responses eliminated).

---

## 15. Guided Tour Module

- A **first-login guided tour** for employees: detects first login (per user), auto-starts, and
  spotlights **My Profile, Employee Tasks, Report Issue, Feedback, AI Assistant**.
- Modern tooltips with **title, description, Next, Skip**, and a step counter.
- **Completion saved**; returning users are not shown it again; replay via **Help → Take Product Tour**.

---

## 16. Role-Based Access Control

| Capability | HR/Admin | Manager | Employee |
|---|---|---|---|
| View all employees / tasks / stats | ✅ | ✅ | ❌ (403) |
| Create / approve onboarding | ✅ | ❌ | ❌ |
| View **own** profile / tasks / progress | — | — | ✅ |
| Submit feedback / report issue | ✅ | ✅ | ✅ |

- Roles resolved **server-side** from the signed JWT (client cannot tamper).
- Employee data is **identity-filtered** server-side (`employee=<own sys_id>`) — verified zero
  cross-employee leakage.

---

## 17. Security Features

- **JWT** authentication (signed, short-lived) + server-side role resolution.
- **scrypt**-hashed passwords + one-time, hashed, expiring onboarding tokens.
- **Helmet** security headers (CSP, HSTS, X-Frame-Options, nosniff).
- **Rate limiting** (brute-force protection) and **input validation** (express-validator).
- **RBAC** on all sensitive read/write endpoints; **IDOR-safe** own-data filtering.
- **Service-account** isolation — ServiceNow credentials stay server-side; `.env` git-ignored.
- **CORS** locked to same-origin + explicit allow-list (no global bypass).

---

## 18. API Integration

- **ServiceNow REST Table API** — CRUD via the service account (`snowClient`).
- **ServiceNow Scripted REST** — `secure_auth/validate` for credential validation.
- **Google Gemini API** — AI assistant responses.
- **SMTP (nodemailer)** — onboarding/welcome and alert emails (Brevo/Gmail), with an Ethereal
  test fallback.
- **WebSocket (`/ws`)** — real-time in-app notifications.

Representative endpoints: `POST /api/auth/login`, `POST /api/auth/set-password`,
`POST /api/employees`, `POST /api/employees/:id/approve`, `GET /api/employees/me`,
`GET /api/stats`, `POST /api/notifications/broadcast`, `POST /api/chat`.

---

## 19. Testing Results

| Area | Test | Result |
|---|---|---|
| Onboarding E2E | create → provision → set-password → login → tasks → approve | ✅ status → Onboarded, 100% |
| Authentication | valid / invalid password / single-use token | ✅ 200 / 401 / 400 |
| RBAC | employee → `/employees`,`/tasks`,`/stats` | ✅ 403 (own data 200) |
| Ownership | two employees' task isolation | ✅ 0 overlap |
| Security headers | Helmet (CSP/HSTS/XFO/nosniff) | ✅ present |
| Rate limiting | rapid invalid logins | ✅ 429 throttled |
| Injection | SQLi / XSS in login | ✅ rejected (401) |
| AI assistant | greetings/help + quota fallback | ✅ helpful replies |
| Backend suite | `npm test` | ✅ 58/58 |
| CORS (Render) | same-origin vs unknown origin | ✅ allowed / denied (no 500) |

---

## 20. Screenshots

_Insert captures from the live app (https://enterprise-workflow-hub.onrender.com/login.html):_
1. Login page · 2. Set-Password page · 3. HR Dashboard (directory + filters + Approve) ·
4. New Hire form (with Team Information) · 5. Employee Dashboard (progress + My Team Information) ·
6. Employee Tasks (checklist) · 7. AI Assistant chat · 8. First-Login Guided Tour ·
9. Daily Menu (weekly, today highlighted) · 10. Notifications + welcome email.

---

## 21. Advantages

- **End-to-end automation** — Flow-driven tasks; one-click approval.
- **Secure self-service login** without weakening ServiceNow security.
- **Single source of truth** with real-time progress.
- **Strict role separation** and least-privilege access.
- **Resilient UX** — AI help + guided tour + graceful fallbacks.
- **Portable & deployment-ready** (Render / Azure / Docker), same-origin design.

---

## 22. Future Scope

- **httpOnly + Secure + SameSite cookie sessions** with CSRF protection (replace localStorage JWT).
- **Enterprise SSO** (SAML/OIDC) for staff.
- **Document upload & verification** for onboarding paperwork.
- **Multi-stage approvals** (Manager → IT → HR) and SLA timers.
- **Analytics dashboards** (time-to-onboard, bottlenecks).
- **Mobile app / PWA** and multi-language support.

---

## 23. Conclusion

The Enterprise Workflow Hub demonstrates a practical, secure, and automated approach to employee
onboarding built on ServiceNow. It unifies HR, IT, and employee experiences into one role-aware
portal; automates task generation and approval; and solves a real ServiceNow authentication
constraint with a secure, standards-based design — all verified end-to-end against a live
instance and packaged for deployment. The project showcases full-stack engineering, enterprise
platform integration, applied security, and thoughtful UX, and provides a solid foundation for
the future enhancements outlined above.
