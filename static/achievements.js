document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const SECTION_ID = "achievement-section";

    function createSafeGoalKey(goal) {
        return (goal || "default-goal")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-");
    }

    function readHistory() {
        const progressTracker = document.getElementById("progress-tracker");
        const goalInput = document.getElementById("goal");
        const currentGoal = progressTracker
            ? progressTracker.dataset.goal
            : (goalInput ? goalInput.value : "default-goal");
        const storageKey = "mission-history-" + createSafeGoalKey(currentGoal);
        let savedHistory = [];

        try {
            savedHistory = JSON.parse(localStorage.getItem(storageKey) || "[]");
        } catch (error) {
            savedHistory = [];
        }

        if (!Array.isArray(savedHistory)) {
            return [];
        }

        return savedHistory.filter(function (record) {
            return (
                record &&
                typeof record === "object" &&
                /^\d{4}-\d{2}-\d{2}$/.test(String(record.date || ""))
            );
        }).map(function (record) {
            const completed = Math.max(0, Number(record.completed) || 0);
            const total = Math.max(0, Number(record.total) || 0);

            return {
                date: String(record.date),
                completed: completed,
                total: total,
                percentage: total > 0
                    ? Math.round((completed / total) * 100)
                    : Math.max(0, Number(record.percentage) || 0)
            };
        }).sort(function (a, b) {
            return a.date.localeCompare(b.date);
        });
    }

    function dayNumber(dateText) {
        const parts = dateText.split("-").map(Number);
        return Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000;
    }

    function calculateStats(history) {
        const activeDays = history.filter(function (record) {
            return record.completed > 0;
        });

        let longestStreak = 0;
        let runningStreak = 0;
        let previousDay = null;

        activeDays.forEach(function (record) {
            const currentDay = dayNumber(record.date);
            runningStreak = previousDay !== null && currentDay === previousDay + 1
                ? runningStreak + 1
                : 1;
            longestStreak = Math.max(longestStreak, runningStreak);
            previousDay = currentDay;
        });

        let currentStreak = 0;
        if (activeDays.length) {
            currentStreak = 1;
            for (let index = activeDays.length - 1; index > 0; index -= 1) {
                if (
                    dayNumber(activeDays[index].date) -
                    dayNumber(activeDays[index - 1].date) === 1
                ) {
                    currentStreak += 1;
                } else {
                    break;
                }
            }
        }

        const totalCompleted = history.reduce(function (sum, record) {
            return sum + record.completed;
        }, 0);

        const perfectDays = history.filter(function (record) {
            return record.total > 0 && record.completed >= record.total;
        }).length;

        return {
            currentStreak: currentStreak,
            longestStreak: longestStreak,
            totalCompleted: totalCompleted,
            perfectDays: perfectDays
        };
    }

    function getBadges(stats) {
        const badges = [];

        if (stats.totalCompleted >= 1) badges.push("🌱 First Step");
        if (stats.totalCompleted >= 5) badges.push("⭐ Mission Builder");
        if (stats.totalCompleted >= 10) badges.push("🏅 Action Hero");
        if (stats.perfectDays >= 1) badges.push("💯 Perfect Day");
        if (stats.currentStreak >= 3) badges.push("🔥 3-Day Streak");
        if (stats.longestStreak >= 7) badges.push("🏆 Weekly Champion");

        return badges;
    }

    function findInsertionPoint() {
        const headings = Array.from(document.querySelectorAll("h2, h3"));
        return headings.find(function (heading) {
            return heading.textContent.includes("Your Action DNA");
        }) || headings.find(function (heading) {
            return heading.textContent.includes("AI Weekly Progress Report");
        });
    }

    function renderAchievements() {
        const history = readHistory();
        const stats = calculateStats(history);
        const badges = getBadges(stats);
        let section = document.getElementById(SECTION_ID);

        if (!section) {
            section = document.createElement("section");
            section.id = SECTION_ID;
            section.className = "achievement-section";

            const insertionPoint = findInsertionPoint();
            if (insertionPoint && insertionPoint.parentNode) {
                insertionPoint.parentNode.insertBefore(section, insertionPoint);
            } else {
                document.body.appendChild(section);
            }
        }

        const badgeText = badges.length
            ? badges.map(function (badge) {
                return "<span class=\"achievement-badge\">" + badge + "</span>";
            }).join("")
            : "<p>Complete your first mission to unlock a badge.</p>";

        section.innerHTML =
            "<h2>🏆 Streaks & Achievements</h2>" +
            "<div class=\"achievement-card\">" +
                "<p><strong>🔥 Current Streak:</strong> " + stats.currentStreak + " day(s)</p>" +
                "<p><strong>🏅 Longest Streak:</strong> " + stats.longestStreak + " day(s)</p>" +
                "<p><strong>✅ Total Missions Completed:</strong> " + stats.totalCompleted + "</p>" +
                "<p><strong>💯 Perfect Days:</strong> " + stats.perfectDays + "</p>" +
                "<div class=\"achievement-badges\">" + badgeText + "</div>" +
            "</div>";
    }

    renderAchievements();

    document.addEventListener("change", function (event) {
        if (event.target.matches("input[type='checkbox']")) {
            window.setTimeout(renderAchievements, 100);
        }
    });

    window.addEventListener("storage", renderAchievements);
});
