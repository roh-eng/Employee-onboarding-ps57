# Enterprise Employee Workflow & Delivery Intelligence Hub

A full-stack, enterprise-grade workflow automation and SLA monitoring application integrated securely with ServiceNow.

This project demonstrates a decoupled architecture featuring a custom Node.js Express backend, a modern JavaScript/HTML/CSS frontend, and a ServiceNow App Engine Studio backend. It features AI-driven bottleneck predictions, SLA tracking, and automated Flow Designer escalations.

## 🚀 Architecture Overview
- **Frontend:** Pure HTML/CSS/JS (Vanilla) with an Enterprise SaaS aesthetic.
- **Backend:** Node.js / Express.js REST API.
- **Database & Intelligence:** ServiceNow PDI (Custom Tables, Service Level Management, Business Rules, Flow Designer).

---

## 🛠️ How to Run This Project Locally

Because this is a full-stack application, you cannot simply double-click the `index.html` file. The Node.js server must be running to securely route API requests to ServiceNow.

Follow these steps to run the application on your local machine:

### 1. Prerequisites
- You must have [Node.js](https://nodejs.org/) installed on your computer.
- A ServiceNow Personal Developer Instance (PDI) with the corresponding custom tables and Business Rules configured.

### 2. Installation
Clone this repository and navigate into the project folder, then install the required dependencies:
```bash
npm install
```
*(This installs Express, Axios, dotenv, and CORS)*

### 3. Environment Variables (.env)
For security, ServiceNow credentials are not hardcoded. You must create a `.env` file in the root directory (next to `server.js`) with the following variables:

```env
SERVICENOW_INSTANCE=https://devXXXXX.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=your_actual_password_goes_here
SERVICENOW_SCOPE=x_1850353_employ_0
```

### 4. Start the Server
Run the following command to start the Node.js backend:
```bash
node server.js
```
You should see a message confirming: `Enterprise Workflow Hub Server running on http://localhost:3000`

### 5. Access the Web Portal
Open your favorite web browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

You will be greeted by the Login page. Click "Sign In" to access the dashboards and interact with the ServiceNow data in real-time!
