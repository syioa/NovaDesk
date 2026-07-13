import Window from "./Window.js";
import WindowState from "./WindowState.js";

export default class WindowManager {
    #container;
    #eventBus;
    #windows = [];
    #desktop;

    #activeSnapRect = null;
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

    #createSnapRect(x, y, width, height) {
        return {
            x,
            y,
            width,
            height
        };
    }

    updateSnapPreview(window, pointerX, pointerY) {
        const workArea = this.getWorkArea();
        const threshold = 24;

        let rect = null;

        if (pointerX <= workArea.left + threshold) {
            rect = {
                x: workArea.left,
                y: workArea.top,
                width: workArea.width / 2,
                height: workArea.height
            };
        } else if (pointerX >= workArea.right - threshold) {
            rect = {
                x: workArea.left + workArea.width / 2,
                y: workArea.top,
                width: workArea.width / 2,
                height: workArea.height
            };
        } else if (pointerY <= workArea.top + threshold) {
            rect = {
                x: workArea.left,
                y: workArea.top,
                width: workArea.width,
                height: workArea.height
            };
        }

        this.#activeSnapRect = rect;

        if (rect) {
            this.#desktop.showSnapPreview(rect);
        } else {
            this.#desktop.hideSnapPreview();
        }
    }

    hideSnapPreview() {
        this.#desktop.hideSnapPreview();
    }
    clearSnapPreview() {
        this.#activeSnapRect = null;
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
        this.#eventBus.emit("window:focused", window);
    }

    clearFocus(window) {
        if (this.#focusedWindow !== window) {
            return;
        }

        window._setFocused(false);

        this.#focusedWindow = null;

        this.#emitBlur(window);
    }

    close(window) {
        this.#windows = this.#windows.filter(
            w => w !== window
        );

        this.#eventBus.emit("window:closed", window);

        window.destroy();
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

    getActiveSnapRect() {
        return this.#activeSnapRect;
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