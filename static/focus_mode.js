document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const missionSection =
        document.getElementById("daily-mission-section");

    if (!missionSection) {
        return;
    }

    const missionCheckboxes = Array.from(
        document.querySelectorAll(".mission-checkbox")
    );

    if (!missionCheckboxes.length) {
        return;
    }

    let timerInterval = null;
    let selectedMissionId = "";
    let durationSeconds = 0;
    let remainingSeconds = 0;
    let isRunning = false;
    let endsAt = null;

    function safeKey(value) {
        return (value || "default")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-");
    }

    function currentGoal() {
        const tracker =
            document.getElementById("progress-tracker");
        const input =
            document.getElementById("goal");

        if (tracker && tracker.dataset.goal) {
            return tracker.dataset.goal;
        }

        return input && input.value.trim()
            ? input.value.trim()
            : "default-goal";
    }

    function currentDate() {
        return missionSection.dataset.date ||
            new Date().toISOString().slice(0, 10);
    }

    function storageKey() {
        return (
            "focus-mode-" +
            safeKey(currentGoal()) +
            "-" +
            currentDate()
        );
    }

    function missionLabel(checkbox) {
        const label = document.querySelector(
            'label[for="' + checkbox.id + '"]'
        );

        return label
            ? label.textContent.trim()
            : "Mission";
    }

    function missionMinutes(checkbox) {
        const card = checkbox.closest(".mission-card");
        const duration = card
            ? card.querySelector(".mission-duration")
            : null;
        const match = duration
            ? duration.textContent.match(/\d+/)
            : null;

        return match
            ? Math.max(1, Number(match[0]))
            : 25;
    }

    function addStyles() {
        if (document.getElementById("focus-mode-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "focus-mode-styles";
        style.textContent =
            ".focus-mode-section{width:100%;max-width:850px;margin:28px auto;}" +
            ".focus-mode-section>h2{margin-bottom:14px;color:#1e40af;font-size:26px;}" +
            ".focus-mode-card{padding:28px;border:1px solid #c7d2fe;border-radius:22px;background:linear-gradient(135deg,#fff,#eef2ff);box-shadow:0 16px 35px rgba(30,64,175,.13);}" +
            ".focus-mode-select{width:100%;margin-bottom:20px;padding:13px 15px;border:2px solid #bfdbfe;border-radius:12px;color:#1e293b;background:#fff;font:inherit;}" +
            ".focus-mode-clock{margin:8px 0 20px;color:#1d4ed8;font-size:48px;font-weight:850;text-align:center;letter-spacing:2px;}" +
            ".focus-mode-progress{height:12px;margin-bottom:20px;overflow:hidden;border-radius:999px;background:#dbeafe;}" +
            ".focus-mode-fill{width:0;height:100%;border-radius:999px;background:linear-gradient(90deg,#2563eb,#4f46e5);transition:width .3s ease;}" +
            ".focus-mode-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}" +
            ".focus-mode-buttons button{padding:12px;font-size:15px;}" +
            ".focus-mode-message{margin-top:18px;color:#475569;text-align:center;font-weight:650;line-height:1.5;}" +
            "@media(max-width:600px){.focus-mode-card{padding:20px}.focus-mode-clock{font-size:38px}.focus-mode-buttons{grid-template-columns:1fr}}";
        document.head.appendChild(style);
    }

    const section = document.createElement("section");
    section.id = "focus-mode-section";
    section.className = "focus-mode-section";

    const heading = document.createElement("h2");
    heading.textContent = "⏱ AI Focus Mode";

    const card = document.createElement("div");
    card.className = "focus-mode-card";

    const select = document.createElement("select");
    select.id = "focus-mission-select";
    select.className = "focus-mode-select";
    select.setAttribute("aria-label", "Select a mission to focus on");

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select one mission...";
    select.appendChild(defaultOption);

    missionCheckboxes.forEach(function (checkbox) {
        const option = document.createElement("option");
        option.value = checkbox.id;
        option.textContent =
            missionLabel(checkbox) +
            " (" +
            missionMinutes(checkbox) +
            " min)";
        option.disabled = checkbox.checked;
        select.appendChild(option);
    });

    const clock = document.createElement("div");
    clock.id = "focus-mode-clock";
    clock.className = "focus-mode-clock";
    clock.textContent = "00:00";

    const progress = document.createElement("div");
    progress.className = "focus-mode-progress";

    const fill = document.createElement("div");
    fill.id = "focus-mode-fill";
    fill.className = "focus-mode-fill";
    progress.appendChild(fill);

    const buttons = document.createElement("div");
    buttons.className = "focus-mode-buttons";

    const startButton = document.createElement("button");
    startButton.type = "button";
    startButton.id = "focus-start";
    startButton.textContent = "Start";

    const pauseButton = document.createElement("button");
    pauseButton.type = "button";
    pauseButton.id = "focus-pause";
    pauseButton.textContent = "Pause";

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.id = "focus-reset";
    resetButton.textContent = "Reset";

    buttons.appendChild(startButton);
    buttons.appendChild(pauseButton);
    buttons.appendChild(resetButton);

    const message = document.createElement("p");
    message.id = "focus-mode-message";
    message.className = "focus-mode-message";
    message.textContent =
        "Choose one mission and give it your full attention.";

    card.appendChild(select);
    card.appendChild(clock);
    card.appendChild(progress);
    card.appendChild(buttons);
    card.appendChild(message);
    section.appendChild(heading);
    section.appendChild(card);

    missionSection.insertAdjacentElement("afterend", section);

    function formatTime(seconds) {
        const safeSeconds = Math.max(0, Math.ceil(seconds));
        const minutes = Math.floor(safeSeconds / 60);
        const remaining = safeSeconds % 60;

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(remaining).padStart(2, "0")
        );
    }

    function saveState() {
        localStorage.setItem(
            storageKey(),
            JSON.stringify({
                missionId: selectedMissionId,
                durationSeconds: durationSeconds,
                remainingSeconds: remainingSeconds,
                running: isRunning,
                endsAt: endsAt
            })
        );
    }

    function updateDisplay() {
        const allMissionsComplete =
            missionCheckboxes.every(function (checkbox) {
                return checkbox.checked;
            });

        clock.textContent = formatTime(remainingSeconds);

        const completed = durationSeconds > 0
            ? durationSeconds - remainingSeconds
            : 0;
        const percent = durationSeconds > 0
            ? Math.min(100, Math.max(
                0,
                (completed / durationSeconds) * 100
            ))
            : 0;

        fill.style.width = percent + "%";
        defaultOption.textContent = allMissionsComplete
            ? "🎉 All missions are completed!"
            : "Select one mission...";

        select.disabled =
            isRunning || allMissionsComplete;

        startButton.disabled =
            allMissionsComplete ||
            isRunning || !selectedMissionId ||
            remainingSeconds <= 0;
        pauseButton.disabled =
            allMissionsComplete || !isRunning;
        resetButton.disabled =
            allMissionsComplete || !selectedMissionId;

        if (allMissionsComplete && !isRunning) {
            message.textContent =
                "🎉 All missions are completed! No focus session is needed.";
        } else if (
            !allMissionsComplete &&
            !selectedMissionId &&
            message.textContent.includes(
                "All missions are completed"
            )
        ) {
            message.textContent =
                "Choose one mission and give it your full attention.";
        }
    }

    function stopInterval() {
        if (timerInterval !== null) {
            window.clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function completeFocusedMission() {
        stopInterval();
        isRunning = false;
        remainingSeconds = 0;
        endsAt = null;

        const checkbox =
            document.getElementById(selectedMissionId);

        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            checkbox.dispatchEvent(
                new Event("change", { bubbles: true })
            );
        }

        message.textContent =
            "🎉 Focus session completed! Your mission was marked complete.";
        saveState();
        updateDisplay();
    }

    function tick() {
        if (!isRunning || !endsAt) {
            return;
        }

        remainingSeconds = Math.max(
            0,
            Math.ceil((endsAt - Date.now()) / 1000)
        );

        if (remainingSeconds <= 0) {
            completeFocusedMission();
            return;
        }

        saveState();
        updateDisplay();
    }

    function startTimer() {
        if (!selectedMissionId || remainingSeconds <= 0) {
            return;
        }

        isRunning = true;
        endsAt = Date.now() + remainingSeconds * 1000;
        message.textContent =
            "🧠 Focus mode is active. Stay with this one mission.";
        stopInterval();
        timerInterval = window.setInterval(tick, 1000);
        saveState();
        updateDisplay();
    }

    function pauseTimer() {
        if (!isRunning) {
            return;
        }

        tick();
        isRunning = false;
        endsAt = null;
        stopInterval();
        message.textContent =
            "⏸ Timer paused. Continue when you are ready.";
        saveState();
        updateDisplay();
    }

    function resetTimer() {
        stopInterval();
        isRunning = false;
        endsAt = null;

        const checkbox =
            document.getElementById(selectedMissionId);
        remainingSeconds = checkbox
            ? missionMinutes(checkbox) * 60
            : 0;
        durationSeconds = remainingSeconds;
        message.textContent =
            "Timer reset. Press Start when you are ready.";
        saveState();
        updateDisplay();
    }

    function chooseMission() {
        stopInterval();
        isRunning = false;
        endsAt = null;
        selectedMissionId = select.value;

        const checkbox =
            document.getElementById(selectedMissionId);
        durationSeconds = checkbox
            ? missionMinutes(checkbox) * 60
            : 0;
        remainingSeconds = durationSeconds;
        message.textContent = selectedMissionId
            ? "Mission selected. Press Start to begin."
            : "Choose one mission and give it your full attention.";
        saveState();
        updateDisplay();
    }

    function loadState() {
        try {
            const state = JSON.parse(
                localStorage.getItem(storageKey()) || "null"
            );

            const savedCheckbox = state
                ? document.getElementById(state.missionId)
                : null;

            if (
                !state ||
                !savedCheckbox ||
                savedCheckbox.checked
            ) {
                localStorage.removeItem(storageKey());
                updateDisplay();
                return;
            }

            selectedMissionId = state.missionId;
            durationSeconds =
                Math.max(0, Number(state.durationSeconds) || 0);
            remainingSeconds =
                Math.max(0, Number(state.remainingSeconds) || 0);
            isRunning = Boolean(state.running);
            endsAt = state.endsAt
                ? Number(state.endsAt)
                : null;
            select.value = selectedMissionId;

            if (isRunning && endsAt) {
                remainingSeconds = Math.max(
                    0,
                    Math.ceil((endsAt - Date.now()) / 1000)
                );

                if (remainingSeconds <= 0) {
                    completeFocusedMission();
                    return;
                }

                timerInterval = window.setInterval(tick, 1000);
                message.textContent =
                    "🧠 Focus mode is active. Stay with this one mission.";
            } else {
                isRunning = false;
                endsAt = null;
                message.textContent =
                    "Saved focus session restored.";
            }

            updateDisplay();
        } catch (error) {
            localStorage.removeItem(storageKey());
            updateDisplay();
        }
    }

    select.addEventListener("change", chooseMission);
    startButton.addEventListener("click", startTimer);
    pauseButton.addEventListener("click", pauseTimer);
    resetButton.addEventListener("click", resetTimer);

    missionCheckboxes.forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
            const option = select.querySelector(
                'option[value="' + checkbox.id + '"]'
            );

            if (option) {
                option.disabled = checkbox.checked;
            }

            if (
                checkbox.checked &&
                selectedMissionId === checkbox.id
            ) {
                stopInterval();
                selectedMissionId = "";
                durationSeconds = 0;
                remainingSeconds = 0;
                isRunning = false;
                endsAt = null;
                select.value = "";
                saveState();
            }

            updateDisplay();
        });
    });

    addStyles();
    loadState();
});
