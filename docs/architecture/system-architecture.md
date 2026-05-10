# System Architecture

## Overview

The Enterprise Workflow Hub follows a **three-tier architecture**:

1. **Presentation Layer** — HTML/CSS/JS frontend served as static assets
2. **Application Layer** — Node.js + Express REST API with MVC pattern
3. **Data Layer** — ServiceNow PDI (cloud) via REST Table API

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Login      │  │  Dashboard   │  │  AI Chatbot      │  │
│  │   (JWT)      │  │  (Chart.js)  │  │  (Gemini API)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / HTTP
┌────────────────────────▼────────────────────────────────────┐
│              EXPRESS APPLICATION SERVER                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Security Middleware                                  │  │
│  │  • Helmet (CSP, HSTS, XSS)                            │  │
│  │  • express-rate-limit (100 req / 15 min)              │  │
│  │  • express-validator (input sanitization)             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authentication Middleware                            │  │
│  │  • JWT verification (Authorization: Bearer)           │  │
│  │  • Role-based access control (HR / Manager / Employee)│  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │   Routes     │ │ Controllers  │ │    Services      │   │
│  │  /api/auth   │ │   (async)    │ │  snowClient.js   │   │
│  │  /api/stats  │ │              │ │  logger.js       │   │
│  │  /api/menu   │ │              │ │                  │   │
│  └──────────────┘ └──────────────┘ └──────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ ServiceNow REST Table API
                         │ (Basic Auth over HTTPS)
┌────────────────────────▼────────────────────────────────────┐
│              SERVICENOW PDI INSTANCE                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Employee    │  │  Onboarding  │  │  Project Tables  │  │
│  │  Table       │  │  Task Table  │  │                  │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────┤  │
│  │  Issue       │  │  Daily Menu  │  │  Sprint Tasks    │  │
│  │  Table       │  │  Table       │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  Flow Designer  ──►  Automated workflows & notifications     │
│  Business Rules ──►  AI Bottleneck Risk Predictor            │
│  ACLs           ──►  Scoped application security             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Employee Onboarding

```
HR Manager (Browser)
    │
    ▼
POST /api/employees (JWT + HR role)
    │
    ▼
Express Controller → snowClient.post()
    │
    ▼
ServiceNow: x_..._employee INSERT
    │
    ▼
Flow Designer Trigger → x_..._onboarding_task INSERT (auto)
    │
    ▼
Employee sees tasks in Dashboard
```

### Daily Menu

```
HR Manager (Browser)
    │
    ▼
POST /api/menu (JWT + HR role)
    │
    ▼
Express Controller → validation → snowClient.post()
    │
    ▼
ServiceNow: x_..._daily_menu INSERT
    │
    ▼
All employees see updated menu in real-time
```

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| **Node.js + Express** | Fast to develop, massive ecosystem, non-blocking I/O ideal for API proxying |
| **ServiceNow PDI as DB** | Project requirement; leverages enterprise-grade ACLs, Flow Designer, SLAs |
| **JWT over Sessions** | Stateless, scalable, works across distributed environments |
| **Vanilla JS Frontend** | Zero build step, fast load times, easy to deploy |
| **Winston Logging** | Production-standard logging with rotation and JSON format |
| **Helmet + Rate Limit** | Defense in depth against OWASP Top 10 risks |
