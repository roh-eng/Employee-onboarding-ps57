const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SNOW_INSTANCE = process.env.SERVICENOW_INSTANCE;
const SNOW_USER = process.env.SERVICENOW_USERNAME;
const SNOW_PASS = process.env.SERVICENOW_PASSWORD;
const SNOW_SCOPE = process.env.SERVICENOW_SCOPE;

const snowClient = axios.create({
    baseURL: `${SNOW_INSTANCE}/api/now/table`,
    auth: { username: SNOW_USER, password: SNOW_PASS },
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
});

// Helper Formatting
const formatEmployee = (sysObj) => ({
    id: sysObj.sys_id,
    name: sysObj.name,
    email: sysObj.email,
    department: sysObj.department,
    joiningDate: sysObj.joining_date,
    status: sysObj.status
});

const formatTask = (sysObj) => ({
    id: sysObj.sys_id?.display_value ?? sysObj.sys_id,
    employeeId: sysObj.employee?.value ?? sysObj.employee,
    employeeName: sysObj.employee?.display_value ?? 'Unknown',
    taskType: sysObj.task_type?.display_value ?? sysObj.task_type,
    assignedTo: sysObj.assigned_to?.display_value ?? sysObj.assigned_to,
    status: sysObj.status?.display_value ?? sysObj.status,
    dueDate: sysObj.due_date?.display_value ?? sysObj.due_date,
    priority: sysObj.priority?.display_value ?? sysObj.priority
});

// --- API ENDPOINTS ---

app.get('/api/stats', async (req, res) => {
    try {
        const [empRes, taskRes] = await Promise.all([
            snowClient.get(`/${SNOW_SCOPE}_employee`),
            snowClient.get(`/${SNOW_SCOPE}_onboarding_task`)
        ]);
        
        const employees = empRes.data.result || [];
        const tasks = taskRes.data.result || [];

        res.json({
            totalEmployees: employees.length,
            onboardedEmployees: employees.filter(e => e.status === 'Onboarded').length,
            pendingTasks: tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length,
            activeIssues: 0
        });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/employees', async (req, res) => {
    try {
        const response = await snowClient.get(`/${SNOW_SCOPE}_employee`);
        res.json((response.data.result || []).map(formatEmployee));
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/employees', async (req, res) => {
    try {
        const payload = {
            name: req.body.name,
            email: req.body.email,
            department: req.body.department,
            joining_date: req.body.joiningDate,
            status: 'Pending'
        };
        const response = await snowClient.post(`/${SNOW_SCOPE}_employee`, payload);
        res.status(201).json(formatEmployee(response.data.result));
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tasks', async (req, res) => {
    try {
        const response = await snowClient.get(`/${SNOW_SCOPE}_onboarding_task?sysparm_display_value=all`);
        res.json((response.data.result || []).map(formatTask));
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const payload = { status: req.body.status };
        const response = await snowClient.put(`/${SNOW_SCOPE}_onboarding_task/${req.params.id}`, payload);
        res.json(formatTask(response.data.result));
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/issues', async (req, res) => {
    try {
        const payload = {
            description: req.body.description,
            priority: req.body.priority,
            status: 'New'
        };
        const response = await snowClient.post(`/${SNOW_SCOPE}_issue`, payload);
        res.status(201).json(response.data.result);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// --- STAGE 2 API ENDPOINTS ---

app.get('/api/projects', async (req, res) => {
    try {
        const response = await snowClient.get(`/${SNOW_SCOPE}_project`);
        res.json(response.data.result || []);
    } catch(err) { 
        // Return mock data if table doesn't exist yet
        res.json([{ sys_id: '1', project_name: 'Workflow Hub v2', client_name: 'Internal', project_manager: 'Admin', status: 'Development' }]);
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const payload = {
            project_name: req.body.project_name,
            client_name: req.body.client_name,
            project_manager: req.body.project_manager,
            start_date: req.body.start_date,
            deadline: req.body.deadline,
            status: 'Planning'
        };
        const response = await snowClient.post(`/${SNOW_SCOPE}_project`, payload);
        res.status(201).json(response.data.result);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/sprint-tasks', async (req, res) => {
    try {
        const response = await snowClient.get(`/${SNOW_SCOPE}_project_sprint_task?sysparm_display_value=all`);
        
        // Helper to safely extract string from ServiceNow object
        const getVal = (field, fallback = '') => {
            if (!field) return fallback;
            if (typeof field === 'object') return field.display_value || field.value || fallback;
            return field;
        };

        // Map ServiceNow objects to flat strings for the frontend
        const formattedTasks = response.data.result.map(task => ({
            sys_id: getVal(task.sys_id),
            task_name: getVal(task.short_description, 'Unnamed Task'),
            assigned_team: getVal(task.assigned_team, 'N/A'),
            progress: getVal(task.progress, 0),
            delay_risk: getVal(task.delay_risk, 'Low'),
            sla_status: getVal(task.sla_status, 'Pending')
        }));
        
        res.json(formattedTasks);
    } catch(err) { 
        // Return mock data if table doesn't exist yet
        res.json([
            { sys_id: '1', task_name: 'Database Schema', assigned_team: 'Development', progress: 100, delay_risk: 'Low', sla_status: 'Met' },
            { sys_id: '2', task_name: 'Node.js APIs', assigned_team: 'Development', progress: 40, delay_risk: 'High', sla_status: 'Breached' },
            { sys_id: '3', task_name: 'Frontend Dashboard', assigned_team: 'UI/UX', progress: 10, delay_risk: 'Medium', sla_status: 'In Progress' }
        ]);
    }
});

app.put('/api/sprint-tasks/:id', async (req, res) => {
    try {
        const payload = {
            progress: req.body.progress
        };
        const response = await snowClient.put(`/${SNOW_SCOPE}_project_sprint_task/${req.params.id}`, payload);
        res.json(response.data.result);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// AI Chatbot Backend Logic
app.post('/api/chat', async (req, res) => {
    try {
        const msg = req.body.message.toLowerCase();
        let reply = "I am your Enterprise AI Assistant. How can I help you today?";

        if (msg.includes('menu') || msg.includes('lunch') || msg.includes('dinner')) {
            try {
                const response = await snowClient.get(`/${SNOW_SCOPE}_daily_menu`);
                const menus = response.data.result || [];
                if (menus.length > 0) {
                    const latest = menus[0];
                    reply = `**Today's Menu:**\nBreakfast: ${latest.breakfast}\nLunch: ${latest.lunch}\nDinner: ${latest.dinner}\nSnacks: ${latest.snacks}`;
                } else {
                    reply = "I couldn't find the menu for today.";
                }
            } catch (e) {
                reply = "There was an error fetching the menu from ServiceNow.";
            }
        } 
        else if (msg.includes('task') || msg.includes('onboarding')) {
            try {
                const response = await snowClient.get(`/${SNOW_SCOPE}_onboarding_task?sysparm_display_value=all`);
                const tasks = response.data.result || [];
                const pending = tasks.filter(t => t.status !== 'Completed');
                reply = `There are currently **${pending.length} pending onboarding tasks** in the system. Check the Employee Dashboard for more details.`;
            } catch(e) {
                reply = "Error fetching tasks from ServiceNow.";
            }
        }
        else if (msg.includes('delay') || msg.includes('bottleneck') || msg.includes('risk')) {
            try {
                const response = await snowClient.get(`/${SNOW_SCOPE}_sprint_task`);
                const tasks = response.data.result || [];
                const highRisk = tasks.filter(t => t.delay_risk === 'High');
                if(highRisk.length > 0) {
                    reply = `**⚠️ AI Alert:** I have detected ${highRisk.length} tasks with a HIGH delay risk. This could cause a bottleneck in the project delivery. Please check the SLA Intelligence dashboard immediately.`;
                } else {
                    reply = "I have analyzed the current Sprint Tasks. There are currently no high-risk bottlenecks detected.";
                }
            } catch(e) {
                reply = "**⚠️ AI Alert:** Testing Mode. Simulated bottleneck detected in Node.js APIs due to progress < 50% and SLA nearing deadline. Escalation recommended.";
            }
        }
        else if (msg.includes('issue') || msg.includes('not working') || msg.includes('problem')) {
            reply = "I can help with that. Please go to the **Report Issue** tab to log a support ticket, and it will be assigned to the appropriate team.";
        }
        else if (msg.includes('project') || msg.includes('delivery')) {
            reply = "I am monitoring the active projects. You can view overall project health and team assignments in the **Project Delivery** dashboard.";
        }
        
        res.json({ reply });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
    console.log(`Enterprise Workflow Hub Server running on http://localhost:${PORT}`);
});
