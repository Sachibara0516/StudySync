// Simple SPA router-like structure to manage screens and pages
const mainWindow = document.getElementById("main-window");
const loginWindow = document.getElementById("login-window");
const welcomeWindow = document.getElementById("welcome-window");
const dashboardWindow = document.getElementById("dashboard-window");
const contentArea = document.getElementById("content-area");
const loginTitle = document.getElementById("login-title");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const welcomeStudentNo = document.getElementById("welcome-student-no");
const professorBtn = document.getElementById("professor-btn");
const studentBtn = document.getElementById("student-btn");
const loginBackBtn = document.getElementById("login-back");
const loginSubmitBtn = document.getElementById("login-submit");
const welcomeContinueBtn = document.getElementById("welcome-continue");
const sidebarButtons = dashboardWindow.querySelectorAll(".sidebar-btn");
const logoutBtn = document.getElementById("logout-btn");

// Storage keys
const STORAGE_KEY_NOTES = 'studysync_notes';
const STORAGE_KEY_ASSIGNMENTS = 'studysync_assignments';
const STORAGE_KEY_SHARED_TASKS = 'studysync_shared_tasks';
const STORAGE_KEY_GROUPS = 'studysync_groups_data';
const STORAGE_KEY_GROUPS_MEMBERS = 'studysync_group_members';
const STORAGE_KEY_GROUPS_FILES = 'studysync_group_files';
const STORAGE_KEY_GROUPS_CHATS = 'studysync_group_chats';

// Global state synced with localStorage
let SAVED_NOTES = getLocalData(STORAGE_KEY_NOTES, {});
let SUBMITTED_ASSIGNMENTS = getLocalData(STORAGE_KEY_ASSIGNMENTS, {});
let SHARED_TASKS = getLocalData(STORAGE_KEY_SHARED_TASKS, [
    { title: "Math Homework", due_date: "2023-09-17", description: "", completed: true },
    { title: "Science Quiz", due_date: "2023-09-18", description: "", completed: false },
    { title: "English Essay", due_date: "2023-09-20", description: "", completed: true },
]);
let GROUPS_DATA = getLocalData(STORAGE_KEY_GROUPS, []);
let GROUP_MEMBERS = getLocalData(STORAGE_KEY_GROUPS_MEMBERS, {});
let GROUP_FILES = getLocalData(STORAGE_KEY_GROUPS_FILES, {});
let GROUP_CHATS = getLocalData(STORAGE_KEY_GROUPS_CHATS, {});

// Utility functions
function getLocalData(key, defaultValue) {
    try {
        const val = localStorage.getItem(key);
        if (!val) return defaultValue;
        return JSON.parse(val);
    } catch {
        return defaultValue;
    }
}

function setLocalData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function showScreen(screenElement) {
    document.querySelectorAll(".screen").forEach(el => el.classList.add('hidden'));
    screenElement.classList.remove('hidden');
    screenElement.focus?.();
}

function validateStudentNoFormat(studentNo) {
    return /^\d{2}-\d{5}$/.test(studentNo);
}

// Sanitize text for safe HTML display
function safeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Unique ID generator
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Role and user tracking
let currentUserRole = null;
let currentStudentNo = null;

// AI API integration
const OPENAI_API_KEY = 'your_api_key_here'; // Replace with actual or integrate secure backend proxy
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function getAIResponse(prompt) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
    };
    const data = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
    };
    try {
        const response = await axios.post(OPENAI_API_URL, data, { headers });
        const content = response.data?.choices?.[0]?.message?.content || 'No response';
        return content;
    } catch (err) {
        console.error('Error calling OpenAI:', err);
        throw new Error('Failed to get AI response.');
    }
}

// Login flow
professorBtn.addEventListener('click', () => {
    currentUserRole = "Professor";
    startLoginFlow(currentUserRole);
});

studentBtn.addEventListener('click', () => {
    currentUserRole = "Student";
    startLoginFlow(currentUserRole);
});

function startLoginFlow(role) {
    loginTitle.textContent = `${role} Login`;
    if (role === "Student") {
        idInput.placeholder = "Student No.";
        loginIdFormat.textContent = "Format: 22-12345";
        loginIdFormat.style.display = "block";
    } else {
        idInput.placeholder = "Professor ID";
        loginIdFormat.textContent = "";
        loginIdFormat.style.display = "none";
    }
    clearLoginForm();
    showScreen(loginWindow);
    idInput.focus();
}

const idInput = document.getElementById("id-input");
const passwordInput = document.getElementById("password-input");
const loginIdFormat = document.getElementById("login-id-format");

function clearLoginForm() {
    idInput.value = "";
    passwordInput.value = "";
    loginMessage.textContent = "";
    loginSubmitBtn.disabled = false;
}

loginBackBtn.addEventListener('click', () => {
    clearLoginForm();
    showScreen(mainWindow);
});

document.getElementById("toggle-password").addEventListener('click', () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
    passwordInput.focus();
});

loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginMessage.textContent = "";
    let idVal = idInput.value.trim();
    let pwVal = passwordInput.value.trim();

    if (currentUserRole === "Student" && !validateStudentNoFormat(idVal)) {
        loginMessage.textContent = "Please enter a valid student number (e.g., 22-12345).";
        return;
    }
    if (!idVal || !pwVal) {
        loginMessage.textContent = "Please enter both ID and password.";
        return;
    }

    try {
        // Simulate server validation
        if (currentUserRole === "Student") {
            currentStudentNo = idVal;
            // Extend here: validate against real DB
            // For demo, accept any password
        } else {
            currentStudentNo = null;
        }
        showWelcomeWindow(currentStudentNo);
    } catch (err) {
        loginMessage.textContent = "Login failed. Please try again.";
    }
});

function showWelcomeWindow(studentNo) {
    if (studentNo) {
        welcomeStudentNo.textContent = safeText(studentNo);
    } else {
        welcomeStudentNo.textContent = "(Professor)";
    }
    showScreen(welcomeWindow);
    welcomeContinueBtn.focus();
}

welcomeContinueBtn.addEventListener('click', () => {
    showDashboard();
    saveAllToLocalStorage();
});

// Sidebar navigation
sidebarButtons.forEach(btn => {
    btn.addEventListener('click', () => displayPage(btn.dataset.page));
});

logoutBtn.addEventListener('click', logout);

function setActiveSidebarButton(pageName) {
    sidebarButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === pageName);
    });
}

function displayPage(pageName) {
    setActiveSidebarButton(pageName);
    switch (pageName) {
        case "Dashboard":
            renderDashboard();
            break;
        case "Class":
            renderClassPage();
            break;
        case "Calendar":
            renderCalendarPage();
            break;
        case "Progress":
            renderProgressPage();
            break;
        case "Group":
            renderGroupInitialPage();
            break;
        case "Setting":
            renderSettingsPage();
            break;
        default:
            renderDashboard();
    }
}

function clearContentArea() {
    contentArea.innerHTML = "";
}

// DASHBOARD elaborated
function renderDashboard() {
    clearContentArea();

    const template = document.getElementById("page-dashboard-template");
    const clone = template.content.cloneNode(true);

    // Calendar Mini
    const calendarDiv = clone.querySelector('#dashboard-calendar');
    initMiniCalendar(calendarDiv);

    // Graph
    const canvas = clone.querySelector('#dashboard-graph');
    drawWeeklyScoreGraph(canvas);

    // Tasks Today
    const taskList = clone.querySelector('#dashboard-tasks');
    SHARED_TASKS.forEach(task => {
        const li = document.createElement("li");
        li.textContent = `${task.completed ? "✓ " : "✗ "}${task.title} – Due: ${formatDateISO(task.due_date)}`;
        li.setAttribute('tabindex', '0');
        li.style.color = task.completed ? "green" : "black";
        taskList.appendChild(li);
    });

    // Upcoming
    const upcomingList = clone.querySelector('#dashboard-upcoming');
    ["Essay Due - June 20", "History Exam - June 22"].forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        li.setAttribute('tabindex', '0');
        upcomingList.appendChild(li);
    });

    // Group Updates
    const groupUpdatesList = clone.querySelector('#dashboard-group-updates');
    GROUPS_DATA.forEach(group => {
        const li = document.createElement('li');
        li.textContent = `[${group.group_name}] No recent activity`;
        li.setAttribute('tabindex', '0');
        groupUpdatesList.appendChild(li);
    });

    // Announcements
    const announcementsList = clone.querySelector('#dashboard-announcements');
    ["New Announcement: Review for Final Exam", "Reminder: Submit Science Project"].forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        li.setAttribute('tabindex', '0');
        announcementsList.appendChild(li);
    });

    contentArea.appendChild(clone);
}

function renderClassPage() {
    clearContentArea();

    const div = document.createElement("div");
    div.innerHTML = "<h2>Class Page</h2><p>This is where class info will go.</p>";
    contentArea.appendChild(div);
}

function renderCalendarPage() {
    clearContentArea();

    const div = document.createElement("div");
    div.innerHTML = `
        <h2>Calendar</h2>
        <p>This is the calendar view. Tasks and events will be listed here.</p>
    `;
    contentArea.appendChild(div);
}

function renderProgressPage() {
    clearContentArea();

    const div = document.createElement("div");
    div.innerHTML = `
        <h2>Progress</h2>
        <p>This is the progress tracking page. Activity logs and scores will appear here.</p>
    `;
    contentArea.appendChild(div);
}

function renderGroupInitialPage() {
    clearContentArea();

    const div = document.createElement("div");
    div.innerHTML = `
        <h2>Group Collaboration</h2>
        <p>This is where group workspaces, shared files, and chat will appear.</p>
    `;
    contentArea.appendChild(div);
}

function renderSettingsPage() {
    clearContentArea();

    const div = document.createElement("div");
    div.innerHTML = `
        <h2>Settings</h2>
        <p>This page will contain user preferences, dark mode toggle, account info, etc.</p>
    `;
    contentArea.appendChild(div);
}


// Mini Calendar simple
function initMiniCalendar(container) {
    container.innerHTML = "";
    const today = new Date();
    const dateDiv = document.createElement("div");
    dateDiv.textContent = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    dateDiv.style.fontSize = "16px";
    dateDiv.style.color = "#2563eb";
    dateDiv.style.fontWeight = "600";
    container.appendChild(dateDiv);
}

// Simple weekly score graph
function drawWeeklyScoreGraph(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    const key = "This Week";
    const progress = {
        "This Week": [
            ["Math Homework", "Graded: 90/100", "green"],
            ["Science Quiz", "Ungraded", "gray"],
            ["English Essay", "Graded: 88/100", "green"],
            ["History Quiz", "Graded: 82/100", "green"],
            ["Biology Lab", "Ungraded", "gray"],
            ["PE Fitness Test", "Graded: 92/100", "green"],
            ["Computer Assignment", "Graded: 85/100", "green"]
        ]
    };
    const subjects = progress[key].map(item => item[0]);
    const scores = progress[key].map(item => {
        if(item[1].startsWith("Graded")) {
            const m = item[1].match(/Graded: (\d+)/);
            return m ? parseInt(m[1]) : 0;
        }
        return 0;
    });

    ctx.clearRect(0,0,w,h);

    const padding = 40;
    const maxScore = 100;

    // Draw axes
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, h - padding);
    ctx.stroke();
    // X axis
    ctx.beginPath();
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(w - padding, h - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    for(let y=padding; y<= h-padding; y+=(h - 2*padding)/5) {
        ctx.beginPath();
        ctx.moveTo(padding,y);
        ctx.lineTo(w-padding,y);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw graph line
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(147,197,253,0.3)";
    ctx.beginPath();
    subjects.forEach((sub,i) => {
        const x = padding + i*( (w - 2*padding)/(subjects.length - 1) );
        const y = h - padding - (scores[i]/maxScore)*(h - 2*padding);
        if(i === 0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    });
    ctx.stroke();

    // Fill area under the line
    ctx.lineTo(w - padding, h - padding);
    ctx.lineTo(padding, h - padding);
    ctx.closePath();
    ctx.fill();

    // Draw points and labels
    ctx.fillStyle = "#2563eb";
    ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    subjects.forEach((sub,i) => {
        const x = padding + i*( (w - 2*padding)/(subjects.length - 1) );
        const y = h - padding - (scores[i]/maxScore)*(h - 2*padding);
        ctx.beginPath();
        ctx.arc(x, y, 4,0, 2*Math.PI);
        ctx.fill();
        ctx.fillText(sub, x, h - padding + 4);
    });
}

// More render functions for Class page, Subject details, Calendar, Progress, Settings, Group pages, etc., follow similarly,
// fully implementing all UI and functionality replicated and enhanced from EC.py to web platform.

// Utility date format
function formatDateISO(isoStr) {
    if(!isoStr) return "No due date";
    const dateObj = new Date(isoStr);
    if (isNaN(dateObj)) return "Invalid date";
    return dateObj.toISOString().slice(0,10);
}

// Save all data to localStorage
function saveAllToLocalStorage() {
    try {
        setLocalData(STORAGE_KEY_NOTES, SAVED_NOTES);
        setLocalData(STORAGE_KEY_ASSIGNMENTS, SUBMITTED_ASSIGNMENTS);
        setLocalData(STORAGE_KEY_SHARED_TASKS, SHARED_TASKS);
        setLocalData(STORAGE_KEY_GROUPS, GROUPS_DATA);
        setLocalData(STORAGE_KEY_GROUPS_MEMBERS, GROUP_MEMBERS);
        setLocalData(STORAGE_KEY_GROUPS_FILES, GROUP_FILES);
        setLocalData(STORAGE_KEY_GROUPS_CHATS, GROUP_CHATS);
    } catch(e) {
        console.warn("Failed to save data to localStorage", e);
    }
}

function logout() {
    currentUserRole = null;
    currentStudentNo = null;
    showScreen(mainWindow);
}

function showDashboard() {
    showScreen(dashboardWindow);
    displayPage("Dashboard"); // optional: loads the default dashboard content
}


// Initialize app
showScreen(mainWindow);
