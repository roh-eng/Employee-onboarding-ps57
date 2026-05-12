const express = require('express');
const axios = require('axios');
const config = require('../config');
const snowClient = require('../services/snowClient');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage || userMessage.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

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
        // Log the error for debugging
        console.error('Gemini API Error:', err.message);
        
        // Provide user-friendly error message
        if (err.response && err.response.status === 429) {
            return res.json({ 
                reply: 'I am currently experiencing high demand. Please try again in a moment.' 
            });
        }
        
        res.json({ 
            reply: 'I apologize, but I am experiencing technical difficulties. Please try again later.' 
        });
    }
});

module.exports = router;
