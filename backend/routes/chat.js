const express = require('express');
const axios = require('axios');
const config = require('../config');
const snowClient = require('../services/snowClient');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const GEMINI_API_KEY = config.geminiKey;

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const userMessage = req.body.message;

        let projectContext = '';
        try {
            const [taskRes, sprintRes] = await Promise.all([
                snowClient.get(`/${config.snowScope}_onboarding_task?sysparm_display_value=all`),
                snowClient.get(`/${config.snowScope}_project_sprint_task?sysparm_display_value=all`)
            ]);
            const onboardingTasks = taskRes.data.result || [];
            const sprintTasks = sprintRes.data.result || [];
            const pending = onboardingTasks.filter(t => t.status !== 'Completed').length;
            const highRisk = sprintTasks.filter(t => {
                const risk = (t.delay_risk && (t.delay_risk.display_value || t.delay_risk)) || '';
                return risk === 'High';
            }).length;
            projectContext = `Current live data from ServiceNow PDI:\n- Total onboarding tasks: ${onboardingTasks.length}\n- Pending onboarding tasks: ${pending}\n- Total sprint tasks: ${sprintTasks.length}\n- High risk (bottleneck) sprint tasks: ${highRisk}`;
        } catch (e) {
            projectContext = 'Live ServiceNow data is currently unavailable.';
        }

        const systemPrompt = `You are an intelligent AI Assistant for the "Enterprise Employee Workflow & Delivery Intelligence Hub" - a full-stack enterprise application.

You have deep knowledge about:
1. **This Project**: A Node.js + ServiceNow integration that manages employee onboarding, sprint tasks, SLA monitoring, and AI bottleneck prediction.
2. **ServiceNow**: App Engine Studio, Business Rules, Flow Designer, SLA Definitions, tables, REST APIs.
3. **Tech Stack**: Node.js, Express.js, HTML/CSS, Vanilla JavaScript, Chart.js, Axios, ServiceNow PDI.
4. **Features**: HR Dashboard, Employee Tasks, Project Delivery, SLA Intelligence, My Performance, Priority Matrix, Daily Menu.

${projectContext}

Answer helpfully and concisely. For project-related questions, reference the live data above. For general tech/IT questions, answer from your training knowledge. Keep responses under 150 words unless asked for detail. Use **bold** for key terms.`;

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            const msg = userMessage.toLowerCase();
            let reply = 'I am your Enterprise AI Assistant. How can I help you today?';
            if (msg.includes('task') || msg.includes('onboarding')) reply = 'Based on live ServiceNow data, check the Employee Tasks tab for details.';
            else if (msg.includes('risk') || msg.includes('bottleneck') || msg.includes('delay')) reply = 'Check the **SLA Intelligence** tab for real-time AI bottleneck predictions.';
            else if (msg.includes('sla')) reply = 'The **SLA Engine** monitors all sprint tasks. Check **My Performance** for your SLA success rate.';
            else if (msg.includes('project')) reply = 'You can manage all projects in the **Project Delivery** tab.';
            else if (msg.includes('hr') || msg.includes('employee')) reply = 'The **HR Dashboard** shows all employees. Use **New Hire** to register employees.';
            else if (msg.includes('menu') || msg.includes('food') || msg.includes('lunch')) reply = 'Check the **Daily Menu** tab for today\'s meal options.';
            else reply = 'I need a **Gemini API key** to answer general questions. Add your key to the .env file as GEMINI_API_KEY.';
            return res.json({ reply });
        }

        const geminiRes = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: systemPrompt + '\n\nUser: ' + userMessage }]
                }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const reply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please try again.';
        res.json({ reply });
    } catch (err) {
        next(new Error('Chat service error. Please check your Gemini API key.'));
    }
});

module.exports = router;
