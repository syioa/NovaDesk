import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";

export class Taskbar {
    #center;
    #element;
    #left;
    #right;

    #eventBus;
    #startButton;
    #calendar;

    #buttons = new Map();

    constructor(eventBus) {
        this.#eventBus = eventBus;

        this.#element = document.createElement("div");
        this.#element.className = "taskbar";

        this.#left = document.createElement("div");
        this.#left.className = "taskbar-left";

        this.#center = document.createElement("div");
        this.#center.className = "taskbar-center";

        this.#right = document.createElement("div");
        this.#right.className = "taskbar-right";

        this.#element.append(
            this.#left,
            this.#center,
            this.#right
        );

        this.#createStartButton();
        this.#createClock();
    }

    addWindow(window) {
        const button = document.createElement("button");

        button.textContent = window.getTitle();
        button.className = "taskbar-button";

        button.addEventListener("click", () => {
            if (window.isVisible()) {
                window.focus();
            } else {
                window.restore();
                window.focus();
            }
        });

        this.#center.append(button);

        this.#buttons.set(window, button);
    }
    removeWindow(window) {
        const button = this.#buttons.get(window);

        if (!button) return;

        button.remove();
        this.#buttons.delete(window);
    }

    setActiveWindow(window) {
        for (const [win, button] of this.#buttons) {
            button.classList.toggle(
                "active",
                win === window
            );
        }
    }

    #createStartButton() {
        this.#startButton = document.createElement("button");
        this.#startButton.className = "taskbar-start";
        this.#startButton.textContent = "Start";
        this.#startButton.type = "button";

        this.#startButton.addEventListener("pointerdown", (event) => {
            event.stopPropagation();

            this.#eventBus.emit("start:toggle");
        });

        this.#left.append(this.#startButton);
    }

    #createClock() {
        const clock = document.createElement("button");

        clock.className = "taskbar-clock";
        clock.type = "button";
        clock.setAttribute("aria-label", "Open calendar");

        const updateClock = () => {
            clock.textContent = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
        };

        updateClock();

        setInterval(updateClock, 1000);

        this.#right.append(clock);

        this.#calendar = flatpickr(clock, {
            defaultDate: new Date(),
            allowInput: false,
            clickOpens: true,
            closeOnSelect: false,
            monthSelectorType: "static",

            position: (instance) => {
                const calendar = instance.calendarContainer;
                const clockRect = clock.getBoundingClientRect();

                const gap = 16;

                const top =
                    clockRect.top -
                    calendar.offsetHeight -
                    gap +
                    window.pageYOffset;

                const left =
                    clockRect.right -
                    calendar.offsetWidth +
                    window.pageXOffset;

                calendar.style.top = `${top}px`;
                calendar.style.left = `${left}px`;
                calendar.style.right = "auto";
            }
        });
    }

    bindEvents() {
        this.#eventBus.on("window:created", (window) => {
            this.addWindow(window);
        });

        this.#eventBus.on("window:closed", (window) => {
            this.removeWindow(window);
        });

        this.#eventBus.on("window:focused", (window) => {
            this.setActiveWindow(window);
        });
    }

    getElement() {
        return this.#element;
    }
}