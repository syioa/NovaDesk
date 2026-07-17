import Desktop from "./Desktop.js";
import WindowManager from "./WindowManager.js";
import EventBus from "./EventBus.js";
import AppManager from "./AppManager.js";
import WelcomeApp from "../apps/Welcome/WelcomeApp.js";
import ApplicationRegistry from "./ApplicationRegistry.js";
import UIManager from "./UIManager.js";

export default class Application {
    static instance = null;

    #initialized = false;
    #registry;
    #uiManager = null;

    #desktop = null;
    #windowManager = null;
    #eventBus = null;
    #appManager = null;

    constructor() {
        if (Application.instance) {
            return Application.instance;
        }

        Application.instance = this;
    }

    get desktop() {
        return this.#desktop;
    }

    get windowManager() {
        return this.#windowManager;
    }

    get appManager() {
        return this.#appManager;
    }

    async boot() {
        this.#eventBus = new EventBus();
        this.#registry = new ApplicationRegistry();
        this.#uiManager = new UIManager();

        this.#eventBus.on("window:created", (window) => {
            console.log("Window created:", window);
        });

        if (this.#initialized) return;

        this.#initialized = true;

        this.#desktop = new Desktop(
            this.#eventBus,
            this.#registry,
            this.#uiManager
        );

        document.body.append(this.#desktop.element);

        this.#windowManager = new WindowManager(
            this.#desktop,
            this.#eventBus
        );

        this.#appManager = new AppManager(
            this.#eventBus,
            this.#windowManager,
            this.#registry
        );

        this.#appManager.launch("welcome");

        console.log("NovaDesk started.");
    }
}