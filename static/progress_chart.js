document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const CHART_ID = "seven-day-progress-chart";

    function safeGoalKey(goal) {
        return (goal || "default-goal")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-");
    }

    function currentGoal() {
        const tracker = document.getElementById("progress-tracker");
        const input = document.getElementById("goal");

        if (tracker && tracker.dataset.goal) {
            return tracker.dataset.goal;
        }

        return input && input.value.trim()
            ? input.value.trim()
            : "default-goal";
    }

    function historyRecords() {
        const key = "mission-history-" + safeGoalKey(currentGoal());

        try {
            const history = JSON.parse(localStorage.getItem(key) || "[]");

            if (!Array.isArray(history)) {
                return [];
            }

            return history
                .filter(function (record) {
                    return record && /^\d{4}-\d{2}-\d{2}$/.test(
                        String(record.date || "")
                    );
                })
                .sort(function (a, b) {
                    return a.date.localeCompare(b.date);
                })
                .slice(-7);
        } catch (error) {
            return [];
        }
    }

    function percentage(record) {
        const completed = Math.max(0, Number(record.completed) || 0);
        const total = Math.max(0, Number(record.total) || 0);
        const value = total > 0
            ? Math.round((completed / total) * 100)
            : Number(record.percentage) || 0;

        return Math.min(100, Math.max(0, value));
    }

    function barColor(value) {
        if (value >= 75) return "#22c55e";
        if (value >= 50) return "#3b82f6";
        if (value > 0) return "#f59e0b";
        return "#cbd5e1";
    }

    function shortDate(date) {
        const parts = date.split("-");
        return parts.length === 3
            ? parts[1] + "/" + parts[2]
            : date;
    }

    function addStyles() {
        if (document.getElementById("progress-chart-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "progress-chart-styles";
        style.textContent =
            ".progress-chart-section{width:100%;max-width:850px;margin:28px auto;}" +
            ".progress-chart-section h2{margin-bottom:14px;color:#1e40af;font-size:26px;}" +
            ".progress-chart-card{padding:28px;border:1px solid #bfdbfe;border-radius:22px;background:#fff;box-shadow:0 16px 35px rgba(30,64,175,.13);}" +
            ".progress-chart-bars{display:grid;grid-template-columns:repeat(7,minmax(55px,1fr));align-items:end;gap:12px;height:245px;padding-top:28px;border-bottom:2px solid #cbd5e1;}" +
            ".progress-chart-column{display:flex;height:100%;flex-direction:column;align-items:center;justify-content:flex-end;gap:7px;}" +
            ".progress-chart-value{color:#1e3a8a;font-size:13px;font-weight:800;}" +
            ".progress-chart-bar{width:100%;max-width:58px;min-height:5px;border-radius:10px 10px 3px 3px;transition:height .4s ease;}" +
            ".progress-chart-date{color:#475569;font-size:12px;font-weight:700;}" +
            ".progress-chart-summary{margin-top:20px;color:#334155;text-align:center;font-weight:700;}" +
            ".progress-chart-empty{padding:28px;color:#64748b;text-align:center;}" +
            "@media(max-width:600px){.progress-chart-card{padding:18px}.progress-chart-bars{gap:6px;height:210px}.progress-chart-date{font-size:10px}.progress-chart-value{font-size:11px}}";
        document.head.appendChild(style);
    }

    function insertionPoint() {
        return document.getElementById("achievement-section") ||
            document.getElementById("action-dna-section");
    }

    function renderChart() {
        const history = historyRecords();
        let section = document.getElementById(CHART_ID);

        if (!section) {
            section = document.createElement("section");
            section.id = CHART_ID;
            section.className = "progress-chart-section";

            const target = insertionPoint();
            if (target && target.parentNode) {
                target.parentNode.insertBefore(section, target);
            } else {
                document.body.appendChild(section);
            }
        }

        section.innerHTML = "";

        const heading = document.createElement("h2");
        heading.textContent = "📊 7-Day Progress Chart";
        section.appendChild(heading);

        const card = document.createElement("div");
        card.className = "progress-chart-card";
        section.appendChild(card);

        if (!history.length) {
            const empty = document.createElement("p");
            empty.className = "progress-chart-empty";
            empty.textContent = "Complete a mission to begin your progress chart.";
            card.appendChild(empty);
            return;
        }

        const bars = document.createElement("div");
        bars.className = "progress-chart-bars";

        history.forEach(function (record) {
            const value = percentage(record);
            const column = document.createElement("div");
            const valueLabel = document.createElement("span");
            const bar = document.createElement("div");
            const dateLabel = document.createElement("span");

            column.className = "progress-chart-column";
            valueLabel.className = "progress-chart-value";
            valueLabel.textContent = value + "%";
            bar.className = "progress-chart-bar";
            bar.style.height = Math.max(5, value) + "%";
            bar.style.background = barColor(value);
            bar.title = record.date + " — " + value + "%";
            dateLabel.className = "progress-chart-date";
            dateLabel.textContent = shortDate(record.date);

            column.appendChild(valueLabel);
            column.appendChild(bar);
            column.appendChild(dateLabel);
            bars.appendChild(column);
        });

        card.appendChild(bars);

        const values = history.map(percentage);
        const average = Math.round(
            values.reduce(function (sum, value) {
                return sum + value;
            }, 0) / values.length
        );
        const summary = document.createElement("p");
        summary.className = "progress-chart-summary";
        summary.textContent =
            "Average: " + average + "% • Best: " +
            Math.max.apply(null, values) + "% • Recorded days: " +
            history.length;
        card.appendChild(summary);
    }

    addStyles();
    renderChart();

    document.addEventListener("change", function (event) {
        if (event.target.matches(".mission-checkbox")) {
            window.setTimeout(renderChart, 150);
        }
    });

    window.addEventListener("storage", renderChart);
});
