# ServiceNow PDI — Daily Menu Table Setup Guide

## Option A: Automated (Recommended)

### Prerequisites
- `.env` file configured with valid ServiceNow credentials
- Node.js installed

### Step 1: Create the Table

```powershell
cd "c:\Users\ponna\Downloads\EnterpriseWorkflowHub_Actual\EnterpriseWorkflowHub"
node servicenow/create_table.js
```

**Expected Output:**
```
Table created: <sys_id>
Column created: item_name
Column created: category
Column created: calories
Column created: available
Choices created for category.
Done! Table x_1850353_employ_0_daily_menu is ready in ServiceNow.
```

### Step 2: Create ACLs

```powershell
node servicenow/create_acls.js
```

**Expected Output:**
```
ACL created: read -> <sys_id>
ACL created: write -> <sys_id>
ACL created: create -> <sys_id>
ACL created: delete -> <sys_id>
```

### Troubleshooting Automated Script

| Error | Solution |
|-------|----------|
| `401 Unauthorized` | Check `.env` credentials; ensure user has `admin` or `rest_api_explorer` role |
| `403 Forbidden` | Enable REST API access in PDI: **System Web Services > REST API > Properties** |
| `404 Not Found` | Verify `SERVICENOW_INSTANCE` URL ends with `.service-now.com` (no trailing slash) |
| `No sys_scope found` | Verify `SERVICENOW_SCOPE=x_1850353_employ_0` matches your scoped app |

---

## Option B: Manual Setup in ServiceNow Studio

### Step 1: Open App Engine Studio

1. Log in to your ServiceNow PDI instance
2. Navigate to **App Engine Studio** (search in the filter navigator)
3. Select your scoped app: `Employee Onboarding and Workflow Hub`

### Step 2: Create the Table

1. Click **Create** → **Table**
2. Fill in the form:
   - **Label**: `Daily Menu`
   - **Table name**: `x_1850353_employ_0_daily_menu` (auto-filled)
   - **Extends table**: Leave blank
   - **Create module**: Check this box
3. Click **Create**

### Step 3: Add Columns

Click on the `Daily Menu` table, then **Add Column**:

| Column Label | Column Name | Type | Length | Mandatory |
|-------------|-------------|------|--------|-----------|
| Item Name | `item_name` | String | 100 | Yes |
| Category | `category` | Choice | 40 | Yes |
| Calories | `calories` | Integer | 40 | Yes |
| Available | `available` | Boolean | 40 | Yes |

### Step 4: Add Choice Values for Category

1. Go to the `category` column details
2. Click **Choices** tab
3. Add these choices:

| Value | Label |
|-------|-------|
| breakfast | Breakfast |
| lunch | Lunch |
| snack | Snack |
| beverage | Beverage |

### Step 5: Create ACLs (Security Rules)

1. Navigate to **System Security > Access Control (ACL)**
2. Create four ACLs for the `x_1850353_employ_0_daily_menu` table:

| Operation | Name | Active | Admin Overrides |
|-----------|------|--------|-----------------|
| read | x_1850353_employ_0_daily_menu | true | true |
| write | x_1850353_employ_0_daily_menu | true | true |
| create | x_1850353_employ_0_daily_menu | true | true |
| delete | x_1850353_employ_0_daily_menu | true | true |

3. For each ACL, in the **Requires role** related list, add:
   - `x_1850353_employ_0.hr_manager` (for write/create/delete)
   - `x_1850353_employ_0.employee` (for read)

### Step 6: Verify

1. Go to **All > Employee Onboarding and Workflow Hub > Daily Menu**
2. Click **New**
3. Create a test record:
   - Item Name: `Grilled Chicken Salad`
   - Category: `Lunch`
   - Calories: `450`
   - Available: `true`

If the record saves successfully, the table is ready.

---

## Verification from Node.js

After creating the table, restart your server and test:

```powershell
npm start
```

Then open [http://localhost:3000](http://localhost:3000), log in, and navigate to **Daily Menu**. You should be able to:
- View menu items (Employee role)
- Add new items (HR role)
- Edit items (HR role)
- Delete items (HR role)
- View analytics (any role)
 