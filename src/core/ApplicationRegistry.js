import WelcomeApp from "../apps/Welcome/WelcomeApp.js";

export default class ApplicationRegistry {
    #apps = new Map();

    constructor() {
        this.register(WelcomeApp);
    }

    register(AppClass) {
        const id = AppClass.manifest.id;

        this.#apps.set(id, AppClass);
    }

    getApps() {
        return Array.from(this.#apps.values());
    }

    get(id) {
        return this.#apps.get(id);
    }
}