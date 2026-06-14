const express = require('express');
const axios = require('axios');
const config = require('../config');
const snowClient = require('../services/snowClient');
const logger = require('../services/logger');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Local assistant for greetings / help / common onboarding intents — answered WITHOUT
// calling Gemini, so these ALWAYS work even when the external AI quota is exhausted.
function quickReply(raw) {
    const m = String(raw || '').trim().toLowerCase();
    if (!m) return null;
    const has = (...w) => w.some(x => m.includes(x));
    const GUIDE = "👋 Hi! I'm your Onboarding Assistant. I can help you with:\n\n" +
        "• **My Tasks** — view & complete your onboarding checklist (Employee Tasks)\n" +
        "• **Report Issue** — raise an IT/HR ticket\n" +
        "• **Feedback** — share your onboarding experience\n" +
        "• **My Profile** — see your onboarding status & progress\n" +
        "• **Daily Menu** — this week's cafeteria menu\n\n" +
        "Try: *\"how do I complete a task\"*, *\"how do I report an issue\"*, or *\"what's my onboarding status\"*.";
    if (m === 'hi' || m === 'hello' || m === 'help' || /^(hi|hello|hey|hiya|yo|help|good morning|good afternoon|good evening)\b/.test(m)) return GUIDE;
    if (has('complete') && has('task')) return "To complete a task, open **Employee Tasks**, find the task and click **Complete**. Your **progress** updates automatically on **My Profile**.";
    if (has('report') && (has('issue') || has('ticket') || has('problem'))) return "Go to **Report Issue**, describe the problem, choose a priority and submit — it raises a ticket in ServiceNow.";
    if (has('feedback') || has('survey')) return "Open **Feedback**, pick a category and rating, and tell us about your experience. HR reviews every submission.";
    if (has('status') || has('progress') || has('onboard')) return "Your onboarding **status** and **progress %** appear on **My Profile** and the **Overview** dashboard — they update as you complete tasks and HR approves your onboarding.";
    if (has('password') || has('login') || has('log in') || has('sign in')) return "Set your password using the **link in your welcome email**, then sign in with your **email** on the login page.";
    if (has('lunch') || has('menu') || has('food') || has('cafeteria')) return "Check **Daily Menu** for this week's cafeteria menu — it rotates weekly and highlights today.";
    if (has('thank')) return "You're welcome! 🙌 Type **help** any time to see what I can do.";
    return null;
}

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage || userMessage.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // In test mode, return a deterministic canned reply — no external Gemini or
        // ServiceNow calls, so the suite is fast, deterministic and quiet.
        if (config.nodeEnv === 'test') {
            return res.json({ reply: 'AI assistant (test mode): this is a canned response.' });
        }

        // Greetings / help / common onboarding intents are answered locally (no Gemini).
        const quick = quickReply(userMessage);
        if (quick) return res.json({ reply: quick });

        // Fetch live ServiceNow data for context
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
            projectContext = `Current live data from ServiceNow PDI:
- Total onboarding tasks: ${onboardingTasks.length}
- Pending onboarding tasks: ${pending}
- Total sprint tasks: ${sprintTasks.length}
- High risk (bottleneck) sprint tasks: ${highRisk}`;
        } catch (e) {
            projectContext = 'Live ServiceNow data is currently unavailable.';
        }

        // Build system prompt for Gemini
        const systemPrompt = `You are an intelligent AI Assistant for the "Enterprise Employee Workflow & Delivery Intelligence Hub" - a full-stack enterprise application.

You have deep knowledge about:
1. **This Project**: A Node.js + ServiceNow integration that manages employee onboarding, sprint tasks, SLA monitoring, and AI bottleneck prediction.
2. **ServiceNow**: App Engine Studio, Business Rules, Flow Designer, SLA Definitions, tables, REST APIs.
3. **Tech Stack**: Node.js, Express.js, HTML/CSS, Vanilla JavaScript, Chart.js, Axios, ServiceNow PDI.
4. **Features**: HR Dashboard, Employee Tasks, Project Delivery, SLA Intelligence, My Performance, Priority Matrix, Daily Menu.

${projectContext}

Answer helpfully and concisely. For project-related questions, reference the live data above. For general tech/IT questions, answer from your training knowledge. Keep responses under 150 words unless asked for detail. Use **bold** for key terms.`;

        // Check if Gemini API key is configured
        if (!config.geminiKey) {
            return res.status(500).json({ 
                error: 'AI service is not configured. Please set GEMINI_API_KEY environment variable.' 
            });
        }

        // Make API call to Gemini
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiKey}`;
        
        const geminiResponse = await axios.post(geminiUrl, {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt + '\n\nUser Question: ' + userMessage }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 500
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 second timeout
        });

        // Extract response from Gemini
        const reply = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'I apologize, but I could not generate a response at this time.';

        res.json({ reply });
    } catch (err) {
        logger.error('Gemini API Error', { error: err.message });
        const status = err.response && err.response.status;
        // Always leave the user with something useful, not just an error.
        const help = "I can't reach the AI service right now, but I can still help with the basics — type **help** to see options, or use **Employee Tasks**, **Report Issue**, or **Feedback** from the menu.";
        if (status === 429) return res.json({ reply: 'The AI service is busy right now (usage quota reached). ' + help });
        if (status === 401 || status === 403) return res.json({ reply: 'The AI service key is invalid or not authorized. ' + help });
        if (err.code === 'ECONNABORTED') return res.json({ reply: 'The AI service timed out. ' + help });
        res.json({ reply: 'The AI assistant is temporarily unavailable. ' + help });
    }
});

module.exports = router;
