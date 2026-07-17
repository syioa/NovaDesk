export default class UIManager {
    #active = null;

    constructor() {
        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") {
                return;
            }

            this.#active?.close();
        });
    }

    register(component) {
        this.#active = component;
    }

    unregister(component) {
        if (this.#active === component) {
            this.#active = null;
        }
    }
}