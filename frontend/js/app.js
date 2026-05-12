const API_BASE = 'http://localhost:3000/api';

/* ── API Helper with JWT ─────────────────────────────────────────────────── */
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
        showToast('Session expired. Please log in again.', 'error');
        logout();
    }
    return res;
}

const viewContainer = document.getElementById('view-container');
const navItems = document.querySelectorAll('.nav-menu li');
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatClose = document.getElementById('chat-close');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');
const themeToggle = document.getElementById('theme-toggle');

// userRole and userName are already declared in index.html inline script

/* ── Toast Notifications ─────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type} fade-in`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-xmark' : 'fa-triangle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color:var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'warning'});"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* ── Auth Guard ──────────────────────────────────────────────────────────── */
function requireAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/frontend/login.html';
        return false;
    }
    return true;
}

/* ── Logout ──────────────────────────────────────────────────────────────── */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/frontend/login.html';
}

/* ── Init ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        if (!requireAuth()) return;
    }

    loadView('overview');

    navItems.forEach(item => {
        if (item.id === 'theme-toggle') return;
        item.addEventListener('click', (e) => {
            if (item.id === 'logout-btn') return;
            navItems.forEach(n => n.classList.remove('active'));
            e.currentTarget.classList.add('active');
            loadView(e.currentTarget.getAttribute('data-view'));
        });
    });

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            themeToggle.querySelector('i').classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
            themeToggle.querySelector('span').innerText = isDark ? 'Light Mode' : 'Dark Mode';
        });
    }

    chatToggle.addEventListener('click', () => chatWindow.classList.toggle('hidden'));
    chatClose.addEventListener('click', () => chatWindow.classList.add('hidden'));
    chatSend.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
});

async function loadView(viewName) {
    viewContainer.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:300px;"><i class="fa-solid fa-spinner fa-spin fa-3x" style="color:var(--primary);"></i></div>';
    switch (viewName) {
        case 'overview':    await renderOverview(); break;
        case 'employees':   await renderHRDashboard(); break;
        case 'tasks':       await renderEmployeeTasks(); break;
        case 'issue':       await renderReportIssue(); break;
        case 'projects':    await renderProjectDashboard(); break;
        case 'slas':        await renderSLAIntelligence(); break;
        case 'performance': await renderEmployeePerformance(); break;
        case 'menu':        await renderDailyMenu(); break;
    }
}

// ── COMPANY OVERVIEW with live charts ──────────────────────────────────────
async function renderOverview() {
    let stats = { totalEmployees: 0, onboardedEmployees: 0, pendingTasks: 0 };
    let perf  = { priority: { High: 0, Medium: 0, Low: 0 }, sla: { Met: 0, Breached: 0, InProgress: 0 }, totalTasks: 0 };
    try { const r = await apiFetch(`${API_BASE}/stats`);          if (r.ok) { const d = await r.json(); if (!d.error) stats = d; } } catch(e){}
    try { const r = await apiFetch(`${API_BASE}/stats/employee`); if (r.ok) { const d = await r.json(); if (!d.error) perf  = d; } } catch(e){}

    const pendingEmp = Math.max(0, stats.totalEmployees - stats.onboardedEmployees);
    const isDark = document.body.classList.contains('dark-theme');
    const tc = isDark ? '#9ca3af' : '#6b7280';
    const gc = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    viewContainer.innerHTML = `
        <div class="topbar fade-in">
            <h2><i class="fa-solid fa-chart-line" style="color:var(--primary);"></i> Company Overview</h2>
            <span style="color:var(--text-muted);font-size:0.85rem;"><i class="fa-solid fa-circle" style="color:#10b981;font-size:0.5rem;margin-right:6px;"></i>Live — ServiceNow PDI</span>
        </div>
        <div class="dashboard-grid fade-in">
            <div class="card stat-card"><div class="stat-icon primary"><i class="fa-solid fa-users"></i></div><div class="stat-details"><h3>${stats.totalEmployees}</h3><p>Total Headcount</p></div></div>
            <div class="card stat-card"><div class="stat-icon success"><i class="fa-solid fa-user-check"></i></div><div class="stat-details"><h3>${stats.onboardedEmployees}</h3><p>Onboarded</p></div></div>
            <div class="card stat-card"><div class="stat-icon warning"><i class="fa-solid fa-list-check"></i></div><div class="stat-details"><h3>${stats.pendingTasks}</h3><p>Pending Tasks</p></div></div>
            <div class="card stat-card"><div class="stat-icon" style="background:rgba(239,68,68,0.1);color:var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="stat-details"><h3>${perf.sla.Breached}</h3><p>SLA Breached</p></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;" class="fade-in">
            <div class="card" style="padding:24px;">
                <h3 style="margin-bottom:20px;font-size:1rem;font-weight:600;"><i class="fa-solid fa-users" style="color:var(--primary);margin-right:8px;"></i>Employee Onboarding Status</h3>
                <canvas id="empChart" height="200"></canvas>
            </div>
            <div class="card" style="padding:24px;">
                <h3 style="margin-bottom:20px;font-size:1rem;font-weight:600;"><i class="fa-solid fa-stopwatch" style="color:var(--primary);margin-right:8px;"></i>SLA Performance</h3>
                <canvas id="slaChart" height="200"></canvas>
            </div>
        </div>
        <div class="card fade-in" style="padding:24px;margin-bottom:24px;">
            <h3 style="margin-bottom:20px;font-size:1rem;font-weight:600;"><i class="fa-solid fa-chart-bar" style="color:var(--primary);margin-right:8px;"></i>Sprint Task Priority Distribution</h3>
            <canvas id="priorityChart" height="90"></canvas>
        </div>
        <div class="card fade-in"><h3 style="margin-bottom:12px;">System Status</h3><p style="color:var(--text-muted);">Enterprise Workflow Hub is live and connected to ServiceNow PDI. AI Business Rules are monitoring bottleneck risks in real-time.</p></div>
    `;

    try { new Chart(document.getElementById('empChart'), { type:'doughnut', data:{ labels:['Onboarded','Pending'], datasets:[{ data:[stats.onboardedEmployees,pendingEmp], backgroundColor:['#10b981','#f59e0b'], borderWidth:0 }] }, options:{ plugins:{ legend:{ labels:{ color:tc } } }, cutout:'65%' } }); } catch(e) { console.error('Chart error (emp):', e); }
    try { new Chart(document.getElementById('slaChart'), { type:'doughnut', data:{ labels:['Met','Breached','In Progress'], datasets:[{ data:[perf.sla.Met,perf.sla.Breached,perf.sla.InProgress], backgroundColor:['#10b981','#ef4444','#4f46e5'], borderWidth:0 }] }, options:{ plugins:{ legend:{ labels:{ color:tc } } }, cutout:'65%' } }); } catch(e) { console.error('Chart error (sla):', e); }
    try { new Chart(document.getElementById('priorityChart'), { type:'bar', data:{ labels:['High','Medium','Low'], datasets:[{ label:'Tasks', data:[perf.priority.High,perf.priority.Medium,perf.priority.Low], backgroundColor:['rgba(239,68,68,0.8)','rgba(245,158,11,0.8)','rgba(16,185,129,0.8)'], borderRadius:8, borderSkipped:false }] }, options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:tc }, grid:{ display:false } }, y:{ ticks:{ color:tc, stepSize:1 }, grid:{ color:gc } } } } }); } catch(e) { console.error('Chart error (priority):', e); }
}

// ── HR DASHBOARD ────────────────────────────────────────────────────────────
async function renderHRDashboard() {
    try {
        const res = await apiFetch(`${API_BASE}/employees`);
        const employees = await res.json();
        let html = `
            <div class="topbar fade-in"><h2><i class="fa-solid fa-users" style="color:var(--primary);"></i> HR Dashboard</h2><button class="btn btn-primary" onclick="showAddEmployeeForm()"><i class="fa-solid fa-user-plus"></i> New Hire</button></div>
            <div id="form-container"></div>
            <div class="table-container fade-in"><table class="data-table"><thead><tr><th>Name</th><th>Department</th><th>Joining Date</th><th>Status</th></tr></thead><tbody>`;
        employees.forEach(emp => {
            const sc = emp.status === 'Onboarded' ? 'status-onboarded' : 'status-pending';
            html += `<tr><td><div style="display:flex;align-items:center;gap:12px;"><img src="https://ui-avatars.com/api/?name=${emp.name}&background=random&color=fff&size=32" style="border-radius:50%;">${emp.name}</div></td><td>${emp.department}</td><td>${emp.joiningDate}</td><td><span class="status-badge ${sc}">${emp.status}</span></td></tr>`;
        });
        html += `</tbody></table></div>`;
        viewContainer.innerHTML = html;
    } catch(e) { viewContainer.innerHTML = `<p style="color:var(--danger);">Error loading employees.</p>`; }
}

function showAddEmployeeForm() {
    document.getElementById('form-container').innerHTML = `
        <div class="card fade-in" style="margin-bottom:24px;border-left:4px solid var(--success);">
            <h3 style="margin-bottom:20px;">Register New Hire (Triggers Flow Designer)</h3>
            <form id="new-employee-form" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="form-group"><label>Full Name</label><input type="text" id="emp-name" class="form-control" required></div>
                <div class="form-group"><label>Email</label><input type="email" id="emp-email" class="form-control" required></div>
                <div class="form-group"><label>Department</label><select id="emp-dept" class="form-control"><option>IT</option><option>HR</option><option>Security</option><option>Facility</option></select></div>
                <div class="form-group"><label>Joining Date</label><input type="date" id="emp-date" class="form-control" required></div>
                <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:12px;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('form-container').innerHTML=''">Cancel</button>
                    <button type="submit" class="btn btn-success">Save to ServiceNow</button>
                </div>
            </form>
        </div>`;
    document.getElementById('new-employee-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('.btn-success');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
        try {
            await apiFetch(`${API_BASE}/employees`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: document.getElementById('emp-name').value, email: document.getElementById('emp-email').value, department: document.getElementById('emp-dept').value, joiningDate: document.getElementById('emp-date').value }) });
            showToast('Employee saved successfully!', 'success');
            loadView('employees');
        } catch(err) {
            showToast('Failed to save employee.', 'error');
            btn.innerHTML = 'Save to ServiceNow'; btn.disabled = false;
        }
    });
}

// ── EMPLOYEE TASKS ──────────────────────────────────────────────────────────
async function renderEmployeeTasks() {
    try {
        const tasks = await (await apiFetch(`${API_BASE}/tasks`)).json();
        let html = `<div class="topbar fade-in"><h2><i class="fa-solid fa-list-check" style="color:var(--primary);"></i> Onboarding Tasks</h2></div><div class="table-container fade-in"><table class="data-table"><thead><tr><th>Employee</th><th>Task Type</th><th>Assigned To</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
        tasks.forEach(t => {
            const sc = t.status === 'Completed' ? 'status-completed' : t.status === 'In Progress' ? 'status-inprogress' : 'status-pending';
            const action = t.status !== 'Completed' ? `<button class="btn btn-primary" style="padding:6px 12px;font-size:0.85rem;" onclick="completeTask('${t.id}')">Complete</button>` : `<i class="fa-solid fa-check" style="color:var(--success);"></i>`;
            html += `<tr><td>${t.employeeName}</td><td>${t.taskType}</td><td>${t.assignedTo}</td><td><span class="status-badge ${sc}">${t.status}</span></td><td>${action}</td></tr>`;
        });
        html += `</tbody></table></div>`;
        viewContainer.innerHTML = html;
    } catch(e) { viewContainer.innerHTML = `<p style="color:var(--danger);">Error loading tasks.</p>`; }
}

async function completeTask(id) {
    try {
        await apiFetch(`${API_BASE}/tasks/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'Completed' }) });
        showToast('Task marked as completed.', 'success');
        loadView('tasks');
    } catch(err) {
        showToast('Failed to update task.', 'error');
    }
}

// ── REPORT ISSUE ────────────────────────────────────────────────────────────
async function renderReportIssue() {
    viewContainer.innerHTML = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-ticket" style="color:var(--primary);"></i> Report Issue</h2></div>
        <div class="card fade-in" style="max-width:600px;margin:0 auto;">
            <form id="issue-form">
                <div class="form-group"><label>Description</label><textarea id="issue-desc" class="form-control" rows="5" required placeholder="Describe the issue..."></textarea></div>
                <div class="form-group"><label>Priority</label><select id="issue-priority" class="form-control"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
                <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px;">Submit Ticket to ServiceNow</button>
            </form>
        </div>`;
    document.getElementById('issue-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...'; btn.disabled = true;
        try {
            await apiFetch(`${API_BASE}/issues`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ description: document.getElementById('issue-desc').value, priority: document.getElementById('issue-priority').value }) });
            showToast('Ticket created successfully!', 'success');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Ticket Created!'; btn.classList.replace('btn-primary','btn-success');
            setTimeout(() => { btn.innerHTML = 'Submit Ticket to ServiceNow'; btn.classList.replace('btn-success','btn-primary'); btn.disabled = false; document.getElementById('issue-form').reset(); }, 3000);
        } catch(err) {
            showToast('Failed to create ticket.', 'error');
            btn.innerHTML = 'Submit Ticket to ServiceNow'; btn.disabled = false;
        }
    });
}

// ── PROJECT DELIVERY ────────────────────────────────────────────────────────
async function renderProjectDashboard() {
    let projects = [];
    try { const r = await apiFetch(`${API_BASE}/projects`); if(r.ok) projects = await r.json(); } catch(e){}
    if (!projects.length) projects = [{ sys_id:'demo1', project_name:'Enterprise Workflow Hub', client_name:'Internal', project_manager:'Admin', status:'Development' }];
    let html = `<div class="topbar fade-in"><h2><i class="fa-solid fa-diagram-project" style="color:var(--primary);"></i> Project Delivery Dashboard</h2><button class="btn btn-primary" onclick="showAddProjectForm()"><i class="fa-solid fa-plus"></i> New Project</button></div><div id="project-form-container"></div><div class="table-container fade-in"><table class="data-table"><thead><tr><th>Project Name</th><th>Client</th><th>Manager</th><th>Status</th></tr></thead><tbody>`;
    projects.forEach(p => { html += `<tr><td><strong>${p.project_name}</strong></td><td>${p.client_name}</td><td>${p.project_manager}</td><td><span class="status-badge status-inprogress">${p.status}</span></td></tr>`; });
    html += `</tbody></table></div>`;
    viewContainer.innerHTML = html;
}

function showAddProjectForm() {
    document.getElementById('project-form-container').innerHTML = `
        <div class="card fade-in" style="margin-bottom:24px;border-left:4px solid var(--primary);">
            <h3 style="margin-bottom:20px;">Initiate New Project</h3>
            <form id="new-project-form" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="form-group"><label>Project Name</label><input type="text" id="proj-name" class="form-control" required></div>
                <div class="form-group"><label>Client Name</label><input type="text" id="proj-client" class="form-control" required></div>
                <div class="form-group"><label>Project Manager</label><input type="text" id="proj-manager" class="form-control" required></div>
                <div class="form-group"><label>Start Date</label><input type="date" id="proj-start" class="form-control" required></div>
                <div class="form-group"><label>Deadline</label><input type="date" id="proj-deadline" class="form-control" required></div>
                <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:12px;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('project-form-container').innerHTML=''">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create in ServiceNow</button>
                </div>
            </form>
        </div>`;
    document.getElementById('new-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('.btn-primary'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...'; btn.disabled = true;
        try {
            await apiFetch(`${API_BASE}/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ project_name: document.getElementById('proj-name').value, client_name: document.getElementById('proj-client').value, project_manager: document.getElementById('proj-manager').value, start_date: document.getElementById('proj-start').value, deadline: document.getElementById('proj-deadline').value }) });
            showToast('Project created successfully!', 'success');
            loadView('projects');
        } catch(err) {
            showToast('Failed to create project.', 'error');
            btn.innerHTML = 'Create in ServiceNow'; btn.disabled = false;
        }
    });
}

// ── SLA INTELLIGENCE ────────────────────────────────────────────────────────
async function renderSLAIntelligence() {
    let tasks = [];
    try { const r = await apiFetch(`${API_BASE}/sprint-tasks`); if(r.ok) tasks = await r.json(); } catch(e){}
    if (!tasks.length) tasks = [
        { sys_id:'1', task_name:'Database Schema', assigned_team:'Development', progress:100, delay_risk:'Low', sla_status:'Met' },
        { sys_id:'2', task_name:'Node.js APIs', assigned_team:'Development', progress:40, delay_risk:'High', sla_status:'Breached' },
        { sys_id:'3', task_name:'Frontend Dashboard', assigned_team:'UI/UX', progress:10, delay_risk:'Medium', sla_status:'In Progress' }
    ];
    let html = `<div class="topbar fade-in"><h2><i class="fa-solid fa-stopwatch" style="color:var(--primary);"></i> SLA Intelligence & AI Bottleneck Prediction</h2></div><div class="card fade-in" style="margin-bottom:24px;"><p style="color:var(--text-muted);"><strong>AI Analysis:</strong> Automatically detecting bottlenecks based on Progress % and SLA Deadlines.</p></div><div class="table-container fade-in"><table class="data-table"><thead><tr><th>Task Name</th><th>Team</th><th>Progress</th><th>SLA Status</th><th>AI Delay Risk</th><th>Action</th></tr></thead><tbody>`;
    tasks.forEach(t => {
        const rc = t.delay_risk === 'High' ? 'status-pending' : t.delay_risk === 'Low' ? 'status-completed' : 'status-inprogress';
        const sc = t.sla_status === 'Breached' ? 'status-pending' : t.sla_status === 'Met' ? 'status-completed' : 'status-inprogress';
        html += `<tr><td><strong>${t.task_name}</strong></td><td>${t.assigned_team}</td><td><div class="progress-container"><div class="progress-bar" style="width:${t.progress}%"></div></div><span style="font-size:0.8rem;color:var(--text-muted);">${t.progress}% Complete</span></td><td><span class="status-badge ${sc}">${t.sla_status}</span></td><td><span class="status-badge ${rc}">${t.delay_risk} Risk</span></td><td><button class="btn btn-outline" style="padding:6px 12px;font-size:0.8rem;" onclick="updateSprintProgress('${t.sys_id}')">Update</button></td></tr>`;
    });
    html += `</tbody></table></div>`;
    viewContainer.innerHTML = html;
}

async function updateSprintProgress(id) {
    const val = prompt('Enter new Progress % (0-100):');
    if (val !== null && val !== '') {
        const p = parseInt(val);
        if (p >= 0 && p <= 100) {
            try {
                await apiFetch(`${API_BASE}/sprint-tasks/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ progress:p }) });
                showToast('Progress updated.', 'success');
                loadView('slas');
            } catch(err) {
                showToast('Failed to update progress.', 'error');
            }
        } else { alert('Please enter a number between 0 and 100.'); }
    }
}

// ── MY PERFORMANCE ───────────────────────────────────────────────────────────
async function renderEmployeePerformance() {
    const fbStats = { priority:{ High:1, Medium:1, Low:1 }, sla:{ Met:1, Breached:1, InProgress:1 }, avgProgress:55, totalTasks:3 };
    const fbTasks = [
        { task_name:'Database Schema Design', assigned_team:'Development', delay_risk:'Low', sla_status:'Met' },
        { task_name:'Node.js API Development', assigned_team:'Development', delay_risk:'High', sla_status:'Breached' },
        { task_name:'Frontend Dashboard UI', assigned_team:'UI/UX', delay_risk:'Medium', sla_status:'In Progress' }
    ];
    let stats = fbStats, tasks = fbTasks;
    try { const r = await apiFetch(`${API_BASE}/employee-stats`); if(r.ok){const d=await r.json();if(!d.error)stats=d;} } catch(e){}
    try { const r = await apiFetch(`${API_BASE}/sprint-tasks`);  if(r.ok){const d=await r.json();if(Array.isArray(d)&&d.length)tasks=d;} } catch(e){}

    const rate = stats.totalTasks > 0 ? Math.round((stats.sla.Met / stats.totalTasks) * 100) : 0;
    viewContainer.innerHTML = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-chart-pie" style="color:var(--primary);"></i> My Performance &amp; Task Priority</h2></div>
        <div class="performance-grid fade-in">
            <div class="perf-card"><div class="perf-label">Task Health Score</div><div class="perf-value">${stats.avgProgress}%</div><div class="progress-container"><div class="progress-bar" style="width:${stats.avgProgress}%"></div></div></div>
            <div class="perf-card"><div class="perf-label">SLAs Met</div><div class="perf-value">${stats.sla.Met}</div><div class="perf-label" style="color:var(--success);">Success Rate: ${rate}%</div></div>
            <div class="perf-card"><div class="perf-label">Open Bottlenecks</div><div class="perf-value" style="color:var(--danger);">${stats.sla.Breached}</div><div class="perf-label">Urgent Attention Required</div></div>
        </div>
        <div class="card-header fade-in" style="margin-top:8px;"><h3><i class="fa-solid fa-layer-group"></i> Priority Matrix</h3></div>
        <div class="priority-matrix fade-in">
            <div class="priority-col"><div class="priority-header high"><i class="fa-solid fa-circle-exclamation"></i> High</div><div id="prio-high"></div></div>
            <div class="priority-col"><div class="priority-header medium"><i class="fa-solid fa-circle-half-stroke"></i> Medium</div><div id="prio-medium"></div></div>
            <div class="priority-col"><div class="priority-header low"><i class="fa-solid fa-circle-check"></i> Low</div><div id="prio-low"></div></div>
        </div>`;
    tasks.forEach(t => {
        const el = document.createElement('div');
        el.className = 'priority-item';
        el.innerHTML = `<strong>${t.task_name}</strong><br><small style="color:var(--text-muted);">${t.assigned_team}</small>`;
        if (t.delay_risk === 'High' || t.sla_status === 'Breached') document.getElementById('prio-high').appendChild(el);
        else if (t.delay_risk === 'Medium') document.getElementById('prio-medium').appendChild(el);
        else document.getElementById('prio-low').appendChild(el);
    });
}

// ── DAILY MENU ──────────────────────────────────────────────────────────────
async function renderDailyMenu() {
    let items = [];
    try { const r = await apiFetch(`${API_BASE}/menu`); if(r.ok) items = await r.json(); } catch(e){}
    if (!items.length) items = [
        { id:'1', itemName:'Grilled Chicken Salad', category:'Lunch', calories:450, available:true },
        { id:'2', itemName:'Vegan Buddha Bowl', category:'Lunch', calories:380, available:true },
        { id:'3', itemName:'Caesar Wrap', category:'Snack', calories:320, available:false },
        { id:'4', itemName:'Fresh Fruit Smoothie', category:'Beverage', calories:210, available:true }
    ];
    let html = `<div class="topbar fade-in"><h2><i class="fa-solid fa-utensils" style="color:var(--primary);"></i> Daily Menu</h2>${userRole === 'hr' ? '<button class="btn btn-primary" onclick="showAddMenuForm()"><i class="fa-solid fa-plus"></i> Add Item</button>' : ''}</div><div id="menu-form-container"></div><div class="table-container fade-in"><table class="data-table"><thead><tr><th>Item</th><th>Category</th><th>Calories</th><th>Availability</th></tr></thead><tbody>`;
    items.forEach(item => {
        const statusClass = item.available ? 'status-completed' : 'status-pending';
        const statusText = item.available ? 'Available' : 'Unavailable';
        html += `<tr><td><strong>${item.itemName}</strong></td><td>${item.category}</td><td>${item.calories} kcal</td><td><span class="status-badge ${statusClass}">${statusText}</span></td></tr>`;
    });
    html += `</tbody></table></div>`;
    viewContainer.innerHTML = html;
}

function showAddMenuForm() {
    document.getElementById('menu-form-container').innerHTML = `
        <div class="card fade-in" style="margin-bottom:24px;border-left:4px solid var(--primary);">
            <h3 style="margin-bottom:20px;">Add Menu Item</h3>
            <form id="new-menu-form" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="form-group"><label>Item Name</label><input type="text" id="menu-name" class="form-control" required></div>
                <div class="form-group"><label>Category</label><select id="menu-cat" class="form-control"><option>Breakfast</option><option>Lunch</option><option>Snack</option><option>Beverage</option></select></div>
                <div class="form-group"><label>Calories</label><input type="number" id="menu-cals" class="form-control" required></div>
                <div class="form-group"><label>Available</label><select id="menu-avail" class="form-control"><option value="true">Yes</option><option value="false">No</option></select></div>
                <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:12px;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('menu-form-container').innerHTML=''">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save to ServiceNow</button>
                </div>
            </form>
        </div>`;
    document.getElementById('new-menu-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('.btn-primary'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
        try {
            await apiFetch(`${API_BASE}/menu`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ itemName: document.getElementById('menu-name').value, category: document.getElementById('menu-cat').value, calories: parseInt(document.getElementById('menu-cals').value), available: document.getElementById('menu-avail').value === 'true' }) });
            showToast('Menu item added!', 'success');
            loadView('menu');
        } catch(err) {
            showToast('Failed to add menu item.', 'error');
            btn.innerHTML = 'Save to ServiceNow'; btn.disabled = false;
        }
    });
}

// ── CHATBOT ──────────────────────────────────────────────────────────────────
async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatMessages.innerHTML += `<div class="message user-message fade-in">${text}</div>`;
    chatInput.value = '';
    const typingId = 'typing-' + Date.now();
    chatMessages.innerHTML += `<div id="${typingId}" class="message ai-message fade-in" style="font-size:1.2rem;padding:5px 15px;"><i class="fa-solid fa-ellipsis fa-fade"></i></div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    try {
        const res = await apiFetch(`${API_BASE}/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message:text }) });
        const data = await res.json();
        document.getElementById(typingId).remove();
        let reply = data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        chatMessages.innerHTML += `<div class="message ai-message fade-in">${reply}</div>`;
    } catch(e) {
        document.getElementById(typingId).remove();
        chatMessages.innerHTML += `<div class="message ai-message fade-in" style="color:var(--danger);">Connection error.</div>`;
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
