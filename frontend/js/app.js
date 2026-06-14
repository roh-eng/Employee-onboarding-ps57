// Same-origin API base — works in local dev and in any deployment (Render/Azure/etc.)
// without code changes. (Override with window.API_BASE before this script if ever needed.)
const API_BASE = (window.API_BASE || '') + '/api';

/* ── Demo / fallback data ────────────────────────────────────────────────────
 * Rich sample data shown whenever the live ServiceNow API returns nothing
 * (e.g. the PDI is asleep or empty) so every module looks populated for demos. */
const DEMO = {
    stats: { totalEmployees: 24, onboardedEmployees: 17, pendingTasks: 9, activeIssues: 4 },
    perf:  { priority: { High: 5, Medium: 9, Low: 11 }, sla: { Met: 16, Breached: 3, InProgress: 6 }, avgProgress: 71, totalTasks: 25 },
    employees: [
        { id:'e1',  name:'Aarav Sharma',    email:'aarav.sharma@enterprisehub.com',    department:'Engineering',     joiningDate:'2026-01-12', status:'Onboarded' },
        { id:'e2',  name:'Sarah Johnson',   email:'sarah.johnson@enterprisehub.com',   department:'Human Resources', joiningDate:'2026-02-03', status:'Onboarded', teamName:'People Operations', teamLead:'Anita Rao', manager:'Vikram Singh', workLocation:'Bengaluru' },
        { id:'e3',  name:'Michael Chen',    email:'michael.chen@enterprisehub.com',    department:'Product',         joiningDate:'2026-02-18', status:'Onboarded' },
        { id:'e4',  name:'Priya Nair',      email:'priya.nair@enterprisehub.com',      department:'Engineering',     joiningDate:'2026-03-05', status:'Pending' },
        { id:'e5',  name:'David Williams',  email:'david.williams@enterprisehub.com',  department:'Sales',           joiningDate:'2026-03-22', status:'Onboarded' },
        { id:'e6',  name:'Fatima Al-Sayed', email:'fatima.alsayed@enterprisehub.com',  department:'Finance',         joiningDate:'2026-04-01', status:'Pending' },
        { id:'e7',  name:'Rohan Mehta',     email:'rohan.mehta@enterprisehub.com',     department:'IT Support',      joiningDate:'2026-04-15', status:'Onboarded' },
        { id:'e8',  name:'Emily Davis',     email:'emily.davis@enterprisehub.com',     department:'Marketing',       joiningDate:'2026-05-02', status:'Pending' },
        { id:'e9',  name:'Carlos Gomez',    email:'carlos.gomez@enterprisehub.com',    department:'Operations',      joiningDate:'2026-05-20', status:'Onboarded' },
        { id:'e10', name:'Ananya Reddy',    email:'ananya.reddy@enterprisehub.com',    department:'Design',          joiningDate:'2026-06-01', status:'Pending' },
        { id:'e11', name:'John Carter',     email:'john.carter@enterprisehub.com',     department:'Sales',           joiningDate:'2026-06-08', status:'Pending',   teamName:'Enterprise Sales', teamLead:'Mark Lee', manager:'Sandra Cruz', workLocation:'New York' },
        { id:'e12', name:'Emma Wilson',     email:'emma.wilson@enterprisehub.com',     department:'Marketing',       joiningDate:'2026-05-26', status:'Onboarded', teamName:'Brand & Growth', teamLead:'Lucas Meyer', manager:'Sophia Martinez', workLocation:'Remote' },
    ],
    tasks: [
        { id:'t1',  employeeName:'Priya Nair',      taskType:'Laptop Provisioning', assignedTo:'IT Support', status:'In Progress' },
        { id:'t2',  employeeName:'Fatima Al-Sayed', taskType:'VPN Access',          assignedTo:'Security',   status:'Pending' },
        { id:'t3',  employeeName:'Emily Davis',     taskType:'HR Orientation',      assignedTo:'HR Team',    status:'Completed' },
        { id:'t4',  employeeName:'Ananya Reddy',    taskType:'ID Card Issuance',    assignedTo:'Facilities', status:'Pending' },
        { id:'t5',  employeeName:'Aarav Sharma',    taskType:'Payroll Setup',       assignedTo:'Finance',    status:'Completed' },
        { id:'t6',  employeeName:'Rohan Mehta',     taskType:'Email Account Setup', assignedTo:'IT Support', status:'In Progress' },
        { id:'t7',  employeeName:'David Williams',  taskType:'Benefits Enrollment', assignedTo:'HR Team',    status:'Pending' },
        // ── Sarah Johnson's own onboarding tasks (demo employee #1 — almost done) ──
        { id:'t8',  employeeName:'Sarah Johnson',   taskType:'HR Orientation',      assignedTo:'HR Team',    status:'Completed' },
        { id:'t9',  employeeName:'Sarah Johnson',   taskType:'Payroll Setup',       assignedTo:'Finance',    status:'Completed' },
        { id:'t10', employeeName:'Sarah Johnson',   taskType:'Laptop Provisioning', assignedTo:'IT Support', status:'Completed' },
        { id:'t11', employeeName:'Sarah Johnson',   taskType:'Benefits Enrollment', assignedTo:'HR Team',    status:'In Progress' },
        // ── John Carter's own onboarding tasks (demo employee #2 — in progress) ──
        { id:'t12', employeeName:'John Carter',     taskType:'Laptop Provisioning', assignedTo:'IT Support', status:'Completed' },
        { id:'t13', employeeName:'John Carter',     taskType:'VPN Access',          assignedTo:'Security',   status:'In Progress' },
        { id:'t14', employeeName:'John Carter',     taskType:'ID Card Issuance',    assignedTo:'Facilities', status:'Pending' },
        { id:'t15', employeeName:'John Carter',     taskType:'HR Orientation',      assignedTo:'HR Team',    status:'Pending' },
        // ── Emma Wilson's own onboarding tasks (demo employee #3 — fully onboarded) ──
        { id:'t16', employeeName:'Emma Wilson',     taskType:'HR Orientation',      assignedTo:'HR Team',    status:'Completed' },
        { id:'t17', employeeName:'Emma Wilson',     taskType:'Laptop Provisioning', assignedTo:'IT Support', status:'Completed' },
        { id:'t18', employeeName:'Emma Wilson',     taskType:'Email Account Setup', assignedTo:'IT Support', status:'Completed' },
        { id:'t19', employeeName:'Emma Wilson',     taskType:'Benefits Enrollment', assignedTo:'HR Team',    status:'In Progress' },
    ],
    feedback: [
        { employee:'Sarah Johnson', category:'Onboarding Experience', rating:5, comments:'Smooth onboarding — loved the welcome kit!',          submittedOn:'2026-05-28' },
        { employee:'Michael Chen',  category:'IT Support',            rating:4, comments:'Laptop ready on day one; VPN took a little while.',     submittedOn:'2026-05-30' },
        { employee:'Priya Nair',    category:'Work Environment',      rating:5, comments:'Great team culture and mentorship.',                    submittedOn:'2026-06-02' },
        { employee:'Carlos Gomez',  category:'Management',            rating:4, comments:'Clear goals from my manager in week one.',              submittedOn:'2026-06-04' },
        { employee:'Emily Davis',   category:'Facilities',            rating:3, comments:'Desk setup was delayed by a day.',                      submittedOn:'2026-06-06' },
        { employee:'John Carter',   category:'IT Support',            rating:4, comments:'Laptop arrived quickly; still waiting on VPN access.',  submittedOn:'2026-06-10' },
        { employee:'Emma Wilson',   category:'Onboarding Experience', rating:5, comments:'Buddy programme made my first week really easy.',       submittedOn:'2026-06-09' },
    ],
    projects: [
        { sys_id:'p1', project_name:'HR Portal Revamp',      client_name:'Internal',  project_manager:'Sarah Johnson', status:'Development' },
        { sys_id:'p2', project_name:'Onboarding Automation', client_name:'Acme Corp', project_manager:'Michael Chen',  status:'Testing' },
        { sys_id:'p3', project_name:'Payroll Integration',   client_name:'FinServe',  project_manager:'Aarav Sharma',  status:'Planning' },
        { sys_id:'p4', project_name:'Mobile App Launch',     client_name:'Beta Inc',  project_manager:'Ananya Reddy',  status:'Development' },
    ],
    sprintTasks: [
        { sys_id:'s1', task_name:'Database Schema',    assigned_team:'Engineering', progress:100, delay_risk:'Low',    sla_status:'Met' },
        { sys_id:'s2', task_name:'REST API Layer',     assigned_team:'Engineering', progress:65,  delay_risk:'Medium', sla_status:'In Progress' },
        { sys_id:'s3', task_name:'Frontend Dashboard', assigned_team:'Design',      progress:40,  delay_risk:'High',   sla_status:'Breached' },
        { sys_id:'s4', task_name:'SSO Integration',    assigned_team:'Security',    progress:80,  delay_risk:'Low',    sla_status:'Met' },
        { sys_id:'s5', task_name:'Reporting Module',   assigned_team:'Product',     progress:25,  delay_risk:'High',   sla_status:'In Progress' },
    ],
    menu: [
        { id:'m1', itemName:'Grilled Chicken Salad', category:'Lunch',    calories:450, available:true },
        { id:'m2', itemName:'Vegan Buddha Bowl',     category:'Lunch',    calories:380, available:true },
        { id:'m3', itemName:'Paneer Tikka Wrap',     category:'Snack',    calories:340, available:true },
        { id:'m4', itemName:'Caesar Wrap',           category:'Snack',    calories:320, available:false },
        { id:'m5', itemName:'Fresh Fruit Smoothie',  category:'Beverage', calories:210, available:true },
    ],
    notifications: [
        { sys_id:'n1', message:'New hire Priya Nair starts Monday — provisioning assigned to IT Support.', recipient:'ALL',      created:'2026-06-08', read:false },
        { sys_id:'n2', message:'SLA breach detected on the "Frontend Dashboard" sprint task.',             recipient:'Managers', created:'2026-06-07', read:false },
        { sys_id:'n3', message:'Payroll setup completed for Aarav Sharma.',                                recipient:'ALL',      created:'2026-06-06', read:true },
    ],
    // ── Cafeteria: rotating weekly lunch menus (Mon–Fri) ──────────────────────
    // Four themed weeks. The active week is picked by ISO week number, so it
    // rotates automatically every real calendar week and cycles through all four.
    lunchWeeks: [
        { // Week 1 — Global Flavors
            theme: 'Global Flavors',
            days: {
                Monday:    { main:'Grilled Chicken & Herb Rice', side:'Garden Salad',         dessert:'Fruit Cup',         drink:'Iced Lemon Tea',  kcal:640, veg:false },
                Tuesday:   { main:'Paneer Butter Masala & Naan', side:'Cucumber Raita',       dessert:'Gulab Jamun',       drink:'Mango Lassi',     kcal:720, veg:true  },
                Wednesday: { main:'Spaghetti Bolognese',         side:'Garlic Bread',         dessert:'Tiramisu Cup',      drink:'Sparkling Water', kcal:710, veg:false },
                Thursday:  { main:'Teriyaki Tofu Bowl',          side:'Edamame',              dessert:'Mochi',             drink:'Green Tea',       kcal:560, veg:true  },
                Friday:    { main:'Fish & Chips',                side:'Coleslaw',             dessert:'Brownie',           drink:'Cold Brew',       kcal:780, veg:false },
            }
        },
        { // Week 2 — Mediterranean
            theme: 'Mediterranean',
            days: {
                Monday:    { main:'Falafel & Hummus Platter',    side:'Tabbouleh',            dessert:'Baklava',           drink:'Mint Lemonade',   kcal:600, veg:true  },
                Tuesday:   { main:'Grilled Salmon & Couscous',   side:'Greek Salad',          dessert:'Yogurt & Honey',    drink:'Iced Tea',        kcal:680, veg:false },
                Wednesday: { main:'Margherita Pizza',            side:'Caprese Salad',        dessert:'Lemon Sorbet',      drink:'Sparkling Water', kcal:730, veg:true  },
                Thursday:  { main:'Chicken Shawarma Wrap',       side:'Fattoush',             dessert:'Fruit Cup',         drink:'Ayran',           kcal:660, veg:false },
                Friday:    { main:'Veg Moussaka',                side:'Pita & Tzatziki',      dessert:'Baklava',           drink:'Cold Brew',       kcal:620, veg:true  },
            }
        },
        { // Week 3 — Asian Fusion
            theme: 'Asian Fusion',
            days: {
                Monday:    { main:'Chicken Pad Thai',            side:'Spring Rolls',         dessert:'Coconut Pudding',   drink:'Thai Iced Tea',   kcal:690, veg:false },
                Tuesday:   { main:'Veg Hakka Noodles',           side:'Manchurian',           dessert:'Fruit Cup',         drink:'Jasmine Tea',     kcal:640, veg:true  },
                Wednesday: { main:'Korean Bibimbap',             side:'Kimchi',               dessert:'Mochi',             drink:'Barley Tea',      kcal:700, veg:false },
                Thursday:  { main:'Tofu Ramen',                  side:'Seaweed Salad',        dessert:'Mango Sticky Rice', drink:'Green Tea',       kcal:610, veg:true  },
                Friday:    { main:'Sushi & Tempura Combo',       side:'Miso Soup',            dessert:'Matcha Cheesecake', drink:'Cold Brew',       kcal:750, veg:false },
            }
        },
        { // Week 4 — Comfort Classics
            theme: 'Comfort Classics',
            days: {
                Monday:    { main:'Butter Chicken & Jeera Rice', side:'Mixed Veg',            dessert:'Rice Pudding',      drink:'Buttermilk',      kcal:730, veg:false },
                Tuesday:   { main:'Veggie Burger & Fries',       side:'Onion Rings',          dessert:'Chocolate Chip Cookie', drink:'Lemonade',    kcal:760, veg:true  },
                Wednesday: { main:'Roast Chicken & Mash',        side:'Steamed Greens',       dessert:'Apple Pie',         drink:'Iced Tea',        kcal:700, veg:false },
                Thursday:  { main:'Rajma Chawal',                side:'Papad & Salad',        dessert:'Fruit Cup',         drink:'Chaas',           kcal:650, veg:true  },
                Friday:    { main:'BBQ Pulled Pork Sandwich',    side:'Sweet Potato Fries',   dessert:'Cheesecake',        drink:'Cold Brew',       kcal:790, veg:false },
            }
        },
    ],
};

/* ── Role helpers (RBAC content filtering) ───────────────────────────────────
 * Admin/Manager (role 'hr' or 'manager') see ALL data across the company.
 * A regular employee (role 'employee') only ever sees their OWN records. The
 * authoritative role comes from the signed JWT (verified in index.html). */
function currentRole() { return (localStorage.getItem('userRole') || 'employee').toLowerCase(); }
function isAdminRole() { const r = currentRole(); return r === 'hr' || r === 'manager'; }
function myName()      { return localStorage.getItem('userName') || ''; }
function myRecord()    { return DEMO.employees.find(e => e.name === myName()) || null; }
function myEmail()     { const r = myRecord(); return (r && r.email) || `${myName().toLowerCase().replace(/\s+/g, '.')}@enterprisehub.com`; }

// Summary of the logged-in employee's own onboarding tasks (for personal views).
function personalTaskStats(name) {
    const t = DEMO.tasks.filter(x => x.employeeName === name);
    const completed  = t.filter(x => x.status === 'Completed').length;
    const inProgress = t.filter(x => x.status === 'In Progress').length;
    const pending    = t.filter(x => x.status === 'Pending').length;
    const progress   = t.length ? Math.round((completed / t.length) * 100) : 0;
    return { tasks: t, total: t.length, completed, inProgress, pending, progress };
}

// Fetch the logged-in employee's REAL onboarding data (status/progress/tasks) from the
// backend; fall back to the demo dataset for demo accounts not in the live instance.
// Returns one normalized shape so the employee views always show accurate values.
async function getMyOnboarding() {
    try {
        const r = await apiFetch(`${API_BASE}/employees/me`);
        if (r.ok) {
            const d = await r.json();
            if (d && d.found) {
                const lc = s => String(s || '').toLowerCase();
                const tasks = (d.tasks || []).map(t => ({ taskType: t.taskType, assignedTo: t.assignedTo, status: prettyStatus(t.status) }));
                return {
                    real: true,
                    profile: d.profile,
                    tasks,
                    total: d.total, completed: d.completed,
                    inProgress: (d.tasks || []).filter(t => ['in progress', 'in_progress'].includes(lc(t.status))).length,
                    pending: (d.tasks || []).filter(t => lc(t.status) === 'pending').length,
                    progress: d.progress
                };
            }
        }
    } catch (e) { /* fall through to demo */ }
    const s = personalTaskStats(myName());
    const rec = myRecord() || { name: myName(), email: myEmail(), department: '—', joiningDate: '—', status: 'Pending' };
    return { real: false, profile: rec, tasks: s.tasks, total: s.total, completed: s.completed, inProgress: s.inProgress, pending: s.pending, progress: s.progress };
}

// Reusable "this is admin-only" panel so restricted modules stay visible in the
// nav (per spec: all 11 modules visible) but show role-appropriate content.
function adminOnlyPanel(icon, title, message) {
    return `
        <div class="topbar fade-in"><h2><i class="fa-solid ${icon}" style="color:var(--primary);"></i> ${title}</h2></div>
        <div class="card fade-in" style="max-width:560px;margin:32px auto;text-align:center;padding:48px 32px;">
            <div style="font-size:2.4rem;color:var(--primary);margin-bottom:14px;"><i class="fa-solid fa-lock"></i></div>
            <h3 style="margin:0 0 10px;">Administrator access required</h3>
            <p style="color:var(--text-muted);margin:0;">${message}</p>
        </div>`;
}

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
// ServiceNow stores status choices lowercase (onboarded/pending/completed). Title-case
// them for display (e.g. 'onboarded' -> 'Onboarded', 'in_progress' -> 'In Progress').
function prettyStatus(v) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return 'Pending';
    return s.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
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
    // Never render a raw object as "[object Object]" — coerce to a readable string.
    if (message && typeof message === 'object') {
        message = message.message || message.error || message.reply
            || (Array.isArray(message) ? message.join(', ') : '') || JSON.stringify(message);
    }
    if (message == null) message = '';
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
    maybeAutoTour();   // first-login guided tour for employees
});

/* ── First-Login Guided Tour (employees) ──────────────────────────────────── */
const TOUR_STEPS = [
    { sel: '[data-view="employees"]', title: 'My Profile', desc: 'View your onboarding status, progress and personal details here.' },
    { sel: '[data-view="tasks"]', title: 'Employee Tasks', desc: 'See and complete your onboarding checklist — click Complete on each task.' },
    { sel: '[data-view="issue"]', title: 'Report Issue', desc: 'Raise an IT or HR ticket whenever something needs attention.' },
    { sel: '[data-view="feedback"]', title: 'Feedback', desc: 'Share your onboarding experience with the People team.' },
    { sel: '#chat-toggle', title: 'AI Assistant', desc: 'Ask the assistant for help any time — try typing “help”.' }
];
let _tourIdx = 0;
function tourKey() { return 'ewh.tour.' + (localStorage.getItem('userName') || 'anon'); }
function startTour() {
    _tourIdx = 0;
    let ov = document.getElementById('tour-overlay');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'tour-overlay'; ov.className = 'tour-overlay';
        ov.innerHTML = '<div class="tour-spot" id="tour-spot"></div><div class="tour-tip" id="tour-tip"></div>';
        document.body.appendChild(ov);
    }
    ov.style.display = 'block';
    window.addEventListener('resize', renderTourStep);
    renderTourStep();
}
function endTour() {
    const ov = document.getElementById('tour-overlay'); if (ov) ov.style.display = 'none';
    window.removeEventListener('resize', renderTourStep);
    try { localStorage.setItem(tourKey(), '1'); } catch (e) {}
}
function renderTourStep() {
    const step = TOUR_STEPS[_tourIdx];
    const el = document.querySelector(step.sel);
    if (!el) { if (_tourIdx < TOUR_STEPS.length - 1) { _tourIdx++; return renderTourStep(); } return endTour(); }
    try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    const r = el.getBoundingClientRect();
    const pad = 6;
    const spot = document.getElementById('tour-spot');
    spot.style.left = (r.left - pad) + 'px'; spot.style.top = (r.top - pad) + 'px';
    spot.style.width = (r.width + pad * 2) + 'px'; spot.style.height = (r.height + pad * 2) + 'px';
    const last = _tourIdx === TOUR_STEPS.length - 1;
    const tip = document.getElementById('tour-tip');
    tip.innerHTML = `<h4>${step.title}</h4><p>${step.desc}</p>
        <div class="tour-actions"><span class="tour-count">${_tourIdx + 1} of ${TOUR_STEPS.length}</span>
        <div class="tour-btns"><button class="btn btn-outline" id="tour-skip">Skip</button>
        <button class="btn btn-primary" id="tour-next">${last ? 'Finish' : 'Next'}</button></div></div>`;
    const tipW = 300;
    let tx = r.right + 16, ty = Math.max(12, r.top);
    if (tx + tipW > window.innerWidth) { tx = Math.max(12, Math.min(r.left, window.innerWidth - tipW - 12)); ty = r.bottom + 12; }
    tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
    document.getElementById('tour-skip').onclick = endTour;
    document.getElementById('tour-next').onclick = () => { if (last) endTour(); else { _tourIdx++; renderTourStep(); } };
}
function maybeAutoTour() {
    // New employees see the tour automatically on first login; existing users (who
    // already completed/skipped it) and admins/managers do not.
    if (currentRole() === 'employee' && !localStorage.getItem(tourKey())) setTimeout(startTour, 900);
}

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
        // Same-origin WS endpoint (uses the page's host+port, so it works behind HTTPS in prod).
        _liveSocket = new WebSocket(`${proto}://${location.host}/ws`);
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
    let count = 0;
    try {
        const res = await apiFetch(`${API_BASE}/notifications/unread-count`);
        if (res.ok) { const d = await res.json(); count = d.count || 0; }
    } catch (e) { /* ignore — fall back to demo count below */ }
    if (!count) count = DEMO.notifications.filter(n => !n.read).length;   // demo fallback
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

async function loadNotifList() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    list.innerHTML = '<div class="notif-empty">Loading…</div>';
    try {
        const res = await apiFetch(`${API_BASE}/notifications`);
        let items = res.ok ? await res.json() : [];
        if (!Array.isArray(items) || !items.length) items = DEMO.notifications;
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
    // Regular employees get a personalised dashboard (their own onboarding only).
    if (!isAdminRole()) return renderEmployeeOverview();
    let stats = { totalEmployees: 0, onboardedEmployees: 0, pendingTasks: 0 };
    let perf  = { priority: { High: 0, Medium: 0, Low: 0 }, sla: { Met: 0, Breached: 0, InProgress: 0 }, totalTasks: 0 };
    try { const r = await apiFetch(`${API_BASE}/stats`);          if (r.ok) { const d = await r.json(); if (!d.error) stats = d; } } catch(e){}
    try { const r = await apiFetch(`${API_BASE}/stats/employee`); if (r.ok) { const d = await r.json(); if (!d.error) perf  = d; } } catch(e){}
    // Fall back to rich demo data so the dashboard always looks populated.
    if (!stats || !stats.totalEmployees) stats = DEMO.stats;
    if (!perf || !perf.totalTasks) perf = DEMO.perf;

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

// ── EMPLOYEE OVERVIEW (personal dashboard — own onboarding only) ────────────
async function renderEmployeeOverview() {
    const m = await getMyOnboarding();
    const s = m;                       // {total,completed,inProgress,pending,progress,tasks}
    const rec = m.profile;
    const isDark = document.body.classList.contains('dark-theme');
    const tc = isDark ? '#9ca3af' : '#6b7280';
    const nextTask = (s.tasks || []).find(t => String(t.status).toLowerCase() !== 'completed');

    viewContainer.innerHTML = `
        <div class="topbar fade-in">
            <h2><i class="fa-solid fa-house-user" style="color:var(--primary);"></i> Welcome back, ${myName().split(' ')[0]}</h2>
            <span style="color:var(--text-muted);font-size:0.85rem;"><i class="fa-solid fa-circle" style="color:#10b981;font-size:0.5rem;margin-right:6px;"></i>Your onboarding journey</span>
        </div>
        <div class="dashboard-grid fade-in">
            <div class="card stat-card"><div class="stat-icon primary"><i class="fa-solid fa-list-check"></i></div><div class="stat-details"><h3>${s.total}</h3><p>My Tasks</p></div></div>
            <div class="card stat-card"><div class="stat-icon success"><i class="fa-solid fa-circle-check"></i></div><div class="stat-details"><h3>${s.completed}</h3><p>Completed</p></div></div>
            <div class="card stat-card"><div class="stat-icon warning"><i class="fa-solid fa-spinner"></i></div><div class="stat-details"><h3>${s.inProgress}</h3><p>In Progress</p></div></div>
            <div class="card stat-card"><div class="stat-icon" style="background:rgba(239,68,68,0.1);color:var(--danger);"><i class="fa-solid fa-hourglass-half"></i></div><div class="stat-details"><h3>${s.pending}</h3><p>Pending</p></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:24px;margin-bottom:24px;" class="fade-in">
            <div class="card" style="padding:24px;">
                <h3 style="margin-bottom:16px;font-size:1rem;font-weight:600;"><i class="fa-solid fa-gauge-high" style="color:var(--primary);margin-right:8px;"></i>My Onboarding Progress</h3>
                <div style="display:flex;align-items:center;gap:18px;">
                    <div style="font-size:2.4rem;font-weight:700;color:var(--primary);">${s.progress}%</div>
                    <div style="flex:1;"><div class="progress-container" style="height:14px;"><div class="progress-bar" style="width:${s.progress}%"></div></div>
                    <p style="color:var(--text-muted);font-size:0.85rem;margin:10px 0 0;">${s.completed} of ${s.total} tasks completed${nextTask ? ` · next up: <strong>${nextTask.taskType}</strong>` : ' · all done! 🎉'}</p></div>
                </div>
            </div>
            <div class="card" style="padding:24px;">
                <h3 style="margin-bottom:16px;font-size:1rem;font-weight:600;"><i class="fa-solid fa-chart-pie" style="color:var(--primary);margin-right:8px;"></i>Task Breakdown</h3>
                <canvas id="myTaskChart" height="170"></canvas>
            </div>
        </div>
        <div class="card fade-in" style="padding:24px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
                <h3 style="margin:0;"><i class="fa-solid fa-people-group" style="color:var(--primary);margin-right:8px;"></i>My Team Information</h3>
                <span class="status-badge ${String(rec.status||'').toLowerCase()==='onboarded'?'status-onboarded':'status-pending'}">${trStatus(prettyStatus(rec.status))}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;">
                <div><div style="color:var(--text-muted);font-size:0.78rem;">Department</div><div>${fmtEmpValue('department', rec.department) || '—'}</div></div>
                <div><div style="color:var(--text-muted);font-size:0.78rem;">Team Name</div><div>${rec.teamName || '—'}</div></div>
                <div><div style="color:var(--text-muted);font-size:0.78rem;">Team Lead</div><div>${rec.teamLead || '—'}</div></div>
                <div><div style="color:var(--text-muted);font-size:0.78rem;">Manager</div><div>${rec.manager || '—'}</div></div>
                <div><div style="color:var(--text-muted);font-size:0.78rem;">Work Location</div><div>${rec.workLocation || '—'}</div></div>
                <div><div style="color:var(--text-muted);font-size:0.78rem;">Email</div><div>${rec.email || '—'}</div></div>
            </div>
            <p style="color:var(--text-muted);font-size:0.8rem;margin:14px 0 0;"><i class="fa-solid fa-lock"></i> View only — your team details are managed by HR.</p>
        </div>`;

    try {
        new Chart(document.getElementById('myTaskChart'), {
            type:'doughnut',
            data:{ labels:['Completed','In Progress','Pending'], datasets:[{ data:[s.completed, s.inProgress, s.pending], backgroundColor:['#10b981','#f59e0b','#ef4444'], borderWidth:0 }] },
            options:{ plugins:{ legend:{ labels:{ color:tc } } }, cutout:'62%' }
        });
    } catch(e) { console.error('Chart error (myTask):', e); }
}

// ── HR DASHBOARD ────────────────────────────────────────────────────────────
let _emps = [];
let _empFilter = { predicate: () => true, getState: () => [], setState: () => {} };
const _hrState = { q: '', sortKey: '', sortDir: 1 };

// Single source of truth for the employee table — the header, the rows, AND the filter
// field list all derive from this, so adding a column here auto-syncs everywhere.
const EMP_DEPT_LABELS = { it: 'IT', hr: 'HR', security: 'Security', sales: 'Sales', marketing: 'Marketing', finance: 'Finance', engineering: 'Engineering', product: 'Product', design: 'Design', operations: 'Operations', facility: 'Facilities', facilities: 'Facilities' };
function fmtEmpValue(key, v) {
    if (key === 'status') return prettyStatus(v);
    if (key === 'department') { const k = String(v || '').toLowerCase(); return EMP_DEPT_LABELS[k] || prettyStatus(v); }
    return v == null ? '' : v;
}
const EMP_COLUMNS = [
    { key: 'name', label: 'Name', type: 'text', render: (e) => `<div style="display:flex;align-items:center;gap:12px;"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(e.name || '')}&background=random&color=fff&size=32" style="border-radius:50%;">${e.name || ''}</div>` },
    { key: 'department', label: 'Department', type: 'choice', render: (e) => fmtEmpValue('department', e.department) },
    { key: 'joiningDate', label: 'Joining Date', type: 'date', render: (e) => e.joiningDate || '' },
    { key: 'status', label: 'Status', type: 'choice', render: (e) => { const on = String(e.status || '').toLowerCase() === 'onboarded'; return `<span class="status-badge ${on ? 'status-onboarded' : 'status-pending'}">${trStatus(prettyStatus(e.status))}</span>`; } }
];
// Live choice values pulled straight from the loaded employee records.
const empChoices = (key) => [...new Set(_emps.map(e => e[key]).filter(v => v != null && String(v).trim() !== ''))];

// ── Filter Pinning (persist HR filter conditions across refreshes) ──
const HR_FILTER_KEY = 'ewh.hrFilter';
function updateHrPinBtn() {
    const b = document.getElementById('pin-filter-btn'); if (!b) return;
    const on = !!localStorage.getItem(HR_FILTER_KEY);
    b.innerHTML = `<i class="fa-solid fa-thumbtack"></i> ${on ? 'Unpin Filters' : 'Pin Filters'}`;
    b.classList.toggle('btn-success', on);
}
function toggleHrFilterPin() {
    if (localStorage.getItem(HR_FILTER_KEY)) { localStorage.removeItem(HR_FILTER_KEY); showToast('Filters unpinned.', 'info'); }
    else { localStorage.setItem(HR_FILTER_KEY, JSON.stringify(_empFilter.getState())); showToast('Filters pinned — they will reapply after refresh.', 'success'); }
    updateHrPinBtn();
}

async function renderHRDashboard() {
    // Regular employees cannot see other employees — show their own profile only.
    if (!isAdminRole()) return renderMyProfile();
    try {
        const res = await apiFetch(`${API_BASE}/employees`);
        _emps = res.ok ? await res.json() : [];
        if (!Array.isArray(_emps)) _emps = [];
    } catch (e) { _emps = []; }
    if (!_emps.length) _emps = DEMO.employees;   // demo fallback so the table is never empty

    // Only HR can approve onboarding (the backend endpoint is HR-only).
    const canApprove = currentRole() === 'hr';
    _hrState.q = ''; _hrState.sortKey = ''; _hrState.sortDir = 1;
    viewContainer.innerHTML = `
        <div class="topbar fade-in">
            <h2><i class="fa-solid fa-users" style="color:var(--primary);"></i> <span data-i18n="hrDashboard">HR Dashboard</span></h2>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                ${canApprove ? '<button id="approve-selected-btn" class="btn btn-success" onclick="approveSelectedEmployee()"><i class="fa-solid fa-user-check"></i> Approve Selected</button>' : ''}
                <button class="btn btn-primary" onclick="showAddEmployeeForm()"><i class="fa-solid fa-user-plus"></i> <span data-i18n="newHire">New Hire</span></button>
            </div>
        </div>
        ${canApprove ? '<p class="fade-in" style="color:var(--text-muted);font-size:0.85rem;margin:-6px 0 14px;"><i class="fa-solid fa-circle-info"></i> Select one pending employee, then click <strong>Approve Selected</strong> to complete their onboarding tasks and mark them Onboarded.</p>' : ''}
        <div id="form-container"></div>
        <div class="toolbar fade-in">
            <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="emp-search" class="form-control" data-i18n="quickSearch" placeholder="Quick search…"></div>
            <button id="pin-filter-btn" class="btn btn-outline" onclick="toggleHrFilterPin()"><i class="fa-solid fa-thumbtack"></i> Pin Filters</button>
        </div>
        <div id="emp-filter" class="fade-in"></div>
        <div class="table-container fade-in"><table class="data-table">
            <thead><tr>
                ${canApprove ? '<th style="width:84px;text-align:center;">Approve</th>' : ''}
                ${EMP_COLUMNS.map(c => `<th class="sortable" data-key="${c.key}" data-i18n="${c.key}">${c.label}</th>`).join('')}
            </tr></thead>
            <tbody id="emp-tbody"></tbody>
        </table></div>`;

    document.getElementById('emp-search').addEventListener('input', (e) => { _hrState.q = e.target.value.toLowerCase(); renderEmpRows(); });
    // Filter field list is generated dynamically from EMP_COLUMNS (auto-syncs with the table);
    // choice values come from the live employee records.
    _empFilter = attachFilterBuilder('emp-filter', EMP_COLUMNS, renderEmpRows, { choicesFor: empChoices, fmtValue: fmtEmpValue });
    // Filter Pinning — reapply saved conditions after a refresh.
    try { const pinned = localStorage.getItem(HR_FILTER_KEY); if (pinned) _empFilter.setState(JSON.parse(pinned)); } catch (e) { /* ignore corrupt pin */ }
    updateHrPinBtn();
    document.querySelectorAll('.data-table th.sortable').forEach(th => th.addEventListener('click', () => {
        const k = th.dataset.key;
        if (_hrState.sortKey === k) _hrState.sortDir *= -1; else { _hrState.sortKey = k; _hrState.sortDir = 1; }
        setSortArrows(_hrState.sortKey, _hrState.sortDir);
        renderEmpRows();
    }));
    renderEmpRows();
}

// ── MY PROFILE (employee view of the "Employees" module — own record only) ───
async function renderMyProfile() {
    const m = await getMyOnboarding();
    const rec = m.profile;
    const s = m;
    const sc = String(rec.status || '').toLowerCase() === 'onboarded' ? 'status-onboarded' : 'status-pending';
    viewContainer.innerHTML = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-id-badge" style="color:var(--primary);"></i> My Profile</h2></div>
        <div class="card fade-in" style="max-width:620px;margin:0 auto;padding:32px;">
            <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(rec.name)}&background=0e7490&color=fff&size=72" style="border-radius:50%;width:72px;height:72px;">
                <div>
                    <h3 style="margin:0 0 4px;font-size:1.3rem;">${rec.name}</h3>
                    <span class="status-badge ${sc}">${trStatus(prettyStatus(rec.status))}</span>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
                <div><div style="color:var(--text-muted);font-size:0.8rem;">Email</div><div>${rec.email}</div></div>
                <div><div style="color:var(--text-muted);font-size:0.8rem;">Department</div><div>${rec.department}</div></div>
                <div><div style="color:var(--text-muted);font-size:0.8rem;">Joining Date</div><div>${rec.joiningDate}</div></div>
                <div><div style="color:var(--text-muted);font-size:0.8rem;">Onboarding Progress</div><div>${s.progress}% (${s.completed}/${s.total} tasks)</div></div>
            </div>
            <div style="margin-top:22px;"><div class="progress-container" style="height:12px;"><div class="progress-bar" style="width:${s.progress}%"></div></div></div>
            <p style="color:var(--text-muted);font-size:0.85rem;margin:18px 0 0;"><i class="fa-solid fa-circle-info"></i> You can only view your own profile. Company directory is available to administrators.</p>
        </div>`;
}

function renderEmpRows() {
    const canApprove = currentRole() === 'hr';
    let rows = _emps.filter(e => {
        if (_hrState.q && !`${e.name} ${e.department} ${e.status}`.toLowerCase().includes(_hrState.q)) return false;
        return _empFilter.predicate(e);
    });
    rows = sortRows(rows, _hrState.sortKey, _hrState.sortDir);
    const tbody = document.getElementById('emp-tbody');
    if (!tbody) return;
    const colspan = EMP_COLUMNS.length + (canApprove ? 1 : 0);
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;color:var(--text-muted);padding:28px;">No matching employees.</td></tr>`; return; }
    tbody.innerHTML = rows.map(emp => {
        const isOnboarded = String(emp.status || '').toLowerCase() === 'onboarded';
        const selectCell = canApprove
            ? `<td style="text-align:center;">${isOnboarded
                ? '<i class="fa-solid fa-circle-check" style="color:var(--success);" title="Already onboarded"></i>'
                : `<input type="radio" name="emp-approve" value="${emp.id}" title="Select to approve onboarding">`}</td>`
            : '';
        // Cells generated from the shared column config (stays in sync with the header/filter).
        const cells = EMP_COLUMNS.map(c => `<td>${c.render(emp)}</td>`).join('');
        return `<tr>${selectCell}${cells}</tr>`;
    }).join('');
}

// HR-only: approve onboarding for the selected pending employee (one at a time).
async function approveSelectedEmployee() {
    const sel = document.querySelector('input[name="emp-approve"]:checked');
    if (!sel) { showToast('Select a pending employee first.', 'error'); return; }
    const id = sel.value;
    const btn = document.getElementById('approve-selected-btn');
    const original = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Approving…'; }
    try {
        const res = await apiFetch(`${API_BASE}/employees/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Approval failed'); }
        const data = await res.json();
        const n = (data.completedTasks || []).length;
        showToast(`Onboarding approved — ${n} task${n === 1 ? '' : 's'} completed, employee marked Onboarded.`, 'success');
        loadView('employees');   // refresh so the row now shows Onboarded
    } catch (e) {
        showToast(e.message || 'Could not approve onboarding.', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
    }
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
                <div style="grid-column:span 2;border-top:1px solid var(--panel-border);padding-top:6px;margin-top:2px;font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">Team Information</div>
                <div class="form-group"><label>Team Name</label><input type="text" id="emp-team" class="form-control" placeholder="e.g. Application Development"></div>
                <div class="form-group"><label>Team Lead</label><input type="text" id="emp-lead" class="form-control" placeholder="e.g. Rohit Kumar"></div>
                <div class="form-group"><label>Manager</label><input type="text" id="emp-manager" class="form-control" placeholder="e.g. Priya Sharma"></div>
                <div class="form-group"><label>Work Location</label><input type="text" id="emp-location" class="form-control" placeholder="e.g. Hyderabad / Remote"></div>
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
            await apiFetch(`${API_BASE}/employees`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
                name: document.getElementById('emp-name').value,
                email: document.getElementById('emp-email').value,
                department: document.getElementById('emp-dept').value,
                joiningDate: document.getElementById('emp-date').value,
                teamName: document.getElementById('emp-team').value,
                teamLead: document.getElementById('emp-lead').value,
                manager: document.getElementById('emp-manager').value,
                workLocation: document.getElementById('emp-location').value
            }) });
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
// Operators offered per field TYPE (text / choice / date).
const OPS_BY_TYPE = {
    text:   [['contains', 'Contains'], ['starts', 'Starts With'], ['ends', 'Ends With'], ['is', 'Equals']],
    choice: [['is', 'Equals'], ['is_not', 'Not Equals']],
    date:   [['before', 'Before'], ['after', 'After'], ['is', 'Equals'], ['between', 'Between']]
};

// Type-aware, data-driven condition builder. `fields` = [{key,label,type,choices?}].
// options.choicesFor(key) supplies live choice values; options.fmtValue(key,v) labels them.
function attachFilterBuilder(mountId, fields, onChange, options = {}) {
    const mount = document.getElementById(mountId);
    if (!mount) return { predicate: () => true, getState: () => [], setState: () => {} };
    const choicesFor = options.choicesFor || (() => []);
    const fmtValue = options.fmtValue || ((k, v) => v);
    const typeOf = (key) => { const f = fields.find(x => x.key === key); return f ? (f.type || (f.choices ? 'choice' : 'text')) : 'text'; };
    const choiceList = (key) => { const f = fields.find(x => x.key === key); return (f && f.choices) ? f.choices.map(c => ({ value: c, label: c })) : choicesFor(key).map(v => ({ value: v, label: fmtValue(key, v) })); };
    const operHtml = (key) => OPS_BY_TYPE[typeOf(key)].map(o => `<option value="${o[0]}">${o[1]}</option>`).join('');

    const valueControl = (key, oper) => {
        const t = typeOf(key);
        if (t === 'choice') return `<select class="form-control f-value"><option value="">-- value --</option>${choiceList(key).map(c => `<option value="${c.value}">${c.label}</option>`).join('')}</select>`;
        if (t === 'date') return oper === 'between'
            ? `<input type="date" class="form-control f-value"><input type="date" class="form-control f-value2" style="margin-top:6px;">`
            : `<input type="date" class="form-control f-value">`;
        return `<input class="form-control f-value" placeholder="-- value --">`;
    };

    const rowHtml = (c) => {
        const key = c ? c.field : '', oper = c ? c.oper : '';
        return `<div class="filter-row">
            <select class="form-control f-field"><option value="">-- choose field --</option>${fields.map(f => `<option value="${f.key}"${f.key === key ? ' selected' : ''}>${f.label}</option>`).join('')}</select>
            <select class="form-control f-oper"><option value="">-- oper --</option>${key ? operHtml(key) : ''}</select>
            ${valueControl(key, oper)}
            <button type="button" class="btn btn-outline f-remove" title="Remove condition"><i class="fa-solid fa-xmark"></i></button>
        </div>`;
    };

    mount.innerHTML = `<div class="filter-builder"><div class="filter-rows"></div>
        <button type="button" class="btn btn-outline f-add" style="margin-top:12px;"><i class="fa-solid fa-plus"></i> Add condition</button></div>`;
    const rows = mount.querySelector('.filter-rows');

    function renderRows(conds) {
        const list = (conds && conds.length) ? conds : [null];
        rows.innerHTML = list.map(rowHtml).join('');
        list.forEach((c, i) => {
            if (!c) return;
            const r = rows.children[i];
            const op = r.querySelector('.f-oper'); if (op) op.value = c.oper || '';
            const cur = r.querySelector('.f-value'); if (cur) cur.outerHTML = valueControl(c.field, c.oper);
            const v1 = r.querySelector('.f-value'); if (v1) v1.value = c.value || '';
            const v2 = r.querySelector('.f-value2'); if (v2) v2.value = c.value2 || '';
        });
    }
    renderRows([null]);

    mount.addEventListener('input', (e) => { if (e.target.classList.contains('f-value') || e.target.classList.contains('f-value2')) onChange(); });
    mount.addEventListener('change', (e) => {
        const row = e.target.closest('.filter-row');
        if (e.target.classList.contains('f-field')) {
            row.querySelector('.f-oper').innerHTML = `<option value="">-- oper --</option>${operHtml(e.target.value)}`;
            const v2 = row.querySelector('.f-value2'); if (v2) v2.remove();
            const cur = row.querySelector('.f-value'); if (cur) cur.outerHTML = valueControl(e.target.value, '');
        }
        if (e.target.classList.contains('f-oper')) {
            const key = row.querySelector('.f-field').value;
            if (typeOf(key) === 'date') {
                const v2 = row.querySelector('.f-value2'); if (v2) v2.remove();
                const cur = row.querySelector('.f-value'); if (cur) cur.outerHTML = valueControl(key, e.target.value);
            }
        }
        onChange();
    });
    mount.addEventListener('click', (e) => {
        if (e.target.closest('.f-add')) { rows.insertAdjacentHTML('beforeend', rowHtml(null)); }
        else if (e.target.closest('.f-remove')) {
            const r = e.target.closest('.filter-row');
            if (rows.querySelectorAll('.filter-row').length > 1) r.remove(); else renderRows([null]);
            onChange();
        }
    });

    function getState() {
        return [...rows.querySelectorAll('.filter-row')].map(r => ({
            field: r.querySelector('.f-field').value,
            oper: r.querySelector('.f-oper') ? r.querySelector('.f-oper').value : '',
            value: r.querySelector('.f-value') ? r.querySelector('.f-value').value : '',
            value2: r.querySelector('.f-value2') ? r.querySelector('.f-value2').value : ''
        })).filter(c => c.field && c.oper);
    }
    function setState(conds) { renderRows(conds && conds.length ? conds : [null]); }

    function predicate(item) {
        const conds = getState().filter(c => c.value !== '' || c.oper === 'between');
        return conds.every(c => {
            if (typeOf(c.field) === 'date') {
                const iv = String(item[c.field] || ''); const a = String(c.value || ''); const b = String(c.value2 || '');
                if (!iv) return false;
                switch (c.oper) {
                    case 'before': return iv < a;
                    case 'after': return iv > a;
                    case 'is': return iv === a;
                    case 'between': return (!a || iv >= a) && (!b || iv <= b);
                    default: return true;
                }
            }
            const v = String(item[c.field] ?? '').toLowerCase(); const cv = String(c.value || '').toLowerCase();
            switch (c.oper) {
                case 'is': return v === cv;
                case 'is_not': return v !== cv;
                case 'contains': return v.includes(cv);
                case 'starts': return v.startsWith(cv);
                case 'ends': return v.endsWith(cv);
                default: return true;
            }
        });
    }
    return { predicate, getState, setState };
}

// ── EMPLOYEE TASKS ──────────────────────────────────────────────────────────
let _tasks = [];
let _taskFilter = { predicate: () => true };
const _taskState = { q: '', sortKey: '', sortDir: 1 };

async function renderEmployeeTasks() {
    if (!isAdminRole()) {
        // OWNERSHIP: employees get ONLY their own tasks from the server (/employees/me,
        // which queries `employee=<their record id>`). They never query /tasks (403).
        const m = await getMyOnboarding();
        _tasks = (m.tasks || []).map(t => ({ id: t.id || '', employeeName: m.profile.name, taskType: t.taskType, assignedTo: t.assignedTo, status: t.status }));
    } else {
        try {
            const r = await apiFetch(`${API_BASE}/tasks`);
            _tasks = r.ok ? await r.json() : [];
            if (!Array.isArray(_tasks)) _tasks = [];
        } catch (e) { _tasks = []; }
        if (!_tasks.length) _tasks = DEMO.tasks;   // demo fallback so the admin table is never empty
    }

    const tasksTitle = isAdminRole() ? 'Onboarding Tasks — All Employees' : 'My Onboarding Tasks';
    _taskState.q = ''; _taskState.status = 'All'; _taskState.sortKey = ''; _taskState.sortDir = 1;
    viewContainer.innerHTML = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-list-check" style="color:var(--primary);"></i> ${tasksTitle}</h2></div>
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
        { key: 'assignedTo', label: 'Assigned To' },
        { key: 'status', label: 'Status', choices: ['Completed', 'In Progress', 'Pending'] }
    ], renderTaskRows);
    document.querySelectorAll('.data-table th.sortable').forEach(th => th.addEventListener('click', () => {
        const k = th.dataset.key;
        if (_taskState.sortKey === k) _taskState.sortDir *= -1; else { _taskState.sortKey = k; _taskState.sortDir = 1; }
        setSortArrows(_taskState.sortKey, _taskState.sortDir);
        renderTaskRows();
    }));
    renderTaskRows();
}

// A task_type may be a plain string OR an object { name, description } for custom
// onboarding requirements — render it meaningfully (never "[object Object]").
function displayTaskType(v) {
    if (v == null) return '';
    if (typeof v === 'object') {
        const name = v.name || v.display_value || v.value || '';
        const desc = v.description || '';
        if (name && desc) return `${name} <span style="color:var(--text-muted);font-size:0.82em;">(${desc})</span>`;
        return name || JSON.stringify(v);
    }
    return v;
}
function taskTypeText(v) {
    if (v && typeof v === 'object') return [v.name, v.description].filter(Boolean).join(' ');
    return v == null ? '' : String(v);
}

function renderTaskRows() {
    let rows = _tasks.filter(t => {
        if (_taskState.q && !`${t.employeeName} ${taskTypeText(t.taskType)} ${t.assignedTo} ${t.status}`.toLowerCase().includes(_taskState.q)) return false;
        return _taskFilter.predicate(t);
    });
    rows = sortRows(rows, _taskState.sortKey, _taskState.sortDir);
    const tbody = document.getElementById('task-tbody');
    if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:28px;">No matching tasks.</td></tr>`; return; }
    tbody.innerHTML = rows.map(t => {
        const sc = t.status === 'Completed' ? 'status-completed' : t.status === 'In Progress' ? 'status-inprogress' : 'status-pending';
        const action = t.status !== 'Completed' ? `<button class="btn btn-primary" style="padding:6px 12px;font-size:0.85rem;" onclick="completeTask('${t.id}')">${tr('complete', 'Complete')}</button>` : `<i class="fa-solid fa-check" style="color:var(--success);"></i>`;
        return `<tr><td>${t.employeeName}</td><td>${displayTaskType(t.taskType)}</td><td>${t.assignedTo}</td><td><span class="status-badge ${sc}">${trStatus(t.status || 'Pending')}</span></td><td>${action}</td></tr>`;
    }).join('');
}

async function completeTask(id) {
    // Optimistically mark complete so the change is visible after re-render. For an
    // employee these are demo tasks (client-side); for an admin the live PUT persists.
    const demoTask = DEMO.tasks.find(t => t.id === id);
    if (demoTask) demoTask.status = 'Completed';
    try {
        await apiFetch(`${API_BASE}/tasks/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'Completed' }) });
    } catch (err) { /* demo task / no live row — optimistic UI already updated */ }
    showToast('Task marked as completed.', 'success');
    loadView('tasks');
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
    if (!items.length) items = DEMO.feedback;   // demo fallback
    // Regular employees only see the feedback they submitted themselves; fall back to
    // their own demo feedback if the live set has none for them (demo logins aren't live).
    if (!isManager) {
        let mine = items.filter(f => (f.employee || '') === myName());
        if (!mine.length) mine = DEMO.feedback.filter(f => (f.employee || '') === myName());
        items = mine;
    }

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
    if (!projects.length) projects = DEMO.projects;   // demo fallback
    const admin = isAdminRole();   // only admins/managers can create projects
    const newProjectBtn = admin ? `<button class="btn btn-primary" onclick="showAddProjectForm()"><i class="fa-solid fa-plus"></i> <span data-i18n="newProject">New Project</span></button>` : `<span style="color:var(--text-muted);font-size:0.82rem;"><i class="fa-solid fa-eye"></i> Read-only</span>`;
    let html = `<div class="topbar fade-in"><h2><i class="fa-solid fa-diagram-project" style="color:var(--primary);"></i> <span data-i18n="projectDeliveryDashboard">Project Delivery Dashboard</span></h2>${newProjectBtn}</div><div id="project-form-container"></div><div class="table-container fade-in"><table class="data-table"><thead><tr><th data-i18n="projectName">Project Name</th><th data-i18n="client">Client</th><th data-i18n="manager">Manager</th><th data-i18n="status">Status</th></tr></thead><tbody>`;
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
    if (!tasks.length) tasks = DEMO.sprintTasks;   // demo fallback
    const admin = isAdminRole();   // only admins/managers can update sprint progress
    const actionTh = admin ? '<th data-i18n="action">Action</th>' : '';
    let html = `<div class="topbar fade-in"><h2><i class="fa-solid fa-stopwatch" style="color:var(--primary);"></i> <span data-i18n="slaTitle">SLA Intelligence & AI Bottleneck Prediction</span></h2></div><div class="card fade-in" style="margin-bottom:24px;"><p style="color:var(--text-muted);"><strong>AI Analysis:</strong> Automatically detecting bottlenecks based on Progress % and SLA Deadlines.${admin ? '' : ' <em>(read-only)</em>'}</p></div><div class="table-container fade-in"><table class="data-table"><thead><tr><th data-i18n="taskName">Task Name</th><th data-i18n="team">Team</th><th data-i18n="progress">Progress</th><th data-i18n="slaStatus">SLA Status</th><th data-i18n="aiDelayRisk">AI Delay Risk</th>${actionTh}</tr></thead><tbody>`;
    tasks.forEach(t => {
        const rc = t.delay_risk === 'High' ? 'status-pending' : t.delay_risk === 'Low' ? 'status-completed' : 'status-inprogress';
        const sc = t.sla_status === 'Breached' ? 'status-pending' : t.sla_status === 'Met' ? 'status-completed' : 'status-inprogress';
        const actionTd = admin ? `<td><button class="btn btn-outline" style="padding:6px 12px;font-size:0.8rem;" onclick="updateSprintProgress('${t.sys_id}')">${tr('update', 'Update')}</button></td>` : '';
        html += `<tr><td><strong>${t.task_name}</strong></td><td>${t.assigned_team}</td><td><div class="progress-container"><div class="progress-bar" style="width:${t.progress}%"></div></div><span style="font-size:0.8rem;color:var(--text-muted);">${t.progress}%</span></td><td><span class="status-badge ${sc}">${trStatus(t.sla_status)}</span></td><td><span class="status-badge ${rc}">${trStatus(t.delay_risk)} ${tr('risk', 'Risk')}</span></td>${actionTd}</tr>`;
    });
    html += `</tbody></table></div>`;
    viewContainer.innerHTML = html;
}

async function updateSprintProgress(id) {
    const val = prompt('Enter new Progress % (0-100):');
    if (val !== null && val !== '') {
        const p = parseInt(val);
        if (p >= 0 && p <= 100) {
            // Optimistically update so the change shows after re-render (the SLA board
            // uses the curated demo set; a live PUT persists when a real row exists).
            const demoSprint = DEMO.sprintTasks.find(t => t.sys_id === id);
            if (demoSprint) { demoSprint.progress = p; demoSprint.sla_status = p >= 100 ? 'Met' : 'In Progress'; demoSprint.delay_risk = p < 50 ? 'High' : p < 90 ? 'Medium' : 'Low'; }
            try {
                await apiFetch(`${API_BASE}/sprint-tasks/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ progress:p }) });
            } catch (err) { /* demo row — optimistic UI already updated */ }
            showToast('Progress updated.', 'success');
            loadView('slas');
        } else { alert('Please enter a number between 0 and 100.'); }
    }
}

// ── MY PERFORMANCE ───────────────────────────────────────────────────────────
async function renderEmployeePerformance() {
    // Regular employees see performance based on their OWN onboarding tasks.
    if (!isAdminRole()) return renderMyPerformance();
    let stats = DEMO.perf, tasks = DEMO.sprintTasks;   // demo fallback
    // Only use live perf when there are actually sprint tasks; otherwise keep the
    // curated demo perf so the cards aren't all zeros (matches the demo matrix below).
    try { const r = await apiFetch(`${API_BASE}/stats/employee`); if(r.ok){const d=await r.json();if(!d.error && d.totalTasks)stats=d;} } catch(e){}
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

// ── MY PERFORMANCE (employee — own onboarding tasks only) ───────────────────
async function renderMyPerformance() {
    const s = await getMyOnboarding();
    viewContainer.innerHTML = `
        <div class="topbar fade-in"><h2><i class="fa-solid fa-chart-pie" style="color:var(--primary);"></i> My Performance &amp; Tasks</h2></div>
        <div class="performance-grid fade-in">
            <div class="perf-card"><div class="perf-label">Onboarding Progress</div><div class="perf-value">${s.progress}%</div><div class="progress-container"><div class="progress-bar" style="width:${s.progress}%"></div></div></div>
            <div class="perf-card"><div class="perf-label">Tasks Completed</div><div class="perf-value" style="color:var(--success);">${s.completed}</div><div class="perf-label">of ${s.total} assigned</div></div>
            <div class="perf-card"><div class="perf-label">Still Pending</div><div class="perf-value" style="color:var(--danger);">${s.pending + s.inProgress}</div><div class="perf-label">${s.inProgress} in progress · ${s.pending} not started</div></div>
        </div>
        <div class="card-header fade-in" style="margin-top:8px;"><h3><i class="fa-solid fa-layer-group"></i> My Task Priority</h3></div>
        <div class="priority-matrix fade-in">
            <div class="priority-col"><div class="priority-header high"><i class="fa-solid fa-circle-exclamation"></i> Not Started</div><div id="prio-high"></div></div>
            <div class="priority-col"><div class="priority-header medium"><i class="fa-solid fa-circle-half-stroke"></i> In Progress</div><div id="prio-medium"></div></div>
            <div class="priority-col"><div class="priority-header low"><i class="fa-solid fa-circle-check"></i> Completed</div><div id="prio-low"></div></div>
        </div>`;
    s.tasks.forEach(t => {
        const el = document.createElement('div');
        el.className = 'priority-item';
        el.innerHTML = `<strong>${t.taskType}</strong><br><small style="color:var(--text-muted);">${t.assignedTo}</small>`;
        if (t.status === 'Pending') document.getElementById('prio-high').appendChild(el);
        else if (t.status === 'In Progress') document.getElementById('prio-medium').appendChild(el);
        else document.getElementById('prio-low').appendChild(el);
    });
}

// ── WEEKLY LUNCH MENU ─────────────────────────────────────────────────────────
// ISO-8601 week number — drives the auto-rotating weekly menu.
function isoWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7;          // Mon = 0 … Sun = 6
    date.setUTCDate(date.getUTCDate() - dayNum + 3);    // nearest Thursday
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    return 1 + Math.round((date - firstThursday) / (7 * 24 * 3600 * 1000));
}

async function renderDailyMenu() {
    const today = new Date();
    const weekNo = isoWeekNumber(today);
    const week = DEMO.lunchWeeks[weekNo % DEMO.lunchWeeks.length];   // rotates every real week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    const isWeekend = todayName === 'Saturday' || todayName === 'Sunday';

    // Monday of the current ISO week, for a friendly "Week of …" label.
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekLabel = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // On weekdays we highlight today; on weekends the cafeteria is closed, so we
    // highlight the next serving day (Monday) instead — there's always one card lit.
    const highlightDay = isWeekend ? 'Monday' : todayName;
    const highlightLabel = isWeekend ? '● NEXT' : '● TODAY';

    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const cards = order.map(day => {
        const m = week.days[day];
        const isHi = day === highlightDay;
        const vegDot = m.veg
            ? '<span style="color:#10b981;"><i class="fa-solid fa-leaf"></i> Veg</span>'
            : '<span style="color:#ef4444;"><i class="fa-solid fa-drumstick-bite"></i> Non-veg</span>';
        return `
            <div class="card fade-in" style="padding:18px;${isHi ? 'border:2px solid var(--primary);box-shadow:0 0 0 4px rgba(14,116,144,0.12);' : ''}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <strong style="font-size:1.02rem;">${day}</strong>
                    ${isHi ? `<span class="status-badge status-inprogress" style="font-weight:700;">${highlightLabel}</span>` : ''}
                </div>
                <div style="font-weight:600;margin-bottom:6px;">${m.main}</div>
                <ul style="list-style:none;padding:0;margin:0 0 12px;color:var(--text-muted);font-size:0.86rem;line-height:1.7;">
                    <li><i class="fa-solid fa-bowl-food" style="width:18px;color:var(--primary);"></i> ${m.side}</li>
                    <li><i class="fa-solid fa-ice-cream" style="width:18px;color:var(--primary);"></i> ${m.dessert}</li>
                    <li><i class="fa-solid fa-mug-hot" style="width:18px;color:var(--primary);"></i> ${m.drink}</li>
                </ul>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.82rem;">
                    ${vegDot}
                    <span style="color:var(--text-muted);"><i class="fa-solid fa-fire"></i> ${m.kcal} kcal</span>
                </div>
            </div>`;
    }).join('');

    const todaysHighlight = isWeekend
        ? `<div class="card fade-in" style="margin-bottom:20px;border-left:4px solid var(--warning);"><p style="margin:0;color:var(--text-muted);"><i class="fa-solid fa-mug-saucer" style="color:var(--warning);"></i> The cafeteria is closed on weekends — <strong>Monday's menu</strong> is highlighted below as the next serving day: <strong>${week.days['Monday'].main}</strong>.</p></div>`
        : `<div class="card fade-in" style="margin-bottom:20px;border-left:4px solid var(--primary);">
               <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
                   <span class="status-badge status-inprogress" style="font-weight:700;">TODAY · ${todayName}</span>
                   <strong style="font-size:1.05rem;">${week.days[todayName].main}</strong>
                   <span style="color:var(--text-muted);font-size:0.86rem;">with ${week.days[todayName].side} · ${week.days[todayName].dessert} · ${week.days[todayName].drink} · ${week.days[todayName].kcal} kcal</span>
               </div>
           </div>`;

    viewContainer.innerHTML = `
        <div class="topbar fade-in">
            <h2><i class="fa-solid fa-utensils" style="color:var(--primary);"></i> Weekly Lunch Menu</h2>
        </div>
        <p class="fade-in" style="color:var(--text-muted);margin:-6px 0 18px;font-size:0.88rem;">
            <i class="fa-solid fa-calendar-week" style="color:var(--primary);"></i>
            <strong>${week.theme}</strong> week · Week of ${weekLabel} · the menu rotates automatically every week.
        </p>
        ${todaysHighlight}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;">
            ${cards}
        </div>`;
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
    // Company-wide analytics/exports are an admin capability.
    if (!isAdminRole()) {
        viewContainer.innerHTML = adminOnlyPanel('fa-file-export', 'Reports &amp; Exports',
            'Company-wide reports and data exports are available to administrators. Your personal progress is on the Overview and My Performance pages.');
        return;
    }
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
    // Integrations & settings are an admin capability.
    if (!isAdminRole()) {
        viewContainer.innerHTML = adminOnlyPanel('fa-plug', 'Integrations &amp; Webhooks',
            'System integrations, webhooks and configuration are managed by administrators.');
        return;
    }
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
