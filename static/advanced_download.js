document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const button =
        document.getElementById("download-plan");

    if (!button) {
        return;
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function elementText(id, fallback) {
        const element = byId(id);

        return element &&
            element.innerText.trim()
            ? element.innerText.trim()
            : fallback;
    }

    function currentGoal() {
        const tracker =
            byId("progress-tracker");

        const input =
            byId("goal");

        if (
            tracker &&
            tracker.dataset.goal
        ) {
            return tracker.dataset.goal;
        }

        if (
            input &&
            input.value.trim()
        ) {
            return input.value.trim();
        }

        return "No goal provided";
    }

    function taskText(
        selector,
        takeawayMode
    ) {
        const boxes =
            Array.from(
                document.querySelectorAll(
                    selector
                )
            );

        if (!boxes.length) {
            return "No items available.";
        }

        return boxes.map(
            function (box, index) {
                const label =
                    document.querySelector(
                        'label[for="' +
                        box.id +
                        '"]'
                    );

                const state =
                    box.checked
                        ? "[Completed]"
                        : "[Pending]";

                let line =
                    (index + 1) +
                    ". " +
                    state +
                    " " +
                    (
                        label
                            ? label.textContent.trim()
                            : "Task"
                    );

                if (takeawayMode) {
                    const missionId =
                        box.id.replace(
                            "mission-",
                            ""
                        );

                    const takeaway =
                        byId(
                            "takeaway-" +
                            missionId
                        );

                    line +=
                        "\n   Takeaway: " +
                        (
                            takeaway &&
                            takeaway.value.trim()
                                ? takeaway.value.trim()
                                : "No takeaway added"
                        );
                }

                return line;
            }
        ).join("\n\n");
    }

    function section(title, content) {
        return (
            "\n\n" +
            title +
            "\n" +
            "=".repeat(title.length) +
            "\n" +
            content
        );
    }

    button.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            const missionSection =
                byId(
                    "daily-mission-section"
                );

            const missionDate =
                missionSection &&
                missionSection.dataset.date
                    ? missionSection.dataset.date
                    : new Date()
                        .toISOString()
                        .slice(0, 10);

            let report =
                "AI ACTION ASSISTANT\n" +
                "ADVANCED PROGRESS REPORT\n";

            report +=
                "Generated: " +
                new Date().toLocaleString() +
                "\n";

            report += section(
                "GOAL",
                currentGoal()
            );

            report += section(
                "ACTION PLAN PROGRESS",
                elementText(
                    "progress-text",
                    "No progress available."
                )
            );

            report += section(
                "SMART ACTION PLAN",
                taskText(
                    ".step-checkbox",
                    false
                )
            );

            report += section(
                "TODAY'S MISSIONS - " +
                    missionDate,
                taskText(
                    ".mission-checkbox",
                    true
                )
            );

            report += section(
                "AI FOCUS MODE",
                elementText(
                    "focus-mode-section",
                    "No focus session available."
                )
            );

            report += section(
                "FOCUS ANALYTICS",
                elementText(
                    "focus-analytics-section",
                    "No focus analytics available."
                )
            );

            report += section(
                "DAILY PERFORMANCE HISTORY",
                elementText(
                    "daily-history-list",
                    "No daily history available."
                )
            );

            report += section(
                "7-DAY PROGRESS CHART",
                elementText(
                    "seven-day-progress-chart",
                    "No progress-chart data available."
                )
            );

            report += section(
                "STREAKS AND ACHIEVEMENTS",
                elementText(
                    "achievement-section",
                    "No achievements available."
                )
            );

            report += section(
                "ACTION DNA",
                elementText(
                    "action-dna-section",
                    "No Action DNA available."
                )
            );

            report += section(
                "REFLECTION HISTORY",
                elementText(
                    "reflection-history",
                    "No reflections available."
                )
            );

            report += section(
                "WEEKLY PROGRESS REPORT",
                elementText(
                    "weekly-report-results",
                    "No weekly report available."
                )
            );

            report +=
                "\n\nKeep taking small, consistent steps toward your goal.\n";

            const blob =
                new Blob(
                    [report],
                    {
                        type:
                            "text/plain;charset=utf-8"
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

            link.href = url;

            link.download =
                "AI_Action_Assistant_Advanced_Report.txt";

            document.body.appendChild(
                link
            );

            link.click();
            link.remove();

            window.setTimeout(
                function () {
                    URL.revokeObjectURL(
                        url
                    );
                },
                100
            );
        },
        true
    );
});