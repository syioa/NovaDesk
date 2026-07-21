import WelcomeApp from "../apps/Welcome/WelcomeApp.js";
import TestApp1 from "../apps/test1.js";
import TestApp2 from "../apps/test2.js";
import TestApp3 from "../apps/test3.js";

export default class ApplicationRegistry {
    #apps = new Map();

    constructor() {
        this.register(WelcomeApp);

        this.register(TestApp1);
        this.register(TestApp2);
        this.register(TestApp3)
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