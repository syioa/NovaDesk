export default class AppManager {
    #windowManager;
    #eventBus;
    #registry;

    constructor(eventBus, windowManager, registry) {
        this.#eventBus = eventBus;
        this.#windowManager = windowManager;
        this.#registry = registry;

        this.#eventBus.on("app:launch", (id) => {
            this.launch(id);
        });
    }

    /**
     * Register an application class.
     * @param {typeof import("../apps/App.js").default} AppClass
     */

    /**
     * Launch an application by id.
     *@param {string} id
     */
    launch(id) {
        const AppClass = this.#registry.get(id);

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