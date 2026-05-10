const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const viewContainer = document.getElementById('view-container');
const navItems = document.querySelectorAll('.nav-menu li');

// Chatbot Elements
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatClose = document.getElementById('chat-close');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

// Theme Logic
const themeToggle = document.getElementById('theme-toggle');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadView('overview');

    // Navigation Listener
    navItems.forEach(item => {
        if(item.id === 'theme-toggle') return;
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            loadView(target.getAttribute('data-view'));
        });
    });

    // Theme Toggle Logic
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            const icon = themeToggle.querySelector('i');
            const text = themeToggle.querySelector('span');
            if(isDark) {
                icon.classList.replace('fa-moon', 'fa-sun');
                text.innerText = 'Light Mode';
            } else {
                icon.classList.replace('fa-sun', 'fa-moon');
                text.innerText = 'Dark Mode';
            }
        });
    }

    // Chatbot Listeners
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
    });
    chatClose.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });
    
    chatSend.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
});

// View Router
async function loadView(viewName) {
    viewContainer.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%;"><i class="fa-solid fa-spinner fa-spin fa-3x" style="color:var(--primary);"></i></div>';
    
    switch(viewName) {
        case 'overview': await renderOverview(); break;
        case 'employees': await renderHRDashboard(); break;
        case 'tasks': await renderEmployeeTasks(); break;
        case 'issue': await renderReportIssue(); break;
        case 'projects': await renderProjects(); break;
        case 'slas': await renderSLAIntelligence(); break;
    }
}

// ---------------- VIEWS ----------------

async function renderOverview() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const stats = await res.json();

        viewContainer.innerHTML = `
            <div class="topbar fade-in">
                <h2><i class="fa-solid fa-chart-line" style="color: var(--primary);"></i> Company Overview</h2>
            </div>
            <div class="dashboard-grid fade-in">
                <div class="card stat-card">
                    <div class="stat-icon primary"><i class="fa-solid fa-users"></i></div>
                    <div class="stat-details">
                        <h3>${stats.totalEmployees}</h3>
                        <p>Total Headcount</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon success"><i class="fa-solid fa-user-check"></i></div>
                    <div class="stat-details">
                        <h3>${stats.onboardedEmployees}</h3>
                        <p>Onboarded</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon warning"><i class="fa-solid fa-list-check"></i></div>
                    <div class="stat-details">
                        <h3>${stats.pendingTasks}</h3>
                        <p>Pending Tasks</p>
                    </div>
                </div>
            </div>
            
            <div class="card fade-in">
                <h3 style="margin-bottom: 16px;">System Status</h3>
                <p style="color: var(--text-muted);">
                    The Enterprise Workflow Hub is successfully connected to ServiceNow App Engine Studio.<br>
                    Flow Designer automations are active and monitoring for new employee registrations to dispatch provisioning tasks.
                </p>
            </div>
        `;
    } catch (e) {
        viewContainer.innerHTML = `<p style="color: var(--danger);">Error connecting to Node.js backend. Is the server running?</p>`;
    }
}

async function renderHRDashboard() {
    try {
        const res = await fetch(`${API_BASE}/employees`);
        const employees = await res.json();

        let html = `
            <div class="topbar fade-in">
                <h2><i class="fa-solid fa-users" style="color: var(--primary);"></i> HR Dashboard</h2>
                <button class="btn btn-primary" onclick="showAddEmployeeForm()"><i class="fa-solid fa-user-plus"></i> New Hire</button>
            </div>
            <div id="form-container"></div>
            <div class="table-container fade-in">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Joining Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        employees.forEach(emp => {
            const statusClass = emp.status === 'Onboarded' ? 'status-onboarded' : 'status-pending';
            html += `
                <tr>
                    <td><strong>${emp.id || 'N/A'}</strong></td>
                    <td>
                        <div style="display:flex; align-items:center; gap: 12px;">
                            <img src="https://ui-avatars.com/api/?name=${emp.name}&background=random&color=fff&size=32" style="border-radius:50%">
                            ${emp.name}
                        </div>
                    </td>
                    <td>${emp.department}</td>
                    <td>${emp.joiningDate}</td>
                    <td><span class="status-badge ${statusClass}">${emp.status}</span></td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        viewContainer.innerHTML = html;
    } catch (e) {
        viewContainer.innerHTML = `<p style="color: var(--danger);">Error loading employees.</p>`;
    }
}

function showAddEmployeeForm() {
    const container = document.getElementById('form-container');
    container.innerHTML = `
        <div class="card fade-in" style="margin-bottom: 24px; border-left: 4px solid var(--success);">
            <h3 style="margin-bottom: 20px;">Register New Hire (Triggers Flow Designer)</h3>
            <form id="new-employee-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group"><label>Full Name</label><input type="text" id="emp-name" class="form-control" required></div>
                <div class="form-group"><label>Email</label><input type="email" id="emp-email" class="form-control" required></div>
                <div class="form-group"><label>Department</label>
                    <select id="emp-dept" class="form-control" required>
                        <option value="IT">IT</option>
                        <option value="HR">HR</option>
                        <option value="Security">Security</option>
                        <option value="Facility">Facility</option>
                    </select>
                </div>
                <div class="form-group"><label>Joining Date</label><input type="date" id="emp-date" class="form-control" required></div>
                <div style="grid-column: span 2; display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('form-container').innerHTML=''">Cancel</button>
                    <button type="submit" class="btn btn-success">Save to ServiceNow</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('new-employee-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('emp-name').value,
            email: document.getElementById('emp-email').value,
            department: document.getElementById('emp-dept').value,
            joiningDate: document.getElementById('emp-date').value
        };

        const btn = e.target.querySelector('.btn-success');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        await fetch(`${API_BASE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        loadView('employees'); // Refresh view
    });
}

async function renderEmployeeTasks() {
    try {
        const res = await fetch(`${API_BASE}/tasks`);
        const tasks = await res.json();

        let html = `
            <div class="topbar fade-in">
                <h2><i class="fa-solid fa-list-check" style="color: var(--primary);"></i> Onboarding Tasks</h2>
            </div>
            <div class="table-container fade-in">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Task Number</th>
                            <th>Employee</th>
                            <th>Task Type</th>
                            <th>Assigned Team</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        tasks.forEach(task => {
            const displayStatus = task.status || 'Pending';
            let statusClass = 'status-pending';
            if(displayStatus === 'In Progress') statusClass = 'status-inprogress';
            if(displayStatus === 'Completed') statusClass = 'status-completed';

            const actionBtn = displayStatus !== 'Completed' 
                ? `<button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="completeTask('${task.id}')">Complete</button>` 
                : `<i class="fa-solid fa-check" style="color: var(--success);"></i>`;

            html += `
                <tr>
                    <td><strong>${task.id}</strong></td>
                    <td>${task.employeeName}</td>
                    <td>${task.taskType}</td>
                    <td>${task.assignedTo}</td>
                    <td><span class="status-badge ${statusClass}">${displayStatus}</span></td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        viewContainer.innerHTML = html;
    } catch (e) {
        viewContainer.innerHTML = `<p style="color: var(--danger);">Error loading tasks.</p>`;
    }
}

async function completeTask(taskId) {
    await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' })
    });
    loadView('tasks'); // Refresh
}

async function renderReportIssue() {
    let html = `
        <div class="topbar fade-in">
            <h2><i class="fa-solid fa-ticket" style="color: var(--primary);"></i> Report Issue</h2>
        </div>
        <div class="card fade-in" style="max-width: 600px; margin: 0 auto;">
            <p style="color: var(--text-muted); margin-bottom: 24px;">Log an issue directly into ServiceNow App Engine Studio.</p>
            <form id="issue-form">
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="issue-desc" class="form-control" rows="5" required placeholder="Describe the issue..."></textarea>
                </div>
                <div class="form-group">
                    <label>Priority</label>
                    <select id="issue-priority" class="form-control">
                        <option value="High">High</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 8px;">Submit Ticket to ServiceNow</button>
            </form>
        </div>
    `;
    viewContainer.innerHTML = html;

    document.getElementById('issue-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            description: document.getElementById('issue-desc').value,
            priority: document.getElementById('issue-priority').value
        };

        const btn = e.target.querySelector('button');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
        btn.disabled = true;

        await fetch(`${API_BASE}/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Ticket Created Successfully';
        btn.classList.replace('btn-primary', 'btn-success');
        document.getElementById('issue-form').reset();
        
        setTimeout(() => {
            btn.innerHTML = 'Submit Ticket to ServiceNow';
            btn.classList.replace('btn-success', 'btn-primary');
            btn.disabled = false;
        }, 3000);
    });
}

async function renderProjects() {
    try {
        const res = await fetch(`${API_BASE}/projects`);
        const projects = await res.json();

        let html = `
            <div class="topbar fade-in">
                <h2><i class="fa-solid fa-diagram-project" style="color: var(--primary);"></i> Project Delivery Dashboard</h2>
                <button class="btn btn-primary" onclick="showAddProjectForm()"><i class="fa-solid fa-plus"></i> New Project</button>
            </div>
            <div id="project-form-container"></div>
            <div class="table-container fade-in">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Project Name</th>
                            <th>Client</th>
                            <th>Manager</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        projects.forEach(proj => {
            html += `
                <tr>
                    <td><strong>${proj.sys_id.substring(0, 5).toUpperCase()}</strong></td>
                    <td>${proj.project_name}</td>
                    <td>${proj.client_name}</td>
                    <td>${proj.project_manager}</td>
                    <td><span class="status-badge status-inprogress">${proj.status}</span></td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        viewContainer.innerHTML = html;
    } catch (e) {
        viewContainer.innerHTML = `<p style="color: var(--danger);">Error loading projects.</p>`;
    }
}

function showAddProjectForm() {
    const container = document.getElementById('project-form-container');
    container.innerHTML = `
        <div class="card fade-in" style="margin-bottom: 24px; border-left: 4px solid var(--primary);">
            <h3 style="margin-bottom: 20px;">Initiate New Project (Triggers Sprint Task Auto-Generation)</h3>
            <form id="new-project-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group"><label>Project Name</label><input type="text" id="proj-name" class="form-control" required></div>
                <div class="form-group"><label>Client Name</label><input type="text" id="proj-client" class="form-control" required></div>
                <div class="form-group"><label>Project Manager</label><input type="text" id="proj-manager" class="form-control" required></div>
                <div class="form-group"><label>Start Date</label><input type="date" id="proj-start" class="form-control" required></div>
                <div class="form-group"><label>Deadline</label><input type="date" id="proj-deadline" class="form-control" required></div>
                <div style="grid-column: span 2; display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('project-form-container').innerHTML=''">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Project in ServiceNow</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('new-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            project_name: document.getElementById('proj-name').value,
            client_name: document.getElementById('proj-client').value,
            project_manager: document.getElementById('proj-manager').value,
            start_date: document.getElementById('proj-start').value,
            deadline: document.getElementById('proj-deadline').value
        };

        const btn = e.target.querySelector('.btn-primary');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';
        btn.disabled = true;

        await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        loadView('projects'); // Refresh view
    });
}

async function renderSLAIntelligence() {
    try {
        const res = await fetch(`${API_BASE}/sprint-tasks`);
        const tasks = await res.json();

        let html = `
            <div class="topbar fade-in">
                <h2><i class="fa-solid fa-stopwatch" style="color: var(--primary);"></i> SLA Intelligence & AI Bottleneck Prediction</h2>
            </div>
            <div class="card fade-in" style="margin-bottom: 24px;">
                <p style="color: var(--text-muted); font-size: 0.95rem;">
                    <strong>AI Analysis:</strong> Automatically detecting bottlenecks based on Progress % and SLA Deadlines. High risk tasks are automatically escalated.
                </p>
            </div>
            <div class="table-container fade-in">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Task Name</th>
                            <th>Team</th>
                            <th>Progress</th>
                            <th>SLA Status</th>
                            <th>AI Delay Risk</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        tasks.forEach(task => {
            const riskClass = task.delay_risk === 'High' ? 'status-pending' : (task.delay_risk === 'Low' ? 'status-completed' : 'status-inprogress');
            const slaClass = task.sla_status === 'Breached' ? 'status-pending' : 'status-completed';

            html += `
                <tr>
                    <td><strong>${task.task_name}</strong></td>
                    <td>${task.assigned_team}</td>
                    <td>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${task.progress}%"></div>
                        </div>
                        <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-top: 4px; display: block;">${task.progress}% Complete</span>
                    </td>
                    <td><span class="status-badge ${slaClass}">${task.sla_status}</span></td>
                    <td><span class="status-badge ${riskClass}">${task.delay_risk} Risk</span></td>
                    <td><button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="updateSprintProgress('${task.sys_id}')">Update</button></td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        viewContainer.innerHTML = html;
    } catch (e) {
        viewContainer.innerHTML = `<p style="color: var(--danger);">Error loading sprint tasks.</p>`;
    }
}

async function updateSprintProgress(taskId) {
    const newProgress = prompt("Enter new Progress % (0-100):");
    if(newProgress !== null && newProgress !== "") {
        const progressInt = parseInt(newProgress);
        if(progressInt >= 0 && progressInt <= 100) {
            await fetch(`${API_BASE}/sprint-tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ progress: progressInt })
            });
            loadView('slas'); // Refresh
        } else {
            alert("Please enter a valid number between 0 and 100.");
        }
    }
}

// ---------------- CHATBOT LOGIC ----------------

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // User Msg
    chatMessages.innerHTML += `
        <div class="message user-message fade-in">
            ${text}
        </div>
    `;
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Typing
    const typingId = 'typing-' + Date.now();
    chatMessages.innerHTML += `
        <div id="${typingId}" class="message ai-message fade-in" style="font-size: 1.2rem; padding: 5px 15px;">
            <i class="fa-solid fa-ellipsis fa-fade"></i>
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const res = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        
        document.getElementById(typingId).remove();
        
        let formattedReply = data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedReply = formattedReply.replace(/\n/g, '<br>');

        chatMessages.innerHTML += `
            <div class="message ai-message fade-in">
                ${formattedReply}
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (e) {
        document.getElementById(typingId).remove();
        chatMessages.innerHTML += `<div class="message ai-message fade-in" style="color:var(--danger);">Connection error to ServiceNow.</div>`;
    }
}
