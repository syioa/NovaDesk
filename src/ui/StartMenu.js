import WelcomeApp from "../apps/Welcome/WelcomeApp.js";

export default class StartMenu {
    #element;
    #eventBus;
    #registry;

    #isOpen = false;

    constructor(eventBus, registry) {
        this.#eventBus = eventBus;
        this.#registry = registry;

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
                console.log("inside start menu");
                return;
            }

            console.log("outside start menu");

            this.close();
        });
    }

    #render() {
        this.#element.innerHTML = `
            <div class="start-menu__header">
                NovaDesk
            </div>

            </div>
            <div class="start-menu__apps">
        `;

        const appsContainer = this.#element.querySelector(".start-menu__apps");

        for (const AppClass of this.#registry.getApps()) {
            const manifest = AppClass.manifest;

            const button = document.createElement("button");

            button.textContent = manifest.name;

            button.addEventListener("click", () => {
                this.#eventBus.emit(
                    "app:launch",
                    manifest.id
                );

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