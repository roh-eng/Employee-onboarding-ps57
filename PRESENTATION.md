---
marp: true
theme: default
paginate: true
title: Enterprise Workflow Hub
---

<!--
HOW TO USE:
• Render directly with Marp (VS Code "Marp for VS Code" → Export to PDF/PPTX), or
• Copy each slide's content into PowerPoint / Google Slides.
• Text under "Speaker Notes" is for the presenter (Marp puts HTML-comment notes in the
  PPTX notes pane automatically).
-->

# Enterprise Workflow Hub
### AI-Assisted Employee Onboarding on ServiceNow

**A full-stack onboarding & delivery-intelligence platform**
Node.js · Express · ServiceNow PDI · Vanilla JS

<!--
Speaker Notes (Slide 1 — Introduction):
Good morning. Our project is the Enterprise Workflow Hub — a full-stack web application
that automates employee onboarding using ServiceNow as the backend platform. It combines a
Node.js/Express server, a ServiceNow Personal Developer Instance for data and workflow
automation, and a lightweight vanilla-JS frontend. The goal: take a new hire from "record
created" to "fully onboarded and logged in" with as little manual effort as possible, while
keeping everything secure and role-aware.
-->

---

## 1. Introduction

- **What it is:** an enterprise onboarding portal that provisions, tracks, and approves new employees end-to-end.
- **Built on:** Node.js + Express backend, **ServiceNow** (tables, Flow Designer, Business Rules), vanilla-JS SPA frontend.
- **Who uses it:** **HR/Admin**, **Managers**, and **Employees** — each sees a role-appropriate experience.
- **Key idea:** the app orchestrates ServiceNow; ServiceNow automates the workflow.

<!--
Speaker Notes:
Introduce the three user roles and the core integration pattern — the Express app is the
experience layer and a service account talks to ServiceNow's REST Table API; ServiceNow's
Flow Designer and Business Rules do the heavy automation. Emphasise it's a real integration,
not a mock — it runs against a live ServiceNow instance.
-->

---

## 2. Problem Statement

- Onboarding is **manual, fragmented, and slow** — spreadsheets, emails, scattered approvals.
- **No single source of truth** for an employee's status, tasks, and progress.
- **Security gaps:** ad-hoc accounts, shared passwords, weak access control.
- **Poor visibility:** HR can't see progress; employees don't know what to do next.
- **Onboarding ≠ access:** creating a record doesn't give the new hire a working login.

<!--
Speaker Notes:
Frame the pain. In most orgs onboarding spans HR, IT and managers with no unified tool.
Status lives in someone's inbox. New hires are confused about next steps, and giving them
a secure system login is a separate, error-prone manual step. We targeted exactly that gap.
-->

---

## 3. Solution Overview

- **One portal** for the whole onboarding lifecycle: create → provision → tasks → approve → onboarded.
- **Automated task generation** via ServiceNow Flow Designer on new-hire creation.
- **Secure self-service login** — new hires set their own password via a one-time link.
- **Role-based dashboards** — HR sees everything; employees see only their own data.
- **AI Assistant + Guided Tour** to help employees self-serve.
- **Notifications + email** keep everyone informed.

<!--
Speaker Notes:
This is the elevator pitch. We don't just store data — we automate the workflow, secure the
identity, and guide the user. Each of these bullets becomes a later slide. The headline win:
a new hire goes from "registered by HR" to "logged in and completing tasks" automatically.
-->

---

## 4. System Architecture

```
 Browser (SPA: login, set-password, dashboard)
        │  HTTPS (same-origin /api + /ws WebSocket)
        ▼
 Node.js / Express  ── helmet · rate-limit · JWT · RBAC
   • REST API   • static frontend   • live notifications
        │  ServiceNow REST Table API (service account)
        ▼
 ServiceNow PDI
   • Tables (employee, onboarding_task, …)
   • Flow Designer  • Business Rules  • Scripted REST (auth)
   ─ external: Gemini (AI) · SMTP (email)
```

<!--
Speaker Notes:
Walk the layers top to bottom. The browser talks same-origin to Express (which also serves
the frontend — important for our deployment). Express enforces security (Helmet headers, rate
limiting, JWT, role checks) and is the ONLY thing that holds the ServiceNow service-account
credentials. ServiceNow holds the data and runs the automation. Two external services: Google
Gemini for the AI assistant and SMTP for onboarding emails — both optional and fail gracefully.
-->

---

## 5. Employee Onboarding Flow

1. **HR registers a new hire** (name, email, department, team info).
2. ServiceNow **Flow Designer auto-creates** the checklist: *Laptop, VPN, ID Card, Desk Setup*.
3. App **provisions a ServiceNow user** + emails a **welcome + set-password link**.
4. Employee **completes tasks**; progress updates in real time.
5. **HR approves onboarding** (one click) → tasks marked complete → **status → Onboarded**.

```
Create ──▶ Auto-tasks ──▶ Provision + email ──▶ Set password
   ──▶ Complete tasks ──▶ HR approve ──▶ ONBOARDED ✅
```

<!--
Speaker Notes:
This is the core workflow and our main demo. Stress the automation points: the 4 tasks are
created by a ServiceNow Flow, not by our code. HR's "Approve Selected" action completes the
employee's pending tasks and flips the status to Onboarded server-side. We verified this
end-to-end against the live instance — tasks go pending → completed, status → onboarded.
-->

---

## 6. Authentication System

- **Problem found:** ServiceNow rejects **API-set passwords** for login (instance policy) → new hires couldn't sign in.
- **Solution:** **Set-Password onboarding flow** — the portal is the identity provider for employees.
  - One-time **token** (hashed, 7-day expiry) emailed as a secure link.
  - Employee sets a password → stored as a **scrypt hash** on their record.
  - Login verified by the app → issues a **short-lived JWT**.
- **Service account** does all ServiceNow API calls. **No security properties disabled; no users modified.**

<!--
Speaker Notes:
This is our strongest engineering story. We investigated with evidence and found the 401 was
an authentication failure — ServiceNow's policy makes API-created passwords unusable for Basic
auth. Rather than weaken security, we made the portal own employee credentials: a one-time
hashed token, a scrypt-hashed password, and a JWT — all with Node's built-in crypto, no new
dependencies. Admins/HR still authenticate through ServiceNow. We tested new login, wrong
password (401), and single-use token (reuse → 400).
-->

---

## 7. Team Information Module

- HR assigns at creation: **Team Name, Team Lead, Manager, Work Location** (+ Department).
- Stored as custom fields on the ServiceNow employee record.
- Employee dashboard shows a **"My Team Information"** card — **read-only** ("managed by HR").
- Loaded live from ServiceNow via the employee's own-data endpoint.

> *Welcome Kiran 👋 — Team: Application Development · Team Lead: Rohit Kumar · Manager: Priya Sharma · Status: Onboarded*

<!--
Speaker Notes:
Beyond tasks, a new hire wants to know "who's my team?". HR fills these fields on the New Hire
form; they're stored in ServiceNow and surfaced read-only on the employee's dashboard. The
employee cannot edit them — enforced server-side (create/edit endpoints are HR-only). The quote
is the exact experience we demoed for an employee named Kiran.
-->

---

## 8. AI Assistant & Guided Tour

**AI Assistant**
- In-app chat for onboarding help (powered by Google Gemini).
- **Greetings/help & common questions answered locally** — always works, even if the AI quota is exhausted.
- Graceful, meaningful fallback messages (never a dead-end).

**First-Login Guided Tour**
- Auto-starts for **new employees only**; highlights Profile, Tasks, Report Issue, Feedback, AI Assistant.
- Modern tooltips (Next / Skip), saved once completed; replay via **Help → Take Product Tour**.

<!--
Speaker Notes:
Two self-service features. The assistant is resilient — if Gemini is rate-limited, greetings
and FAQs still respond from a local intent handler, and any failure returns helpful guidance
instead of an error. The guided tour onboards the user to the UI itself: it detects first login
per user, walks them through the key areas, and won't nag returning users — but they can replay
it from the Help button any time.
-->

---

## 9. Demo Screens

- **Login / Set-Password** — secure self-service activation.
- **HR Dashboard** — searchable employee directory, dynamic filters, **Approve onboarding**.
- **Employee Dashboard** — progress %, task checklist, **My Team Information**.
- **Daily Menu** — auto-rotating weekly cafeteria menu (today highlighted).
- **AI Assistant** + **Guided Tour** overlays.
- **Notifications** (in-app + email) and **Reports/CSV exports**.

<!--
Speaker Notes:
For the live demo, show: HR creating Kiran with team info → the welcome/set-password email →
Kiran setting a password and logging in → his dashboard with 0% then completing tasks → HR
clicking Approve → Kiran's status flips to Onboarded at 100%. Then show role separation:
Kiran cannot see other employees; HR sees everyone. Finish with the AI assistant and the tour.
-->

---

## 10. Conclusion

- **Delivered:** an automated, secure, role-aware onboarding platform on ServiceNow.
- **Highlights:** Flow-driven tasks · self-service secure login · live progress · AI help · guided tour.
- **Verified end-to-end** against a live ServiceNow instance; **deployment-ready** (Render/Azure/Docker).
- **Future scope:** httpOnly-cookie sessions + CSRF, SSO/SAML, mobile app, analytics dashboards, multi-stage approvals, document uploads.
- **Outcome:** faster onboarding, single source of truth, stronger security.

**Thank you — Questions?**

<!--
Speaker Notes:
Summarise the value: we automated a manual process, solved a real ServiceNow authentication
constraint without weakening security, and enforced proper role-based access — all verified
live. Note it's production-ready with a documented deployment path. Close with future scope to
show we understand the roadmap (cookie sessions/CSRF, SSO, mobile, analytics) and invite
questions.
-->
