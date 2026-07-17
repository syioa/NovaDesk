import WelcomeApp from "../apps/Welcome/WelcomeApp.js";

export default class StartMenu {
    #element;
    #eventBus;
    #registry;
    #uiManager;

    #isOpen = false;

    constructor(eventBus, registry, uiManager) {
        this.#eventBus = eventBus;
        this.#registry = registry;
        this.#uiManager = uiManager;

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
        this.#uiManager.register(this);
    }

    close() {
        this.#isOpen = false;
        this.#element.style.display = "none";
        this.#uiManager.unregister(this);
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