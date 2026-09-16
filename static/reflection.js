document.addEventListener("DOMContentLoaded", function () {
    const generateButton = document.getElementById(
        "generate-reflection"
    );

    if (!generateButton) {
        return;
    }

    const loading = document.getElementById(
        "reflection-loading"
    );

    const results = document.getElementById(
        "reflection-results"
    );

    const errorBox = document.getElementById(
        "reflection-error"
    );

    const performanceBox = document.getElementById(
        "reflection-performance"
    );

    const learningBox = document.getElementById(
        "reflection-learning"
    );

    const nextFocusBox = document.getElementById(
        "reflection-next-focus"
    );

    const motivationBox = document.getElementById(
        "reflection-motivation"
    );

    const historyBox = document.getElementById(
        "reflection-history"
    );

    const goalBox = document.getElementById("goal");

    const missionSection = document.getElementById(
        "daily-mission-section"
    );

    const resetButton = document.getElementById(
        "reset-progress"
    );

    const legacyHistoryStorageKey =
        "dailyReflectionHistory";

    function createSafeGoalKey(goal) {
        return (goal || "default-goal")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-");
    }

    function getCurrentDate() {
        if (missionSection && missionSection.dataset.date) {
            return missionSection.dataset.date;
        }

        return new Date().toISOString().split("T")[0];
    }

    function getCurrentGoal() {
        if (goalBox) {
            return goalBox.value.trim();
        }

        return "";
    }

    function getReflectionStorageKey() {
        return (
            "dailyReflection_" +
            getCurrentDate() +
            "_" +
            getCurrentGoal()
        );
    }

    function getHistoryStorageKey() {
        return (
            "dailyReflectionHistory_" +
            createSafeGoalKey(getCurrentGoal())
        );
    }

    function displayReflection(reflection) {
        performanceBox.textContent =
            reflection.performance || "";

        learningBox.textContent =
            reflection.learning || "";

        nextFocusBox.textContent =
            reflection.nextFocus || "";

        motivationBox.textContent =
            reflection.motivation || "";

        results.style.display = "block";
        errorBox.style.display = "none";
    }

    function getReflectionHistory() {
        const savedHistory = localStorage.getItem(
            getHistoryStorageKey()
        );

        if (savedHistory) {
            try {
                const history = JSON.parse(savedHistory);

                return Array.isArray(history)
                    ? history
                    : [];
            } catch (error) {
                return [];
            }
        }

        const legacyHistory = localStorage.getItem(
            legacyHistoryStorageKey
        );

        if (!legacyHistory) {
            return [];
        }

        try {
            const history = JSON.parse(legacyHistory);

            if (Array.isArray(history)) {
                const currentGoalKey = createSafeGoalKey(
                    getCurrentGoal()
                );

                const matchingHistory = history.filter(
                    function (record) {
                        return (
                            record &&
                            createSafeGoalKey(record.goal) ===
                                currentGoalKey
                        );
                    }
                );

                localStorage.setItem(
                    getHistoryStorageKey(),
                    JSON.stringify(matchingHistory)
                );

                return matchingHistory;
            }

            return [];
        } catch (error) {
            return [];
        }
    }

    function saveReflection(reflection) {
        const record = {
            date: getCurrentDate(),
            goal: getCurrentGoal(),
            performance: reflection.performance,
            learning: reflection.learning,
            nextFocus: reflection.nextFocus,
            motivation: reflection.motivation
        };

        localStorage.setItem(
            getReflectionStorageKey(),
            JSON.stringify(record)
        );

        const history = getReflectionHistory();

        const existingIndex = history.findIndex(
            function (item) {
                return (
                    item.date === record.date &&
                    item.goal === record.goal
                );
            }
        );

        if (existingIndex >= 0) {
            history[existingIndex] = record;
        } else {
            history.unshift(record);
        }

        history.sort(function (first, second) {
            return second.date.localeCompare(first.date);
        });

        localStorage.setItem(
            getHistoryStorageKey(),
            JSON.stringify(history)
        );
    }

    function createHistoryParagraph(label, value) {
        const paragraph = document.createElement("p");

        const strong = document.createElement("strong");
        strong.textContent = label;

        paragraph.appendChild(strong);
        paragraph.appendChild(
            document.createTextNode(value || "")
        );

        return paragraph;
    }

    function displayReflectionHistory() {
        if (!historyBox) {
            return;
        }

        const history = getReflectionHistory();
        historyBox.innerHTML = "";

        if (history.length === 0) {
            const emptyMessage = document.createElement("p");

            emptyMessage.textContent =
    "Your previous reflections will appear here.";

            historyBox.appendChild(emptyMessage);
            return;
        }

        history.forEach(function (record) {
            const card = document.createElement("article");
            card.className = "reflection-history-card";

            const dateHeading = document.createElement("h4");
            dateHeading.textContent = "📅 " + record.date;

            card.appendChild(dateHeading);

            if (record.goal) {
                card.appendChild(
                    createHistoryParagraph(
                        "Goal: ",
                        record.goal
                    )
                );
            }

            card.appendChild(
                createHistoryParagraph(
                    "Performance: ",
                    record.performance
                )
            );

            card.appendChild(
                createHistoryParagraph(
                    "Learning: ",
                    record.learning
                )
            );

            card.appendChild(
                createHistoryParagraph(
                    "Next Focus: ",
                    record.nextFocus
                )
            );

            card.appendChild(
                createHistoryParagraph(
                    "Motivation: ",
                    record.motivation
                )
            );

            historyBox.appendChild(card);
        });
    }

    function loadSavedReflection() {
        const savedReflection = localStorage.getItem(
            getReflectionStorageKey()
        );

        if (!savedReflection) {
            return;
        }

        try {
            const reflection = JSON.parse(savedReflection);
            displayReflection(reflection);
        } catch (error) {
            localStorage.removeItem(
                getReflectionStorageKey()
            );
        }
    }

    generateButton.addEventListener(
        "click",
        async function () {
            const missionCheckboxes = Array.from(
                document.querySelectorAll(
                    ".mission-checkbox"
                )
            );

            const takeawayBoxes = Array.from(
                document.querySelectorAll(
                    ".mission-takeaway"
                )
            );

            const completedMissions =
                missionCheckboxes.filter(
                    function (checkbox) {
                        return checkbox.checked;
                    }
                ).length;

            const takeaways = takeawayBoxes
                .map(function (box) {
                    return box.value.trim();
                })
                .filter(function (text) {
                    return text !== "";
                });

            errorBox.style.display = "none";
            results.style.display = "none";
            loading.style.display = "block";

            generateButton.disabled = true;
            generateButton.textContent =
                "Generating Reflection...";

            try {
                const response = await fetch(
                    "/generate-daily-reflection",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            goal: getCurrentGoal(),
                            takeaways: takeaways,
                            completed_missions:
                                completedMissions,
                            total_missions:
                                missionCheckboxes.length
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                        "Could not generate your reflection."
                    );
                }

                const apiReflection =
                    data.reflection || {};

                let reflection;

                if (typeof apiReflection === "string") {
                    reflection = {
                        performance: apiReflection,

                        learning:
                            takeaways.join(" ") ||
                            "No takeaways were added today.",

                        nextFocus:
                            "Continue with your next important mission.",

                        motivation:
                            "Keep moving forward—you are making progress!"
                    };
                } else {
                    reflection = {
                        performance:
                            apiReflection.performance ||
                            apiReflection.performance_summary ||
                            completedMissions +
                            " of " +
                            missionCheckboxes.length +
                            " missions completed.",

                        learning:
                            apiReflection.learning ||
                            apiReflection.learning_summary ||
                            takeaways.join(" ") ||
                            "No takeaways were added today.",

                        nextFocus:
                            apiReflection.next_focus ||
                            apiReflection.next_step ||
                            "Continue with your next important mission.",

                        motivation:
                            apiReflection.motivation ||
                            apiReflection.motivational_message ||
                            "Keep moving forward—you are making progress!"
                    };
                }

                displayReflection(reflection);
                saveReflection(reflection);
                displayReflectionHistory();

            } catch (error) {
                errorBox.textContent = error.message;
                errorBox.style.display = "block";

            } finally {
                loading.style.display = "none";
                generateButton.disabled = false;
                generateButton.textContent =
                    "Generate My Reflection";
            }
        }
    );

    if (resetButton) {
        resetButton.addEventListener(
            "click",
            function () {
                localStorage.removeItem(
                    getReflectionStorageKey()
                );

                localStorage.removeItem(
                    getHistoryStorageKey()
                );
            }
        );
    }

    loadSavedReflection();
    displayReflectionHistory();
});
