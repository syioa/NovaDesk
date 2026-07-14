export class Taskbar {
    #element;
    #left;
    #center;
    #right;
    #eventBus;
    #startButton;

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
        this.#startButton.textContent = "Start";

        this.#startButton.addEventListener("click", () => {
            this.#eventBus.emit("start:toggle");
        });

        this.#left.append(this.#startButton);
    }

    #createClock() {
        const clock = document.createElement("span");
        clock.textContent = "12:00";

        this.#right.append(clock);
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