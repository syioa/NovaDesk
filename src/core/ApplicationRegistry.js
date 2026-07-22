import WelcomeApp from "../apps/Welcome/WelcomeApp.js";
import NotesApp from "../apps/Notes/NotesApp.js";

export default class ApplicationRegistry {
    #apps = new Map();

    constructor() {
        this.register(WelcomeApp);
        this.register(NotesApp);
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