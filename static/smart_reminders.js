(function () {
    "use strict";

    const NOTIFICATION_KEY = "ai-action-assistant-last-reminder";

    function byId(id) {
        return document.getElementById(id);
    }

    function localDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
    }

    function currentGoal() {
        const tracker = byId("progress-tracker");
        const input = byId("goal");

        if (tracker && tracker.dataset.goal && tracker.dataset.goal.trim()) {
            return tracker.dataset.goal.trim();
        }

        if (input && input.value.trim()) return input.value.trim();
        return "";
    }

    function deadlineValue() {
        const input = byId("deadline");
        return input && input.value ? input.value : "";
    }

    function daysUntil(dateText) {
        if (!dateText) return null;

        const parts = dateText.split("-").map(Number);
        if (parts.length !== 3 || parts.some(function (part) {
            return !Number.isFinite(part);
        })) return null;

        const deadline = new Date(parts[0], parts[1] - 1, parts[2]);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
    }

    function missionData() {
        const missions = Array.from(
            document.querySelectorAll(".mission-checkbox")
        );
        const unfinished = missions.filter(function (mission) {
            return !mission.checked;
        });
        const first = unfinished[0];
        let priority = "No daily missions are available yet.";

        if (first) {
            const label = document.querySelector('label[for="' + first.id + '"]');
            priority = label ? label.textContent.trim() : "Complete your next mission.";
        } else if (missions.length) {
            priority = "All of today’s missions are complete. Excellent work!";
        }

        return {
            total: missions.length,
            unfinished: unfinished.length,
            completed: missions.length - unfinished.length,
            priority: priority
        };
    }

    function reminderState() {
        const goal = currentGoal();
        const deadline = deadlineValue();
        const remaining = daysUntil(deadline);
        const missions = missionData();
        let level = "safe";
        let label = "Ready";
        let message = "Create an action plan to activate smart reminders.";

        if (goal && remaining !== null) {
            if (remaining < 0) {
                level = "urgent";
                label = "Deadline Passed";
                message = "Your deadline passed " + Math.abs(remaining) +
                    " day(s) ago. Review and update your plan today.";
            } else if (remaining === 0) {
                level = "urgent";
                label = "Due Today";
                message = "Your goal deadline is today. Focus on the highest-impact action.";
            } else if (remaining <= 7) {
                level = "urgent";
                label = "Urgent";
                message = remaining +
                    " day(s) remain. Complete your priority mission today.";
            } else if (remaining <= 30) {
                level = "upcoming";
                label = "Deadline Approaching";
                message = remaining +
                    " day(s) remain. Keep your daily mission streak active.";
            } else {
                level = "safe";
                label = "On Schedule";
                message = remaining +
                    " day(s) remain. Consistent daily action will keep you on track.";
            }
        }

        if (missions.total && missions.unfinished === 0) {
            level = "complete";
            label = "Today Complete";
            message = "All daily missions are complete. Your goal is moving forward.";
        }

        return {
            goal: goal,
            deadline: deadline,
            remaining: remaining,
            missions: missions,
            level: level,
            label: label,
            message: message
        };
    }

    function deadlineText(state) {
        if (!state.deadline || state.remaining === null) return "No deadline selected";
        if (state.remaining < 0) return Math.abs(state.remaining) + " day(s) overdue";
        if (state.remaining === 0) return "Deadline is today";
        return state.remaining + " day(s) remaining";
    }

    function missionText(state) {
        if (!state.missions.total) return "No missions available";
        return state.missions.unfinished + " of " + state.missions.total +
            " mission(s) unfinished";
    }

    function render() {
        const state = reminderState();
        const panel = byId("smart-reminder-panel");
        const badge = byId("smart-reminder-badge");
        const message = byId("smart-reminder-message");
        const deadline = byId("smart-reminder-deadline");
        const missions = byId("smart-reminder-missions");
        const priority = byId("smart-reminder-priority");

        if (!panel) return;
        panel.className = "smart-reminder-panel " + state.level;
        badge.textContent = state.label;
        message.textContent = state.message;
        deadline.textContent = deadlineText(state);
        missions.textContent = missionText(state);
        priority.textContent = state.missions.priority;
        updateNotificationButton();
    }

    function showStatus(text, type) {
        const status = byId("smart-reminder-status");
        if (!status) return;
        status.textContent = text;
        status.className = "smart-reminder-status " + type;
        status.style.display = "block";
    }

    function notificationSupported() {
        return "Notification" in window;
    }

    function updateNotificationButton() {
        const button = byId("enable-smart-notifications");
        if (!button) return;

        if (!notificationSupported()) {
            button.disabled = true;
            button.textContent = "Notifications Not Supported";
            return;
        }

        if (Notification.permission === "granted") {
            button.disabled = false;
            button.textContent = "🔔 Send Today’s Reminder";
        } else if (Notification.permission === "denied") {
            button.disabled = true;
            button.textContent = "Notifications Blocked in Browser";
        } else {
            button.disabled = false;
            button.textContent = "🔔 Enable Browser Reminders";
        }
    }

    function sendNotification(force) {
        if (!notificationSupported() || Notification.permission !== "granted") return;

        const state = reminderState();
        const today = localDateKey(new Date());
        const previous = localStorage.getItem(NOTIFICATION_KEY);
        if (!force && previous === today) return;

        const title = state.goal
            ? "AI Action Assistant: " + state.label
            : "AI Action Assistant Reminder";
        const body = state.missions.unfinished
            ? state.missions.priority
            : state.message;

        new Notification(title, {body: body});
        localStorage.setItem(NOTIFICATION_KEY, today);
    }

    async function handleNotificationButton() {
        if (!notificationSupported()) {
            showStatus("Browser notifications are not supported here.", "error");
            return;
        }

        try {
            if (Notification.permission === "default") {
                const permission = await Notification.requestPermission();
                updateNotificationButton();

                if (permission !== "granted") {
                    showStatus(
                        "Notifications were not enabled. In-page reminders still work.",
                        "info"
                    );
                    return;
                }
            }

            if (Notification.permission === "granted") {
                sendNotification(true);
                showStatus("✅ Today’s browser reminder was sent.", "success");
            }
        } catch (error) {
            showStatus("Browser notification could not be sent.", "error");
        }
    }

    function addStyles() {
        if (byId("smart-reminder-styles")) return;

        const style = document.createElement("style");
        style.id = "smart-reminder-styles";
        style.textContent = [
            ".smart-reminder-section{max-width:850px;margin:28px auto;}",
            ".smart-reminder-card{background:#fff;border:1px solid #bfd5ff;border-radius:20px;",
            "padding:28px;box-shadow:0 10px 25px rgba(30,79,180,.08);}",
            ".smart-reminder-heading{display:flex;align-items:center;justify-content:space-between;",
            "gap:12px;flex-wrap:wrap;margin-bottom:16px;}",
            ".smart-reminder-heading h2{margin:0;color:#1747b5;}",
            ".smart-reminder-badge{padding:7px 13px;border-radius:999px;font-weight:800;}",
            ".smart-reminder-panel{border-left:7px solid #2563eb;background:#eff6ff;",
            "border-radius:14px;padding:18px;}",
            ".smart-reminder-panel.safe{border-color:#2563eb;background:#eff6ff;}",
            ".smart-reminder-panel.upcoming{border-color:#f59e0b;background:#fffbeb;}",
            ".smart-reminder-panel.urgent{border-color:#dc2626;background:#fef2f2;}",
            ".smart-reminder-panel.complete{border-color:#16a34a;background:#f0fdf4;}",
            ".smart-reminder-panel.safe .smart-reminder-badge{background:#dbeafe;color:#1d4ed8;}",
            ".smart-reminder-panel.upcoming .smart-reminder-badge{background:#fef3c7;color:#92400e;}",
            ".smart-reminder-panel.urgent .smart-reminder-badge{background:#fee2e2;color:#991b1b;}",
            ".smart-reminder-panel.complete .smart-reminder-badge{background:#dcfce7;color:#166534;}",
            ".smart-reminder-message{font-weight:700;color:#243b63;margin:0 0 14px;}",
            ".smart-reminder-metrics{display:grid;grid-template-columns:1fr 1fr;gap:12px;}",
            ".smart-reminder-metric{background:rgba(255,255,255,.75);border-radius:10px;",
            "padding:12px;font-weight:700;color:#314766;}",
            ".smart-reminder-priority{margin-top:14px;background:#fff;border-radius:10px;padding:14px;}",
            ".smart-reminder-priority strong{display:block;color:#1747b5;margin-bottom:5px;}",
            ".smart-reminder-button{width:100%;margin-top:16px;border:0;border-radius:11px;",
            "padding:13px 18px;background:linear-gradient(90deg,#2563eb,#4f46e5);",
            "color:#fff;font-size:16px;font-weight:800;cursor:pointer;}",
            ".smart-reminder-button:disabled{background:#94a3b8;cursor:not-allowed;}",
            ".smart-reminder-status{display:none;margin-top:12px;padding:11px;border-radius:9px;font-weight:600;}",
            ".smart-reminder-status.success{background:#dcfce7;color:#166534;}",
            ".smart-reminder-status.info{background:#dbeafe;color:#1e40af;}",
            ".smart-reminder-status.error{background:#fee2e2;color:#991b1b;}",
            "@media(max-width:600px){.smart-reminder-metrics{grid-template-columns:1fr;}}"
        ].join("");
        document.head.appendChild(style);
    }

    function buildInterface() {
        if (byId("smart-reminder-section")) return;
        addStyles();

        const section = document.createElement("section");
        section.id = "smart-reminder-section";
        section.className = "smart-reminder-section";
        section.innerHTML = [
            '<div class="smart-reminder-card">',
            '<div class="smart-reminder-heading">',
            '<h2>🔔 Smart Reminders & Deadline Alerts</h2>',
            '<span id="smart-reminder-badge" class="smart-reminder-badge"></span>',
            "</div>",
            '<div id="smart-reminder-panel" class="smart-reminder-panel">',
            '<p id="smart-reminder-message" class="smart-reminder-message"></p>',
            '<div class="smart-reminder-metrics">',
            '<div id="smart-reminder-deadline" class="smart-reminder-metric"></div>',
            '<div id="smart-reminder-missions" class="smart-reminder-metric"></div>',
            "</div>",
            '<div class="smart-reminder-priority">',
            '<strong>🎯 Today’s Priority</strong>',
            '<span id="smart-reminder-priority"></span>',
            "</div>",
            "</div>",
            '<button type="button" id="enable-smart-notifications" class="smart-reminder-button"></button>',
            '<div id="smart-reminder-status" class="smart-reminder-status" role="status"></div>',
            "</div>"
        ].join("");

        const manager = byId("goal-manager-section");
        const form = byId("goal-form");
        if (manager && manager.parentNode) {
            manager.parentNode.insertBefore(section, manager.nextSibling);
        } else if (form && form.parentNode) {
            form.parentNode.insertBefore(section, form);
        } else {
            document.body.insertBefore(section, document.body.firstChild);
        }

        byId("enable-smart-notifications").addEventListener(
            "click",
            handleNotificationButton
        );

        document.querySelectorAll(".mission-checkbox").forEach(function (checkbox) {
            checkbox.addEventListener("change", function () {
                window.setTimeout(render, 50);
            });
        });

        const deadlineInput = byId("deadline");
        if (deadlineInput) deadlineInput.addEventListener("change", render);

        render();
        sendNotification(false);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildInterface);
    } else {
        buildInterface();
    }
})();
