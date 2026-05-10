# Local Setup Guide

## Prerequisites

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **ServiceNow PDI** instance with scoped app created
- **Git** ([Download](https://git-scm.com/))
- **Gemini API Key** (optional, for AI chatbot)

## Step 1: Clone the Repository

```bash
git clone https://github.com/roh-eng/Employee-onboarding-ps57.git
cd EnterpriseWorkflowHub
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=3000
SERVICENOW_INSTANCE=https://your-instance.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=your_password
SERVICENOW_SCOPE=x_1850353_employ_0
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=your_random_secret_key
```

## Step 4: Start the Server

### Option A: Command Line
```bash
npm start
```

### Option B: Windows Batch
```bash
START_SERVER.bat
```

## Step 5: Access the Application

Open your browser to: [http://localhost:3000](http://localhost:3000)

Default login credentials (ServiceNow sys_user):
- Use your ServiceNow admin username and password
- Select a role: HR Manager, Project Manager, or Employee

## Step 6: Run Tests

```bash
node tests/api.test.js
```

## Step 7: Import Postman Collection

1. Open Postman
2. Click **Import** → **File**
3. Select `tests/EnterpriseWorkflowHub.postman_collection.json`
4. Run the **Login** request first to set the `{{token}}` variable

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change `PORT` in `.env` or kill existing node processes |
| ServiceNow connection error | Verify `.env` credentials and PDI URL |
| JWT errors | Ensure `JWT_SECRET` is set in `.env` |
| Static files not loading | Verify `frontend/` folder exists at project root |
