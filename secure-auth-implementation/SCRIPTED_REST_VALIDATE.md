# Option B — ServiceNow Scripted REST credential validation

This lets **provisioned employees with NO ServiceNow roles** log in to the app.
Role-less users can't use the REST Table API (the legacy login path), so we add a
tiny Scripted REST endpoint that ServiceNow authenticates the user against directly.

The backend is **already wired** for this (`backend/routes/auth.js`, gated on
`SERVICENOW_VALIDATE_PATH`). It stays inactive until you deploy the endpoint below
and set the env var — so existing logins are unaffected.

> ⚠️ This is authentication code. Deploy it yourself after review — do not let an
> automated agent push it to your instance.

---

## 1. Create the Scripted REST API

ServiceNow → **System Web Services → Scripted REST APIs → New**
- **Name:** `Secure Auth`
- **API ID:** `secure_auth`
- Save. Note the **Base API path** shown on the record, e.g. `/api/123456/secure_auth`.

## 2. Add a resource

On that API → **Resources → New**
- **Name:** `validate`
- **HTTP method:** `GET`
- **Relative path:** `/validate`
- **Script:**

```javascript
(function process(request, response) {
    // Runs AS the authenticated caller. A wrong password is rejected (401) by
    // ServiceNow's auth layer before this script ever runs.
    var gu = gs.getUser();
    var roleList = [];
    try {
        var it = gu.getRoles().iterator();
        while (it.hasNext()) { roleList.push(it.next().toString()); }
    } catch (e) { /* no roles — fine, app treats as 'employee' */ }

    return {
        valid: true,
        sysId: gs.getUserID(),
        name:  gu.getDisplayName(),
        email: gu.getEmail(),
        roles: roleList
    };
})(request, response);
```

## 3. Make it callable by role-less users (the important bit)

On the `validate` resource:
- **Requires authentication:** `true`
- **Requires ACL authorization:** `false`  ← so a freshly provisioned employee
  (no roles) can call it once authenticated.

*(If your security policy requires an ACL, attach one whose condition is simply
"user is authenticated" rather than requiring a specific role.)*

## 4. Point the app at it

In `EnterpriseWorkflowHub/.env`:

```
SERVICENOW_VALIDATE_PATH=/api/123456/secure_auth/validate
```
(use the Base API path from step 1 + `/validate`). Restart the server.

## 5. Verify

```bash
# valid creds of a NO-ROLE provisioned employee → JWT issued
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<provisioned_user>","password":"<temp_password>"}'
# → { "success": true, "token": "...", "role": "employee" }

# wrong password → 401
```

## How the backend uses it (already implemented)

`auth.js` calls `GET {instance}{SERVICENOW_VALIDATE_PATH}` with the user's own
Basic-auth credentials:
- **200 + `{valid:true,...}`** → resolve role from `roles`, issue the app JWT.
- **401/403** → invalid credentials.
- **endpoint missing / network error** → falls back to the legacy Table-API flow,
  so admin/roled logins keep working even if the endpoint is down.
