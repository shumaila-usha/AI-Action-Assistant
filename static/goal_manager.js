(function () {
    "use strict";

    const REGISTRY_KEY = "ai-action-assistant-goals";

    function byId(id) {
        return document.getElementById(id);
    }

    function safeGoalKey(goal) {
        return (goal || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function readJson(key, fallback) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key));
            return parsed === null ? fallback : parsed;
        } catch (error) {
            return fallback;
        }
    }

    function readRegistry() {
        const records = readJson(REGISTRY_KEY, []);
        return Array.isArray(records) ? records : [];
    }

    function writeRegistry(records) {
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(records));
    }

    function currentFormData() {
        const tracker = byId("progress-tracker");
        const goalInput = byId("goal");
        const deadlineInput = byId("deadline");
        const experienceInput = byId("experience_level");
        const dailyTimeInput = byId("daily_time");
        const goal = tracker && tracker.dataset.goal
            ? tracker.dataset.goal.trim()
            : goalInput && goalInput.value
                ? goalInput.value.trim()
                : "";

        return {
            id: safeGoalKey(goal),
            goal: goal,
            deadline: deadlineInput ? deadlineInput.value : "",
            experience_level: experienceInput ? experienceInput.value : "",
            daily_time: dailyTimeInput ? dailyTimeInput.value : "",
            action_plan: currentActionPlan(),
            archived: false,
            updated_at: new Date().toISOString()
        };
    }

    function currentActionPlan() {
        return Array.from(document.querySelectorAll(".step-checkbox"))
            .map(function (checkbox) {
                const label = document.querySelector(
                    'label[for="' + checkbox.id + '"]'
                );
                return label ? label.textContent.trim() : "";
            })
            .filter(function (step) {
                return Boolean(step);
            });
    }

    function historyFor(goalId) {
        const history = readJson("mission-history-" + goalId, []);
        return Array.isArray(history) ? history : [];
    }

    function goalStats(goalId) {
        const history = historyFor(goalId);
        if (!history.length) {
            return {percentage: 0, days: 0, status: "Not Started"};
        }

        const percentages = history.map(function (day) {
            const value = Number(day.percentage);
            return Number.isFinite(value) ? value : 0;
        });
        const average = Math.round(
            percentages.reduce(function (sum, value) {
                return sum + value;
            }, 0) / percentages.length
        );

        let status = "Needs Attention";
        if (average >= 75) status = "Strong Progress";
        else if (average >= 50) status = "On Track";
        else if (average > 0) status = "Building Momentum";

        return {percentage: average, days: history.length, status: status};
    }

    function saveCurrentGoal() {
        const current = currentFormData();
        if (!current.goal || !current.id || current.goal === "None") return;

        const records = readRegistry();
        const existingIndex = records.findIndex(function (record) {
            return record.id === current.id;
        });

        if (existingIndex >= 0) {
            current.archived = Boolean(records[existingIndex].archived);
            current.created_at = records[existingIndex].created_at || current.updated_at;
            if (!current.action_plan.length && Array.isArray(records[existingIndex].action_plan)) {
                current.action_plan = records[existingIndex].action_plan;
            }
            records[existingIndex] = Object.assign({}, records[existingIndex], current);
        } else {
            current.created_at = current.updated_at;
            records.push(current);
        }

        writeRegistry(records);
    }

    function discoverReflectionGoals() {
        const records = readRegistry();
        const knownIds = new Set(records.map(function (record) {
            return record.id;
        }));
        const reflections = readJson("dailyReflectionHistory", []);

        if (!Array.isArray(reflections)) return;

        reflections.forEach(function (reflection) {
            const goal = reflection && typeof reflection.goal === "string"
                ? reflection.goal.trim()
                : "";
            const id = safeGoalKey(goal);

            if (!goal || !id || knownIds.has(id)) return;

            records.push({
                id: id,
                goal: goal,
                deadline: "",
                experience_level: "",
                daily_time: "",
                archived: false,
                created_at: reflection.date || new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            knownIds.add(id);
        });

        writeRegistry(records);
    }

    function setFormValue(id, value) {
        const field = byId(id);
        if (field && value) field.value = value;
    }

    function switchGoal(record) {
        const form = byId("goal-form");
        if (!form) return;

        setFormValue("goal", record.goal);
        setFormValue("deadline", record.deadline);
        setFormValue("experience_level", record.experience_level);
        setFormValue("daily_time", record.daily_time);

        let savedPlanInput = byId("saved_action_plan");
        if (!savedPlanInput) {
            savedPlanInput = document.createElement("input");
            savedPlanInput.type = "hidden";
            savedPlanInput.id = "saved_action_plan";
            savedPlanInput.name = "saved_action_plan";
            form.appendChild(savedPlanInput);
        }
        savedPlanInput.value = JSON.stringify(
            Array.isArray(record.action_plan) ? record.action_plan : []
        );

        if (!byId("deadline").value ||
            !byId("experience_level").value ||
            !byId("daily_time").value) {
            form.scrollIntoView({behavior: "smooth", block: "start"});
            showMessage(
                "Complete the missing goal settings, then click Create My Action Plan.",
                "info"
            );
            return;
        }

        showMessage("Opening your selected goal...", "success");
        window.setTimeout(function () {
            if (typeof form.requestSubmit === "function") form.requestSubmit();
            else form.submit();
        }, 250);
    }

    function updateArchive(goalId, archived) {
        const records = readRegistry();
        const record = records.find(function (item) {
            return item.id === goalId;
        });
        if (!record) return;

        record.archived = archived;
        record.updated_at = new Date().toISOString();
        writeRegistry(records);
        renderGoals();
        showMessage(
            archived ? "Goal archived safely." : "Goal restored to the active list.",
            "success"
        );
    }

    function removeGoal(goalId, goalName) {
        const confirmed = window.confirm(
            "Remove this goal from the Goal Manager?\n\n" + goalName +
            "\n\nIts detailed progress data will remain in your browser backup."
        );
        if (!confirmed) return;

        const records = readRegistry().filter(function (record) {
            return record.id !== goalId;
        });
        writeRegistry(records);
        renderGoals();
        showMessage("Goal removed from the manager list.", "info");
    }

    function makeButton(text, className, handler) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.className = "goal-manager-button " + className;
        button.addEventListener("click", handler);
        return button;
    }

    function showMessage(text, type) {
        const message = byId("goal-manager-message");
        if (!message) return;
        message.textContent = text;
        message.className = "goal-manager-message " + type;
        message.style.display = "block";
    }

    function renderGoals() {
        const list = byId("goal-manager-list");
        const count = byId("goal-manager-count");
        const archivedToggle = byId("show-archived-goals");
        if (!list) return;

        const records = readRegistry();
        const showArchived = archivedToggle && archivedToggle.checked;
        const visible = records.filter(function (record) {
            return showArchived || !record.archived;
        });

        if (count) {
            const activeCount = records.filter(function (record) {
                return !record.archived;
            }).length;
            count.textContent = activeCount + " active goal(s)";
        }

        list.innerHTML = "";
        if (!visible.length) {
            const empty = document.createElement("p");
            empty.className = "goal-manager-empty";
            empty.textContent = showArchived
                ? "No saved goals are available yet."
                : "No active saved goals are available.";
            list.appendChild(empty);
            return;
        }

        visible.sort(function (a, b) {
            return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
        });

        visible.forEach(function (record) {
            const stats = goalStats(record.id);
            const card = document.createElement("article");
            card.className = "goal-manager-item" +
                (record.archived ? " archived" : "");

            const title = document.createElement("h3");
            title.textContent = record.goal;

            const meta = document.createElement("p");
            meta.className = "goal-manager-meta";
            meta.textContent = [
                record.deadline ? "Deadline: " + record.deadline : "Deadline not saved",
                stats.days + " tracked day(s)",
                stats.status
            ].join(" • ");

            const progress = document.createElement("div");
            progress.className = "goal-manager-progress";
            const progressBar = document.createElement("span");
            progressBar.style.width = stats.percentage + "%";
            progress.appendChild(progressBar);

            const progressText = document.createElement("strong");
            progressText.className = "goal-manager-percentage";
            progressText.textContent = stats.percentage + "% average completion";

            const actions = document.createElement("div");
            actions.className = "goal-manager-item-actions";

            if (!record.archived) {
                actions.appendChild(makeButton("Open Goal", "open", function () {
                    switchGoal(record);
                }));
                actions.appendChild(makeButton("Archive", "archive", function () {
                    updateArchive(record.id, true);
                }));
            } else {
                actions.appendChild(makeButton("Restore Goal", "open", function () {
                    updateArchive(record.id, false);
                }));
            }

            actions.appendChild(makeButton("Remove", "remove", function () {
                removeGoal(record.id, record.goal);
            }));

            card.appendChild(title);
            card.appendChild(meta);
            card.appendChild(progress);
            card.appendChild(progressText);
            card.appendChild(actions);
            list.appendChild(card);
        });
    }

    function addStyles() {
        if (byId("goal-manager-styles")) return;
        const style = document.createElement("style");
        style.id = "goal-manager-styles";
        style.textContent = [
            ".goal-manager-section{max-width:850px;margin:28px auto;}",
            ".goal-manager-card{background:#fff;border:1px solid #bfd5ff;border-radius:20px;",
            "padding:28px;box-shadow:0 10px 25px rgba(30,79,180,.08);}",
            ".goal-manager-heading{display:flex;justify-content:space-between;gap:12px;",
            "align-items:center;flex-wrap:wrap;margin-bottom:6px;}",
            ".goal-manager-heading h2{color:#1747b5;margin:0;}",
            ".goal-manager-count{background:#e7efff;color:#1747b5;padding:7px 12px;",
            "border-radius:999px;font-weight:700;}",
            ".goal-manager-description{color:#465a78;margin:8px 0 18px;}",
            ".goal-manager-filter{display:flex;align-items:center;gap:8px;margin-bottom:16px;",
            "font-weight:700;color:#233b65;}",
            ".goal-manager-list{display:grid;gap:14px;}",
            ".goal-manager-item{border:1px solid #cfe0ff;background:#f8fbff;",
            "border-radius:15px;padding:18px;}",
            ".goal-manager-item.archived{opacity:.72;background:#f3f4f6;}",
            ".goal-manager-item h3{margin:0 0 8px;color:#123b99;font-size:18px;}",
            ".goal-manager-meta{margin:0 0 12px;color:#52647e;font-size:14px;}",
            ".goal-manager-progress{height:10px;background:#dce9ff;border-radius:999px;overflow:hidden;}",
            ".goal-manager-progress span{display:block;height:100%;background:linear-gradient(90deg,#2563eb,#4f46e5);}",
            ".goal-manager-percentage{display:block;margin-top:7px;color:#173c8c;}",
            ".goal-manager-item-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px;}",
            ".goal-manager-button{border:0;border-radius:9px;padding:10px 15px;color:#fff;",
            "font-weight:700;cursor:pointer;}",
            ".goal-manager-button.open{background:#315bea;}",
            ".goal-manager-button.archive{background:#64748b;}",
            ".goal-manager-button.remove{background:#b91c1c;}",
            ".goal-manager-message{display:none;margin-top:15px;padding:12px;border-radius:10px;font-weight:600;}",
            ".goal-manager-message.success{background:#dcfce7;color:#166534;}",
            ".goal-manager-message.info{background:#dbeafe;color:#1e40af;}",
            ".goal-manager-empty{text-align:center;color:#60708a;padding:15px;}",
            "@media(max-width:600px){.goal-manager-button{width:100%;}}"
        ].join("");
        document.head.appendChild(style);
    }

    function buildInterface() {
        if (byId("goal-manager-section")) return;

        saveCurrentGoal();
        discoverReflectionGoals();
        addStyles();

        const section = document.createElement("section");
        section.id = "goal-manager-section";
        section.className = "goal-manager-section";
        section.innerHTML = [
            '<div class="goal-manager-card">',
            '<div class="goal-manager-heading">',
            '<h2>🎯 Multiple Goal Manager</h2>',
            '<span id="goal-manager-count" class="goal-manager-count"></span>',
            "</div>",
            '<p class="goal-manager-description">Save, review, switch, and archive your goals without mixing their progress.</p>',
            '<label class="goal-manager-filter">',
            '<input type="checkbox" id="show-archived-goals"> Show archived goals',
            "</label>",
            '<div id="goal-manager-list" class="goal-manager-list"></div>',
            '<div id="goal-manager-message" class="goal-manager-message" role="status"></div>',
            "</div>"
        ].join("");

        const form = byId("goal-form");
        if (form && form.parentNode) {
            form.parentNode.insertBefore(section, form);
        } else {
            document.body.insertBefore(section, document.body.firstChild);
        }

        byId("show-archived-goals").addEventListener("change", renderGoals);
        renderGoals();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildInterface);
    } else {
        buildInterface();
    }
})();
