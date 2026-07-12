import Window from "./Window.js";
import WindowState from "./WindowState.js";

export default class WindowManager {
    #container;
    #eventBus;
    #windows = [];
    #desktop;

    #focusedWindow = null;
    #zCounter = 100;

    constructor(desktop, eventBus) {
        this.#desktop = desktop;
        this.#container = this.#desktop.getLayer("windows");
        this.#eventBus = eventBus;
    }

    create(options = {}) {
        const window = new Window(this, options);

        this.#windows.push(window);
        window.mount(this.#container);

        this.#eventBus.emit("window:created", window);

        this.focus(window);
        return window;
    }

    updateSnapPreview(window, pointerX, pointerY) {
        const workArea = this.getWorkArea();

        const threshold = 24;

        if (pointerX <= workArea.left + threshold) {
            this.#desktop.showSnapPreview({
                x: workArea.left,
                y: workArea.top,
                width: workArea.width / 2,
                height: workArea.height
            });

            return;
        }

        if (pointerX >= workArea.right - threshold) {
            this.#desktop.showSnapPreview({
                x: workArea.left + workArea.width / 2,
                y: workArea.top,
                width: workArea.width / 2,
                height: workArea.height
            });

            return;
        }

        if (pointerY <= workArea.top + threshold) {
            this.#desktop.showSnapPreview(workArea);

            return;
        }

        this.#desktop.hideSnapPreview();
    }

    hideSnapPreview() {
        this.#desktop.hideSnapPreview();
    }

    focus(window) {
        if (this.#focusedWindow === window) {
            return;
        }

        if (!this.#windows.includes(window)) {
            return;
        }

        if (window.state === WindowState.CLOSED) {
            return;
        }

        const previous = this.#focusedWindow;

        if (previous) {
            previous._setFocused(false);
            this.#emitBlur(previous);
        }

        this.#focusedWindow = window;

        window._setFocused(true);
        window._setZIndex(++this.#zCounter);

        this.#emitFocus(window);
    }

    clearFocus(window) {
        if (this.#focusedWindow !== window) {
            return;
        }

        window._setFocused(false);

        this.#focusedWindow = null;

        this.#emitBlur(window);
    }

    #emitFocus(window) {
        this.eventBus.emit("window:focus", {
            window
        });
    }

    #emitBlur(window) {
        this.eventBus.emit("window:blur", {
            window
        });
    }

    get windows() {
        return [...this.#windows];
    }

    get eventBus() {
        return this.#eventBus;
    }

    get container() {
        return this.#container;
    }

    get focusedWindow() {
        return this.#focusedWindow;
    }

    getWorkArea() {
        const width = this.#desktop.element.clientWidth;
        const height = this.#desktop.element.clientHeight;

        return {
            left: 0,
            top: 0,
            right: width,
            bottom: height,
            width,
            height,
        };
    }
}