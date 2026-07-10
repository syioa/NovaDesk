export default class EventBus {
    #listeners = new Map();
    // #eventBus = null;

    // get eventBus() {
    //   return this.#eventBus;
    //}

    /**
     * Register an event listener.
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }

        const listeners = this.#listeners.get(event);
        listeners.add(callback);

        return () => listeners.delete(callback);
    }

    /**
     * Register a one-time listener.
     * @param {string} event
     * @param {Function} callback
     */
    once(event, callback) {
        const unsubscribe = this.on(event, (...args) => {
            unsubscribe();
            callback(...args);
        });
    }

    /**
     * Emit an event.
     * @param {string} event
     * @param {...any} args
     */
    emit(event, ...args) {
        const listeners = this.#listeners.get(event);

        if (!listeners) {
            return;
        }

        for (const listener of listeners) {
            listener(...args);
        }
    }

    /**
     * Remove all listeners for an event.
     * @param {string} event
     */
    clear(event) {
        this.#listeners.delete(event);
    }

    /**
     * Remove all listeners.
     */
    destroy() {

        this.#listeners.clear();
    }
}