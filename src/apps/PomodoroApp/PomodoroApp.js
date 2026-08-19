import App from "../app.js";
import "../../styles/apps/pomodoro.css";

export default class PomodoroApp extends App {
    static manifest = {
        id: "pomodoro",
        name: "Pomodoro",
        icon: "P",

        width: 420,
        height: 520,

        minWidth: 360,
        minHeight: 460
    };

    #window = null;

    #timer = null;
    #timeRemaining = 25 * 60;
    #isRunning = false;

    #session = 1;

    #mode = "work";

    #durations = {
        work: 25 * 60,
        short: 5 * 60,
        long: 15 * 60
    };

    #settingsOpen = false;

    #settingsStorageKey = "novadesk-pomodoro-settings";

    async mount(window, eventBus, settingsStore) {
        super.mount(window);

        this.#loadSettings();

        this.#window = window;

        this.#window.content.innerHTML = `
            <div class="pomodoro-app">

                <div class="pomodoro-header">
    <div class="pomodoro-title">
        Pomodoro
    </div>

    <div class="pomodoro-header-right">
        <div class="pomodoro-session">
            Session ${this.#session}
        </div>

        <button
            class="pomodoro-settings"
            type="button"
            aria-label="Settings">
            ⚙
        </button>
    </div>
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
            <input
                type="number"
                min="1"
                max="180"
                data-setting="work">

            <span>min</span>
        </div>
    </label>

    <label>
        Short Break
        <div class="pomodoro-setting-input">
            <input
                type="number"
                min="1"
                max="60"
                data-setting="short">

            <span>min</span>
        </div>
    </label>

    <label>
        Long Break
        <div class="pomodoro-setting-input">
            <input
                type="number"
                min="1"
                max="120"
                data-setting="long">

            <span>min</span>
        </div>
    </label>

    <button
        class="pomodoro-settings-save"
        type="button">
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

        const settingsPanel =
            content.querySelector(".pomodoro-settings-panel");

        const saveSettingsButton =
            content.querySelector(".pomodoro-settings-save");

        settingsButton.addEventListener("click", () => {
            this.#toggleSettings();
        });

        saveSettingsButton.addEventListener("click", () => {
            this.#applySettings();
        });

        this.#updateSettingsInputs();
    }

    #loadSettings() {
        const saved =
            localStorage.getItem(this.#settingsStorageKey);

        if (!saved) {
            return;
        }

        try {
            const settings = JSON.parse(saved);

            if (
                Number.isFinite(settings.work) &&
                settings.work > 0
            ) {
                this.#durations.work = settings.work;
            }

            if (
                Number.isFinite(settings.short) &&
                settings.short > 0
            ) {
                this.#durations.short = settings.short;
            }

            if (
                Number.isFinite(settings.long) &&
                settings.long > 0
            ) {
                this.#durations.long = settings.long;
            }
        } catch {
            // Ignore invalid saved settings.
        }
    }

    #saveSettings() {
        localStorage.setItem(
            this.#settingsStorageKey,
            JSON.stringify(this.#durations)
        );
    }

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

        this.#durations = {
            work: work * 60,
            short: short * 60,
            long: long * 60
        };

        this.#saveSettings();

        this.#settingsOpen = false;

        content
            .querySelector(".pomodoro-settings-panel")
            .classList.remove("open");

        if (!this.#isRunning) {
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

    #toggleTimer() {
        if (this.#isRunning) {
            this.#pauseTimer();
        } else {
            this.#startTimer();
        }
    }

    #startTimer() {
        if (this.#timeRemaining <= 0) {
            this.#resetTimer();
        }

        this.#isRunning = true;

        this.#updateUI();

        this.#timer = setInterval(() => {
            this.#timeRemaining--;

            this.#updateUI();

            if (this.#timeRemaining <= 0) {
                this.#finishTimer();
            }
        }, 1000);
    }

    #pauseTimer() {
        this.#isRunning = false;

        clearInterval(this.#timer);
        this.#timer = null;

        this.#updateUI();
    }

    #resetTimer() {
        clearInterval(this.#timer);

        this.#timer = null;
        this.#isRunning = false;

        this.#timeRemaining =
            this.#durations[this.#mode];

        this.#updateUI();
    }

    #changeMode(mode) {
        if (this.#mode === mode) {
            return;
        }

        clearInterval(this.#timer);

        this.#timer = null;
        this.#isRunning = false;
        this.#mode = mode;

        this.#timeRemaining =
            this.#durations[mode];

        this.#updateUI();
    }

    #finishTimer() {
        clearInterval(this.#timer);

        this.#timer = null;
        this.#isRunning = false;
        this.#timeRemaining = 0;

        if (this.#mode === "work") {
            this.#session++;
            this.#mode = "short";
        } else {
            this.#mode = "work";
        }

        this.#timeRemaining =
            this.#durations[this.#mode];

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