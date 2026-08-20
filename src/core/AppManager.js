export default class AppManager {
    #windowManager;
    #eventBus;
    #registry;
    #settingsStore;

    constructor(eventBus, windowManager, registry, settingsStore) {

        this.#eventBus = eventBus;
        this.#windowManager = windowManager;
        this.#registry = registry;
        this.#settingsStore = settingsStore;

        this.#eventBus.on("app:launch", (payload) => {
            if (typeof payload === "string") {
                this.launch(payload);
                return;
            }

            this.launch(payload.id, payload.options);
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
    launch(id, options = {}) {
        const AppClass = this.#registry.get(id);

        if (!AppClass) {
            throw new Error(`Unknown application "${id}".`);
        }

        const manifest = AppClass.manifest;

        const window = this.#windowManager.create({
            title: manifest.name,
            width: manifest.width,
            height: manifest.height,
            minWidth: manifest.minWidth,
            minHeight: manifest.minHeight,
        });

        const app = new AppClass();

        app.mount(
            window,
            this.#eventBus,
            this.#settingsStore,
            options
        );

        if (options.page) {
            app.openPage?.(options.page);
        }

        return app;
    }
}