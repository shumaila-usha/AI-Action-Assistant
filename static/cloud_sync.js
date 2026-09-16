(function () {
    "use strict";

    const USER_KEY = "ai-cloud-sync-current-user";
    const LOADED_KEY = "ai-cloud-sync-loaded-version";
    const KNOWN_USERS_KEY = "ai-cloud-sync-known-users";
    const META_PREFIX = "ai-cloud-sync-";
    const body = document.body;
    const userId = body && body.dataset.userId ? String(body.dataset.userId) : "";

    if (!userId) return;

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    const originalClear = Storage.prototype.clear;
    let syncTimer = null;
    let syncReady = false;
    let applyingServerData = false;

    function isSyncMetadata(key) {
        return String(key || "").startsWith(META_PREFIX);
    }

    function snapshot() {
        const data = {};
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key !== null && !isSyncMetadata(key)) {
                data[key] = localStorage.getItem(key);
            }
        }
        return data;
    }

    function clearManagedData() {
        const keys = [];
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key !== null && !isSyncMetadata(key)) keys.push(key);
        }
        keys.forEach(function (key) {
            originalRemoveItem.call(localStorage, key);
        });
    }

    function knownUsers() {
        try {
            const users = JSON.parse(localStorage.getItem(KNOWN_USERS_KEY) || "[]");
            return Array.isArray(users) ? users.map(String) : [];
        } catch (error) {
            return [];
        }
    }

    function rememberUser() {
        const users = knownUsers();
        if (!users.includes(userId)) users.push(userId);
        originalSetItem.call(localStorage, KNOWN_USERS_KEY, JSON.stringify(users));
    }

    function setStatus(text, type) {
        let status = document.getElementById("account-sync-status");
        if (!status) {
            const accountUser = document.querySelector(".account-user");
            if (!accountUser) return;
            status = document.createElement("span");
            status.id = "account-sync-status";
            status.className = "account-sync-status";
            accountUser.appendChild(status);
        }
        status.textContent = text;
        status.className = "account-sync-status " + type;
    }

    async function requestServer(method, data) {
        const options = {
            method: method,
            headers: {"Content-Type": "application/json"},
            credentials: "same-origin"
        };
        if (data !== undefined) options.body = JSON.stringify(data);

        const response = await fetch("/api/user-data", options);
        if (response.status === 401) {
            window.location.href = "/login";
            throw new Error("Your session expired.");
        }

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Data synchronization failed.");
        }
        return result;
    }

    async function uploadNow(keepalive) {
        if (applyingServerData) return;

        setStatus("Saving…", "saving");
        const response = await fetch("/api/user-data", {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            credentials: "same-origin",
            keepalive: Boolean(keepalive),
            body: JSON.stringify({data: snapshot()})
        });

        if (!response.ok) throw new Error("Could not save account data.");
        setStatus("✓ Synced", "synced");
    }

    function scheduleUpload() {
        if (!syncReady || applyingServerData) return;
        window.clearTimeout(syncTimer);
        syncTimer = window.setTimeout(function () {
            uploadNow(false).catch(function () {
                setStatus("Sync paused", "error");
            });
        }, 700);
    }

    function installStorageWatcher() {
        Storage.prototype.setItem = function (key, value) {
            originalSetItem.call(this, key, value);
            if (this === localStorage && !isSyncMetadata(key)) scheduleUpload();
        };

        Storage.prototype.removeItem = function (key) {
            originalRemoveItem.call(this, key);
            if (this === localStorage && !isSyncMetadata(key)) scheduleUpload();
        };

        Storage.prototype.clear = function () {
            originalClear.call(this);
            if (this === localStorage) {
                originalSetItem.call(localStorage, USER_KEY, userId);
                scheduleUpload();
            }
        };

        window.addEventListener("storage", scheduleUpload);
        window.addEventListener("pagehide", function () {
            if (syncReady) {
                uploadNow(true).catch(function () {
                    return null;
                });
            }
        });

        const logoutForm = document.querySelector('form[action="/logout"]');
        if (logoutForm) {
            logoutForm.addEventListener("submit", async function (event) {
                event.preventDefault();
                setStatus("Securing account data…", "saving");

                try {
                    await uploadNow(true);
                } catch (error) {
                    setStatus("Browser data remains safe", "error");
                }

                applyingServerData = true;
                clearManagedData();
                originalRemoveItem.call(localStorage, USER_KEY);
                applyingServerData = false;
                HTMLFormElement.prototype.submit.call(logoutForm);
            });
        }
    }

    function applyServerData(data) {
        applyingServerData = true;
        clearManagedData();
        Object.keys(data).forEach(function (key) {
            const value = data[key];
            if (!isSyncMetadata(key) && typeof value === "string") {
                originalSetItem.call(localStorage, key, value);
            }
        });
        originalSetItem.call(localStorage, USER_KEY, userId);
        applyingServerData = false;
    }

    async function initializeSync() {
        const previousUser = localStorage.getItem(USER_KEY);
        const changedUser = Boolean(previousUser && previousUser !== userId);
        const usersBeforeLogin = knownUsers();

        if (changedUser) clearManagedData();
        originalSetItem.call(localStorage, USER_KEY, userId);
        rememberUser();
        setStatus("Connecting…", "saving");

        try {
            const result = await requestServer("GET");
            const serverData = result.data && typeof result.data === "object"
                ? result.data
                : {};
            const serverVersion = userId + ":" + String(result.updated_at || "empty");
            const loadedVersion = sessionStorage.getItem(LOADED_KEY);

            if (result.has_data) {
                applyServerData(serverData);
                setStatus("✓ Synced", "synced");

                if (loadedVersion !== serverVersion) {
                    sessionStorage.setItem(LOADED_KEY, serverVersion);
                    window.location.reload();
                    return;
                }
            } else {
                if (!previousUser && usersBeforeLogin.length > 0) {
                    clearManagedData();
                    originalSetItem.call(localStorage, USER_KEY, userId);
                }
                await requestServer("PUT", {data: snapshot()});
                setStatus("✓ First sync complete", "synced");
            }

            syncReady = true;
            installStorageWatcher();
        } catch (error) {
            syncReady = true;
            installStorageWatcher();
            setStatus("Offline — browser data safe", "error");
        }
    }

    initializeSync();
})();
