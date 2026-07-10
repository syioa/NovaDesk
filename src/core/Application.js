import Desktop from "./Desktop.js";
import WindowManager from "./WindowManager.js";
import EventBus from "./EventBus.js";
import AppManager from "./AppManager.js";
import WelcomeApp from "../apps/Welcome/WelcomeApp.js";

export default class Application {
    static instance = null;

    #initialized = false;

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

        this.#eventBus.on("window:created", (window) => {
            console.log("Window created:", window);
        });

        if (this.#initialized) return;

        this.#initialized = true;

        this.#desktop = new Desktop();

        document.body.append(this.#desktop.element);

        this.#windowManager = new WindowManager(
            this.#desktop,
            this.#eventBus
        );

        this.#appManager = new AppManager(this.#windowManager);
        this.#appManager.register(WelcomeApp);
        this.#appManager.launch("welcome");

        console.log("NovaDesk started.");
    }
}