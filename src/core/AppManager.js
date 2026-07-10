export default class AppManager {
    #windowManager;
    #apps = new Map();

    constructor(windowManager) {
        this.#windowManager = windowManager;
    }

    /**
     * Register an application class.
     * @param {typeof import("../apps/App.js").default} AppClass
     */
    register(AppClass) {
        const { id } = AppClass.manifest;

        if (!id) {
            throw new Error("Application manifest must contain an id.");
        }

        if (this.#apps.has(id)) {
            throw new Error(`Application "${id}" is already registered.`);
        }

        this.#apps.set(id, AppClass);
    }

    /**
     * Launch an application by id.
     * @param {string} id
     */
    launch(id) {
        const AppClass = this.#apps.get(id);

        if (!AppClass) {
            throw new Error(`Unknown application "${id}".`);
        }

        const manifest = AppClass.manifest;

        const window = this.#windowManager.create({
            title: manifest.name,
            width: manifest.width,
            height: manifest.height
        });

        const app = new AppClass();

        app.mount(window);

        return app;
    }
}