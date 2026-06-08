# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0] - 2026-06-08

### Added
- **Infrastructure Sync** — Programmatic table creation for `employee_feedback` and `notification` modules via `fix_all_tables.js`.
- **Permanent Notifications** — Transitioned `notification` table from in-memory fallback to permanent ServiceNow storage with full dictionary patch scripts.
- **Automated Validation** — Added `check_menus.js` and `export_menu_tables.js` for CI/CD and deployment validation.

### Changed
- **API Consistency** — Validated and fixed REST endpoint inconsistencies between the React/Vanilla frontend and the Node.js backend.
- **Technical Debt Cleanup** — Removed redundant root-level files and obsolete `sprint_task` manual definitions from the PDI.
- **Contributor Obfuscation** — Scrubbed historical dummy commit names ("Jules", "Claude") for public showcase security and cleaner history.

## [2.0.0] - 2026-05-10

### Added
- **Daily Menu Module** — Full CRUD (create, read, update, delete) with analytics endpoint
- **JWT Authentication** — Real ServiceNow `sys_user` validation with signed tokens
- **Role-Based Access Control** — HR / Manager / Employee middleware protection
- **Security Hardening** — Helmet.js, rate limiting, input validation, XSS protection
- **Winston Logging** — Structured JSON logs to `logs/` directory
- **API Validation** — express-validator for all POST/PUT endpoints
- **Health Check** — `/api/health` endpoint for monitoring
- **Postman Collection** — Complete API collection with environment variables
- **Smoke Tests** — Automated API validation script
- **ServiceNow Scripts** — Automated table and ACL creation utilities
- **Comprehensive Documentation** — Architecture, setup guide, API docs, screenshots guide

### Changed
- **Backend Architecture** — Refactored monolithic `server.js` into MVC structure
  - `backend/config/` — Environment configuration
  - `backend/middleware/` — Auth, validation, security, error handling
  - `backend/routes/` — Modular route definitions
  - `backend/services/` — ServiceNow client and logger
- **Frontend Structure** — Moved from `public/` to `frontend/` directory
- **Authentication Flow** — Replaced fake `setTimeout` login with real JWT flow
- **API Responses** — Standardized `{ success, data/error }` format

### Security
- Added `.gitignore` for `.env`, `node_modules/`, `logs/`
- Created `.env.example` with placeholder values
- Implemented rate limiting (100 req/15min general, 10 req/15min auth)
- Added input sanitization with express-validator
- JWT tokens expire after 8 hours

## [1.0.0] - 2026-05-09

### Added
- Initial Enterprise Workflow Hub release
- ServiceNow PDI integration via REST Table API
- Employee onboarding dashboard
- Task management with Flow Designer triggers
- Issue reporting system
- Project Delivery module
- SLA Intelligence with AI bottleneck prediction
- AI Chatbot powered by Google Gemini
- Chart.js analytics dashboard
- Role-based sidebar navigation
