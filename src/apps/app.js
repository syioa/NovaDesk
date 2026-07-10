export default class App {
    #window = null;

    constructor() {
        if (new.target === App) {
            throw new Error("App is an abstract class and cannot be instantiated.");
        }
    }

    /**
     * Called when the app is launched.
     * @param {Window} window
     */
    mount(window) {
        this.#window = window;
    }

    /**
     * Called before the app is closed.
     */
    unmount() { }

    /**
     * Window owned by this app.
     */
    get window() {
        return this.#window;
    }

    /**
     * Metadata every app should override.
     */
    static get manifest() {
        throw new Error(`${this.name} must define a static manifest.`);
    }
}