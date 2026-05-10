# Enterprise Workflow & Delivery Intelligence Hub

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-blue)](https://expressjs.com/)
[![ServiceNow](https://img.shields.io/badge/ServiceNow-PDI-orange)](https://developer.servicenow.com/)

A production-ready, full-stack enterprise application that bridges a modern Node.js backend with **ServiceNow PDI** (Personal Developer Instance) to deliver end-to-end employee onboarding, project delivery, SLA intelligence, and AI-powered assistance.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [ServiceNow Integration](#servicenow-integration)
- [Testing](#testing)
- [Security](#security)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)

---

## Problem Statement

Traditional enterprises face critical workflow gaps:

1. **Manual Onboarding** — HR teams use spreadsheets and emails, causing delays and data loss.
2. **No HR-IT Communication** — Employee data is siloed; IT provisioning is reactive.
3. **No Centralized Platform** — Managers lack visibility into tasks, SLAs, and bottlenecks.
4. **No SLA Monitoring** — Sprint task delays are discovered too late for corrective action.

This platform solves all four problems by integrating **ServiceNow App Engine Studio** with a modern Node.js dashboard, complete with Flow Designer automation, ACL-based RBAC, and AI bottleneck prediction.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Login      │  │  Dashboard   │  │  AI Chatbot      │  │
│  │   (JWT)      │  │  (Chart.js)  │  │  (Gemini API)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼────────────────────────────────────┐
│              NODE.JS + EXPRESS BACKEND                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Helmet     │  │  Rate Limit  │  │  JWT Auth        │  │
│  │   CORS       │  │  Validation  │  │  Role Middleware │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ ServiceNow REST Table API
┌────────────────────────▼────────────────────────────────────┐
│              SERVICENOW PDI (App Engine)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Employee    │  │  Onboarding  │  │  Project / Sprint│  │
│  │  Table       │  │  Task Table  │  │  Task Tables     │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────┤  │
│  │  Issue       │  │  Daily Menu  │  │  SLA Definitions │  │
│  │  Table       │  │  Table       │  │  Business Rules  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  Flow Designer  ──►  Automated Onboarding & Escalation       │
│  ACLs           ──►  Role-Based Access Control               │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

| Module | Description | Role Access |
|--------|-------------|-------------|
| **Company Overview** | Live KPI cards, doughnut & bar charts (Chart.js) | All |
| **HR Dashboard** | Employee CRUD with avatar generation, New Hire form | HR |
| **Employee Tasks** | Onboarding task list with status & completion action | HR, Manager |
| **Report Issue** | Ticket creation with priority levels | All |
| **Daily Menu** | Meal catalog with calories, availability, analytics | All (HR manages) |
| **Project Delivery** | Project list with client, manager, status | HR, Manager |
| **SLA Intelligence** | Sprint task progress, AI delay risk prediction | HR, Manager |
| **My Performance** | Task health score, SLA success rate, priority matrix | All |
| **AI Chatbot** | Gemini-powered assistant with live ServiceNow context | All |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 18+ |
| **Backend** | Express.js 5.x |
| **Security** | Helmet, express-rate-limit, JWT, express-validator |
| **Logging** | Winston |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Charts** | Chart.js 4.4 |
| **Icons** | Font Awesome 6.4 |
| **External APIs** | ServiceNow REST Table API, Google Gemini 1.5 Flash |

---

## Project Structure

```
EnterpriseWorkflowHub/
│
├── backend/                     # Express MVC Architecture
│   ├── config/                  # Environment configuration
│   ├── controllers/             # Business logic controllers
│   ├── middleware/              # Auth, validation, security, error handling
│   ├── routes/                  # API route definitions
│   ├── services/                # ServiceNow client, logger
│   └── server.js                # Application entry point
│
├── frontend/                    # Static web application
│   ├── assets/
│   ├── css/                     # style.css (design system)
│   ├── js/                      # app.js (SPA logic)
│   ├── index.html               # Dashboard shell
│   └── login.html               # Secure login portal
│
├── servicenow/                  # ServiceNow automation artifacts
│   ├── business_rules/          # AI Bottleneck Risk Predictor
│   ├── create_table.js          # Daily Menu table creator
│   ├── create_acls.js           # ACL generator
│   └── screenshots/
│
├── docs/                        # Documentation
│   ├── architecture/
│   ├── api-documentation/
│   ├── setup-guide/
│   └── screenshots/
│
├── tests/                       # Validation suite
│   ├── api.test.js              # Smoke tests
│   └── EnterpriseWorkflowHub.postman_collection.json
│
├── logs/                        # Winston log files
├── .env.example                 # Environment template
├── .gitignore                   # Git exclusions
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- ServiceNow PDI instance
- Gemini API key (optional, for AI chatbot)

### Installation

```bash
# Clone the repository
git clone https://github.com/roh-eng/Employee-onboarding-ps57.git
cd EnterpriseWorkflowHub

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your ServiceNow and Gemini credentials

# Start the server
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `SERVICENOW_INSTANCE` | Yes | Your PDI URL |
| `SERVICENOW_USERNAME` | Yes | Admin username |
| `SERVICENOW_PASSWORD` | Yes | Admin password |
| `SERVICENOW_SCOPE` | Yes | Scoped app prefix |
| `GEMINI_API_KEY` | No | Google AI Studio API key |
| `JWT_SECRET` | Yes | Strong secret for token signing |

---

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Validate credentials against ServiceNow `sys_user` |
| `POST` | `/api/auth/logout` | Client-side token clear |
| `GET`  | `/api/auth/session` | Validate JWT session |

### Resources

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET`  | `/api/employees` | JWT | All | List employees |
| `POST` | `/api/employees` | JWT | HR | Create employee |
| `GET`  | `/api/tasks` | JWT | All | List onboarding tasks |
| `PUT`  | `/api/tasks/:id` | JWT | HR, Manager | Update task status |
| `GET`  | `/api/issues` | JWT | All | List issues |
| `POST` | `/api/issues` | JWT | All | Report issue |
| `GET`  | `/api/projects` | JWT | All | List projects |
| `POST` | `/api/projects` | JWT | HR, Manager | Create project |
| `GET`  | `/api/sprint-tasks` | JWT | All | List sprint tasks |
| `PUT`  | `/api/sprint-tasks/:id` | JWT | HR, Manager | Update progress |
| `GET`  | `/api/menu` | JWT | All | List daily menu |
| `POST` | `/api/menu` | JWT | HR | Add menu item |
| `PUT`  | `/api/menu/:id` | JWT | HR | Update menu item |
| `DELETE` | `/api/menu/:id` | JWT | HR | Delete menu item |
| `GET`  | `/api/menu/analytics` | JWT | All | Menu statistics |
| `GET`  | `/api/stats` | JWT | All | Dashboard KPIs |
| `GET`  | `/api/stats/employee` | JWT | All | Performance stats |
| `POST` | `/api/chat` | JWT | All | AI assistant message |
| `GET`  | `/api/health` | None | — | Server health check |

### Response Format

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": "Description of the error"
}
```

---

## Authentication

The system uses **JWT (JSON Web Tokens)** issued after validating credentials against the ServiceNow `sys_user` table.

### Flow

1. User submits username/password on `login.html`.
2. Backend creates a temporary ServiceNow client with the user's credentials.
3. If `sys_user` lookup succeeds, a JWT is signed with `userId`, `userName`, and `role`.
4. Frontend stores the token in `localStorage` and sends it as `Authorization: Bearer <token>` on every request.
5. Backend middleware verifies the token and enforces role-based access.

---

## ServiceNow Integration

### Custom Tables

| Table | Purpose |
|-------|---------|
| `x_..._employee` | Employee records |
| `x_..._onboarding_task` | Task assignments |
| `x_..._project` | Project master data |
| `x_..._project_sprint_task` | Sprint tasks with progress & SLA |
| `x_..._issue` | Issue/ticket tracking |
| `x_..._daily_menu` | Meal catalog |

### Automation

- **Flow Designer**: Employee onboarding triggers automatic task creation.
- **Business Rules**: AI Bottleneck Risk Predictor updates `delay_risk` based on progress %.
- **SLA Definitions**: 5-day development SLA with breach escalation.

### Running Table Scripts

```bash
node servicenow/create_table.js   # Creates Daily Menu table
node servicenow/create_acls.js    # Creates ACLs for Daily Menu
```

---

## Testing

### Smoke Tests

```bash
node tests/api.test.js
```

Validates:
- Health endpoint returns `200 OK`
- Auth validation rejects empty credentials (`400`)
- Protected routes reject unauthenticated requests (`401`)

### Postman Collection

Import `tests/EnterpriseWorkflowHub.postman_collection.json` into Postman.

1. Run **Login** request first to populate the `{{token}}` variable.
2. Execute any resource request with the token automatically injected.

---

## Security

| Layer | Implementation |
|-------|----------------|
| **Headers** | Helmet.js (CSP, HSTS, X-Frame-Options, etc.) |
| **Rate Limiting** | 100 req/15min general, 10 req/15min login |
| **Input Validation** | express-validator with sanitization |
| **Authentication** | JWT with 8-hour expiration |
| **Authorization** | Role-based middleware (HR / Manager / Employee) |
| **CORS** | Restricted to known origins |
| **Secrets** | Environment variables only; `.env` gitignored |

---

## Screenshots

> Placeholder sections for evaluation submission:

- `docs/screenshots/login.png` — Secure login with role selector
- `docs/screenshots/dashboard.png` — Company Overview with live charts
- `docs/screenshots/hr-dashboard.png` — Employee management
- `docs/screenshots/tasks.png` — Onboarding task board
- `docs/screenshots/projects.png` — Project Delivery dashboard
- `docs/screenshots/slas.png` — SLA Intelligence with AI risk
- `docs/screenshots/daily-menu.png` — Daily Menu module
- `docs/screenshots/performance.png` — My Performance analytics
- `docs/screenshots/chatbot.png` — AI Assistant widget

---

## Future Enhancements

- [ ] **Mobile App** — React Native companion for field HR
- [ ] **HRMS Integration** — SAP / Workday connector
- [ ] **Advanced AI Analytics** — Predictive turnover modeling
- [ ] **Multi-Tenant Support** — Multi-company environment scaling
- [ ] **Push Notifications** — Real-time SLA breach alerts
- [ ] **Dark Mode Persistence** — User preference stored in DB

---

## License

ISC

---

## Contributors

Enterprise Workflow Team
