# ENTERPRISE WORKFLOW HUB
### An Employee Onboarding & Delivery Intelligence Platform built on ServiceNow

---

## 1. Title Page

**ENTERPRISE WORKFLOW HUB**
*An Integrated Employee Onboarding, Team Management and Delivery-Intelligence Platform using ServiceNow and Node.js*

A Project Report submitted in partial fulfilment of the requirements for the award of the degree of

**Bachelor of Technology**
in
**Computer Science and Engineering**

Submitted by:
**[Student Name]** — [Roll Number]

Under the guidance of:
**[Guide Name], [Designation]**

**[Department of Computer Science and Engineering]**
**[College / University Name]**
**[Academic Year: 2025–2026]**

---

## 2. Abstract

Employee onboarding in modern enterprises is a multi-stage, cross-departmental process involving HR, IT, Security and Facilities. Traditional approaches rely on manual checklists, scattered emails and spreadsheets, leading to delays, missed steps, poor visibility and inconsistent employee experience.

The **Enterprise Workflow Hub** is a full-stack web application that automates the end-to-end onboarding lifecycle by integrating a **Node.js/Express** backend and a responsive **vanilla-JavaScript** frontend with a **ServiceNow** platform instance (PDI). When HR registers a new hire, the system provisions the employee record, auto-generates a standardized onboarding task checklist through **ServiceNow Flow Designer**, issues a secure self-service **"set password"** onboarding link, and delivers a welcome email. Employees authenticate through a hardened credential flow (scrypt-hashed passwords, one-time tokens, JWT sessions), view a personalized dashboard with their **onboarding status, progress and team information**, and complete their tasks. HR reviews progress and **approves onboarding** in one action, after which the employee's status transitions to *Onboarded*.

The platform additionally provides an **AI Assistant** (Google Gemini with a resilient local fallback), **role-based access control (RBAC)**, **SLA & AI bottleneck intelligence** driven by ServiceNow Business Rules, a **first-login guided tour**, and **production-grade security** (Helmet security headers, rate limiting, input validation). The result is a single, automated, secure and auditable system that reduces onboarding time, eliminates manual errors and gives every stakeholder real-time visibility.

**Keywords:** ServiceNow, Employee Onboarding, Workflow Automation, Node.js, REST API, JWT, RBAC, Flow Designer, Scripted REST API, scrypt.

---

## 3. Introduction

Enterprises hire continuously, and each new employee triggers a sequence of tasks across multiple teams: provisioning a laptop, granting VPN access, issuing an ID card, setting up a desk, completing HR orientation, payroll and benefits enrolment. Coordinating these tasks manually is error-prone and slow.

The Enterprise Workflow Hub treats onboarding as a **structured digital workflow**. It uses ServiceNow — an industry-standard enterprise workflow platform — as the system of record and automation engine, and wraps it in a modern, friendly web experience for HR and employees. The application demonstrates real-world integration patterns: secure server-to-platform communication via a service account, REST Table API usage, Flow Designer automation, Business Rules, Scripted REST APIs, and event-driven notifications.

This report describes the problem addressed, the limitations of existing approaches, the proposed solution, the system architecture, the ServiceNow components used, the data model, and each major functional module — onboarding, authentication, team information, AI assistant, guided tour, RBAC and security — followed by testing results, advantages, future scope and conclusion.

---

## 4. Problem Statement

To design and implement an automated, secure and role-aware employee onboarding platform that:

1. Eliminates manual, fragmented onboarding checklists.
2. Automatically generates and tracks onboarding tasks for every new hire.
3. Provides each employee a personalized, real-time view of their onboarding status, progress and team.
4. Authenticates users securely **without exposing platform credentials** and without storing reusable plaintext passwords.
5. Enforces strict access control so employees see only their own data while HR retains full oversight.
6. Surfaces delivery bottlenecks and SLA risks intelligently.
7. Remains usable and helpful even when external services (e.g., the AI provider) are unavailable.

---

## 5. Existing System

Conventional onboarding processes typically suffer from:

- **Manual checklists** maintained in spreadsheets or documents, with no enforcement of completion.
- **Email-driven coordination**, where requests to IT/Security/Facilities are lost or delayed.
- **No single source of truth** — status is scattered across people's inboxes.
- **Poor employee visibility** — new hires don't know what is pending or who their team is.
- **Weak access control** — shared documents expose everyone's data.
- **No analytics** — management cannot see bottlenecks or SLA breaches.
- **Insecure credential handling** — temporary passwords emailed in plaintext, or platform admin credentials reused.

**Limitations:** lack of automation, no auditability, no real-time tracking, no role separation, and no graceful handling of failures.

---

## 6. Proposed System

The Enterprise Workflow Hub addresses these gaps with a single integrated platform:

- **Automated task generation** via ServiceNow Flow Designer the moment a hire is registered.
- **Self-service secure onboarding** — employees set their own password through a one-time link; passwords are stored only as scrypt hashes.
- **Personalized employee dashboard** showing live status, progress percentage, task completion and team information pulled from ServiceNow.
- **One-click HR approval** that completes pending tasks and transitions the employee to *Onboarded*.
- **Server-enforced RBAC** — employees see only their own records; HR/Managers get organization-wide views.
- **AI Assistant** for onboarding guidance with a resilient local fallback.
- **SLA & AI bottleneck prediction** via ServiceNow Business Rules.
- **Production-grade security** — Helmet, rate limiting, validation, JWT, and a least-privilege service account.

---

## 7. Objectives

1. Automate the complete employee onboarding lifecycle end-to-end.
2. Integrate a Node.js application with ServiceNow using the REST Table API and a least-privilege service account.
3. Implement a secure, self-service authentication flow (one-time tokens + scrypt + JWT).
4. Provide a personalized, real-time employee dashboard and team-information module.
5. Enforce role-based access control at the API level.
6. Deliver an AI assistant that degrades gracefully.
7. Apply enterprise security best practices and validate the system with end-to-end testing.

---

## 8. System Architecture

The system follows a **three-tier architecture**: Presentation (browser), Application (Node.js/Express), and Platform/Data (ServiceNow).

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION TIER  — Browser (HTML5, CSS3, Vanilla JS, Chart.js)          │
│  login.html · set-password.html · index.html (SPA shell + view router)     │
│  JWT in client; all calls via apiFetch() with Bearer token                 │
└───────────────▲───────────────────────────────────────────┬──────────────┘
                │  HTTPS / JSON (REST)                        │ WebSocket /ws (live notifications)
┌───────────────┴───────────────────────────────────────────▼──────────────┐
│  APPLICATION TIER — Node.js + Express                                       │
│  Routes: /auth /employees /tasks /projects /sprint-tasks /feedback          │
│          /notifications /menu /issues /reports /webhooks /stats /chat       │
│  Middleware: verifyToken (JWT) · requireRole (RBAC) · helmet · rateLimit ·  │
│              express-validator                                              │
│  Services: snowClient (Axios, service account) · portalAuth (scrypt) ·      │
│            mailer (Nodemailer) · realtime (WebSocket) · logger (Winston)    │
└───────────────▲───────────────────────────────────────────┬──────────────┘
                │  REST Table API (Basic auth, SERVICE ACCOUNT)              │
┌───────────────┴───────────────────────────────────────────▼──────────────┐
│  PLATFORM / DATA TIER — ServiceNow Instance (Scope x_1850353_employ_0)      │
│  Tables · Flow Designer · Business Rules · Scripted REST API · sys_user     │
└────────────────────────────────────────────────────────────────────────────┘
```

**Technology stack**

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (SPA), Chart.js |
| Backend | Node.js, Express 5 |
| Integration | Axios (REST), ServiceNow Table API & Scripted REST API |
| Auth/Security | JSON Web Tokens, Node `crypto` scrypt, Helmet, express-rate-limit, express-validator |
| Realtime | `ws` (WebSocket) |
| Email | Nodemailer (SMTP / test inbox) |
| Logging | Winston |
| Platform | ServiceNow PDI (App Engine, Flow Designer, Business Rules) |
| AI | Google Gemini API (with local fallback) |

---

## 9. ServiceNow Components Used

| Component | Purpose in the project |
|---|---|
| **Scoped Application** (`x_1850353_employ_0`) | Container for all custom tables and logic |
| **Custom Tables** | Employee, Onboarding Task, Project, Project Sprint Task, Employee Feedback, Notification, Issue, Daily Menu |
| **REST Table API** | All CRUD operations from the backend service account |
| **Flow Designer** — *Auto Onboarding Tasks* | Auto-creates the standard onboarding checklist when an employee record is inserted |
| **Business Rules** — *AI Bottleneck Risk Predictor* | Runs *before insert/update* on Sprint Tasks; sets delay risk (High/Medium/Low) from progress + SLA |
| **Scripted REST API** — *Secure Auth → `/validate`* | Validates a user's credentials and returns identity + resolved role (used for role-less authentication) |
| **Choice fields** | `status` (pending/onboarded), task `status` (pending/completed), department |
| **Custom fields (Employee)** | `u_password_hash`, `u_setup_token_hash`, `u_setup_token_expires`, `u_team_name`, `u_team_lead`, `u_manager`, `u_work_location` |
| **sys_user / sys_user_has_role** | Identity provisioning and role assignment |
| **Roles** | `snc_basic_auth_api_access`, `x_1850353_employ_0.user` granted to provisioned employees |

---

## 10. Database Design

ServiceNow stores data in tables (analogous to relational tables). The core entities and key columns:

**Employee** (`x_1850353_employ_0_employee`)
| Column | Type | Notes |
|---|---|---|
| sys_id | GUID | Primary key |
| name | String | Full name |
| email | String | Login identifier (unique) |
| department | Choice | it / hr / security / … |
| joining_date | Date | |
| status | Choice | pending → onboarded |
| u_password_hash | String | scrypt hash (portal credential) |
| u_setup_token_hash | String | scrypt hash of one-time token |
| u_setup_token_expires | String | ISO expiry timestamp |
| u_team_name, u_team_lead, u_manager, u_work_location | String | Team information |

**Onboarding Task** (`x_1850353_employ_0_onboarding_task`)
| Column | Type | Notes |
|---|---|---|
| sys_id | GUID | Primary key |
| employee | Reference → Employee | Owner (basis of task ownership) |
| task_type | Choice/String | Laptop, VPN, ID Card, Desk Setup… |
| assigned_to | String | Fulfilling team |
| status | Choice | pending / completed |

**Project / Project Sprint Task / Employee Feedback / Notification / Issue / Daily Menu** — supporting entities for delivery tracking, surveys, alerts, ticketing and cafeteria.

**Relationships (ER summary):**
`Employee 1 ──< Onboarding Task` (one employee → many tasks, via the `employee` reference).
`Employee 1 ── 1 sys_user` (linked by email for identity).
`Project 1 ──< Project Sprint Task`.

---

## 11. Authentication Flow

The application **decouples portal login from ServiceNow Basic authentication** (a deliberate design after observing that platform-set passwords are rejected by instance security policy). Employees authenticate against the application using credentials they set themselves.

**Set-password onboarding flow**
```
HR registers hire → Employee record created
   → one-time token generated; scrypt(token) + 7-day expiry stored on the record
   → welcome email with a "Set Password" link  (no password is ever emailed)
Employee opens link → POST /api/auth/set-password {email, token, newPassword}
   → token verified (scrypt + expiry, single-use) → scrypt(password) stored; token cleared
Employee logs in → POST /api/auth/login {email, password}
   → backend verifies scrypt(password) against the stored hash
   → issues a short-lived signed JWT  { userId, userName, role, email }
Subsequent requests → Authorization: Bearer <JWT> → verifyToken middleware
```

**Security properties**
- Passwords stored only as **scrypt** hashes (salted, constant-time comparison); never plaintext.
- One-time tokens are **single-use, time-limited, and hashed at rest**.
- ServiceNow **service-account credentials never reach the browser**.
- Demo/test logins are **disabled in production** (`NODE_ENV=production`).
- Role is resolved **server-side** and embedded in the signed JWT — client tampering is ineffective.

---

## 12. Employee Onboarding Workflow

```
1. HR → "New Hire": name, email, department, joining date, team info
2. Backend creates the Employee record (status = pending)
3. ServiceNow Flow "Auto Onboarding Tasks" auto-creates the checklist:
        Laptop Provisioning · VPN Access · ID Card Issuance · Desk Setup
4. Backend provisions a sys_user + least-privilege roles, issues a set-password link,
   and emails the new hire a welcome + activation link
5. Employee sets password → logs in → sees personalized dashboard
6. Employee completes tasks (progress updates automatically)
7. HR selects the employee and clicks "Approve Selected"
        → all pending tasks → completed
        → employee.status → onboarded
8. Employee dashboard reflects: Status = Onboarded, Progress = 100%
```

This was validated end-to-end (see §19). The progress and status update **immediately** after approval because the dashboard reads the live ServiceNow record via `GET /api/employees/me`.

---

## 13. Team Information Module

Each employee is associated with team metadata maintained by HR:

- **Department, Team Name, Team Lead, Manager, Work Location.**

**Behaviour**
- HR **assigns** these fields in the New Hire form; they are stored on the Employee record (`u_team_*`, `u_work_location`).
- The employee dashboard renders a **"My Team Information"** card (read-only) populated from `GET /api/employees/me`.
- Employees **cannot modify** team data — there is no employee write path; the create/update endpoints require the HR role (403 otherwise).

*Example employee view:* "Welcome Kiran 👋 — Team: **Application Development**, Team Lead: **Rohit Kumar**, Manager: **Priya Sharma**, Status: **Onboarded**."

---

## 14. AI Assistant Module

An in-app assistant helps employees with onboarding questions.

- **Local intent layer (always available):** greetings (`hi`/`hello`/`help`) and common intents (complete a task, report an issue, feedback, status, password, menu) are answered instantly **without** any external call.
- **Generative layer:** other questions are forwarded to the **Google Gemini API** with live ServiceNow context (task counts, bottlenecks).
- **Graceful degradation:** if Gemini is unavailable (e.g., quota/HTTP 429, auth error, timeout), the assistant returns a **specific, meaningful message plus usable guidance** instead of failing — so the assistant is never a dead end.

This design ensures the assistant remains useful and reliable regardless of external service status.

---

## 15. Guided Tour Module

To improve first-time experience, a **first-login guided tour** runs automatically for new employees:

- Detects first login (per-user flag in `localStorage`).
- Highlights key areas with modern spotlight tooltips: **My Profile → Employee Tasks → Report Issue → Feedback → AI Assistant** (Title, Description, *Next*, *Skip*, step counter).
- Completion is saved; it does not reappear.
- A **Help (?) → "Take Product Tour"** button in the header lets users replay it anytime.
- Existing users and HR/Managers do not see it automatically.

---

## 16. Role-Based Access Control (RBAC)

Three application roles are derived from ServiceNow roles: **HR (admin), Manager, Employee**.

| Capability | Employee | Manager | HR |
|---|---|---|---|
| View own profile/tasks/progress | ✅ | ✅ | ✅ |
| View all employees / tasks / stats | ❌ (403) | ✅ | ✅ |
| Register new hire / assign team | ❌ | ❌ | ✅ |
| Approve onboarding | ❌ | ❌ | ✅ |
| Reports & Integrations | ❌ | partial | ✅ |
| Broadcast notifications | ❌ | ✅ | ✅ |

- **Enforced server-side** via `verifyToken` + `requireRole` on every protected route.
- The UI additionally hides/locks controls per role, but security never depends on the UI.
- **Task ownership** is identity-bound: employees retrieve only their own tasks through `GET /api/employees/me`, which queries `onboarding_task` by the employee's own record id — verified with zero cross-employee leakage.

---

## 17. Security Features

- **Password security:** scrypt hashing (salted, `timingSafeEqual`); no plaintext storage or transmission.
- **One-time onboarding tokens:** hashed, single-use, time-limited.
- **JWT sessions:** signed (HS256), expiring; server-resolved roles.
- **HTTP security headers (Helmet):** Content-Security-Policy, HSTS, X-Frame-Options=SAMEORIGIN, X-Content-Type-Options=nosniff.
- **Rate limiting** on authentication to mitigate brute-force.
- **Input validation** (express-validator) on create/login/feedback/issue endpoints.
- **Injection-safe:** parameterized ServiceNow REST calls; SQL-injection / XSS attempts in login are rejected (401/400).
- **Broken-access-control protection:** all list/read endpoints role-gated; employees cannot enumerate others.
- **Secrets management:** credentials/keys in `.env` (never committed, never sent to the browser); least-privilege service account.

---

## 18. API Integration

The backend exposes a REST API consumed by the SPA and integrates outward with ServiceNow and Gemini.

**Representative endpoints**
| Method & Path | Role | Purpose |
|---|---|---|
| `POST /api/auth/login` | public | Authenticate, return JWT |
| `POST /api/auth/set-password` | public (token) | Activate account |
| `GET /api/employees/me` | any auth | Own profile + tasks + team (identity-filtered) |
| `GET /api/employees` | hr/manager | Full directory |
| `POST /api/employees` | hr | Register hire (+team, +provisioning) |
| `POST /api/employees/:id/approve` | hr | Approve onboarding |
| `GET /api/tasks` | hr/manager | All tasks |
| `GET /api/stats` | hr/manager | KPI aggregates |
| `POST /api/feedback` | any auth | Submit feedback |
| `POST /api/notifications/broadcast` | hr/manager | Broadcast |
| `POST /api/chat` | any auth | AI assistant |

**Outbound integration:** ServiceNow Table API + Scripted REST API (Basic auth, service account); Google Gemini `generateContent`; SMTP for email; WebSocket `/ws` for live notifications.

---

## 19. Testing Results

End-to-end and security testing were performed against the live instance. Summary of verified results:

| # | Test | Result |
|---|---|---|
| 1 | Create hire → provision → welcome email | **Pass** (email sent; account provisioned) |
| 2 | Set-password (one-time token) | **Pass**; reused token → 400 (single-use) |
| 3 | Employee login → JWT, role=employee | **Pass** |
| 4 | Dashboard before approval | pending / 0% / 0–5 tasks |
| 5 | HR approve → tasks completed | **Pass** (5/5) |
| 6 | Dashboard after approval | **onboarded / 100% / 5/5** (no stale data) |
| 7 | Task ownership (Kiran vs Asha) | **Pass** — 0 task overlap |
| 8 | Employee → `/employees`, `/tasks`, `/stats` | **403** (cannot view others) |
| 9 | Employee → create/modify | **403** (cannot edit) |
| 10 | HR → `/employees`, `/tasks` | **200** (full visibility) |
| 11 | Team info: HR assign / employee view / no edit | **Pass** |
| 12 | AI Assistant: hi/help/intents | helpful replies (no external dependency) |
| 13 | AI Assistant: Gemini 429 | graceful, meaningful fallback |
| 14 | Auth: invalid/empty/SQLi/XSS | 401/400 (rejected) |
| 15 | Security headers (Helmet) | present (CSP, HSTS, X-Frame-Options) |
| 16 | Rate limiting | active |
| 17 | Backend integration suite | 58/58 passing |

---

## 20. Screenshots

*(Insert captured images here. Suggested figures and captions:)*

- **Fig. 20.1** — Login page (ocean-themed).
- **Fig. 20.2** — Set Password (onboarding activation) page.
- **Fig. 20.3** — Employee Dashboard: stat cards, onboarding progress, task breakdown chart.
- **Fig. 20.4** — "My Team Information" card (Department, Team, Lead, Manager, Location, Status).
- **Fig. 20.5** — Employee Tasks ("My Onboarding Tasks") with Complete action.
- **Fig. 20.6** — HR Dashboard: employee table, dynamic filter panel (Pin Filters), "Approve Selected".
- **Fig. 20.7** — First-login Guided Tour spotlight tooltip.
- **Fig. 20.8** — AI Assistant chat window.
- **Fig. 20.9** — SLA Intelligence & AI bottleneck prediction.
- **Fig. 20.10** — Reports & Exports; Weekly Lunch Menu.
- **Fig. 20.11** — ServiceNow: Employee table, Flow Designer "Auto Onboarding Tasks", Business Rule.

---

## 21. Advantages

- **Automation:** zero manual checklist creation; tasks generated by Flow Designer.
- **Speed & accuracy:** standardized onboarding, fewer missed steps.
- **Real-time visibility:** live status/progress for employees and HR.
- **Security-first:** scrypt + JWT + RBAC + Helmet; no credentials in the browser.
- **Resilience:** AI and email degrade gracefully; demo fallback keeps the app demoable offline.
- **Single source of truth:** ServiceNow as the system of record with full auditability.
- **Great UX:** responsive design, guided tour, friendly assistant.
- **Extensible:** clean route/service separation; webhooks for external systems.

---

## 22. Future Scope

- **Single Sign-On (SAML/OIDC)** and **httpOnly cookie + CSRF** session model.
- **Multi-factor authentication.**
- **Document management** (upload/verify certificates) within onboarding.
- **Configurable onboarding templates** per department/role.
- **Mobile application** (React Native / PWA).
- **Advanced analytics & ML** for true bottleneck prediction and time-to-productivity.
- **Manager self-service** for team configuration and approvals.
- **Multi-language (i18n)** expansion and accessibility (WCAG 2.1 AA) certification.

---

## 23. Conclusion

The Enterprise Workflow Hub demonstrates a complete, production-shaped solution for automated employee onboarding by integrating a modern Node.js web application with the ServiceNow enterprise platform. It automates task generation through Flow Designer, secures authentication with a self-service set-password flow (scrypt + one-time tokens + JWT), enforces strict role-based access control, presents employees a personalized dashboard with live status and team information, and adds intelligent assistance, SLA insights and a guided onboarding experience — all hardened with enterprise security practices and validated through extensive end-to-end testing. The project showcases practical skills in full-stack development, enterprise platform integration, REST API design, applied security, and workflow automation, and provides a strong foundation for further enhancement toward a real-world deployment.

---

*Prepared for B.Tech project submission — Enterprise Workflow Hub.*
