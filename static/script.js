document.addEventListener("DOMContentLoaded", function () {

    // ==================================================
    // PAGE ELEMENTS
    // ==================================================

    const stepCheckboxes =
        document.querySelectorAll(".step-checkbox");

    const missionCheckboxes =
        document.querySelectorAll(".mission-checkbox");

    const progressFill =
        document.getElementById("progress-fill");

    const progressText =
        document.getElementById("progress-text");

    const missionProgressFill =
        document.getElementById("mission-progress-fill");

    const missionProgressText =
        document.getElementById("mission-progress-text");

    const progressTracker =
        document.getElementById("progress-tracker");

    const dailyMissionSection =
        document.getElementById("daily-mission-section");

    const resetButton =
        document.getElementById("reset-progress");

    const downloadButton =
        document.getElementById("download-plan");


    // ==================================================
    // PROGRESS INTELLIGENCE ELEMENTS
    // ==================================================

    const intelligencePercentage =
        document.getElementById("intelligence-percentage");

    const intelligenceStatus =
        document.getElementById("intelligence-status");

    const intelligenceMessage =
        document.getElementById("intelligence-message");


    // ==================================================
    // HISTORY ELEMENTS
    // ==================================================

    const dailyHistoryList =
        document.getElementById("daily-history-list");

    const historyEmptyMessage =
        document.getElementById("history-empty-message");


    // ==================================================
    // ACTION DNA ELEMENTS
    // ==================================================

    const actionDnaMessage =
        document.getElementById("action-dna-message");

    const actionDnaResults =
        document.getElementById("action-dna-results");

    const actionDnaAverage =
        document.getElementById("action-dna-average");

    const actionDnaBestDay =
        document.getElementById("action-dna-best-day");

    const actionDnaWeakestDay =
        document.getElementById("action-dna-weakest-day");

    const actionDnaInsights =
        document.getElementById("action-dna-insights");


    // ==================================================
    // GOAL RISK ELEMENTS
    // ==================================================

    const goalRiskSection =
        document.getElementById("goal-risk-section");

    const goalRiskStatus =
        document.getElementById("goal-risk-status");

    const goalRiskScore =
        document.getElementById("goal-risk-score");

    const goalRiskMessage =
        document.getElementById("goal-risk-message");


    // ==================================================
    // RECOVERY COACH ELEMENTS
    // ==================================================

    const recoveryCoachSection =
        document.getElementById("recovery-coach-section");

    const recoveryMode =
        document.getElementById("recovery-mode");

    const recoveryMessage =
        document.getElementById("recovery-message");

    const recoveryActions =
        document.getElementById("recovery-actions");


    // ==================================================
    // FORM ELEMENTS
    // ==================================================

    const mainForm =
        document.getElementById("goal-form");

    const goalInput =
        document.getElementById("goal");

    const deadlineInput =
        document.getElementById("deadline");

    const dailyTimeInput =
        document.getElementById("daily_time");

    const performanceHistoryInput =
        document.getElementById("performance_history");


    // ==================================================
    // CURRENT GOAL AND DATE
    // ==================================================

    let currentGoal = "default-goal";

    if (progressTracker) {

        currentGoal =
            progressTracker.dataset.goal ||
            "default-goal";

    } else if (
        goalInput &&
        goalInput.value.trim()
    ) {

        currentGoal =
            goalInput.value.trim();
    }


    function createSafeGoalKey(goal) {

        return (
            goal ||
            "default-goal"
        )
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            );
    }


    const safeGoalKey =
        createSafeGoalKey(
            currentGoal
        );


    let missionDate = "";

    if (dailyMissionSection) {

        missionDate =
            dailyMissionSection.dataset.date ||
            "";
    }

    if (!missionDate) {

        missionDate =
            new Date()
                .toISOString()
                .slice(0, 10);
    }


    // ==================================================
    // STORAGE KEYS
    // ==================================================

    function getActionStorageKey() {

        return (
            "action-progress-" +
            safeGoalKey
        );
    }


    function getMissionStorageKey() {

        return (
            "mission-progress-" +
            safeGoalKey +
            "-" +
            missionDate
        );
    }


    function getHistoryStorageKey() {

        return (
            "mission-history-" +
            safeGoalKey
        );
    }


    // ==================================================
    // ACTION PLAN STORAGE
    // ==================================================

    function loadActionProgress() {

        const saved =
            localStorage.getItem(
                getActionStorageKey()
            );

        if (!saved) {
            stepCheckboxes.forEach(
                function (checkbox) {
                    checkbox.checked = false;
                }
            );

            return;
        }

        try {

            const states =
                JSON.parse(saved);

            stepCheckboxes.forEach(
                function (checkbox, index) {

                    if (
                        states[index] !==
                        undefined
                    ) {

                        checkbox.checked =
                            states[index];
                    }
                }
            );

        } catch (error) {

            console.log(
                "Could not load action progress:",
                error
            );
        }
    }


    function saveActionProgress() {

        const states =
            Array.from(
                stepCheckboxes
            ).map(
                function (checkbox) {

                    return checkbox.checked;
                }
            );

        localStorage.setItem(
            getActionStorageKey(),
            JSON.stringify(states)
        );
    }


    // ==================================================
    // MISSION STORAGE
    // ==================================================

    function loadMissionProgress() {

        const saved =
            localStorage.getItem(
                getMissionStorageKey()
            );

        if (!saved) {
            return;
        }

        try {

            const states =
                JSON.parse(saved);

            missionCheckboxes.forEach(
                function (checkbox, index) {

                    if (
                        states[index] !==
                        undefined
                    ) {

                        checkbox.checked =
                            states[index];
                    }
                }
            );

        } catch (error) {

            console.log(
                "Could not load mission progress:",
                error
            );
        }
    }


    function saveMissionProgress() {

        const states =
            Array.from(
                missionCheckboxes
            ).map(
                function (checkbox) {

                    return checkbox.checked;
                }
            );

        localStorage.setItem(
            getMissionStorageKey(),
            JSON.stringify(states)
        );
    }


    // ==================================================
    // ACTION PLAN PROGRESS
    // ==================================================

    function getCompletedActionSteps() {

        return Array.from(
            stepCheckboxes
        ).filter(
            function (checkbox) {

                return checkbox.checked;
            }
        ).length;
    }


    function updateActionProgress() {

        if (
            !stepCheckboxes.length ||
            !progressFill ||
            !progressText
        ) {
            return;
        }

        const completed =
            getCompletedActionSteps();

        const total =
            stepCheckboxes.length;

        const percentage =
            Math.round(
                (completed / total) * 100
            );

        progressFill.style.width =
            percentage + "%";

        progressText.textContent =
            completed +
            " of " +
            total +
            " steps completed (" +
            percentage +
            "%)";
    }


    // ==================================================
    // PROGRESS INTELLIGENCE
    // ==================================================

    function getProgressStatus(percentage) {

        if (percentage === 100) {

            return {
                status: "Excellent",
                message:
                    "Amazing work! You completed all of today's missions.",
                emoji: "🔥"
            };
        }

        if (percentage >= 75) {

            return {
                status: "Very Good",
                message:
                    "Strong progress. You are very close to completing today's plan.",
                emoji: "💪"
            };
        }

        if (percentage >= 50) {

            return {
                status: "Good",
                message:
                    "Good progress. Complete one more mission to improve today's result.",
                emoji: "👍"
            };
        }

        if (percentage > 0) {

            return {
                status: "Needs Improvement",
                message:
                    "You started well. Focus on the next priority mission.",
                emoji: "🎯"
            };
        }

        return {
            status: "Not Started",
            message:
                "Your missions are ready. Start with the easiest important task.",
            emoji: "⏳"
        };
    }


    function updateProgressIntelligence(
        percentage
    ) {

        if (
            !intelligencePercentage ||
            !intelligenceStatus ||
            !intelligenceMessage
        ) {
            return;
        }

        const analysis =
            getProgressStatus(
                percentage
            );

        intelligencePercentage.textContent =
            percentage + "%";

        intelligenceStatus.textContent =
            analysis.status;

        intelligenceMessage.textContent =
            analysis.message;
    }


    // ==================================================
    // DAILY HISTORY
    // ==================================================

    function getDailyHistory() {

        const saved =
            localStorage.getItem(
                getHistoryStorageKey()
            );

        if (!saved) {
            return [];
        }

        try {

            const history =
                JSON.parse(saved);

            return Array.isArray(history)
                ? history
                : [];

        } catch (error) {

            console.log(
                "Could not read history:",
                error
            );

            return [];
        }
    }


    function saveDailyHistory(
        completed,
        total,
        percentage
    ) {

        const history =
            getDailyHistory();

        const analysis =
            getProgressStatus(
                percentage
            );

        const todayRecord = {
            date: missionDate,
            completed: completed,
            total: total,
            percentage: percentage,
            status: analysis.status
        };

        const existingIndex =
            history.findIndex(
                function (record) {

                    return (
                        record.date ===
                        missionDate
                    );
                }
            );

        if (existingIndex >= 0) {

            history[existingIndex] =
                todayRecord;

        } else {

            history.push(
                todayRecord
            );
        }

        history.sort(
            function (a, b) {

                return a.date.localeCompare(
                    b.date
                );
            }
        );

        localStorage.setItem(
            getHistoryStorageKey(),
            JSON.stringify(history)
        );

        displayDailyHistory();

        analyzeActionDNA();

        updateGoalRiskAndRecovery();
    }


    function displayDailyHistory() {

        if (!dailyHistoryList) {
            return;
        }

        const history =
            getDailyHistory();

        dailyHistoryList.innerHTML =
            "";

        if (history.length === 0) {

            if (historyEmptyMessage) {

                historyEmptyMessage.style.display =
                    "block";
            }

            return;
        }

        if (historyEmptyMessage) {

            historyEmptyMessage.style.display =
                "none";
        }

        [...history]
            .reverse()
            .forEach(
                function (record) {

                    const analysis =
                        getProgressStatus(
                            record.percentage
                        );

                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "history-card";

                    const dateHeading =
                        document.createElement(
                            "h3"
                        );

                    dateHeading.textContent =
                        record.date;

                    const missionText =
                        document.createElement(
                            "p"
                        );

                    missionText.textContent =
                        "Missions: " +
                        record.completed +
                        " / " +
                        record.total;

                    const percentageText =
                        document.createElement(
                            "p"
                        );

                    percentageText.textContent =
                        "Completion: " +
                        record.percentage +
                        "%";

                    const statusText =
                        document.createElement(
                            "p"
                        );

                    statusText.textContent =
                        "Status: " +
                        record.status +
                        " " +
                        analysis.emoji;

                    card.appendChild(
                        dateHeading
                    );

                    card.appendChild(
                        missionText
                    );

                    card.appendChild(
                        percentageText
                    );

                    card.appendChild(
                        statusText
                    );

                    dailyHistoryList.appendChild(
                        card
                    );
                }
            );
    }


    // ==================================================
    // ACTION DNA
    // ==================================================

    function resetActionDNAView() {

        if (actionDnaMessage) {

            actionDnaMessage.style.display =
                "block";

            actionDnaMessage.textContent =
                "Complete your daily missions to build your Action DNA.";
        }

        if (actionDnaResults) {

            actionDnaResults.style.display =
                "none";
        }
    }


    function displayActionDNA(actionDNA) {

        if (
            !actionDnaMessage ||
            !actionDnaResults ||
            !actionDnaAverage ||
            !actionDnaBestDay ||
            !actionDnaWeakestDay ||
            !actionDnaInsights
        ) {
            return;
        }

        if (!actionDNA) {

            resetActionDNAView();
            return;
        }

        actionDnaMessage.style.display =
            "none";

        actionDnaResults.style.display =
            "grid";

        actionDnaAverage.textContent =
            (
                actionDNA.average_completion ||
                0
            ) + "%";

        if (actionDNA.best_day) {

            actionDnaBestDay.textContent =
                actionDNA.best_day.date +
                " — " +
                actionDNA.best_day.percentage +
                "%";

        } else {

            actionDnaBestDay.textContent =
                "No data yet";
        }

        if (actionDNA.weakest_day) {

            actionDnaWeakestDay.textContent =
                actionDNA.weakest_day.date +
                " — " +
                actionDNA.weakest_day.percentage +
                "%";

        } else {

            actionDnaWeakestDay.textContent =
                "No data yet";
        }

        actionDnaInsights.innerHTML =
            "";

        const insights =
            Array.isArray(
                actionDNA.insights
            )
                ? actionDNA.insights
                : [];

        insights.forEach(
            function (insight) {

                const item =
                    document.createElement(
                        "li"
                    );

                item.textContent =
                    insight;

                actionDnaInsights.appendChild(
                    item
                );
            }
        );
    }


    async function analyzeActionDNA() {

        const history =
            getDailyHistory();

        if (!history.length) {

            resetActionDNAView();
            return;
        }

        try {

            const response =
                await fetch(
                    "/analyze-action-dna",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                history: history
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Action DNA analysis failed."
                );
            }

            displayActionDNA(
                data.action_dna
            );

        } catch (error) {

            console.log(
                "Could not analyze Action DNA:",
                error
            );

            if (actionDnaMessage) {

                actionDnaMessage.textContent =
                    "Action DNA could not be loaded right now.";
            }
        }
    }


    // ==================================================
    // GOAL RISK DISPLAY
    // ==================================================

    function updateRiskDetail(
        label,
        value
    ) {

        if (!goalRiskSection) {
            return;
        }

        const paragraphs =
            goalRiskSection.querySelectorAll(
                ".goal-risk-details p"
            );

        paragraphs.forEach(
            function (paragraph) {

                const strong =
                    paragraph.querySelector(
                        "strong"
                    );

                if (
                    strong &&
                    strong.textContent.trim() ===
                    label
                ) {

                    paragraph.innerHTML =
                        "<strong>" +
                        label +
                        "</strong> " +
                        value;
                }
            }
        );
    }


    function displayGoalRisk(result) {

        if (
            !goalRiskSection ||
            !goalRiskStatus ||
            !goalRiskScore ||
            !goalRiskMessage
        ) {
            return;
        }

        goalRiskStatus.textContent =
            result.status;

        goalRiskScore.textContent =
            result.risk_score + "/100";

        goalRiskMessage.textContent =
            result.message;

        goalRiskSection.classList.remove(
            "goal-risk-on-track",
            "goal-risk-needs-attention",
            "goal-risk-at-risk"
        );

        const statusClass =
            "goal-risk-" +
            result.status
                .toLowerCase()
                .replace(/\s+/g, "-");

        goalRiskSection.classList.add(
            statusClass
        );

        updateRiskDetail(
            "Days Remaining:",
            result.days_remaining !== null
                ? result.days_remaining
                : "Deadline unavailable"
        );

        updateRiskDetail(
            "Action Plan Progress:",
            result.plan_progress + "%"
        );

        updateRiskDetail(
            "Average Mission Completion:",
            result.average_completion + "%"
        );

        const oldReasons =
            goalRiskSection.querySelector(
                ".goal-risk-reasons"
            );

        const oldNoRisk =
            goalRiskSection.querySelector(
                ".no-risk-message"
            );

        if (oldReasons) {
            oldReasons.remove();
        }

        if (oldNoRisk) {
            oldNoRisk.remove();
        }

        const reasons =
            Array.isArray(result.reasons)
                ? result.reasons
                : [];

        if (reasons.length > 0) {

            const reasonsBox =
                document.createElement(
                    "div"
                );

            reasonsBox.className =
                "goal-risk-reasons";

            const title =
                document.createElement(
                    "h4"
                );

            title.textContent =
                "Why this status?";

            const list =
                document.createElement(
                    "ul"
                );

            reasons.forEach(
                function (reason) {

                    const item =
                        document.createElement(
                            "li"
                        );

                    item.textContent =
                        reason;

                    list.appendChild(
                        item
                    );
                }
            );

            reasonsBox.appendChild(
                title
            );

            reasonsBox.appendChild(
                list
            );

            goalRiskSection.appendChild(
                reasonsBox
            );

        } else {

            const noRisk =
                document.createElement(
                    "p"
                );

            noRisk.className =
                "no-risk-message";

            noRisk.textContent =
                "✅ No major risk factors detected.";

            goalRiskSection.appendChild(
                noRisk
            );
        }
    }


    // ==================================================
    // RECOVERY COACH DISPLAY
    // ==================================================

    function displayRecoveryPlan(plan) {

        if (!recoveryCoachSection) {
            return;
        }

        if (
            !plan ||
            !plan.active
        ) {

            recoveryCoachSection.style.display =
                "none";

            return;
        }

        recoveryCoachSection.style.display =
            "block";

        if (recoveryMode) {

            recoveryMode.textContent =
                plan.mode;
        }

        if (recoveryMessage) {

            recoveryMessage.textContent =
                plan.message;
        }

        if (!recoveryActions) {
            return;
        }

        recoveryActions.innerHTML =
            "";

        const actions =
            Array.isArray(plan.actions)
                ? plan.actions
                : [];

        actions.forEach(
            function (action, index) {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "recovery-action";

                const number =
                    document.createElement(
                        "div"
                    );

                number.className =
                    "recovery-action-number";

                number.textContent =
                    index + 1;

                const content =
                    document.createElement(
                        "div"
                    );

                content.className =
                    "recovery-action-content";

                const title =
                    document.createElement(
                        "h4"
                    );

                title.textContent =
                    action.title;

                const purpose =
                    document.createElement(
                        "p"
                    );

                purpose.textContent =
                    action.purpose;

                content.appendChild(
                    title
                );

                content.appendChild(
                    purpose
                );

                const duration =
                    document.createElement(
                        "span"
                    );

                duration.className =
                    "recovery-duration";

                duration.textContent =
                    "⏱ " +
                    action.duration +
                    " min";

                card.appendChild(
                    number
                );

                card.appendChild(
                    content
                );

                card.appendChild(
                    duration
                );

                recoveryActions.appendChild(
                    card
                );
            }
        );
    }


    // ==================================================
    // LIVE RISK AND RECOVERY API
    // ==================================================

    async function updateGoalRiskAndRecovery() {

        if (
            !goalRiskSection ||
            !deadlineInput ||
            !stepCheckboxes.length
        ) {
            return;
        }

        const completedSteps =
            getCompletedActionSteps();

        const totalSteps =
            stepCheckboxes.length;

        const history =
            getDailyHistory();

        try {

            const response =
                await fetch(
                    "/predict-goal-risk",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                goal: currentGoal,

                                deadline:
                                    deadlineInput.value,

                                daily_time:
                                    dailyTimeInput
                                        ? dailyTimeInput.value
                                        : "30 minutes",

                                completed_steps:
                                    completedSteps,

                                total_steps:
                                    totalSteps,

                                history: history
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Risk and recovery analysis failed."
                );
            }

            displayGoalRisk(
                data.goal_risk
            );

            displayRecoveryPlan(
                data.recovery_plan
            );

        } catch (error) {

            console.log(
                "Could not update risk and recovery:",
                error
            );
        }
    }


    // ==================================================
    // MISSION PROGRESS
    // ==================================================

    function updateMissionProgress(
        saveHistory = true
    ) {

        if (
            !missionCheckboxes.length ||
            !missionProgressFill ||
            !missionProgressText
        ) {
            return;
        }

        const completed =
            Array.from(
                missionCheckboxes
            ).filter(
                function (checkbox) {

                    return checkbox.checked;
                }
            ).length;

        const total =
            missionCheckboxes.length;

        const percentage =
            Math.round(
                (completed / total) * 100
            );

        missionProgressFill.style.width =
            percentage + "%";

        if (percentage === 100) {

            missionProgressText.textContent =
                "🎉 Daily Mission Complete! " +
                completed +
                " of " +
                total +
                " missions completed (100%)";

        } else {

            missionProgressText.textContent =
                completed +
                " of " +
                total +
                " missions completed (" +
                percentage +
                "%)";
        }

        updateProgressIntelligence(
            percentage
        );

        if (saveHistory) {

            saveDailyHistory(
                completed,
                total,
                percentage
            );
        }
    }


    // ==================================================
    // CHECKBOX EVENTS
    // ==================================================

    stepCheckboxes.forEach(
        function (checkbox) {

            checkbox.addEventListener(
                "change",
                function () {

                    saveActionProgress();

                    updateActionProgress();

                    updateGoalRiskAndRecovery();
                }
            );
        }
    );


    missionCheckboxes.forEach(
        function (checkbox) {

            checkbox.addEventListener(
                "change",
                function () {

                    saveMissionProgress();

                    updateMissionProgress(
                        true
                    );
                }
            );
        }
    );


    // ==================================================
    // SEND HISTORY WITH FORM
    // ==================================================

    if (
        mainForm &&
        performanceHistoryInput
    ) {

        mainForm.addEventListener(
            "submit",
            function () {

                const submittedGoal =
                    goalInput &&
                    goalInput.value.trim()
                        ? goalInput.value.trim()
                        : currentGoal;

                const submittedKey =
                    createSafeGoalKey(
                        submittedGoal
                    );

                const savedHistory =
                    localStorage.getItem(
                        "mission-history-" +
                        submittedKey
                    );

                performanceHistoryInput.value =
                    savedHistory || "[]";
            }
        );
    }


    // ==================================================
    // RESET PROGRESS
    // ==================================================

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            function () {

                const confirmed =
                    confirm(
                        "Are you sure you want to reset today's progress for this goal?"
                    );

                if (!confirmed) {
                    return;
                }

                stepCheckboxes.forEach(
                    function (checkbox) {

                        checkbox.checked =
                            false;
                    }
                );

                missionCheckboxes.forEach(
                    function (checkbox) {

                        checkbox.checked =
                            false;
                    }
                );

                localStorage.removeItem(
                    getActionStorageKey()
                );

                localStorage.removeItem(
                    getMissionStorageKey()
                );

                updateActionProgress();

                updateMissionProgress(
                    true
                );

                updateGoalRiskAndRecovery();
            }
        );
    }


    // ==================================================
    // DOWNLOAD ACTION PLAN
    // ==================================================

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            function () {

                let planText =
                    "AI ACTION ASSISTANT\n\n";

                planText +=
                    "GOAL\n====\n";

                planText +=
                    currentGoal + "\n\n";

                planText +=
                    "SMART ACTION PLAN\n";

                planText +=
                    "=================\n\n";

                stepCheckboxes.forEach(
                    function (checkbox, index) {

                        const label =
                            document.querySelector(
                                `label[for="${checkbox.id}"]`
                            );

                        if (label) {

                            const status =
                                checkbox.checked
                                    ? "[Completed]"
                                    : "[Pending]";

                            planText +=
                                (index + 1) +
                                ". " +
                                status +
                                " " +
                                label.textContent.trim() +
                                "\n";
                        }
                    }
                );

                if (
                    missionCheckboxes.length >
                    0
                ) {

                    planText +=
                        "\nTODAY'S MISSIONS\n";

                    planText +=
                        "================\n";

                    planText +=
                        "Date: " +
                        missionDate +
                        "\n\n";

                    missionCheckboxes.forEach(
                        function (checkbox, index) {

                            const label =
                                document.querySelector(
                                    `label[for="${checkbox.id}"]`
                                );

                            if (label) {

                                const status =
                                    checkbox.checked
                                        ? "[Completed]"
                                        : "[Pending]";

                                planText +=
                                    (index + 1) +
                                    ". " +
                                    status +
                                    " " +
                                    label.textContent.trim() +
                                    "\n";
                            }
                        }
                    );
                }

                const blob =
                    new Blob(
                        [planText],
                        {
                            type: "text/plain"
                        }
                    );

                const url =
                    URL.createObjectURL(
                        blob
                    );

                const link =
                    document.createElement(
                        "a"
                    );

                link.href =
                    url;

                link.download =
                    "AI_Action_Plan.txt";

                link.click();

                URL.revokeObjectURL(
                    url
                );
            }
        );
    }


    // ==================================================
    // INITIAL PAGE LOAD
    // ==================================================

    loadActionProgress();

    loadMissionProgress();

    updateActionProgress();

    updateMissionProgress(
        false
    );

    displayDailyHistory();

    analyzeActionDNA();

    updateGoalRiskAndRecovery();

});
