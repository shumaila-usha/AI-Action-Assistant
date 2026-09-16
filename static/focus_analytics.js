document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const focusSection =
        document.getElementById("focus-mode-section");

    if (!focusSection) {
        return;
    }

    let lastUpdateTime = Date.now();

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
        const missionSection =
            document.getElementById("daily-mission-section");

        return missionSection && missionSection.dataset.date
            ? missionSection.dataset.date
            : new Date().toISOString().slice(0, 10);
    }

    function focusStateKey() {
        return (
            "focus-mode-" +
            safeKey(currentGoal()) +
            "-" +
            currentDate()
        );
    }

    function analyticsKey() {
        return "focus-analytics-" + safeKey(currentGoal());
    }

    function readJson(key, fallback) {
        try {
            const value = JSON.parse(
                localStorage.getItem(key) || "null"
            );
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    function getAnalytics() {
        const data = readJson(analyticsKey(), {});
        return data && typeof data === "object" &&
            !Array.isArray(data)
            ? data
            : {};
    }

    function saveAnalytics(data) {
        localStorage.setItem(
            analyticsKey(),
            JSON.stringify(data)
        );
    }

    function addStyles() {
        if (document.getElementById("focus-analytics-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "focus-analytics-styles";
        style.textContent =
            ".focus-analytics-section{width:100%;max-width:850px;margin:28px auto;}" +
            ".focus-analytics-section>h2{margin-bottom:14px;color:#1e40af;font-size:26px;}" +
            ".focus-analytics-card{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:24px;border:1px solid #bfdbfe;border-radius:22px;background:#fff;box-shadow:0 16px 35px rgba(30,64,175,.12);}" +
            ".focus-stat{padding:18px;border:1px solid #dbeafe;border-radius:16px;text-align:center;background:linear-gradient(135deg,#eff6ff,#fff);}" +
            ".focus-stat-value{display:block;margin-bottom:7px;color:#1d4ed8;font-size:28px;font-weight:850;}" +
            ".focus-stat-label{color:#475569;font-size:13px;font-weight:700;}" +
            ".focus-activity{grid-column:1/-1;margin-top:5px;}" +
            ".focus-activity-title{margin-bottom:10px;color:#1e3a8a;font-weight:800;}" +
            ".focus-activity-row{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;}" +
            ".focus-activity-day{padding:10px 4px;border-radius:10px;color:#475569;text-align:center;background:#f1f5f9;font-size:11px;font-weight:750;}" +
            ".focus-activity-day.active{color:#fff;background:linear-gradient(135deg,#2563eb,#4f46e5);}" +
            "@media(max-width:600px){.focus-analytics-card{grid-template-columns:1fr}.focus-activity{grid-column:1}.focus-activity-row{gap:4px}.focus-activity-day{font-size:9px}}";
        document.head.appendChild(style);
    }

    const section = document.createElement("section");
    section.id = "focus-analytics-section";
    section.className = "focus-analytics-section";

    const heading = document.createElement("h2");
    heading.textContent = "📈 Focus Analytics";

    const card = document.createElement("div");
    card.className = "focus-analytics-card";

    function statBlock(id, label) {
        const block = document.createElement("div");
        const value = document.createElement("span");
        const text = document.createElement("span");

        block.className = "focus-stat";
        value.id = id;
        value.className = "focus-stat-value";
        value.textContent = "0m";
        text.className = "focus-stat-label";
        text.textContent = label;
        block.appendChild(value);
        block.appendChild(text);
        card.appendChild(block);
    }

    statBlock("focus-today", "Focused Today");
    statBlock("focus-week", "Last 7 Days");
    statBlock("focus-best", "Best Focus Day");

    const activity = document.createElement("div");
    activity.className = "focus-activity";

    const activityTitle = document.createElement("p");
    activityTitle.className = "focus-activity-title";
    activityTitle.textContent = "Last 7 Days Activity";

    const activityRow = document.createElement("div");
    activityRow.id = "focus-activity-row";
    activityRow.className = "focus-activity-row";

    activity.appendChild(activityTitle);
    activity.appendChild(activityRow);
    card.appendChild(activity);
    section.appendChild(heading);
    section.appendChild(card);
    focusSection.insertAdjacentElement("afterend", section);

    function dateText(date) {
        return date.toISOString().slice(0, 10);
    }

    function lastSevenDates() {
        const dates = [];
        const base = new Date(currentDate() + "T12:00:00");

        for (let offset = 6; offset >= 0; offset -= 1) {
            const date = new Date(base);
            date.setDate(base.getDate() - offset);
            dates.push(dateText(date));
        }

        return dates;
    }

    function minutes(seconds) {
        return Math.floor(Math.max(0, seconds || 0) / 60);
    }

    function render() {
        const data = getAnalytics();
        const dates = lastSevenDates();
        const todaySeconds = Number(data[currentDate()]) || 0;
        const weekSeconds = dates.reduce(function (sum, date) {
            return sum + (Number(data[date]) || 0);
        }, 0);
        const bestSeconds = dates.reduce(function (best, date) {
            return Math.max(best, Number(data[date]) || 0);
        }, 0);

        document.getElementById("focus-today").textContent =
            minutes(todaySeconds) + "m";
        document.getElementById("focus-week").textContent =
            minutes(weekSeconds) + "m";
        document.getElementById("focus-best").textContent =
            minutes(bestSeconds) + "m";

        activityRow.innerHTML = "";

        dates.forEach(function (date) {
            const day = document.createElement("div");
            const dayMinutes = minutes(Number(data[date]) || 0);
            day.className = "focus-activity-day";

            if (dayMinutes > 0) {
                day.classList.add("active");
            }

            day.textContent =
                date.slice(5).replace("-", "/") +
                "\n" +
                dayMinutes +
                "m";
            day.style.whiteSpace = "pre-line";
            activityRow.appendChild(day);
        });
    }

    function recordFocusTime() {
        const now = Date.now();
        const elapsed = Math.max(
            0,
            Math.min(2000, now - lastUpdateTime)
        );
        lastUpdateTime = now;

        const focusState = readJson(focusStateKey(), null);

        if (
            focusState &&
            focusState.running === true &&
            Number(focusState.endsAt) > now
        ) {
            const data = getAnalytics();
            const today = currentDate();
            data[today] = (Number(data[today]) || 0) +
                elapsed / 1000;
            saveAnalytics(data);
        }

        render();
    }

    addStyles();
    render();
    window.setInterval(recordFocusTime, 1000);
    window.addEventListener("storage", render);
});
