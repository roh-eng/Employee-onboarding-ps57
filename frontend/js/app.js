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

/* ── i18n helpers for dynamically-rendered content ───────────────────────── */
// Use inline translation (not data-i18n) for table rows that re-render on filter/sort.
function tr(key, fallback) {
    return (window.I18N && I18N.t) ? I18N.t(key, fallback) : (fallback || key);
}
// Map ServiceNow status/risk values to i18n keys (comparisons stay on the raw value).
const STATUS_KEYS = {
    'Onboarded': 'onboarded', 'Pending': 'pending', 'Completed': 'completed', 'In Progress': 'inProgress',
    'Available': 'available', 'Unavailable': 'unavailable', 'Met': 'met', 'Breached': 'breached',
    'High': 'high', 'Medium': 'medium', 'Low': 'low'
};
function trStatus(v) {
    if (v == null || v === '') return '';
    const k = STATUS_KEYS[v];
    return k ? tr(k, v) : v;
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
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

/* ── Logout ──────────────────────────────────────────────────────────────── */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/login.html';
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
        // Restore the saved theme (defaults to dark — the body ships with .dark-theme)
        applyTheme(localStorage.getItem('theme') || 'dark');
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-theme');
            applyTheme(isDark ? 'light' : 'dark');
        });
    }

    chatToggle.addEventListener('click', () => chatWindow.classList.toggle('hidden'));
    chatClose.addEventListener('click', () => chatWindow.classList.add('hidden'));
    chatSend.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });

    initNotifications();
    initLiveUpdates();
    initLanguageSwitcher();
});

/* ── Theme (persisted across reloads) ─────────────────────────────────────── */
function applyTheme(theme) {
    const isDark = theme !== 'light';
    document.body.classList.toggle('dark-theme', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const label = themeToggle.querySelector('span');
        // Button offers the *other* mode: dark active → "Light Mode" (sun), and vice-versa
        if (icon) { icon.classList.remove('fa-sun', 'fa-moon'); icon.classList.add(isDark ? 'fa-sun' : 'fa-moon'); }
        if (label) label.innerText = isDark ? 'Light Mode' : 'Dark Mode';
    }
}

/* ── Live updates over WebSocket (real-time notification push) ────────────── */
let _liveSocket = null;
let _liveRetry = null;
function initLiveUpdates() {
    if (!('WebSocket' in window)) return;
    try {
        const proto = location.protocol === 'https:' ? 'wss' : 'ws';
        // API server hosts the WS endpoint on /ws (see backend/services/realtime.js)
        const host = location.hostname || 'localhost';
        _liveSocket = new WebSocket(`${proto}://${host}:3000/ws`);
    } catch (e) { return; }

    _liveSocket.addEventListener('open', () => {
        clearTimeout(_liveRetry);
        _liveSocket.send(JSON.stringify({ type: 'subscribe', channel: 'notifications' }));
    });

    _liveSocket.addEventListener('message', (evt) => {
        let msg;
        try { msg = JSON.parse(evt.data); } catch (e) { return; }
        if (msg.type === 'broadcast' && msg.channel === 'notifications') {
            const p = msg.payload || {};
            refreshNotifCount();
            const dd = document.getElementById('notif-dropdown');
            if (dd && !dd.classList.contains('hidden')) loadNotifList();
            const text = p.title ? `${p.title}: ${p.message || ''}` : (p.message || 'New notification');
            showToast(text, 'info');
        }
    });

    // Auto-reconnect so the live channel survives server restarts / dropped links
    const reconnect = () => {
        clearTimeout(_liveRetry);
        _liveRetry = setTimeout(initLiveUpdates, 5000);
    };
    _liveSocket.addEventListener('close', reconnect);
    _liveSocket.addEventListener('error', () => { try { _liveSocket.close(); } catch (e) {} });
}

/* ── Language switcher (i18n) ─────────────────────────────────────────────── */
function initLanguageSwitcher() {
    if (!window.I18N) return;
    I18N.apply(); // translate the static chrome once the DOM is ready
    const sel = document.getElementById('lang-select');
    if (!sel) return;
    sel.value = I18N.getLang();
    sel.addEventListener('change', () => I18N.load(sel.value));
}

/* ── Notifications (live, backed by ServiceNow notification table) ────────── */
function initNotifications() {
    const bell = document.getElementById('notification-bell');
    const dropdown = document.getElementById('notif-dropdown');
    if (!bell || !dropdown) return;

    refreshNotifCount();
    setInterval(refreshNotifCount, 30000);

    bell.addEventListener('click', (e) => {
        if (dropdown.contains(e.target)) return; // clicks inside the panel handled separately
        e.stopPropagation();
        const opening = dropdown.classList.contains('hidden');
        dropdown.classList.toggle('hidden');
        if (opening) loadNotifList();
    });
    dropdown.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => dropdown.classList.add('hidden'));

    const markAll = document.getElementById('notif-mark-all');
    if (markAll) markAll.addEventListener('click', async (e) => {
        e.stopPropagation();
        const unread = [...document.querySelectorAll('.notif-item.unread')];
        for (const el of unread) await markNotifRead(el.dataset.id, el);
    });

    // HR / Manager broadcast composer
    const role = (localStorage.getItem('userRole') || 'employee').toLowerCase();
    if (role === 'hr' || role === 'manager') {
        const composer = document.createElement('div');
        composer.className = 'notif-compose';
        composer.innerHTML = `
            <input id="notif-compose-input" class="form-control" placeholder="Broadcast to everyone…" maxlength="240">
            <button id="notif-compose-send" class="btn btn-primary" type="button" title="Send broadcast"><i class="fa-solid fa-paper-plane"></i></button>`;
        dropdown.appendChild(composer);
        composer.addEventListener('click', (e) => e.stopPropagation());
        const sendBtn = composer.querySelector('#notif-compose-send');
        const input = composer.querySelector('#notif-compose-input');
        const send = async () => {
            const message = input.value.trim();
            if (!message) return;
            sendBtn.disabled = true;
            try {
                const res = await apiFetch(`${API_BASE}/notifications/broadcast`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, target: 'ALL' })
                });
                if (!res.ok) throw new Error();
                input.value = '';
                showToast('Broadcast sent to everyone.', 'success');
                loadNotifList();
                refreshNotifCount();
            } catch (e) { showToast('Failed to send broadcast.', 'error'); }
            finally { sendBtn.disabled = false; }
        };
        sendBtn.addEventListener('click', send);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') send(); });
    }
}

async function refreshNotifCount() {
    try {
        const res = await apiFetch(`${API_BASE}/notifications/unread-count`);
        if (!res.ok) return;
        const { count } = await res.json();
        const badge = document.getElementById('notif-badge');
        if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
    } catch (e) { /* keep silent — bell just shows no count */ }
}

async function loadNotifList() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    list.innerHTML = '<div class="notif-empty">Loading…</div>';
    try {
        const res = await apiFetch(`${API_BASE}/notifications`);
        const items = res.ok ? await res.json() : [];
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = '<div class="notif-empty">You\'re all caught up 🎉</div>';
            return;
        }
        list.innerHTML = items.map(n => {
            const id = (n.sys_id && n.sys_id.value) ? n.sys_id.value : n.sys_id;
            const text = n.message || n.title || 'Notification';
            return `<div class="notif-item ${n.read ? '' : 'unread'}" data-id="${id}">
                        <div class="notif-msg">${text}</div>
                        <div class="notif-meta"><i class="fa-solid fa-user-group"></i> ${n.recipient || 'ALL'} &middot; ${n.created || ''}</div>
                    </div>`;
        }).join('');
        list.querySelectorAll('.notif-item.unread').forEach(el => {
            el.addEventListener('click', (e) => { e.stopPropagation(); markNotifRead(el.dataset.id, el); });
        });
    } catch (e) {
        list.innerHTML = '<div class="notif-empty">Could not load notifications.</div>';
    }
}

async function markNotifRead(id, el) {
    try {
        const res = await apiFetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
        if (res.ok && el) el.classList.remove('unread');
        refreshNotifCount();
    } catch (e) { /* ignore */ }
}

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
        case 'feedback':    await renderFeedback(); break;
        case 'reports':     await renderReports(); break;
        case 'webhooks':    await renderWebhooks(); break;
    }
    if (window.I18N) I18N.apply(); // translate any data-i18n inside freshly rendered views
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
            <h2><i class="fa-solid fa-chart-line" style="color:var(--primary);"></i> <span data-i18n="companyOverview">Company Overview</span></h2>
            <span style="color:var(--text-muted);font-size:0.85rem;"><i class="fa-solid fa-circle" style="color:#10b981;font-size:0.5rem;margin-right:6px;"></i>Live — ServiceNow PDI</span>
        </div>
        <div class="dashboard-grid fade-in">
            <div class="card stat-card"><div class="stat-icon primary"><i class="fa-solid fa-users"></i></div><div class="stat-details"><h3>${stats.totalEmployees}</h3><p data-i18n="totalHeadcount">Total Headcount</p></div></div>
            <div class="card stat-card"><div class="stat-icon success"><i class="fa-solid fa-user-check"></i></div><div class="stat-details"><h3>${stats.onboardedEmployees}</h3><p data-i18n="onboarded">Onboarded</p></div></div>
            <div class="card stat-card"><div class="stat-icon warning"><i class="fa-solid fa-list-check"></i></div><div class="stat-details"><h3>${stats.pendingTasks}</h3><p data-i18n="pendingTasks">Pending Tasks</p></div></div>
            <div class="card stat-card"><div class="stat-icon" style="background:rgba(239,68,68,0.1);color:var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="stat-details"><h3>${perf.sla.Breached}</h3><p data-i18n="slaBreached">SLA Breached</p></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;" class="fade-in">
            <div class="card" style="padding:24px;">
                <h3 style="margin-bottom:20px;font-size:1rem;font-weight:600;"><i class="fa-solid fa-users" style="color:var(--primary);margin-right:8px;"></i><span data-i18n="empOnboardingStatus">Employee Onboarding Status</span></h3>
                <canvas id="empChart" height="200"></canvas>
            </div>
            <div class="card" style="padding:24px;">
                <h3 style="margin-bottom:20px;font-size:1rem;font-weight:600;"><i class="fa-solid fa-stopwatch" style="color:var(--primary);margin-right:8px;"></i><span data-i18n="slaPerformance">SLA Performance</span></h3>
                <canvas id="slaChart" height="200"></canvas>
            </div>
        </div>
        <div class="card fade-in" style="padding:24px;margin-bottom:24px;">
            <h3 style="margin-bottom:20px;font-size:1rem;font-weight:600;"><i class="fa-solid fa-chart-bar" style="color:var(--primary);margin-right:8px;"></i><span data-i18n="sprintPriorityDist">Sprint Task Priority Distribution</span></h3>
            <canvas id="priorityChart" height="90"></canvas>
        </div>
        <div class="card fade-in"><h3 style="margin-bottom:12px;" data-i18n="systemStatus">System Status</h3><p style="color:var(--text-muted);">Enterprise Workflow Hub is live and connected to ServiceNow PDI. AI Business Rules are monitoring bottleneck risks in real-time.</p></div>
    `;

    try { new Chart(document.getElementById('empChart'), { type:'doughnut', data:{ labels:['Onboarded','Pending'], datasets:[{ data:[stats.onboardedEmployees,pendingEmp], backgroundColor:['#10b981','#f59e0b'], borderWidth:0 }] }, options:{ plugins:{ legend:{ labels:{ color:tc } } }, cutout:'65%' } }); } catch(e) { console.error('Chart error (emp):', e); }
    try { new Chart(document.getElementById('slaChart'), { type:'doughnut', data:{ labels:['Met','Breached','In Progress'], datasets:[{ data:[perf.sla.Met,perf.sla.Breached,perf.sla.InProgress], backgroundColor:['#10b981','#ef4444','#4f46e5'], borderWidth:0 }] }, options:{ plugins:{ legend:{ labels:{ color:tc } } }, cutout:'65%' } }); } catch(e) { console.error('Chart error (sla):', e); }
    try { new Chart(document.getElementById('priorityChart'), { type:'bar', data:{ labels:['High','Medium','Low'], datasets:[{ label:'Tasks', data:[perf.priority.High,perf.priority.Medium,perf.priority.Low], backgroundColor:['rgba(239,68,68,0.8)','rgba(245,158,11,0.8)','rgba(16,185,129,0.8)'], borderRadius:8, borderSkipped:false }] }, options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:tc }, grid:{ display:false } }, y:{ ticks:{ color:tc, stepSize:1 }, grid:{ color:gc } } } } }); } catch(e) { console.error('Chart error (priority):', e); }
}

// ── HR DASHBOARD ────────────────────────────────────────────────────────────
let _emps = [];
let _empFilter = { predicate: () => true };
const _hrState = { q: '', sortKey: '', sortDir: 1 };

async function renderHRDashboard() {
    try {
        const res = await apiFetch(`${API_BASE}/employees`);
        _emps = res.ok ? await res.json() : [];
        if (!Array.isArray(_emps)) _emps = [];
    } catch (e) { viewContainer.innerHTML = `<p style="color:var(--danger);">Error loading employees.</p>`; return; }

    _hrState.q = ''; _hrState.sortKey = ''; _hrState.sortDir = 1;
    viewContainer.innerHTML = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-users" style="color:var(--primary);"></i> <span data-i18n="hrDashboard">HR Dashboard</span></h2><button class="btn btn-primary" onclick="showAddEmployeeForm()"><i class="fa-solid fa-user-plus"></i> <span data-i18n="newHire">New Hire</span></button></div>
        <div id="form-container"></div>
        <div class="toolbar fade-in">
            <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="emp-search" class="form-control" data-i18n="quickSearch" placeholder="Quick search…"></div>
        </div>
        <div id="emp-filter" class="fade-in"></div>
        <div class="table-container fade-in"><table class="data-table">
            <thead><tr>
                <th class="sortable" data-key="name" data-i18n="name">Name</th>
                <th class="sortable" data-key="department" data-i18n="department">Department</th>
                <th class="sortable" data-key="joiningDate" data-i18n="joiningDate">Joining Date</th>
                <th class="sortable" data-key="status" data-i18n="status">Status</th>
            </tr></thead>
            <tbody id="emp-tbody"></tbody>
        </table></div>`;

    document.getElementById('emp-search').addEventListener('input', (e) => { _hrState.q = e.target.value.toLowerCase(); renderEmpRows(); });
    _empFilter = attachFilterBuilder('emp-filter', [
        { key: 'name', label: 'Name' }, { key: 'department', label: 'Department' },
        { key: 'joiningDate', label: 'Joining Date' }, { key: 'status', label: 'Status' }
    ], renderEmpRows);
    document.querySelectorAll('.data-table th.sortable').forEach(th => th.addEventListener('click', () => {
        const k = th.dataset.key;
        if (_hrState.sortKey === k) _hrState.sortDir *= -1; else { _hrState.sortKey = k; _hrState.sortDir = 1; }
        setSortArrows(_hrState.sortKey, _hrState.sortDir);
        renderEmpRows();
    }));
    renderEmpRows();
}

function renderEmpRows() {
    let rows = _emps.filter(e => {
        if (_hrState.q && !`${e.name} ${e.department} ${e.status}`.toLowerCase().includes(_hrState.q)) return false;
        return _empFilter.predicate(e);
    });
    rows = sortRows(rows, _hrState.sortKey, _hrState.sortDir);
    const tbody = document.getElementById('emp-tbody');
    if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:28px;">No matching employees.</td></tr>`; return; }
    tbody.innerHTML = rows.map(emp => {
        const sc = emp.status === 'Onboarded' ? 'status-onboarded' : 'status-pending';
        return `<tr><td><div style="display:flex;align-items:center;gap:12px;"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || '')}&background=random&color=fff&size=32" style="border-radius:50%;">${emp.name || ''}</div></td><td>${emp.department || ''}</td><td>${emp.joiningDate || ''}</td><td><span class="status-badge ${sc}">${trStatus(emp.status || 'Pending')}</span></td></tr>`;
    }).join('');
}

function showAddEmployeeForm() {
    document.getElementById('form-container').innerHTML = `
        <div class="card fade-in" style="margin-bottom:24px;border-left:4px solid var(--success);">
            <h3 style="margin-bottom:20px;">Register New Hire (Triggers Flow Designer)</h3>
            <form id="new-employee-form" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="form-group"><label data-i18n="fullName">Full Name</label><input type="text" id="emp-name" class="form-control" required></div>
                <div class="form-group"><label data-i18n="email">Email</label><input type="email" id="emp-email" class="form-control" required></div>
                <div class="form-group"><label data-i18n="department">Department</label><select id="emp-dept" class="form-control"><option>IT</option><option>HR</option><option>Security</option><option>Facility</option></select></div>
                <div class="form-group"><label data-i18n="joiningDate">Joining Date</label><input type="date" id="emp-date" class="form-control" required></div>
                <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:12px;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('form-container').innerHTML=''" data-i18n="cancel">Cancel</button>
                    <button type="submit" class="btn btn-success" data-i18n="saveToServiceNow">Save to ServiceNow</button>
                </div>
            </form>
        </div>`;
    if (window.I18N) I18N.apply();
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

// ── Shared sort helper (paints ▲/▼ on the active column header) ───────────────
function setSortArrows(activeKey, dir) {
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
        const label = th.getAttribute('data-label') || th.textContent.replace(/\s*[▲▼]\s*$/, '');
        th.setAttribute('data-label', label);
        th.innerHTML = label + (th.dataset.key === activeKey ? (dir === 1 ? ' ▲' : ' ▼') : '');
    });
}

function sortRows(rows, key, dir) {
    if (!key) return rows;
    return [...rows].sort((a, b) => {
        const av = (a[key] ?? '').toString().toLowerCase();
        const bv = (b[key] ?? '').toString().toLowerCase();
        if (av < bv) return -dir;
        if (av > bv) return dir;
        return 0;
    });
}

// ── Reusable ServiceNow-style condition builder (field / oper / value) ────────
const FILTER_OPERS = [
    ['is', 'is', 'opIs'], ['is_not', 'is not', 'opIsNot'], ['contains', 'contains', 'opContains'],
    ['not_contains', 'does not contain', 'opNotContains'], ['starts', 'starts with', 'opStarts'],
    ['ends', 'ends with', 'opEnds'], ['empty', 'is empty', 'opEmpty']
];

function attachFilterBuilder(mountId, fields, onChange) {
    const mount = document.getElementById(mountId);
    if (!mount) return { predicate: () => true };

    const rowHtml = () => `
        <div class="filter-row">
            <select class="form-control f-field"><option value="" data-i18n="chooseField">-- choose field --</option>${fields.map(f => `<option value="${f.key}">${f.label}</option>`).join('')}</select>
            <select class="form-control f-oper"><option value="" data-i18n="chooseOper">-- oper --</option>${FILTER_OPERS.map(o => `<option value="${o[0]}">${tr(o[2], o[1])}</option>`).join('')}</select>
            <input class="form-control f-value" data-i18n="valuePlaceholder" placeholder="-- value --">
            <button type="button" class="btn btn-outline f-remove" title="Remove condition"><i class="fa-solid fa-xmark"></i></button>
        </div>`;

    mount.innerHTML = `<div class="filter-builder">
            <div class="filter-rows">${rowHtml()}</div>
            <button type="button" class="btn btn-outline f-add" style="margin-top:12px;"><i class="fa-solid fa-plus"></i> <span data-i18n="addCondition">Add condition</span></button>
        </div>`;
    const rows = mount.querySelector('.filter-rows');

    mount.addEventListener('input', (e) => { if (e.target.classList.contains('f-value')) onChange(); });
    mount.addEventListener('change', (e) => {
        if (e.target.classList.contains('f-oper')) {
            const vi = e.target.parentElement.querySelector('.f-value');
            if (vi) { vi.disabled = e.target.value === 'empty'; if (vi.disabled) vi.value = ''; }
        }
        if (e.target.classList.contains('f-field') || e.target.classList.contains('f-oper')) onChange();
    });
    mount.addEventListener('click', (e) => {
        if (e.target.closest('.f-add')) { rows.insertAdjacentHTML('beforeend', rowHtml()); if (window.I18N) I18N.apply(); }
        else if (e.target.closest('.f-remove')) {
            const r = e.target.closest('.filter-row');
            if (rows.querySelectorAll('.filter-row').length > 1) r.remove();
            else { r.querySelector('.f-field').value = ''; r.querySelector('.f-oper').value = ''; const v = r.querySelector('.f-value'); v.value = ''; v.disabled = false; }
            onChange();
        }
    });

    function predicate(item) {
        const conds = [...rows.querySelectorAll('.filter-row')].map(r => ({
            field: r.querySelector('.f-field').value,
            oper: r.querySelector('.f-oper').value,
            value: r.querySelector('.f-value').value
        })).filter(c => c.field && c.oper && (c.value !== '' || c.oper === 'empty'));

        return conds.every(c => {
            const v = (item[c.field] ?? '').toString().toLowerCase();
            const cv = (c.value || '').toLowerCase();
            switch (c.oper) {
                case 'is': return v === cv;
                case 'is_not': return v !== cv;
                case 'contains': return v.includes(cv);
                case 'not_contains': return !v.includes(cv);
                case 'starts': return v.startsWith(cv);
                case 'ends': return v.endsWith(cv);
                case 'empty': return v === '';
                default: return true;
            }
        });
    }
    return { predicate };
}

// ── EMPLOYEE TASKS ──────────────────────────────────────────────────────────
let _tasks = [];
let _taskFilter = { predicate: () => true };
const _taskState = { q: '', sortKey: '', sortDir: 1 };

async function renderEmployeeTasks() {
    try {
        const r = await apiFetch(`${API_BASE}/tasks`);
        _tasks = r.ok ? await r.json() : [];
        if (!Array.isArray(_tasks)) _tasks = [];
    } catch (e) { viewContainer.innerHTML = `<p style="color:var(--danger);">Error loading tasks.</p>`; return; }

    _taskState.q = ''; _taskState.status = 'All'; _taskState.sortKey = ''; _taskState.sortDir = 1;
    viewContainer.innerHTML = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-list-check" style="color:var(--primary);"></i> <span data-i18n="onboardingTasks">Onboarding Tasks</span></h2></div>
        <div class="toolbar fade-in">
            <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="task-search" class="form-control" data-i18n="quickSearch" placeholder="Quick search…"></div>
        </div>
        <div id="task-filter" class="fade-in"></div>
        <div class="table-container fade-in"><table class="data-table">
            <thead><tr>
                <th class="sortable" data-key="employeeName" data-i18n="employee">Employee</th>
                <th class="sortable" data-key="taskType" data-i18n="taskType">Task Type</th>
                <th class="sortable" data-key="assignedTo" data-i18n="assignedTo">Assigned To</th>
                <th class="sortable" data-key="status" data-i18n="status">Status</th>
                <th data-i18n="action">Action</th>
            </tr></thead>
            <tbody id="task-tbody"></tbody>
        </table></div>`;

    document.getElementById('task-search').addEventListener('input', (e) => { _taskState.q = e.target.value.toLowerCase(); renderTaskRows(); });
    _taskFilter = attachFilterBuilder('task-filter', [
        { key: 'employeeName', label: 'Employee' }, { key: 'taskType', label: 'Task Type' },
        { key: 'assignedTo', label: 'Assigned To' }, { key: 'status', label: 'Status' }
    ], renderTaskRows);
    document.querySelectorAll('.data-table th.sortable').forEach(th => th.addEventListener('click', () => {
        const k = th.dataset.key;
        if (_taskState.sortKey === k) _taskState.sortDir *= -1; else { _taskState.sortKey = k; _taskState.sortDir = 1; }
        setSortArrows(_taskState.sortKey, _taskState.sortDir);
        renderTaskRows();
    }));
    renderTaskRows();
}

function renderTaskRows() {
    let rows = _tasks.filter(t => {
        if (_taskState.q && !`${t.employeeName} ${t.taskType} ${t.assignedTo} ${t.status}`.toLowerCase().includes(_taskState.q)) return false;
        return _taskFilter.predicate(t);
    });
    rows = sortRows(rows, _taskState.sortKey, _taskState.sortDir);
    const tbody = document.getElementById('task-tbody');
    if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:28px;">No matching tasks.</td></tr>`; return; }
    tbody.innerHTML = rows.map(t => {
        const sc = t.status === 'Completed' ? 'status-completed' : t.status === 'In Progress' ? 'status-inprogress' : 'status-pending';
        const action = t.status !== 'Completed' ? `<button class="btn btn-primary" style="padding:6px 12px;font-size:0.85rem;" onclick="completeTask('${t.id}')">${tr('complete', 'Complete')}</button>` : `<i class="fa-solid fa-check" style="color:var(--success);"></i>`;
        return `<tr><td>${t.employeeName}</td><td>${t.taskType}</td><td>${t.assignedTo}</td><td><span class="status-badge ${sc}">${trStatus(t.status || 'Pending')}</span></td><td>${action}</td></tr>`;
    }).join('');
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
        <div class="topbar fade-in"><h2><i class="fa-solid fa-ticket" style="color:var(--primary);"></i> <span data-i18n="reportIssue">Report Issue</span></h2></div>
        <div class="card fade-in" style="max-width:600px;margin:0 auto;">
            <form id="issue-form">
                <div class="form-group"><label data-i18n="description">Description</label><textarea id="issue-desc" class="form-control" rows="5" required placeholder="Describe the issue..."></textarea></div>
                <div class="form-group"><label data-i18n="priority">Priority</label><select id="issue-priority" class="form-control"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
                <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px;" data-i18n="submitTicketSN">Submit Ticket to ServiceNow</button>
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

// ── EMPLOYEE FEEDBACK ─────────────────────────────────────────────────────────
async function renderFeedback() {
    const role = (localStorage.getItem('userRole') || 'employee').toLowerCase();
    const isManager = role === 'hr' || role === 'manager';
    const categories = ['Work Environment', 'Management', 'Facilities', 'IT Support', 'Onboarding Experience', 'Other'];

    let items = [];
    try { const r = await apiFetch(`${API_BASE}/feedback`); if (r.ok) { const d = await r.json(); if (Array.isArray(d)) items = d; } } catch (e) {}

    let html = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-comment-dots" style="color:var(--primary);"></i> <span data-i18n="employeeFeedback">Employee Feedback</span></h2></div>
        <div class="card fade-in" style="max-width:640px;margin:0 auto 24px;">
            <h3 style="margin-bottom:18px;" data-i18n="shareFeedback">Share your feedback</h3>
            <form id="feedback-form" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div class="form-group" style="margin-bottom:0;"><label data-i18n="category">Category</label>
                    <select id="fb-category" class="form-control">${categories.map(c => `<option>${c}</option>`).join('')}</select>
                </div>
                <div class="form-group" style="margin-bottom:0;"><label data-i18n="rating">Rating</label>
                    <select id="fb-rating" class="form-control">
                        <option value="5" data-i18n="ratingExcellent">★★★★★ Excellent</option>
                        <option value="4" data-i18n="ratingGood">★★★★ Good</option>
                        <option value="3" selected data-i18n="ratingAverage">★★★ Average</option>
                        <option value="2" data-i18n="ratingPoor">★★ Poor</option>
                        <option value="1" data-i18n="ratingVeryPoor">★ Very Poor</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:0;grid-column:1 / -1;"><label data-i18n="yourFeedback">Your feedback</label>
                    <textarea id="fb-comments" class="form-control" rows="3" required placeholder="Tell us about your experience…"></textarea>
                </div>
                <div style="grid-column:1 / -1;display:flex;justify-content:flex-end;">
                    <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> <span data-i18n="submitFeedback">Submit Feedback</span></button>
                </div>
            </form>
        </div>
        <div class="table-container fade-in"><table class="data-table"><thead><tr>
            ${isManager ? '<th data-i18n="employee">Employee</th>' : ''}<th data-i18n="category">Category</th><th data-i18n="rating">Rating</th><th data-i18n="feedback">Feedback</th><th data-i18n="submitted">Submitted</th>
        </tr></thead><tbody>`;

    if (!items.length) {
        html += `<tr><td colspan="${isManager ? 5 : 4}" style="text-align:center;color:var(--text-muted);padding:28px;">No feedback submitted yet.</td></tr>`;
    } else {
        items.forEach(f => {
            const n = parseInt(f.rating) || 0;
            const stars = '★'.repeat(n) + '☆'.repeat(5 - n);
            html += `<tr>
                ${isManager ? `<td>${f.employee || '—'}</td>` : ''}
                <td><span class="status-badge status-inprogress">${f.category || 'General'}</span></td>
                <td style="color:#fbbf24;letter-spacing:2px;white-space:nowrap;">${stars}</td>
                <td>${f.comments || ''}</td>
                <td style="white-space:nowrap;">${f.submittedOn || ''}</td>
            </tr>`;
        });
    }
    html += `</tbody></table></div>`;
    viewContainer.innerHTML = html;

    document.getElementById('feedback-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
        try {
            const res = await apiFetch(`${API_BASE}/feedback`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: document.getElementById('fb-category').value,
                    rating: parseInt(document.getElementById('fb-rating').value),
                    comments: document.getElementById('fb-comments').value
                })
            });
            if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to submit'); }
            showToast('Thanks! Your feedback was submitted.', 'success');
            loadView('feedback');
        } catch (err) {
            showToast(err.message || 'Failed to submit feedback.', 'error');
            btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Feedback';
        }
    });
}

// ── PROJECT DELIVERY ────────────────────────────────────────────────────────
async function renderProjectDashboard() {
    let projects = [];
    try { const r = await apiFetch(`${API_BASE}/projects`); if(r.ok) projects = await r.json(); } catch(e){}
    if (!projects.length) projects = [{ sys_id:'demo1', project_name:'Enterprise Workflow Hub', client_name:'Internal', project_manager:'Admin', status:'Development' }];
    let html = `<div class="topbar fade-in"><h2><i class="fa-solid fa-diagram-project" style="color:var(--primary);"></i> <span data-i18n="projectDeliveryDashboard">Project Delivery Dashboard</span></h2><button class="btn btn-primary" onclick="showAddProjectForm()"><i class="fa-solid fa-plus"></i> <span data-i18n="newProject">New Project</span></button></div><div id="project-form-container"></div><div class="table-container fade-in"><table class="data-table"><thead><tr><th data-i18n="projectName">Project Name</th><th data-i18n="client">Client</th><th data-i18n="manager">Manager</th><th data-i18n="status">Status</th></tr></thead><tbody>`;
    projects.forEach(p => { html += `<tr><td><strong>${p.project_name}</strong></td><td>${p.client_name}</td><td>${p.project_manager}</td><td><span class="status-badge status-inprogress">${trStatus(p.status)}</span></td></tr>`; });
    html += `</tbody></table></div>`;
    viewContainer.innerHTML = html;
}

function showAddProjectForm() {
    document.getElementById('project-form-container').innerHTML = `
        <div class="card fade-in" style="margin-bottom:24px;border-left:4px solid var(--primary);">
            <h3 style="margin-bottom:20px;">Initiate New Project</h3>
            <form id="new-project-form" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="form-group"><label data-i18n="projectName">Project Name</label><input type="text" id="proj-name" class="form-control" required></div>
                <div class="form-group"><label data-i18n="clientName">Client Name</label><input type="text" id="proj-client" class="form-control" required></div>
                <div class="form-group"><label data-i18n="projectManager">Project Manager</label><input type="text" id="proj-manager" class="form-control" required></div>
                <div class="form-group"><label data-i18n="startDate">Start Date</label><input type="date" id="proj-start" class="form-control" required></div>
                <div class="form-group"><label data-i18n="deadline">Deadline</label><input type="date" id="proj-deadline" class="form-control" required></div>
                <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:12px;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('project-form-container').innerHTML=''" data-i18n="cancel">Cancel</button>
                    <button type="submit" class="btn btn-primary" data-i18n="createInServiceNow">Create in ServiceNow</button>
                </div>
            </form>
        </div>`;
    if (window.I18N) I18N.apply();
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
    let html = `<div class="topbar fade-in"><h2><i class="fa-solid fa-stopwatch" style="color:var(--primary);"></i> <span data-i18n="slaTitle">SLA Intelligence & AI Bottleneck Prediction</span></h2></div><div class="card fade-in" style="margin-bottom:24px;"><p style="color:var(--text-muted);"><strong>AI Analysis:</strong> Automatically detecting bottlenecks based on Progress % and SLA Deadlines.</p></div><div class="table-container fade-in"><table class="data-table"><thead><tr><th data-i18n="taskName">Task Name</th><th data-i18n="team">Team</th><th data-i18n="progress">Progress</th><th data-i18n="slaStatus">SLA Status</th><th data-i18n="aiDelayRisk">AI Delay Risk</th><th data-i18n="action">Action</th></tr></thead><tbody>`;
    tasks.forEach(t => {
        const rc = t.delay_risk === 'High' ? 'status-pending' : t.delay_risk === 'Low' ? 'status-completed' : 'status-inprogress';
        const sc = t.sla_status === 'Breached' ? 'status-pending' : t.sla_status === 'Met' ? 'status-completed' : 'status-inprogress';
        html += `<tr><td><strong>${t.task_name}</strong></td><td>${t.assigned_team}</td><td><div class="progress-container"><div class="progress-bar" style="width:${t.progress}%"></div></div><span style="font-size:0.8rem;color:var(--text-muted);">${t.progress}%</span></td><td><span class="status-badge ${sc}">${trStatus(t.sla_status)}</span></td><td><span class="status-badge ${rc}">${trStatus(t.delay_risk)} ${tr('risk', 'Risk')}</span></td><td><button class="btn btn-outline" style="padding:6px 12px;font-size:0.8rem;" onclick="updateSprintProgress('${t.sys_id}')">${tr('update', 'Update')}</button></td></tr>`;
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
    try { const r = await apiFetch(`${API_BASE}/stats/employee`); if(r.ok){const d=await r.json();if(!d.error)stats=d;} } catch(e){}
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
    let html = `<div class="topbar fade-in"><h2><i class="fa-solid fa-utensils" style="color:var(--primary);"></i> <span data-i18n="dailyMenu">Daily Menu</span></h2>${userRole === 'hr' ? '<button class="btn btn-primary" onclick="showAddMenuForm()"><i class="fa-solid fa-plus"></i> <span data-i18n="addItem">Add Item</span></button>' : ''}</div><div id="menu-form-container"></div><div class="table-container fade-in"><table class="data-table"><thead><tr><th data-i18n="item">Item</th><th data-i18n="category">Category</th><th data-i18n="calories">Calories</th><th data-i18n="availability">Availability</th></tr></thead><tbody>`;
    items.forEach(item => {
        const statusClass = item.available ? 'status-completed' : 'status-pending';
        const statusText = item.available ? tr('available', 'Available') : tr('unavailable', 'Unavailable');
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
                <div class="form-group"><label data-i18n="category">Category</label><select id="menu-cat" class="form-control"><option>Breakfast</option><option>Lunch</option><option>Snack</option><option>Beverage</option></select></div>
                <div class="form-group"><label data-i18n="calories">Calories</label><input type="number" id="menu-cals" class="form-control" required></div>
                <div class="form-group"><label data-i18n="availability">Available</label><select id="menu-avail" class="form-control"><option value="true" data-i18n="yes">Yes</option><option value="false" data-i18n="no">No</option></select></div>
                <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:12px;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('menu-form-container').innerHTML=''" data-i18n="cancel">Cancel</button>
                    <button type="submit" class="btn btn-primary" data-i18n="saveToServiceNow">Save to ServiceNow</button>
                </div>
            </form>
        </div>`;
    if (window.I18N) I18N.apply();
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

// ── REPORTS & EXPORTS ─────────────────────────────────────────────────────────
async function renderReports() {
    const reports = [
        { path:'/reports/employees/csv',    file:'employees_report.csv',    icon:'fa-users',           title:'Employees',                desc:'Full directory with department, status and joining date.' },
        { path:'/reports/tasks/csv',        file:'tasks_report.csv',        icon:'fa-list-check',      title:'Onboarding Tasks',         desc:'All tasks with assignee, status, priority and due date.' },
        { path:'/reports/projects/csv',     file:'projects_report.csv',     icon:'fa-diagram-project', title:'Projects',                 desc:'Portfolio with client, manager, deadline and status.' },
        { path:'/reports/sprint-tasks/csv', file:'sprint_tasks_report.csv', icon:'fa-stopwatch',       title:'Sprint Tasks',             desc:'Sprint progress, delay risk and SLA status.' },
        { path:'/reports/dashboard/json',   file:'dashboard_report.json',   icon:'fa-chart-pie',       title:'Executive Summary (JSON)', desc:'Aggregated KPIs across employees, tasks and projects.' }
    ];
    viewContainer.innerHTML = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-file-export" style="color:var(--primary);"></i> <span data-i18n="reportsExports">Reports &amp; Exports</span></h2></div>
        <div class="report-grid fade-in">
        ${reports.map(r => `
            <div class="card report-card">
                <div class="report-icon"><i class="fa-solid ${r.icon}"></i></div>
                <h3 style="margin:0 0 6px;">${r.title}</h3>
                <p style="color:var(--text-muted);font-size:0.88rem;margin:0 0 18px;flex:1;">${r.desc}</p>
                <button class="btn btn-primary report-dl" data-path="${r.path}" data-file="${r.file}" style="width:100%;justify-content:center;">
                    <i class="fa-solid fa-download"></i> <span data-i18n="download">Download</span>
                </button>
            </div>`).join('')}
        </div>`;
    viewContainer.querySelectorAll('.report-dl').forEach(btn =>
        btn.addEventListener('click', () => downloadReport(btn, btn.dataset.path, btn.dataset.file))
    );
}

async function downloadReport(btn, path, filename) {
    const original = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing…';
    try {
        // apiFetch attaches the JWT; a plain <a href> would be rejected (401)
        const res = await apiFetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error(`Export failed (${res.status})`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        showToast('Report downloaded.', 'success');
    } catch (e) {
        showToast(e.message || 'Could not generate report.', 'error');
    } finally {
        btn.disabled = false; btn.innerHTML = original;
    }
}

// ── INTEGRATIONS & WEBHOOKS (HR only) ─────────────────────────────────────────
const WEBHOOK_EVENTS = ['employee.created', 'employee.updated', 'task.completed', 'project.updated', 'sla.breached', 'feedback.submitted'];

async function renderWebhooks() {
    let hooks = [];
    try { const r = await apiFetch(`${API_BASE}/webhooks`); if (r.ok) { const d = await r.json(); if (Array.isArray(d)) hooks = d; } } catch (e) {}

    viewContainer.innerHTML = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-plug" style="color:var(--primary);"></i> <span data-i18n="integrationsWebhooks">Integrations &amp; Webhooks</span></h2></div>
        <div class="card fade-in" style="max-width:760px;margin:0 auto 24px;">
            <h3 style="margin-bottom:6px;" data-i18n="registerWebhookTitle">Register a webhook</h3>
            <p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:18px;">External systems (SAP, Workday, Slack…) receive a signed POST when the selected events fire.</p>
            <form id="wh-form" style="display:grid;gap:16px;">
                <div class="form-group" style="margin:0;"><label data-i18n="endpointUrl">Endpoint URL</label>
                    <input id="wh-url" type="url" class="form-control" required placeholder="https://example.com/hooks/workflow-hub">
                </div>
                <div class="form-group" style="margin:0;"><label data-i18n="signingSecret">Signing secret (optional)</label>
                    <input id="wh-secret" class="form-control" placeholder="Used to sign delivery payloads">
                </div>
                <div class="form-group" style="margin:0;"><label data-i18n="events">Events</label>
                    <div class="wh-events">${WEBHOOK_EVENTS.map(ev => `<label class="wh-event"><input type="checkbox" value="${ev}"> <span>${ev}</span></label>`).join('')}</div>
                </div>
                <div style="display:flex;justify-content:flex-end;"><button type="submit" class="btn btn-primary"><i class="fa-solid fa-plus"></i> <span data-i18n="registerWebhook">Register Webhook</span></button></div>
            </form>
        </div>
        <div class="table-container fade-in"><table class="data-table"><thead><tr>
            <th data-i18n="endpoint">Endpoint</th><th data-i18n="events">Events</th><th data-i18n="status">Status</th><th data-i18n="created">Created</th><th data-i18n="actions">Actions</th>
        </tr></thead><tbody id="wh-tbody"></tbody></table></div>`;

    renderWebhookRows(hooks);

    document.getElementById('wh-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('wh-url').value.trim();
        const secret = document.getElementById('wh-secret').value.trim();
        const events = [...document.querySelectorAll('.wh-events input:checked')].map(c => c.value);
        if (!events.length) { showToast('Select at least one event.', 'error'); return; }
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering…';
        try {
            const res = await apiFetch(`${API_BASE}/webhooks/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, events, secret: secret || undefined })
            });
            if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Registration failed'); }
            showToast('Webhook registered.', 'success');
            renderWebhooks();
        } catch (err) {
            showToast(err.message || 'Failed to register webhook.', 'error');
            btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plus"></i> Register Webhook';
        }
    });
}

function renderWebhookRows(hooks) {
    const tb = document.getElementById('wh-tbody');
    if (!tb) return;
    if (!hooks.length) {
        tb.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:28px;">No webhooks registered yet.</td></tr>`;
        return;
    }
    tb.innerHTML = hooks.map(h => `<tr>
        <td style="word-break:break-all;max-width:260px;">${h.url}</td>
        <td>${(h.events || []).map(ev => `<span class="status-badge status-inprogress" style="margin:2px;">${ev}</span>`).join('')}</td>
        <td><span class="status-badge ${h.active ? 'status-completed' : 'status-pending'}">${h.active ? 'Active' : 'Inactive'}</span></td>
        <td style="white-space:nowrap;">${(h.createdAt || '').slice(0, 10)}</td>
        <td style="white-space:nowrap;">
            <button class="btn btn-outline wh-test" data-id="${h.id}" title="Send test payload" style="padding:8px 12px;"><i class="fa-solid fa-paper-plane"></i></button>
            <button class="btn btn-outline wh-del" data-id="${h.id}" title="Delete" style="padding:8px 12px;color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`).join('');
    tb.querySelectorAll('.wh-test').forEach(b => b.addEventListener('click', () => testWebhook(b.dataset.id)));
    tb.querySelectorAll('.wh-del').forEach(b => b.addEventListener('click', () => deleteWebhook(b.dataset.id)));
}

async function testWebhook(id) {
    try {
        const res = await apiFetch(`${API_BASE}/webhooks/test/${id}`, { method: 'POST' });
        if (!res.ok) throw new Error();
        showToast('Test payload generated — check server logs.', 'success');
    } catch (e) { showToast('Test failed.', 'error'); }
}

async function deleteWebhook(id) {
    try {
        const res = await apiFetch(`${API_BASE}/webhooks/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showToast('Webhook deleted.', 'success');
        renderWebhooks();
    } catch (e) { showToast('Delete failed.', 'error'); }
}
