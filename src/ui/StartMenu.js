import WelcomeApp from "../apps/Welcome/WelcomeApp.js";

export default class StartMenu {
    #element;
    #eventBus;

    #isOpen = false;

    constructor(eventBus) {
        this.#eventBus = eventBus;

        this.#element = document.createElement("div");
        this.#element.className = "start-menu";

        this.#render();

        this.#eventBus.on("start:toggle", () => {
            this.toggle();
        });

        document.addEventListener("pointerdown", (event) => {
            if (!this.#isOpen) {
                return;
            }

            if (this.#element.contains(event.target)) {
                return;
            }

            this.close();
        });
    }

    #apps = [
        {
            title: "Welcome",
            icon: "👋",
            id: "welcome"
        }
    ];

    #render() {
        this.#element.innerHTML = `
            <div class="start-menu__header">
                NovaDesk
            </div>

            <div class="start-menu__apps">
            </div>
        `;

        const appsContainer = this.#element.querySelector(".start-menu__apps");

        for (const app of this.#apps) {
            const button = document.createElement("button");

            button.textContent = `${app.icon} ${app.title}`;

            button.addEventListener("click", () => {
                this.#eventBus.emit("app:launch", app.id);
                this.close();
            });

            appsContainer.append(button);
        }
    }

    open() {
        this.#isOpen = true;
        this.#element.style.display = "block";
    }

    close() {
        this.#isOpen = false;
        this.#element.style.display = "none";
    }

    toggle() {
        if (this.#isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    getElement() {
        return this.#element;
    }
}