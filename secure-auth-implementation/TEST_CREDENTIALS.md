# 🔐 Test User Accounts — Employee Onboarding Demo

Three ready-to-use **employee** logins for demoing the app from the employee side.
For the **admin side**, sign in with **your own ServiceNow instance admin login**
(no fake admin account is shipped).

These three accounts:
- authenticate **locally** (no ServiceNow required), so the demo always works even
  when the ServiceNow PDI is asleep — defined in `EnterpriseWorkflowHub/backend/routes/auth.js`; **and**
- are **also created as real users in the ServiceNow `sys_user` table** (with passwords),
  so they exist in the instance too.

> ⚠️ Demo-only accounts. Disable the hardcoded block in `auth.js` for production.

---

## Test User Accounts

| User       | Username         | Password      | Role     | Purpose                                   |
|------------|------------------|---------------|----------|-------------------------------------------|
| Employee 1 | `sarah_employee` | `Sarah@5678`  | Employee | Employee (own-data) view                  |
| Employee 2 | `john_employee`  | `John@9012`   | Employee | A *different* employee's own data         |
| Employee 3 | `emma_employee`  | `Emma@3456`   | Employee | A third, fully-onboarded employee         |
| **Admin**  | *(your ServiceNow admin)* | *(your password)* | Admin | Use your real instance admin login |

*Passwords are 9–10 characters with upper/lowercase letters, a number, and a symbol.*

| Login            | Display name   | Email                            | In ServiceNow `sys_user`? |
|------------------|----------------|----------------------------------|---------------------------|
| `sarah_employee` | Sarah Johnson  | sarah.johnson@enterprisehub.com  | ✅ created                |
| `john_employee`  | John Carter    | john.carter@enterprisehub.com    | ✅ created                |
| `emma_employee`  | Emma Wilson    | emma.wilson@enterprisehub.com    | ✅ created                |

> The admin demo account that previously existed (`admin_demo`) has been **removed** —
> use your own ServiceNow admin credentials for the admin view. When you log in as the
> ServiceNow admin, the app resolves your role server-side from `sys_user_has_role`
> and shows the full admin experience.

---

## How to Test

1. Start the app:
   ```bash
   cd EnterpriseWorkflowHub
   node backend/server.js
   ```
2. Open **http://localhost:3000/login.html** (hard-refresh once with **Ctrl+Shift+R**).
3. Sign in as an employee (table above) — or as your ServiceNow admin for the admin side.
4. All **11 modules** appear in the sidebar for every role, but the **content inside
   each module is filtered by role**.
5. Log out and sign in as a different user to compare.

> Tip: open Sarah and John in two browser windows to show that each sees **only their own** data.

---

## Expected Behavior

### 👑 As Admin (your ServiceNow instance admin login)
- ✅ **Overview** — company-wide KPIs and charts.
- ✅ **HR Dashboard** — *all* employees (live ServiceNow directory) + **New Hire** button.
- ✅ **Onboarding Tasks** — *all employees'* tasks; title reads "All Employees".
- ✅ **Employee Feedback** — sees the **Employee** column with everyone's feedback.
- ✅ **Project Delivery** — full table with the **New Project** button.
- ✅ **SLA Intelligence** — sprint tasks with the **Update** action button.
- ✅ **Daily Menu** — weekly menu + the **Add Item** button.
- ✅ **Reports & Exports** and **Integrations & Webhooks** — full access.
- ✅ Notification bell shows a **Broadcast to everyone** composer.

### 👤 As Employee (`sarah_employee` / `john_employee` / `emma_employee`)
- ✅ **Overview** — a personal "Welcome back" dashboard: *my* task counts + my onboarding progress %.
- ✅ **HR Dashboard → My Profile** — only **their own** record. ❌ Cannot see other employees.
- ✅ **Onboarding Tasks** — only **their own** tasks; title reads "My Onboarding Tasks". Can **Complete** tasks.
- ✅ **Employee Feedback** — submit feedback + see only **their own** past feedback.
- ✅ **Project Delivery** / **SLA Intelligence** — **read-only** (no New Project / Update buttons).
- ✅ **My Performance** — based on *their own* onboarding tasks.
- ✅ **Daily Menu** — same weekly menu, **no Add Item button**.
- 🔒 **Reports** / **Integrations** — "Administrator access required" panel.
- ❌ No broadcast composer.

### Side-by-side (proving data isolation)
| Module      | Sarah Johnson           | John Carter                  | Emma Wilson              |
|-------------|-------------------------|------------------------------|--------------------------|
| My Profile  | Human Resources         | Sales                        | Marketing                |
| My Tasks    | 4 tasks (~75% done)     | 4 tasks (1 done, 2 pending)  | 4 tasks (~75% done)      |
| My Feedback | 1 entry (★★★★★)          | 1 entry (★★★★)                | 1 entry (★★★★★)           |

---

## Weekly Lunch Menu

The **Daily Menu** module shows a **cafeteria week (Mon–Fri)** that:
- **Rotates automatically every week** through 4 themed menus
  (Global Flavors → Mediterranean → Asian Fusion → Comfort Classics), by ISO week number.
- **Highlights the current day** ("● TODAY"); on weekends it highlights Monday as the next serving day.

**Where the menu lives in ServiceNow:** table **`x_1850353_employ_0_daily_menu`** —
`https://dev293414.service-now.com/x_1850353_employ_0_daily_menu_list.do`
⚠️ The weekly rotating cards are **frontend demo data** (in `app.js`), **not** stored in
ServiceNow. The `_daily_menu` table holds the simple à la carte items (now cleaned to real
dish names like "Grilled Chicken Salad", "Margherita Pizza", …).

---

## Data cleanup performed (live instance)

The integration test suite had written ~60 junk rows into the live PDI. These were
**renamed to unique real values** (no "CI Test" text remains anywhere):
- `_employee` — 10 × "CI Test Employee" → real names (Aarav Sharma, Priya Nair, …).
- `_employee_feedback` — 16 × "CI Test User" → real names.
- `_daily_menu` — 16 × "CI Test Meal/Salad" → real dish names.
- `_project` — 20 × "CI Test Project"/"Manager Project" → real project names + clients.
- `_onboarding_task` — the ~48 tasks reference the renamed employees, so they now show real names automatically.

> To stop the test suite re-polluting the instance, point it at a separate test PDI
> or mock the ServiceNow client in CI.

---

## Security notes

- The three demo accounts are **hardcoded** in `backend/routes/auth.js` (plaintext match)
  purely for local demos. **Remove/disable** them before any real deployment.
- They were also created in `sys_user`; delete those records if you don't want them in the instance.
- Real users authenticate against ServiceNow with the role resolved **server-side** from
  `sys_user_has_role` (client-side role tampering is overridden by the signed JWT).
- For the production-grade, token-based pattern, see [`README.md`](./README.md).
