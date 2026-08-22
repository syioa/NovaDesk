import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";

export class Taskbar {
    #center;
    #element;
    #registry;
    #left;
    #right;

    #pinned;
    #pinnedApps = new Set();
    #pinnedStorageKey = "novadesk-taskbar-pinned";

    #eventBus;
    #startButton;
    #calendar;

    #buttons = new Map();

    constructor(eventBus, registry) {
        this.#eventBus = eventBus;
        this.#registry = registry;

        this.#element = document.createElement("div");
        this.#element.className = "taskbar";

        this.#left = document.createElement("div");
        this.#left.className = "taskbar-left";

        this.#center = document.createElement("div");
        this.#center.className = "taskbar-center";

        this.#right = document.createElement("div");
        this.#right.className = "taskbar-right";

        this.#pinned = document.createElement("div");
        this.#pinned.className = "taskbar-pinned";

        this.#element.append(
            this.#left,
            this.#pinned,
            this.#center,
            this.#right
        );

        this.#createStartButton();
        this.#createClock();

        this.#loadPinnedApps();
        this.#renderPinnedApps();
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

    #loadPinnedApps() {
        try {
            const raw = localStorage.getItem(
                this.#pinnedStorageKey
            );

            if (!raw) {
                return;
            }

            const data = JSON.parse(raw);

            if (Array.isArray(data)) {
                this.#pinnedApps = new Set(data);
            }
        } catch (error) {
            console.warn(
                "Failed to load pinned taskbar apps.",
                error
            );
        }
    }

    #savePinnedApps() {
        try {
            localStorage.setItem(
                this.#pinnedStorageKey,
                JSON.stringify([...this.#pinnedApps])
            );
        } catch (error) {
            console.warn(
                "Failed to save pinned taskbar apps.",
                error
            );
        }
    }

    #renderPinnedApps() {
        this.#pinned.replaceChildren();

        for (const appId of this.#pinnedApps) {
            const AppClass = this.#registry.get(appId);

            if (!AppClass) {
                continue;
            }

            const manifest = AppClass.manifest;

            const button = document.createElement("button");

            button.className = "taskbar-pinned-button";
            button.type = "button";
            button.dataset.appId = manifest.id;
            button.textContent = manifest.icon;
            button.title = manifest.name;

            button.addEventListener("click", () => {
                this.#eventBus.emit(
                    "app:launch",
                    manifest.id
                );
            });

            this.#pinned.append(button);
        }
    }

    #showTaskbarContextMenu(appId, x, y) {

        const AppClass =
            this.#registry.get(appId);

        if (!AppClass) {
            return;
        }

        const manifest =
            AppClass.manifest;

        const pinned =
            this.#pinnedApps.has(appId);

        const menu =
            document.createElement("div");

        menu.className =
            "taskbar-context-menu";

        menu.innerHTML = `
        <button type="button">
            ${pinned
                ? "Unpin from Taskbar"
                : "Pin to Taskbar"}
        </button>
    `;

        menu.style.position = "fixed";
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.zIndex = "9999";

        document.body.appendChild(menu);

        const button =
            menu.querySelector("button");

        button.addEventListener("click", () => {

            if (pinned) {

                this.#pinnedApps.delete(
                    appId
                );

            } else {

                this.#pinnedApps.add(
                    appId
                );
            }

            this.#savePinnedApps();

            this.#renderPinnedApps();

            menu.remove();
        });

        const closeMenu = (event) => {

            if (!menu.contains(event.target)) {

                menu.remove();

                document.removeEventListener(
                    "pointerdown",
                    closeMenu
                );
            }
        };

        requestAnimationFrame(() => {

            document.addEventListener(
                "pointerdown",
                closeMenu
            );

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

        this.#eventBus.on(
            "taskbar:contextmenu",
            ({ appId, x, y }) => {

                this.#showTaskbarContextMenu(
                    appId,
                    x,
                    y
                );

            }
        );
    }

    getElement() {
        return this.#element;
    }
}