import App from "../app.js";
import "../../styles/apps/pomodoro.css";

export default class PomodoroApp extends App {
    static manifest = {
        id: "pomodoro",
        name: "Pomodoro",
        icon: "⏱️",

        width: 420,
        height: 520,

        minWidth: 360,
        minHeight: 460
    };

    #window = null;
    #timer = null;
    #timeRemaining = 25 * 60;
    #runningMode = null;

    #modeTimes = {
        work: 25 * 60,
        short: 5 * 60,
        long: 15 * 60
    };

    #isRunning = false;
    #completedWorkSessions = 0;
    #mode = "work";

    #durations = {
        work: 25 * 60,
        short: 5 * 60,
        long: 15 * 60
    };

    #settingsOpen = false;
    #settingsStorageKey = "novadesk-pomodoro-settings";

    // ── Named sessions (e.g. "Football", "Study") ──────
    #sessions = [];
    #activeSessionId = null;
    #sessionsStorageKey = "novadesk-pomodoro-sessions";

    async mount(window, eventBus, settingsStore) {
        super.mount(window);

        this.#loadSessions();

        const activeSession = this.#getActiveSession();

        this.#durations = activeSession.durations;

        this.#modeTimes = {
            work: this.#durations.work,
            short: this.#durations.short,
            long: this.#durations.long
        };
        this.#timeRemaining = this.#durations.work;

        this.#window = window;

        this.#window.content.innerHTML = `
            <div class="pomodoro-app">

                <div class="pomodoro-toolbar">
                    <div class="pomodoro-sessions">
                        <div class="pomodoro-sessions-list"></div>

                        <button class="pomodoro-session-add" type="button" aria-label="Add session" title="Add session">
                            +
                        </button>
                    </div>

                    <button class="pomodoro-settings" type="button" aria-label="Settings">
                        ⚙
                    </button>
                </div>

                <div class="pomodoro-modes">

                    <button class="pomodoro-mode active" type="button" data-mode="work">
                        Work
                    </button>

                    <button class="pomodoro-mode" type="button" data-mode="short">
                        Short Break
                    </button>

                    <button class="pomodoro-mode" type="button" data-mode="long">
                        Long Break
                    </button>

                </div>

                <div class="pomodoro-settings-panel">

                    <div class="pomodoro-settings-title">
                        Timer Settings
                    </div>

                    <label>
                        Work
                        <div class="pomodoro-setting-input">
                            <input type="number" min="1" max="180" data-setting="work">

                            <span>min</span>
                        </div>
                    </label>

                    <label>
                        Short Break
                        <div class="pomodoro-setting-input">
                            <input type="number" min="1" max="60" data-setting="short">

                            <span>min</span>
                        </div>
                    </label>

                    <label>
                        Long Break
                        <div class="pomodoro-setting-input">
                            <input type="number" min="1" max="120" data-setting="long">

                            <span>min</span>
                        </div>
                    </label>

                    <button class="pomodoro-settings-save" type="button">
                        Save
                    </button>

                </div>

                <div class="pomodoro-timer">

                    <div class="pomodoro-time">
                        25:00
                    </div>

                    <div class="pomodoro-status">
                        Ready to focus
                    </div>

                </div>

                <div class="pomodoro-controls">

                    <button class="pomodoro-reset" type="button">
                        Reset
                    </button>

                    <button class="pomodoro-start" type="button">
                        Start
                    </button>

                </div>

            </div>
        `;

        const content = this.#window.content;

        const sessionsList =
            content.querySelector(".pomodoro-sessions-list");

        sessionsList.addEventListener("wheel", event => {
            if (event.deltaY === 0) return;

            event.preventDefault();
            sessionsList.scrollLeft += event.deltaY;
        }, { passive: false });

        const startButton =
            content.querySelector(".pomodoro-start");

        const resetButton =
            content.querySelector(".pomodoro-reset");

        const modeButtons =
            content.querySelectorAll(".pomodoro-mode");

        startButton.addEventListener("click", () => {
            this.#toggleTimer();
        });

        resetButton.addEventListener("click", () => {
            this.#resetTimer();
        });

        modeButtons.forEach(button => {
            button.addEventListener("click", () => {
                this.#changeMode(button.dataset.mode);
            });
        });

        const settingsButton =
            content.querySelector(".pomodoro-settings");

        const saveSettingsButton =
            content.querySelector(".pomodoro-settings-save");

        settingsButton.addEventListener("click", () => {
            this.#toggleSettings();
        });

        saveSettingsButton.addEventListener("click", () => {
            this.#applySettings();
        });

        const addSessionButton =
            content.querySelector(".pomodoro-session-add");

        addSessionButton.addEventListener("click", () => {
            this.#addSession();
        });

        this.#updateSettingsInputs();
        this.#renderSessions();
    }

    // ── Named sessions ──────────────────────────────────

    #loadSessions() {
        const saved =
            localStorage.getItem(this.#sessionsStorageKey);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                if (
                    Array.isArray(parsed.sessions) &&
                    parsed.sessions.length > 0
                ) {
                    this.#sessions = parsed.sessions;

                    this.#activeSessionId =
                        this.#sessions.some(
                            s => s.id === parsed.activeSessionId
                        )
                            ? parsed.activeSessionId
                            : this.#sessions[0].id;

                    return;
                }
            } catch {
                // Ignore invalid saved sessions.
            }
        }

        // No saved sessions yet — migrate legacy single-session
        // settings (if any) into a first default session.
        const defaultDurations = {
            work: 25 * 60,
            short: 5 * 60,
            long: 15 * 60
        };

        const legacy =
            localStorage.getItem(this.#settingsStorageKey);

        if (legacy) {
            try {
                const settings = JSON.parse(legacy);

                if (
                    Number.isFinite(settings.work) &&
                    settings.work > 0
                ) {
                    defaultDurations.work = settings.work;
                }

                if (
                    Number.isFinite(settings.short) &&
                    settings.short > 0
                ) {
                    defaultDurations.short = settings.short;
                }

                if (
                    Number.isFinite(settings.long) &&
                    settings.long > 0
                ) {
                    defaultDurations.long = settings.long;
                }
            } catch {
                // Ignore invalid legacy settings.
            }
        }

        this.#sessions = [
            {
                id: 1,
                name: "Focus Session",
                durations: defaultDurations
            }
        ];

        this.#activeSessionId = 1;

        this.#saveSessions();
    }

    #saveSessions() {
        localStorage.setItem(
            this.#sessionsStorageKey,
            JSON.stringify({
                sessions: this.#sessions,
                activeSessionId: this.#activeSessionId
            })
        );
    }

    #getActiveSession() {
        return this.#sessions.find(
            s => s.id === this.#activeSessionId
        );
    }

    #selectSession(id) {
        if (id === this.#activeSessionId) {
            return;
        }

        const session = this.#sessions.find(s => s.id === id);

        if (!session) {
            return;
        }

        clearInterval(this.#timer);
        this.#timer = null;
        this.#isRunning = false;
        this.#runningMode = null;

        this.#activeSessionId = id;
        this.#durations = session.durations;

        this.#mode = "work";

        this.#modeTimes = {
            work: this.#durations.work,
            short: this.#durations.short,
            long: this.#durations.long
        };

        this.#timeRemaining = this.#durations.work;

        this.#completedWorkSessions = 0;

        this.#saveSessions();
        this.#renderSessions();
        this.#updateSettingsInputs();
        this.#updateUI();
    }

    #addSession() {
        const base = this.#getActiveSession();

        const newSession = {
            id: Date.now(),
            name: `Session ${this.#sessions.length + 1}`,
            durations: base
                ? { ...base.durations }
                : { work: 25 * 60, short: 5 * 60, long: 15 * 60 }
        };

        this.#sessions.push(newSession);
        this.#saveSessions();

        this.#selectSession(newSession.id);

        // Jump straight into renaming a freshly created session.
        this.#startRename(newSession.id);
    }

    #deleteSession(id) {
        if (this.#sessions.length <= 1) {
            return;
        }

        const index =
            this.#sessions.findIndex(s => s.id === id);

        if (index === -1) {
            return;
        }

        const wasActive = this.#activeSessionId === id;

        this.#sessions.splice(index, 1);

        if (wasActive) {
            const next =
                this.#sessions[Math.max(0, index - 1)];

            this.#activeSessionId = null;
            this.#selectSession(next.id);
        } else {
            this.#saveSessions();
            this.#renderSessions();
        }
    }

    #renameSession(id, name) {
        const trimmed = name.trim().slice(0, 30);

        const session = this.#sessions.find(s => s.id === id);

        if (!session) {
            return;
        }

        session.name = trimmed || session.name;

        this.#saveSessions();
        this.#renderSessions();
    }

    #startRename(id) {
        const chip =
            this.#window.content.querySelector(
                `.pomodoro-session-chip[data-id="${id}"]`
            );

        const session = this.#sessions.find(s => s.id === id);

        if (!chip || !session) {
            return;
        }

        const nameElement =
            chip.querySelector(".pomodoro-session-chip-name");

        if (!nameElement) {
            return;
        }

        const input = document.createElement("input");

        input.type = "text";
        input.className = "pomodoro-session-chip-input";
        input.maxLength = 30;
        input.value = session.name;

        nameElement.replaceWith(input);

        input.focus();
        input.select();

        let committed = false;

        const commit = () => {
            if (committed) {
                return;
            }

            committed = true;

            this.#renameSession(id, input.value);
        };

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                input.blur();
            } else if (event.key === "Escape") {
                committed = true;
                this.#renderSessions();
            }
        });

        input.addEventListener("blur", commit);
    }

    #renderSessions() {
        const list =
            this.#window.content.querySelector(
                ".pomodoro-sessions-list"
            );

        if (!list) {
            return;
        }

        list.innerHTML = this.#sessions
            .map(session => `
                <div
                    class="pomodoro-session-chip${session.id === this.#activeSessionId
                    ? " active"
                    : ""
                }"
                    data-id="${session.id}">

                    <span
                        class="pomodoro-session-chip-name"
                        data-id="${session.id}">
                        ${this.#escapeHtml(session.name)}
                    </span>

                    <button
                        class="pomodoro-session-chip-edit"
                        type="button"
                        data-id="${session.id}"
                        aria-label="Rename session"
                        title="Rename">
                        ✎
                    </button>

                    ${this.#sessions.length > 1
                    ? `
                    <button
                        class="pomodoro-session-chip-delete"
                        type="button"
                        data-id="${session.id}"
                        aria-label="Delete session"
                        title="Delete">
                        ×
                    </button>`
                    : ""
                }
                </div>
            `)
            .join("");

        list.querySelectorAll(".pomodoro-session-chip")
            .forEach(chip => {
                const id = Number(chip.dataset.id);

                chip.addEventListener("click", event => {
                    if (
                        event.target.closest(
                            ".pomodoro-session-chip-edit"
                        ) ||
                        event.target.closest(
                            ".pomodoro-session-chip-delete"
                        )
                    ) {
                        return;
                    }

                    this.#selectSession(id);
                });

                const nameElement = chip.querySelector(
                    ".pomodoro-session-chip-name"
                );

                nameElement.addEventListener("dblclick", event => {
                    event.stopPropagation();
                    this.#startRename(id);
                });
            });

        list.querySelectorAll(".pomodoro-session-chip-edit")
            .forEach(button => {
                button.addEventListener("click", event => {
                    event.stopPropagation();
                    this.#startRename(Number(button.dataset.id));
                });
            });

        list.querySelectorAll(".pomodoro-session-chip-delete")
            .forEach(button => {
                button.addEventListener("click", event => {
                    event.stopPropagation();
                    this.#deleteSession(Number(button.dataset.id));
                });
            });
    }

    #escapeHtml(value) {
        return value.replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        }[char]));
    }

    // ── Timer settings (per active session) ─────────────

    #applySettings() {
        const content = this.#window.content;

        const work =
            Number(
                content.querySelector(
                    '[data-setting="work"]'
                ).value
            );

        const short =
            Number(
                content.querySelector(
                    '[data-setting="short"]'
                ).value
            );

        const long =
            Number(
                content.querySelector(
                    '[data-setting="long"]'
                ).value
            );

        if (
            !Number.isFinite(work) ||
            !Number.isFinite(short) ||
            !Number.isFinite(long) ||
            work <= 0 ||
            short <= 0 ||
            long <= 0
        ) {
            return;
        }

        const session = this.#getActiveSession();

        if (!session) {
            return;
        }

        session.durations = {
            work: work * 60,
            short: short * 60,
            long: long * 60
        };

        this.#durations = session.durations;

        this.#saveSessions();

        this.#settingsOpen = false;

        content
            .querySelector(".pomodoro-settings-panel")
            .classList.remove("open");

        if (!this.#isRunning) {
            this.#modeTimes = {
                work: this.#durations.work,
                short: this.#durations.short,
                long: this.#durations.long
            };

            this.#timeRemaining =
                this.#durations[this.#mode];

            this.#updateUI();
        }
    }

    #toggleSettings() {
        this.#settingsOpen = !this.#settingsOpen;

        const panel =
            this.#window.content.querySelector(
                ".pomodoro-settings-panel"
            );

        panel.classList.toggle(
            "open",
            this.#settingsOpen
        );
    }

    #updateSettingsInputs() {
        const content = this.#window.content;

        content.querySelector(
            '[data-setting="work"]'
        ).value = this.#durations.work / 60;

        content.querySelector(
            '[data-setting="short"]'
        ).value = this.#durations.short / 60;

        content.querySelector(
            '[data-setting="long"]'
        ).value = this.#durations.long / 60;
    }

    // ── Core timer logic (unchanged behavior) ──────────

    #toggleTimer() {
        if (this.#isRunning) {
            this.#pauseTimer();
        } else {
            this.#startTimer();
        }
    }

    #startTimer() {
        if (this.#isRunning) {
            return;
        }

        this.#isRunning = true;
        this.#runningMode = this.#mode;

        this.#updateUI();

        this.#timer = setInterval(() => {
            this.#modeTimes[this.#runningMode]--;

            if (
                this.#mode === this.#runningMode
            ) {
                this.#timeRemaining =
                    this.#modeTimes[this.#runningMode];
            }

            this.#updateUI();

            if (
                this.#modeTimes[this.#runningMode] <= 0
            ) {
                this.#finishTimer();
            }
        }, 1000);
    }

    #pauseTimer() {
        this.#isRunning = false;

        clearInterval(this.#timer);
        this.#timer = null;

        this.#runningMode = null;

        this.#updateUI();
    }

    #resetTimer() {
        clearInterval(this.#timer);

        this.#timer = null;
        this.#isRunning = false;
        this.#runningMode = null;

        this.#timeRemaining =
            this.#durations[this.#mode];

        this.#modeTimes[this.#mode] =
            this.#timeRemaining;

        this.#updateUI();
    }

    #changeMode(mode) {
        if (this.#mode === mode) {
            return;
        }

        this.#mode = mode;

        this.#timeRemaining =
            this.#modeTimes[mode];

        this.#updateUI();
    }

    #finishTimer() {
        clearInterval(this.#timer);

        this.#timer = null;
        this.#isRunning = false;

        const finishedMode = this.#runningMode;

        this.#runningMode = null;

        this.#modeTimes[finishedMode] = 0;

        if (finishedMode === "work") {
            this.#completedWorkSessions++;

            if (this.#completedWorkSessions >= 4) {
                this.#completedWorkSessions = 0;
                this.#mode = "long";
            } else {
                this.#mode = "short";
            }
        } else {
            this.#mode = "work";
        }

        this.#timeRemaining =
            this.#durations[this.#mode];

        this.#modeTimes[this.#mode] =
            this.#timeRemaining;

        this.#updateUI();
    }

    #updateUI() {
        const app = this.#window.content.querySelector(".pomodoro-app");
        app.dataset.mode = this.#mode;   // "work" | "short" | "long"

        const content = this.#window.content;
        const timeElement =

            content.querySelector(".pomodoro-time");

        const statusElement =
            content.querySelector(".pomodoro-status");

        const startButton =
            content.querySelector(".pomodoro-start");

        const modeButtons =
            content.querySelectorAll(".pomodoro-mode");

        const minutes =
            Math.floor(this.#timeRemaining / 60);

        const seconds =
            this.#timeRemaining % 60;

        timeElement.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        if (this.#isRunning) {
            startButton.textContent = "Pause";
            statusElement.textContent =
                this.#mode === "work"
                    ? "Focusing"
                    : "On break";
        } else if (this.#timeRemaining === 0) {
            startButton.textContent = "Start";
            statusElement.textContent = "Time's up";
        } else {
            startButton.textContent = "Start";

            if (
                this.#timeRemaining ===
                this.#durations[this.#mode]
            ) {
                if (this.#mode === "work") {
                    statusElement.textContent =
                        "Ready to focus";
                } else if (this.#mode === "short") {
                    statusElement.textContent =
                        "Ready for a break";
                } else {
                    statusElement.textContent =
                        "Ready for a long break";
                }
            } else {
                statusElement.textContent = "Paused";
            }
        }

        modeButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.mode === this.#mode
            );
        });
    }
}