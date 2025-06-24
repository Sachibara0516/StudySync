// script.js

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

let currentUserRole = null; // "Student" | "Professor"
let currentStudentNo = null;

/////////////////////////////
// LOCAL STORAGE KEYS and DATA STRUCTURES

const STORAGE_KEY_NOTES = 'studysync_notes';
const STORAGE_KEY_ASSIGNMENTS = 'studysync_assignments';
const STORAGE_KEY_SHARED_TASKS = 'studysync_shared_tasks';
const STORAGE_KEY_GROUPS = 'studysync_groups_data';
const STORAGE_KEY_GROUPS_MEMBERS = 'studysync_group_members';
const STORAGE_KEY_GROUPS_FILES = 'studysync_group_files';
const STORAGE_KEY_GROUPS_CHATS = 'studysync_group_chats';

// Initialize or fetch data from localStorage
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

// Notes are keyed by "Category::ItemTitle" e.g. "Modules::Module 1: Introduction"
// Assignments keyed by "SubjectName::AssignmentTitle"
// Shared tasks is an array of objects: {title, due_date (ISO string), description, completed (bool)}
// Groups are list of objects: {id, group_name, creator_id}
// Group members keyed by group id: array of objects {student_id, role}
// Group files keyed by group id: array of objects {file_id, file_name, uploader_id}
// Group chats keyed by group id: array of objects {sender_id, message, timestamp}


/////////////////////////////
// UTILITIES

function showScreen(screenElement) {
    // Hide all screens
    document.querySelectorAll(".screen").forEach(el => el.classList.add('hidden'));
    screenElement.classList.remove('hidden');
    screenElement.focus?.();
}

function validateStudentNoFormat(studentNo) {
    return /^\d{2}-\d{5}$/.test(studentNo);
}

function safeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/////////////////////////////
// Simple in-memory current data for demo, synced with localStorage

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

// A simple unique ID generator for groups, files, reminders
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/////////////////////////////
// Role selection buttons

professorBtn.addEventListener('click', () => {
    currentUserRole = "Professor";
    startLoginFlow(currentUserRole);
});

studentBtn.addEventListener('click', () => {
    currentUserRole = "Student";
    startLoginFlow(currentUserRole);
});

/////////////////////////////
// Login flow

function startLoginFlow(role) {
    loginTitle.textContent = `${role} Login`;
    // Adjust placeholder and validation hints
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

// Password toggle
document.getElementById("toggle-password").addEventListener('click', () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
    passwordInput.focus();
});

// Handle login submit
loginForm.addEventListener('submit', e => {
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

    // Simulated login: for Student, accept any password and valid student number; for Professor no validation needed.
    currentStudentNo = (currentUserRole === "Student") ? idVal : null;
    showWelcomeWindow(currentStudentNo);
});

/////////////////////////////
// Welcome window and continue

function showWelcomeWindow(studentNo) {
    if (studentNo) {
        welcomeStudentNo.textContent = studentNo;
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

/////////////////////////////
// DASHBOARD main contents

// Pages cache
const pages = new Map();

function showDashboard() {
    showScreen(dashboardWindow);
    renderDashboard();
    setActiveSidebarButton("Dashboard");
}

function setActiveSidebarButton(pageName) {
    sidebarButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === pageName);
    });
}

sidebarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        displayPage(page);
    });
});

logoutBtn.addEventListener('click', () => {
    logout();
});

// Main page display handler
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

// Utility to clear content area
function clearContentArea() {
    contentArea.innerHTML = "";
}

/////////////////////////////
// DASHBOARD Page Implementation

function renderDashboard() {
    clearContentArea();

    const template = document.getElementById("page-dashboard-template");
    const clone = template.content.cloneNode(true);
    // Calendar
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

    // Upcoming Activities (hardcoded demo)
    const upcomingList = clone.querySelector('#dashboard-upcoming');
    ["Essay Due - June 20", "History Exam - June 22"].forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        li.setAttribute('tabindex', '0');
        upcomingList.appendChild(li);
    });

    // Group Updates (simple simulated data)
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

/////////////////////////////
// CLASS PAGE

const SUBJECTS = [
    {name: "Mathematics", icon: "🧮", color: "#fce7f3"},
    {name: "Science", icon: "🔬", color: "#dbeafe"},
    {name: "English", icon: "📚", color: "#fee2e2"},
    {name: "History", icon: "🏰", color: "#e0f2fe"},
    {name: "Geography", icon: "🗺️", color: "#dcfce7"},
    {name: "Computer Science", icon: "💻", color: "#ede9fe"},
    {name: "Art", icon: "🎨", color: "#fef9c3"},
];

function renderClassPage() {
    clearContentArea();
    const template = document.getElementById("page-class-template");
    const clone = template.content.cloneNode(true);
    const subjectContainer = clone.querySelector(".subjects-container");

    SUBJECTS.forEach(subject => {
        const btn = document.createElement('button');
        btn.className = 'subject-button';
        btn.style.backgroundColor = subject.color;
        btn.textContent = `${subject.icon}  ${subject.name}`;
        btn.setAttribute('aria-label', `Open subject details for ${subject.name}`);
        btn.addEventListener('click', () => {
            renderSubjectDetailPage(subject.name);
        });
        subjectContainer.appendChild(btn);
    });

    contentArea.appendChild(clone);
}

/////////////////////////////
// SUBJECT DETAIL PAGE

function renderSubjectDetailPage(subjectName) {
    clearContentArea();
    const template = document.getElementById("page-subject-detail-template");
    const clone = template.content.cloneNode(true);
    const titleEl = clone.querySelector("#subject-detail-title");
    titleEl.textContent = subjectName + " Details";

    // Prepare sections data (JSON-like)
    const section_data = [
        ["Modules", "modules", [
            ["Module 1: Introduction", "Mathematics is the study of numbers, shapes, and patterns."],
            ["Module 2: Advanced Topics", "Covers calculus and problem-solving techniques."],
            ["Module 3: Practice", "Hands-on exercises and practice problems."]
        ], "#6366f1", "#38bdf8"],
        ["Pointers to Review", "pointers", [
            ["Key Formula", "List of formulas you should memorize."],
            ["Important Concepts", "Concepts you must understand."],
            ["Sample Questions", "Example questions for practice."]
        ], "#f43f5e", "#f87171"],
        ["Assignments", "assignments", [
            ["Assignment 1", "Solve exercises on page 34-35."],
            ["Assignment 2", "Group activity about measurements."],
            ["Assignment 3", "Create a math puzzle."]
        ], "#22c55e", "#a3e635"]
    ];

    const tabsDiv = clone.querySelector(".tabs");

    section_data.forEach(([sectionTitle, category, items, colorStart, colorEnd]) => {
        const sectionWrapper = document.createElement("div");
        sectionWrapper.classList.add("section-wrapper");
        items.forEach(([itemTitle, itemContent]) => {
            const sectionFrame = document.createElement("div");
            sectionFrame.classList.add("section-frame", category);
            sectionFrame.style.background = `linear-gradient(to right, ${colorStart}, ${colorEnd})`;

            // Text content with bullet and bold title
            const label = document.createElement("div");
            label.innerHTML = `&bull; <b>${safeText(itemTitle)}:</b> ${safeText(itemContent)}`;
            label.style.fontSize = "14px";
            label.style.color = "white";
            label.style.userSelect = "text";
            label.style.cursor = "text";
            label.style.whiteSpace = "pre-wrap";

            sectionFrame.appendChild(label);

            // For modules, add Ask AI button
            if(category === "modules") {
                const askAIbtn = document.createElement("button");
                askAIbtn.textContent = "Ask AI";
                askAIbtn.className = "ask-ai-btn";
                askAIbtn.style.display = "none";
                askAIbtn.style.cursor = "pointer";
                askAIbtn.style.fontSize = "12px";
                askAIbtn.style.fontWeight = "600";
                askAIbtn.style.borderRadius = "6px";
                askAIbtn.style.border = "none";
                askAIbtn.style.color = "#444";
                askAIbtn.style.backgroundColor = "#fff59d";
                askAIbtn.style.padding = "4px 8px";
                askAIbtn.title = "Ask AI About Selected Text";

                // Show ask AI button if user selects text within label
                label.addEventListener("mouseup", () => {
                    const selection = window.getSelection();
                    if(selection && selection.toString().trim().length > 0) {
                        askAIbtn.style.display = "inline-block";
                    } else {
                        askAIbtn.style.display = "none";
                    }
                });

                askAIbtn.addEventListener("click", async () => {
                    const selection = window.getSelection();
                    const selectedText = selection.toString().trim();
                    if (!selectedText) return;

                    const choice = await prompt("What would you like to do with the selected text?\nOptions: Explain or Edit", "Explain");
                    if (!choice) return;
                    const promptText = `${choice} the following text:\n\n${selectedText}`;
                    try {
                        askAIbtn.disabled = true;
                        askAIbtn.textContent = "Processing...";
                        const aiResponse = await getAIResponse(promptText);
                        alert(`AI ${choice} result:\n\n${aiResponse}`);
                    } catch (e) {
                        alert("AI Error: " + e.toString());
                    } finally {
                        askAIbtn.textContent = "Ask AI";
                        askAIbtn.disabled = false;
                    }
                });

                sectionFrame.appendChild(askAIbtn);
            }

            // Add textarea notes
            const notesTextarea = document.createElement("textarea");
            notesTextarea.placeholder = "Private comment...";
            notesTextarea.style.marginTop = "8px";
            notesTextarea.style.fontSize = "13px";
            notesTextarea.value = SAVED_NOTES[`${sectionTitle}::${itemTitle}`] || "";

            notesTextarea.addEventListener("input", () => {
                SAVED_NOTES[`${sectionTitle}::${itemTitle}`] = notesTextarea.value;
                try {
                    setLocalData(STORAGE_KEY_NOTES, SAVED_NOTES);
                } catch {
                    // silently fail
                }
            });

            sectionFrame.appendChild(notesTextarea);

            // For assignments, add Upload + View buttons
            if(category === "assignments") {
                const assignKey = `${subjectName}::${itemTitle}`;

                // Upload Button
                const uploadBtn = document.createElement("button");
                uploadBtn.textContent = "Upload File";
                uploadBtn.className = "upload-btn";
                uploadBtn.style.marginTop = "8px";
                uploadBtn.style.backgroundColor = "white";
                uploadBtn.style.color = "#3b82f6";
                uploadBtn.style.border = "1.5px solid #3b82f6";
                uploadBtn.style.borderRadius = "8px";
                uploadBtn.style.fontWeight = "600";
                uploadBtn.style.padding = "8px 10px";
                uploadBtn.style.cursor = "pointer";

                // View Button
                const viewBtn = document.createElement("button");
                viewBtn.textContent = "View Your Work";
                viewBtn.className = "view-btn";
                viewBtn.style.marginTop = "6px";
                viewBtn.style.backgroundColor = "white";
                viewBtn.style.color = "#10b981";
                viewBtn.style.border = "1.5px solid #10b981";
                viewBtn.style.borderRadius = "8px";
                viewBtn.style.fontWeight = "600";
                viewBtn.style.padding = "8px 10px";
                viewBtn.style.cursor = "pointer";

                // If submission exists
                let submittedPath = SUBMITTED_ASSIGNMENTS[assignKey] || null;
                if(submittedPath) {
                    uploadBtn.textContent = "Uploaded ✓";
                    uploadBtn.disabled = true;
                    viewBtn.disabled = false;
                } else {
                    viewBtn.disabled = true;
                }

                uploadBtn.addEventListener('click', () => {
                    // Use file picker
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = '*/*';
                    fileInput.addEventListener('change', () => {
                        if (fileInput.files.length > 0) {
                            const file = fileInput.files[0];
                            // Save only the file name (simulate path)
                            SUBMITTED_ASSIGNMENTS[assignKey] = file.name;
                            try {
                                setLocalData(STORAGE_KEY_ASSIGNMENTS, SUBMITTED_ASSIGNMENTS);
                            } catch {}
                            uploadBtn.textContent = "Uploaded ✓";
                            uploadBtn.disabled = true;
                            viewBtn.disabled = false;
                            alert(`Simulated upload of "${file.name}" for assignment.`);
                        }
                    });
                    fileInput.click();
                });

                viewBtn.addEventListener('click', () => {
                    if (!SUBMITTED_ASSIGNMENTS[assignKey]) {
                        alert("No submitted file found.");
                        return;
                    }
                    const action = confirm("Open (OK) or Unsubmit (Cancel)?\nPress OK to simulate opening the file, Cancel to unsubmit.");
                    if(action) {
                        alert(`Simulated opening file: ${SUBMITTED_ASSIGNMENTS[assignKey]}`);
                    } else {
                        delete SUBMITTED_ASSIGNMENTS[assignKey];
                        try {
                            setLocalData(STORAGE_KEY_ASSIGNMENTS, SUBMITTED_ASSIGNMENTS);
                        } catch {}
                        alert("You have unpublished your submission.");
                        uploadBtn.textContent = "Upload File";
                        uploadBtn.disabled = false;
                        viewBtn.disabled = true;
                    }
                });

                sectionFrame.appendChild(uploadBtn);
                sectionFrame.appendChild(viewBtn);
            }

            sectionWrapper.appendChild(sectionFrame);
        });
        tabsDiv.appendChild(sectionWrapper);
    });

    // Setup back button
    const backBtn = clone.querySelector("#subject-back-btn");
    backBtn.addEventListener("click", () => {
        displayPage("Class");
    });

    contentArea.appendChild(clone);
}

/////////////////////////////
// CALENDAR PAGE

function renderCalendarPage() {
    clearContentArea();
    const template = document.getElementById("page-calendar-template");
    const clone = template.content.cloneNode(true);

    const calendarDiv = clone.getElementById("calendar-widget");
    setupCalendarWidget(calendarDiv);

    const todayList = clone.getElementById("todo-list");
    const upcomingList = clone.getElementById("incoming-activities");

    // Show current tasks in to-do list from shared tasks
    SHARED_TASKS.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.title + (task.completed ? " ✓" : "");
        li.setAttribute('tabindex', "0");
        todayList.appendChild(li);
    });

    // Continue with static upcoming activities for demo
    ["Essay Due - June 20", "History Exam - June 22"].forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        li.setAttribute('tabindex', '0');
        upcomingList.appendChild(li);
    });

    // New todo task button handling
    const addTaskBtn = clone.getElementById("todo-add-btn");
    addTaskBtn.addEventListener('click', () => {
        const taskText = prompt("Enter task for today:");
        if(taskText && taskText.trim()) {
            SHARED_TASKS.push({
                title: taskText.trim(),
                due_date: new Date().toISOString().slice(0,10),
                description: "",
                completed: false,
            });
            setLocalData(STORAGE_KEY_SHARED_TASKS, SHARED_TASKS);
            const li = document.createElement('li');
            li.textContent = taskText.trim();
            li.setAttribute('tabindex', '0');
            todayList.appendChild(li);
        }
    });

    contentArea.appendChild(clone);
}

// Simple calendar widget using native date input and minimal UI for demo purposes
function setupCalendarWidget(container) {
    container.innerHTML = "";
    const today = new Date().toISOString().slice(0,10);
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = today;
    dateInput.style.fontSize = "16px";
    dateInput.style.padding = "8px";
    dateInput.style.borderRadius = "6px";
    dateInput.style.border = "1.5px solid #d1d5db";
    dateInput.style.width = "100%";
    dateInput.addEventListener('change', () => {
        // show tasks or events for the selected date if needed
        alert(`Selected date: ${dateInput.value}`);
    });
    container.appendChild(dateInput);
}

/////////////////////////////
// PROGRESS PAGE

function renderProgressPage() {
    clearContentArea();
    const template = document.getElementById("page-progress-template");
    const clone = template.content.cloneNode(true);
    const dropdown = clone.getElementById("progress-filter");
    const activityList = clone.getElementById("progress-activity-list");
    const chartCanvas = clone.getElementById("progress-chart");
    const ctx = chartCanvas.getContext("2d");

    const progressData = {
        "This Week": [
            ["Math Homework", "Graded: 90/100", "green"],
            ["Science Quiz", "Ungraded", "gray"],
            ["English Essay", "Graded: 88/100", "green"],
            ["History Quiz", "Graded: 82/100", "green"],
            ["Biology Lab", "Ungraded", "gray"],
            ["PE Fitness Test", "Graded: 92/100", "green"],
            ["Computer Assignment", "Graded: 85/100", "green"]
        ],
        "Last Week": [
            ["Math Project", "Graded: 87/100", "green"],
            ["Science Lab", "Ungraded", "gray"],
            ["English Reading", "Graded: 80/100", "green"],
            ["History Report", "Graded: 78/100", "green"],
            ["Art Sketch", "Ungraded", "gray"],
            ["Geography Quiz", "Graded: 84/100", "green"],
            ["Music Composition", "Graded: 90/100", "green"]
        ],
        "Last Month": [
            ["Math Exam", "Graded: 75/100", "green"],
            ["Science Fair", "Graded: 93/100", "green"],
            ["English Portfolio", "Ungraded", "gray"],
            ["History Debate", "Graded: 85/100", "green"],
            ["Computer Lab", "Graded: 80/100", "green"],
            ["Art Exhibit", "Ungraded", "gray"],
            ["Geography Map", "Graded: 86/100", "green"]
        ]
    };

    Object.keys(progressData).forEach(key => {
        let option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        dropdown.appendChild(option);
    });

    function drawChart(selectedKey) {
        const labelArr = progressData[selectedKey].map(item => item[0]);
        const scores = progressData[selectedKey].map(item => {
            if (item[1].startsWith("Graded")) {
                const match = item[1].match(/Graded: (\d+)/);
                return match ? parseInt(match[1]) : 0;
            }
            return 0;
        });

        // Clear canvas
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

        // Simple line graph with canvas
        // Dimensions and padding
        const w = chartCanvas.width;
        const h = chartCanvas.height;
        const padding = 40;
        const maxScore = 100;

        // Draw axes
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 2;
        // y axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, h - padding);
        ctx.stroke();
        // x axis
        ctx.beginPath();
        ctx.moveTo(padding, h - padding);
        ctx.lineTo(w - padding, h - padding);
        ctx.stroke();

        // Draw grid lines horizontal
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for(let y = padding; y <= h - padding; y += (h - 2*padding) / 5) {
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw line
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(147,197,253,0.3)";
        ctx.beginPath();
        for(let i = 0; i < scores.length; i++) {
            const x = padding + i * ((w - 2*padding) / (scores.length - 1));
            const y = h - padding - (scores[i] / maxScore) * (h - 2*padding);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Fill below the line
        ctx.lineTo(w - padding, h - padding);
        ctx.lineTo(padding, h - padding);
        ctx.closePath();
        ctx.fill();

        // Draw points and labels
        ctx.fillStyle = "#2563eb";
        ctx.font = "12px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        labelArr.forEach((label, i) => {
            const x = padding + i * ((w - 2*padding) / (scores.length - 1));
            const y = h - padding - (scores[i] / maxScore) * (h - 2*padding);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillText(label, x, h - padding + 4);
        });
    }

    function updateActivityList(selectedKey) {
        activityList.innerHTML = "";
        progressData[selectedKey].forEach(([subject, statusText, color]) => {
            const li = document.createElement("li");
            li.textContent = `${subject} - ${statusText}`;
            li.style.color = color;
            li.setAttribute("tabindex", "0");
            activityList.appendChild(li);
        });
        drawChart(selectedKey);
    }

    dropdown.addEventListener("change", e => {
        updateActivityList(e.target.value);
    });

    dropdown.value = "This Week";
    updateActivityList("This Week");

    contentArea.appendChild(clone);
}

/////////////////////////////
// SETTINGS PAGE

function renderSettingsPage() {
    clearContentArea();
    const template = document.getElementById("page-setting-template");
    const clone = template.content.cloneNode(true);

    const displayNameInput = clone.getElementById("display-name");
    const oldPwInput = clone.getElementById("old-password");
    const newPwInput = clone.getElementById("new-password");
    const togglePassBtns = clone.querySelectorAll(".toggle-pass-btn");
    const updatePwBtn = clone.getElementById("update-password-btn");
    const notifCheckbox = clone.getElementById("email-notif");
    const saveSettingsBtn = clone.getElementById("save-settings-btn");

    // Initialize values
    displayNameInput.value = localStorage.getItem("studysync_display_name") || "";
    notifCheckbox.checked = localStorage.getItem("studysync_email_notifications_enabled") === "true";

    togglePassBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const input = btn.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
            } else {
                input.type = "password";
            }
            input.focus();
        });
    });

    updatePwBtn.addEventListener('click', () => {
        if (!oldPwInput.value.trim() || !newPwInput.value.trim()) {
            alert("Please fill both old and new password fields.");
            return;
        }
        // Simulate password update success
        alert("Password updated successfully.");
        oldPwInput.value = '';
        newPwInput.value = '';
    });

    saveSettingsBtn.addEventListener('click', () => {
        localStorage.setItem("studysync_display_name", displayNameInput.value.trim() || "Student");
        localStorage.setItem("studysync_email_notifications_enabled", notifCheckbox.checked);
        alert(`Settings saved.\nName: ${displayNameInput.value.trim() || "Student"}\nEmail Notifications: ${notifCheckbox.checked ? "Enabled" : "Disabled"}`);
    });

    contentArea.appendChild(clone);
}

/////////////////////////////
// GROUP MAIN PAGE

function renderGroupInitialPage() {
    clearContentArea();
    const template = document.getElementById("page-group-initial-template");
    const clone = template.content.cloneNode(true);

    const groupList = clone.getElementById("group-list");
    const newGroupNameInput = clone.getElementById("new-group-name");
    const createGroupBtn = clone.getElementById("create-group-btn");

    function refreshGroupList() {
        groupList.innerHTML = "";
        GROUPS_DATA.forEach(group => {
            const li = document.createElement('li');
            li.textContent = group.group_name;
            li.tabIndex = 0;
            li.dataset.groupId = group.id;
            li.addEventListener('click', () => renderGroupDetailsPage(group.id));
            li.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    renderGroupDetailsPage(group.id);
                }
            });
            groupList.appendChild(li);
        });
    }

    createGroupBtn.addEventListener('click', () => {
        const nameTrimmed = newGroupNameInput.value.trim();
        if (!nameTrimmed) {
            alert("Group name cannot be empty.");
            return;
        }
        if (GROUPS_DATA.some(g => g.group_name.toLowerCase() === nameTrimmed.toLowerCase())) {
            alert("A group with that name already exists.");
            return;
        }
        const newId = generateId();
        GROUPS_DATA.push({id: newId, group_name: nameTrimmed, creator_id: (currentUserRole === 'Student' ? currentStudentNo : 'professor')});
        GROUP_MEMBERS[newId] = [{student_id: (currentUserRole === 'Student' ? currentStudentNo : 'professor'), role:"admin"}];
        setLocalData(STORAGE_KEY_GROUPS, GROUPS_DATA);
        setLocalData(STORAGE_KEY_GROUPS_MEMBERS, GROUP_MEMBERS);
        alert(`Group '${nameTrimmed}' created successfully.`);
        newGroupNameInput.value = '';
        refreshGroupList();
    });

    refreshGroupList();
    contentArea.appendChild(clone);
}

/////////////////////////////
// GROUP DETAILS PAGE

function renderGroupDetailsPage(groupId) {
    clearContentArea();

    const group = GROUPS_DATA.find(g => g.id === groupId);
    if (!group) {
        alert("Group not found.");
        renderGroupInitialPage();
        return;
    }

    const template = document.getElementById("page-group-details-template");
    const clone = template.content.cloneNode(true);

    const groupDetailsName = clone.getElementById("group-details-name");
    groupDetailsName.textContent = group.group_name;

    // Back to groups button
    const backBtn = clone.getElementById("back-to-groups");
    backBtn.addEventListener('click', () => renderGroupInitialPage());

    // Member list
    const memberList = clone.getElementById("group-member-list");
    function refreshMemberList() {
        memberList.innerHTML = "";
        const members = GROUP_MEMBERS[groupId] || [];
        members.forEach(mem => {
            const li = document.createElement('li');
            li.textContent = `${mem.student_id}${mem.role === 'admin' ? ' (Admin)' : ''}`;
            li.tabIndex = 0;
            memberList.appendChild(li);
        });
    }

    refreshMemberList();

    // Invite member
    const inviteInput = clone.getElementById("invite-member-id");
    const inviteBtn = clone.getElementById("invite-member-btn");
    inviteBtn.addEventListener('click', () => {
        const idVal = inviteInput.value.trim();
        if (!idVal) {
            alert("Please enter a student ID.");
            return;
        }
        if (!validateStudentNoFormat(idVal)) {
            alert("Student ID must be in format 22-XXXXX.");
            return;
        }
        const members = GROUP_MEMBERS[groupId] || [];
        if(members.some(m => m.student_id === idVal)) {
            alert(`${idVal} is already a member.`);
            return;
        }
        members.push({student_id: idVal, role: "member"});
        GROUP_MEMBERS[groupId] = members;
        setLocalData(STORAGE_KEY_GROUPS_MEMBERS, GROUP_MEMBERS);
        alert(`Student ${idVal} invited to the group.`);
        inviteInput.value = "";
        refreshMemberList();
    });

    // Leave group
    const leaveGroupBtn = clone.getElementById("leave-group-btn");
    leaveGroupBtn.disabled = group.creator_id === (currentUserRole === 'Student' ? currentStudentNo : "professor");
    leaveGroupBtn.addEventListener('click', () => {
        if (!confirm(`Are you sure you want to leave '${group.group_name}'?`)) return;
        GROUP_MEMBERS[groupId] = (GROUP_MEMBERS[groupId] || []).filter(m => m.student_id !== (currentUserRole === 'Student' ? currentStudentNo : 'professor'));
        setLocalData(STORAGE_KEY_GROUPS_MEMBERS, GROUP_MEMBERS);
        alert(`You have left the group '${group.group_name}'.`);
        renderGroupInitialPage();
    });

    // Shared files
    const fileList = clone.getElementById("group-file-list");
    const uploadInput = clone.getElementById("upload-file-input");
    const uploadBtn = clone.getElementById("upload-file-btn");
    const deleteFileBtn = clone.getElementById("delete-file-btn");

    function refreshFileList() {
        fileList.innerHTML = "";
        const files = GROUP_FILES[groupId] || [];

        files.forEach(file => {
            const li = document.createElement('li');
            li.textContent = `${file.file_name} (by ${file.uploader_id})`;
            li.tabIndex = 0;
            li.dataset.fileId = file.file_id;
            li.dataset.fileUploader = file.uploader_id;
            li.dataset.selected = "false";

            li.addEventListener('click', () => {
                // Toggle selection
                fileList.querySelectorAll('li').forEach(el => {
                    el.dataset.selected = 'false';
                    el.style.backgroundColor = '';
                });
                li.dataset.selected = 'true';
                li.style.backgroundColor = "#e0e7ff";
                updateDeleteButtonState();
            });

            li.addEventListener('dblclick', () => {
                // Simulate file viewing
                alert(`Simulated opening file: ${file.file_name}`);
            });

            fileList.appendChild(li);
        });
        updateDeleteButtonState();
    }

    function updateDeleteButtonState() {
        const selectedFile = fileList.querySelector('li[data-selected="true"]');
        if (!selectedFile) {
            deleteFileBtn.disabled = true;
            return;
        }
        // Enable delete only if uploader or group creator
        const uploaderId = selectedFile.dataset.fileUploader;
        const isUploaderOrCreator = uploaderId === (currentUserRole === 'Student' ? currentStudentNo : "professor")
            || group.creator_id === (currentUserRole === 'Student' ? currentStudentNo : "professor");
        deleteFileBtn.disabled = !isUploaderOrCreator;
    }

    uploadBtn.addEventListener('click', () => {
        if (!uploadInput.files.length) {
            alert("Please choose a file first.");
            return;
        }
        const file = uploadInput.files[0];
        const newFile = {
            file_id: generateId(),
            file_name: file.name,
            uploader_id: currentUserRole === "Student" ? currentStudentNo : "professor",
            uploaded_at: new Date().toISOString()
        };
        let files = GROUP_FILES[groupId] || [];
        files = [newFile, ...files];
        GROUP_FILES[groupId] = files;
        setLocalData(STORAGE_KEY_GROUPS_FILES, GROUP_FILES);
        alert(`Simulated upload of file '${file.name}' to group '${group.group_name}'.`);
        uploadInput.value = "";
        refreshFileList();
    });

    deleteFileBtn.addEventListener('click', () => {
        const selectedFile = fileList.querySelector('li[data-selected="true"]');
        if (!selectedFile) return;
        if (!confirm(`Are you sure you want to delete '${selectedFile.textContent}'? This action cannot be undone.`)) return;

        let files = GROUP_FILES[groupId] || [];
        files = files.filter(f => f.file_id !== selectedFile.dataset.fileId);
        GROUP_FILES[groupId] = files;
        setLocalData(STORAGE_KEY_GROUPS_FILES, GROUP_FILES);
        alert(`File '${selectedFile.textContent}' deleted.`);
        refreshFileList();
    });

    refreshFileList();

    // Group chat
    const chatList = clone.getElementById("group-chat-list");
    const chatInput = clone.getElementById("group-chat-input");
    const sendChatBtn = clone.getElementById("send-chat-btn");

    function refreshChatList() {
        chatList.innerHTML = "";
        const chats = GROUP_CHATS[groupId] || [];
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.textContent = `${chat.sender_id}: ${chat.message}`;
            li.tabIndex = 0;
            chatList.appendChild(li);
        });
        chatList.scrollTop = chatList.scrollHeight;
    }

    sendChatBtn.addEventListener('click', () => {
        const msg = chatInput.value.trim();
        if (!msg) return;
        const chats = GROUP_CHATS[groupId] || [];
        chats.push({
            sender_id: currentUserRole === 'Student' ? currentStudentNo : 'professor',
            message: msg,
            timestamp: new Date().toISOString()
        });
        GROUP_CHATS[groupId] = chats;
        setLocalData(STORAGE_KEY_GROUPS_CHATS, GROUP_CHATS);
        chatInput.value = "";
        refreshChatList();
    });

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatBtn.click();
        }
    });

    refreshChatList();

    // Delete group button
    const deleteGroupBtn = clone.getElementById("delete-group-btn");
    deleteGroupBtn.disabled = group.creator_id !== (currentUserRole === 'Student' ? currentStudentNo : "professor");

    deleteGroupBtn.addEventListener('click', () => {
        if (!confirm(`Are you sure you want to delete the entire group '${group.group_name}'? This will delete all chats and files and cannot be undone.`)) return;
        // Delete group data
        GROUPS_DATA = GROUPS_DATA.filter(g => g.id !== groupId);
        delete GROUP_MEMBERS[groupId];
        delete GROUP_FILES[groupId];
        delete GROUP_CHATS[groupId];
        setLocalData(STORAGE_KEY_GROUPS, GROUPS_DATA);
        setLocalData(STORAGE_KEY_GROUPS_MEMBERS, GROUP_MEMBERS);
        setLocalData(STORAGE_KEY_GROUPS_FILES, GROUP_FILES);
        setLocalData(STORAGE_KEY_GROUPS_CHATS, GROUP_CHATS);
        alert(`Group '${group.group_name}' deleted.`);
        renderGroupInitialPage();
    });

    contentArea.appendChild(clone);
}

/////////////////////////////
// OTHER UTILITIES

function formatDateISO(isoStr) {
    if(!isoStr) return "No due date";
    const dateObj = new Date(isoStr);
    if (isNaN(dateObj)) return "Invalid date";
    return dateObj.toISOString().slice(0,10);
}


// Minimal AI call simulator (since openai API is backend)
// In the Python original, calls require backend openai usage
// Here, we simulate with a delay and canned response
async function getAIResponse(prompt) {
    // Simulate typing delay & return canned response
    await new Promise(r => setTimeout(r, 1500));
    return `Simulated AI response for: "${prompt}"`;
}

/////////////////////////////
// Local storage save helper

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

/////////////////////////////
// Logout function

function logout() {
    currentUserRole = null;
    currentStudentNo = null;
    // Clear large state if needed or keep data
    showScreen(mainWindow);
}

/////////////////////////////
// Weekly Score Graph on Dashboard

// Using simple 2d canvas to draw line and fill
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

/////////////////////////////
// Mini Calendar on Dashboard (simplified)

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

/////////////////////////////

// Initialize app by showing main window
showScreen(mainWindow);