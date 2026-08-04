import Desktop from "./Desktop.js";
import WindowManager from "./WindowManager.js";
import EventBus from "./EventBus.js";
import AppManager from "./AppManager.js";
import WelcomeApp from "../apps/Welcome/WelcomeApp.js";
import ApplicationRegistry from "./ApplicationRegistry.js";
import UIManager from "./UIManager.js";
import SettingsStore from "../apps/Settings/SettingsStore.js";
import DesktopSettingsPanel from "../apps/Settings/DesktopSettingsPanel.js";
import DialogService from "../ui/components/dialog/DialogService.js";
import ThemeManager from "./ThemeManager.js";

export default class Application {
    static instance = null;

    #initialized = false;
    #registry;
    #uiManager = null;

    #desktop = null;
    #windowManager = null;
    #eventBus = null;
    #appManager = null;
    #settingsStore = null;
    #dialogService = null;
    #themeManager = null;

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

    get settingsStore() {
        return this.#settingsStore;
    }

    get dialogs() {
        return this.#dialogService;
    }

    get themeManager() {
        return this.#themeManager;
    }

    async boot() {
        this.#eventBus = new EventBus();
        this.#registry = new ApplicationRegistry();
        this.#uiManager = new UIManager();

        this.#settingsStore =
            new SettingsStore(
                this.#eventBus
            );

        this.#themeManager =
            new ThemeManager({
                eventBus: this.#eventBus,
                settingsStore: this.#settingsStore
            });

        if (this.#initialized) return;

        this.#initialized = true;

        this.#desktop = new Desktop(
            this.#eventBus,
            this.#registry,
            this.#uiManager,
            this.#settingsStore
        );

        document.body.append(this.#desktop.element);

        this.#dialogService = new DialogService(
            this.#uiManager,
            this.#desktop.getLayer("overlay")
        );

        this.#windowManager = new WindowManager(
            this.#desktop,
            this.#eventBus
        );

        this.#appManager = new AppManager(
            this.#eventBus,
            this.#windowManager,
            this.#registry,
            this.#settingsStore
        );

        this.#appManager.launch("welcome");

        console.log("NovaDesk started.");
    }
}