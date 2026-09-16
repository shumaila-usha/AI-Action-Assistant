document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const button = document.getElementById("generate-weekly-report");
    if (!button) return;

    const loading = document.getElementById("weekly-report-loading");
    const errorBox = document.getElementById("weekly-report-error");
    const results = document.getElementById("weekly-report-results");
    const average = document.getElementById("weekly-average");
    const missions = document.getElementById("weekly-missions");
    const bestDay = document.getElementById("weekly-best-day");
    const weakestDay = document.getElementById("weekly-weakest-day");
    const learning = document.getElementById("weekly-learning");
    const nextFocus = document.getElementById("weekly-next-focus");
    const status = document.getElementById("weekly-status");

    function safeGoalKey(goal) {
        return (goal || "default-goal")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "default-goal";
    }

    function currentGoal() {
        const tracker = document.getElementById("progress-tracker");
        const goalInput = document.getElementById("goal");

        if (tracker && tracker.dataset.goal && tracker.dataset.goal.trim()) {
            return tracker.dataset.goal.trim();
        }

        if (goalInput && goalInput.value.trim()) {
            return goalInput.value.trim();
        }

        return "default-goal";
    }

    function readArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (error) {
            return [];
        }
    }

    function isUsefulLearning(value) {
        if (typeof value !== "string" || !value.trim()) return false;

        const text = value.trim().toLowerCase();
        return !text.startsWith("no learning notes") &&
            text !== "no takeaway added" &&
            text !== "no learning added";
    }

    function getPerformanceHistory(goalKey) {
        return readArray("mission-history-" + goalKey);
    }

    function getReflectionHistory(goal, goalKey) {
        const goalSpecificKeys = [
            "dailyReflectionHistory_" + goalKey,
            "daily-reflection-history-" + goalKey
        ];

        let records = [];
        goalSpecificKeys.forEach(function (key) {
            records = records.concat(readArray(key));
        });

        const legacyRecords = readArray("dailyReflectionHistory").filter(
            function (record) {
                return record && safeGoalKey(record.goal) === goalKey;
            }
        );

        records = records.concat(legacyRecords);

        const seen = new Set();
        return records.filter(function (record) {
            if (!record || safeGoalKey(record.goal || goal) !== goalKey) {
                return false;
            }

            const learningText = record.learning || record.learning_notes || "";
            if (!isUsefulLearning(learningText)) return false;

            const identity = JSON.stringify([
                record.date || "",
                record.goal || goal,
                learningText,
                record.completed || record.completed_missions || "",
                record.total || record.total_missions || ""
            ]);

            if (seen.has(identity)) return false;
            seen.add(identity);
            return true;
        });
    }

    function setText(element, value) {
        if (element) element.textContent = value;
    }

    function showDay(element, day) {
        setText(
            element,
            day && day.date
                ? day.date + " — " + (day.percentage ?? 0) + "%"
                : "No data available."
        );
    }

    function showLearning(notes) {
        if (!learning) return;

        learning.innerHTML = "";
        const usefulNotes = Array.isArray(notes)
            ? notes.filter(isUsefulLearning)
            : [];
        const items = usefulNotes.length
            ? usefulNotes
            : ["No learning notes were added this week."];

        items.forEach(function (note) {
            const item = document.createElement("li");
            item.textContent = note;
            learning.appendChild(item);
        });
    }

    function showReport(report) {
        const completed = report.completed_missions ?? report.total_completed ?? 0;
        const total = report.total_missions ?? 0;

        setText(
            average,
            "Average completion: " + (report.average_completion ?? 0) +
                "% across " + (report.days_recorded ?? 0) +
                " recorded day(s)."
        );
        setText(
            missions,
            completed + " of " + total +
                " missions completed this week."
        );

        showDay(bestDay, report.best_day);
        showDay(weakestDay, report.weakest_day);
        showLearning(report.learning_notes);

        setText(
            nextFocus,
            report.next_week_focus ||
                "Start with one important mission next week."
        );
        setText(status, "Weekly Status: " + (report.status || "No Data"));

        if (results) results.style.display = "block";
    }

    button.addEventListener("click", async function () {
        const goal = currentGoal();
        const goalKey = safeGoalKey(goal);

        if (loading) loading.style.display = "block";
        if (errorBox) errorBox.style.display = "none";
        if (results) results.style.display = "none";
        button.disabled = true;
        button.textContent = "Generating Weekly Report...";

        try {
            const response = await fetch("/generate-weekly-report", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    performance_history: getPerformanceHistory(goalKey),
                    reflection_history: getReflectionHistory(goal, goalKey)
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Could not generate weekly report."
                );
            }

            showReport(data.weekly_report || {});
        } catch (error) {
            if (errorBox) {
                errorBox.textContent = error.message;
                errorBox.style.display = "block";
            }
        } finally {
            if (loading) loading.style.display = "none";
            button.disabled = false;
            button.textContent = "Generate Weekly Report";
        }
    });
});
