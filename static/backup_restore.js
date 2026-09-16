(function () {
    "use strict";

    const BACKUP_VERSION = 1;
    const APP_NAME = "AI Action Assistant";

    function storageSnapshot() {
        const data = {};

        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key !== null) data[key] = localStorage.getItem(key);
        }

        return data;
    }

    function safeDateForFilename() {
        return new Date().toISOString().slice(0, 10);
    }

    function downloadBackup() {
        const backup = {
            app: APP_NAME,
            version: BACKUP_VERSION,
            created_at: new Date().toISOString(),
            local_storage: storageSnapshot()
        };

        const blob = new Blob(
            [JSON.stringify(backup, null, 2)],
            {type: "application/json;charset=utf-8"}
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "AI_Action_Assistant_Backup_" +
            safeDateForFilename() + ".json";
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 100);

        showMessage("✅ Your backup was downloaded successfully.", "success");
    }

    function validateBackup(backup) {
        if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
            throw new Error("This is not a valid backup file.");
        }

        if (backup.app !== APP_NAME) {
            throw new Error("This file was not created by AI Action Assistant.");
        }

        if (!backup.local_storage ||
            typeof backup.local_storage !== "object" ||
            Array.isArray(backup.local_storage)) {
            throw new Error("The backup file does not contain valid app data.");
        }

        Object.keys(backup.local_storage).forEach(function (key) {
            const value = backup.local_storage[key];
            if (typeof value !== "string" && value !== null) {
                throw new Error("The backup contains an invalid value.");
            }
        });
    }

    function restoreBackup(file) {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".json")) {
            showMessage("❌ Please select a JSON backup file.", "error");
            return;
        }

        const reader = new FileReader();

        reader.addEventListener("load", function () {
            try {
                const backup = JSON.parse(String(reader.result || ""));
                validateBackup(backup);

                const keys = Object.keys(backup.local_storage);
                const confirmed = window.confirm(
                    "Restore " + keys.length + " saved item(s)?\n\n" +
                    "Your current AI Action Assistant browser data will be " +
                    "replaced. A page refresh will follow."
                );

                if (!confirmed) {
                    showMessage("Restore cancelled. Your data was not changed.", "info");
                    return;
                }

                localStorage.clear();
                keys.forEach(function (key) {
                    const value = backup.local_storage[key];
                    if (value !== null) localStorage.setItem(key, value);
                });

                showMessage("✅ Data restored. Refreshing the page...", "success");
                window.setTimeout(function () {
                    window.location.reload();
                }, 800);
            } catch (error) {
                showMessage("❌ Restore failed: " + error.message, "error");
            }
        });

        reader.addEventListener("error", function () {
            showMessage("❌ The selected file could not be read.", "error");
        });

        reader.readAsText(file);
    }

    function showMessage(text, type) {
        const message = document.getElementById("backup-restore-message");
        if (!message) return;

        message.textContent = text;
        message.className = "backup-restore-message " + type;
        message.style.display = "block";
    }

    function makeButton(text, className) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.className = className;
        return button;
    }

    function addStyles() {
        const style = document.createElement("style");
        style.textContent = [
            ".backup-restore-section{max-width:850px;margin:28px auto;}",
            ".backup-restore-card{background:#fff;border:1px solid #c9dcff;",
            "border-radius:20px;padding:28px;box-shadow:0 10px 25px rgba(30,79,180,.08);}",
            ".backup-restore-card h2{color:#1747b5;margin:0 0 8px;}",
            ".backup-restore-card p{color:#3f526f;margin:0 0 20px;}",
            ".backup-restore-actions{display:grid;grid-template-columns:1fr 1fr;gap:16px;}",
            ".backup-restore-button{border:0;border-radius:12px;padding:14px 18px;",
            "font-weight:700;font-size:16px;color:#fff;cursor:pointer;}",
            ".backup-button{background:linear-gradient(90deg,#2563eb,#4f46e5);}",
            ".restore-button{background:#51627a;}",
            ".backup-restore-button:hover{filter:brightness(1.06);}",
            ".backup-restore-message{display:none;margin-top:16px;padding:12px 14px;",
            "border-radius:10px;font-weight:600;}",
            ".backup-restore-message.success{background:#dcfce7;color:#166534;}",
            ".backup-restore-message.error{background:#fee2e2;color:#991b1b;}",
            ".backup-restore-message.info{background:#dbeafe;color:#1e40af;}",
            "@media(max-width:600px){.backup-restore-actions{grid-template-columns:1fr;}}"
        ].join("");
        document.head.appendChild(style);
    }

    function buildInterface() {
        if (document.getElementById("backup-restore-section")) return;

        addStyles();

        const section = document.createElement("section");
        section.id = "backup-restore-section";
        section.className = "backup-restore-section";

        const card = document.createElement("div");
        card.className = "backup-restore-card";

        const heading = document.createElement("h2");
        heading.textContent = "🔐 Data Backup & Restore";

        const description = document.createElement("p");
        description.textContent =
            "Protect your goals, missions, progress, reflections, focus sessions, and achievements.";

        const actions = document.createElement("div");
        actions.className = "backup-restore-actions";

        const backupButton = makeButton(
            "⬇ Backup My Data",
            "backup-restore-button backup-button"
        );
        const restoreButton = makeButton(
            "⬆ Restore My Data",
            "backup-restore-button restore-button"
        );

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json,application/json";
        fileInput.hidden = true;

        const message = document.createElement("div");
        message.id = "backup-restore-message";
        message.className = "backup-restore-message";
        message.setAttribute("role", "status");

        backupButton.addEventListener("click", downloadBackup);
        restoreButton.addEventListener("click", function () {
            fileInput.value = "";
            fileInput.click();
        });
        fileInput.addEventListener("change", function () {
            restoreBackup(fileInput.files && fileInput.files[0]);
        });

        actions.appendChild(backupButton);
        actions.appendChild(restoreButton);
        card.appendChild(heading);
        card.appendChild(description);
        card.appendChild(actions);
        card.appendChild(fileInput);
        card.appendChild(message);
        section.appendChild(card);

        const downloadButton = document.getElementById("download-plan");
        const actionContainer = downloadButton
            ? downloadButton.closest("section, div")
            : null;

        if (actionContainer && actionContainer.parentNode) {
            actionContainer.parentNode.insertBefore(section, actionContainer);
        } else {
            const main = document.querySelector("main") || document.body;
            main.appendChild(section);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildInterface);
    } else {
        buildInterface();
    }
})();
