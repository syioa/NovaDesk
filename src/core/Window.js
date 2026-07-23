import { listItem } from "@milkdown/crepe/feature/list-item";
import WindowState from "./WindowState.js";

export default class Window {
    static #DRAG_RESTORE_THRESHOLD = 12;

    #element;
    #content;
    #container;
    manager;

    #state = WindowState.NORMAL;

    #focused = false;
    #renderScheduled = false;
    #pendingRestoreDrag = false;
    #isSnapped = false;
    #visible = true;

    #minWidth = 200;
    #minHeight = 120;

    #title;
    #width;
    #height;
    #x;
    #y;
    #titleBar;
    #titleElement;
    #controls;
    #resizeLayer;
    #minimizeButton;
    #maximizeButton;
    #closeButton;

    #restoreBounds = null;
    #dragWorkArea = null;
    #snapType = null;

    #restoreGrabOffsetY = 0;
    #restoreGrabOffsetX = 0;
    #restoreDragStartX = 0;
    #restoreDragStartY = 0;
    #restoreGrabRatio = 0;
    #dragWidth = 0;
    #dragHeight = 0;
    #dragTitleHeight = 0;

    constructor(manager, options = {}) {
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);

        this.onResizeStart = this.onResizeStart.bind(this);
        this.onResizeMove = this.onResizeMove.bind(this);
        this.onResizeEnd = this.onResizeEnd.bind(this);

        this.manager = manager;

        this.#title = options.title ?? "Untitled";

        this.#width = options.width ?? 500;
        this.#height = options.height ?? 350;

        this.#x = options.x ?? 100;
        this.#y = options.y ?? 100;

        this.#createDOM();
        this.#applyStyles();

        this.drag = {
            active: false,

            pointerId: null,

            startPointerX: 0,
            startPointerY: 0,

            startX: 0,
            startY: 0,
        };

        this.resize = {
            active: false,

            pointerId: null,

            direction: null,

            startPointerX: 0,
            startPointerY: 0,

            startX: 0,
            startY: 0,

            startWidth: 0,
            startHeight: 0,
        };
    }

    #createDOM() {
        this.#element = document.createElement("div");
        this.#element.className = "window";

        // Title bar
        this.#titleBar = document.createElement("div");
        this.#titleBar.className = "window__titlebar";
        this.#titleBar.addEventListener("pointerdown", this.onDragStart);
        this.#titleBar.addEventListener(
            "dblclick",
            this.#handleTitleBarDoubleClick.bind(this)
        );

        // Title
        this.#titleElement = document.createElement("div");
        this.#titleElement.className = "window__title";
        this.#titleElement.textContent = this.#title;

        // Controls
        this.#controls = document.createElement("div");
        this.#controls.className = "window__controls";

        this.#minimizeButton = document.createElement("button");
        this.#minimizeButton.className = "window__button window__button--minimize";
        this.#minimizeButton.type = "button";
        this.#minimizeButton.textContent = "—";
        this.#minimizeButton.title = "Minimize";

        this.#maximizeButton = document.createElement("button");
        this.#maximizeButton.className = "window__button window__button--maximize";
        this.#maximizeButton.type = "button";
        this.#maximizeButton.textContent = "□";
        this.#maximizeButton.title = "Maximize";

        this.#closeButton = document.createElement("button");
        this.#closeButton.className = "window__button window__button--close";
        this.#closeButton.type = "button";
        this.#closeButton.textContent = "✕";
        this.#closeButton.title = "Close";

        const resize = document.createElement("div");
        resize.className = "window__resize";

        this.#resizeLayer = resize;
        this.#element.appendChild(resize);

        const directions = [
            "n",
            "ne",
            "e",
            "se",
            "s",
            "sw",
            "w",
            "nw",
        ];

        for (const direction of directions) {
            const handle = document.createElement("div");

            handle.className = `window__resize-handle window__resize-handle--${direction}`;
            handle.dataset.direction = direction;

            handle.addEventListener("pointerdown", this.onResizeStart);

            resize.appendChild(handle);
        }

        this.#controls.append(
            this.#minimizeButton,
            this.#maximizeButton,
            this.#closeButton
        );

        this.#titleBar.append(
            this.#titleElement,
            this.#controls
        );

        this.#content = document.createElement("div");
        this.#content.className = "window__content";

        this.#element.append(
            this.#titleBar,
            this.#content
        );

        this.#bindEvents();
        this.#syncStateClasses();
        this.#updateControls();
    }

    #handleTitleBarDoubleClick(event) {
        if (event.button !== 0) {
            return;
        }

        if (this.#state === WindowState.MAXIMIZED) {
            this.restore();
        } else if (this.#state === WindowState.NORMAL) {
            this.maximize();
        }
    }

    #bindEvents() {

        this.#controls.addEventListener("pointerdown", (event) => {
            event.stopPropagation();
        });

        this.#closeButton.addEventListener("click", () => {
            this.manager.close(this);
        });

        this.#minimizeButton.addEventListener("click", () => {
            this.minimize();
        });

        this.#maximizeButton.addEventListener("click", () => {
            if (
                this.state === WindowState.MAXIMIZED ||
                this.#isSnapped
            ) {
                this.restore();
            } else {
                this.maximize();
            }
        });
        this.element.addEventListener("mousedown", () => {
            this.requestFocus();
        });

    }

    #updateControls() {
        if (!this.#maximizeButton) {
            return;
        }

        if (this.state === WindowState.MAXIMIZED) {
            this.#maximizeButton.textContent = "❐";
            this.#maximizeButton.title = "Restore";
        } else {
            this.#maximizeButton.textContent = "□";
            this.#maximizeButton.title = "Maximize";
        }
    }

    #applyStyles() {
        Object.assign(this.#element.style, {
            width: `${this.#width}px`,
            height: `${this.#height}px`,
            left: `${this.#x}px`,
            top: `${this.#y}px`
        });
    }

    #isValidTransition(nextState) {
        const transitions = {
            [WindowState.NORMAL]: [
                WindowState.MINIMIZED,
                WindowState.MAXIMIZED,
                WindowState.CLOSED
            ],

            [WindowState.MAXIMIZED]: [
                WindowState.NORMAL,
                WindowState.MINIMIZED,
                WindowState.CLOSED
            ],

            [WindowState.MINIMIZED]: [
                WindowState.NORMAL,
                WindowState.CLOSED
            ],

            [WindowState.CLOSED]: []

        };
        return transitions[this.#state].includes(nextState);
    }

    #syncStateClasses() {
        if (!this.#element) {
            return;
        }

        this.#element.classList.remove(
            "window--normal",
            "window--minimized",
            "window--maximized",
            "window--closed"
        );

        this.#element.classList.add(`window--${this.#state}`);
    }

    #setState(nextState) {
        if (this.#state === nextState) {
            return;
        }

        if (!this.#isValidTransition(nextState)) {
            throw new Error(
                `Invalid window transition: ${this.#state} -> ${nextState}`
            );
        }

        const previousState = this.#state;

        this.#state = nextState;

        this.#syncStateClasses();
        this.#updateControls();

        this.manager.eventBus.emit(
            "window:statechange",
            {
                window: this,
                previousState,
                currentState: nextState
            }
        );
    }

    #scheduleRender() {
        if (this.#renderScheduled) {
            return;
        }

        this.#renderScheduled = true;

        requestAnimationFrame(() => {
            this.#renderScheduled = false;
            this.render();
        });
    }

    render() {
        this.#element.style.left = `${this.#x}px`;
        this.#element.style.top = `${this.#y}px`;

        this.#element.style.width = `${this.#width}px`;
        this.#element.style.height = `${this.#height}px`;
    }


    #setPosition(x, y) {
        this.#x = x;
        this.#y = y;

        this.#scheduleRender();
    }

    onResizeStart(event) {
        if (event.button !== 0) return;

        this.#element.classList.add("window--resizing");
        event.stopPropagation();


        this.manager.focus(this);

        this.resize.active = true;
        this.resize.pointerId = event.pointerId;
        this.resize.direction = event.currentTarget.dataset.direction;

        this.resize.startPointerX = event.clientX;
        this.resize.startPointerY = event.clientY;

        this.resize.startX = this.#x;
        this.resize.startY = this.#y;

        this.resize.startWidth = this.#element.offsetWidth;
        this.resize.startHeight = this.#element.offsetHeight;

        this.#element.setPointerCapture(event.pointerId);

        document.body.style.cursor = `${this.resize.direction}-resize`;

        this.#element.addEventListener("pointermove", this.onResizeMove);
        this.#element.addEventListener("pointerup", this.onResizeEnd);
        this.#element.addEventListener("pointercancel", this.onResizeEnd);

        event.preventDefault();
    }

    //Extract the edge logic
    //Create these four private methods.
    #resizeEast(deltaX) {
        this.#width = Math.max(
            this.#minWidth,
            this.resize.startWidth + deltaX
        );
    }
    #resizeSouth(deltaY) {
        this.#height = Math.max(
            this.#minHeight,
            this.resize.startHeight + deltaY
        );
    }
    #resizeWest(deltaX) {
        const width = Math.max(
            this.#minWidth,
            this.resize.startWidth - deltaX
        );

        this.#width = width;
        this.#x =
            this.resize.startX +
            (this.resize.startWidth - width);
    }
    #resizeNorth(deltaY) {
        const height = Math.max(
            this.#minHeight,
            this.resize.startHeight - deltaY
        );

        this.#height = height;
        this.#y =
            this.resize.startY +
            (this.resize.startHeight - height);
    }

    onResizeMove(event) {
        if (!this.resize.active) return;
        if (event.pointerId !== this.resize.pointerId) return;

        const deltaX = event.clientX - this.resize.startPointerX;
        const deltaY = event.clientY - this.resize.startPointerY;

        switch (this.resize.direction) {
            // East
            case "e":
                this.#resizeEast(deltaX);
                break;

            // South
            case "s":
                this.#resizeSouth(deltaY);
                break;

            // West    
            case "w":
                this.#resizeWest(deltaX);
                break;

            // North
            case "n":
                this.#resizeNorth(deltaY);
                break;

            // South East
            case "se":
                this.#resizeEast(deltaX);
                this.#resizeSouth(deltaY);
                break;

            // South West
            case "sw":
                this.#resizeWest(deltaX);
                this.#resizeSouth(deltaY);
                break;

            // North East
            case "ne":
                this.#resizeNorth(deltaY);
                this.#resizeEast(deltaX);
                break;

            // North West
            case "nw":
                this.#resizeNorth(deltaY);
                this.#resizeWest(deltaX);
                break;
        }

        this.#scheduleRender();
    }

    onResizeEnd(event) {
        this.#element.releasePointerCapture(event.pointerId);

        this.#element.removeEventListener("pointermove", this.onResizeMove);
        this.#element.removeEventListener("pointerup", this.onResizeEnd);
        this.#element.removeEventListener("pointercancel", this.onResizeEnd);

        this.#element.classList.remove("window--resizing");
        document.body.style.cursor = "";
    }

    onDragStart(event) {
        console.log("Move")

        if (event.button !== 0) {
            return;
        }

        // Don't start dragging when clicking the window controls.
        if (event.target.closest(".window__controls")) {
            return;
        }

        this.manager.focus(this);

        if (this.#state === WindowState.MAXIMIZED) {
            this.#pendingRestoreDrag = true;
            const workArea = this.manager.getWorkArea();

            this.#restoreGrabRatio =
                (event.clientX - workArea.left) /
                (workArea.right - workArea.left);

            this.#restoreGrabOffsetY =
                event.clientY - this.#titleBar.getBoundingClientRect().top;

            this.#restoreDragStartX = event.clientX;
            this.#restoreDragStartY = event.clientY;
        } else {
            this.drag.active = true;

            this.drag.startX = this.#x;
            this.drag.startY = this.#y;

            this.drag.startPointerX = event.clientX;
            this.drag.startPointerY = event.clientY;

            // Cache layout values once for this drag session.
            this.#dragWidth = this.#element.offsetWidth;
            this.#dragHeight = this.#element.offsetHeight;
            this.#dragTitleHeight = this.#titleBar.offsetHeight;
            this.#dragWorkArea = this.manager.getWorkArea();
        }

        this.drag.pointerId = event.pointerId;

        this.#titleBar.setPointerCapture(event.pointerId);

        this.#titleBar.addEventListener("pointermove", this.onDragMove);
        this.#titleBar.addEventListener("pointerup", this.onDragEnd);
        this.#titleBar.addEventListener("pointercancel", this.onDragEnd);

        event.preventDefault();
    }

    onDragMove(event) {
        if (this.#pendingRestoreDrag) {

            const dx = event.clientX - this.#restoreDragStartX;
            const dy = event.clientY - this.#restoreDragStartY;

            if (
                Math.abs(dx) < Window.#DRAG_RESTORE_THRESHOLD &&
                Math.abs(dy) < Window.#DRAG_RESTORE_THRESHOLD
            ) {
                return;
            }

            this.#beginRestoreDrag(event);
            // Continue this same pointer movement
        }

        if (!this.drag.active) return;
        if (event.pointerId !== this.drag.pointerId) return;

        const dx = event.clientX - this.drag.startPointerX;
        const dy = event.clientY - this.drag.startPointerY;

        const bounds = this.#dragWorkArea;

        const maxX = bounds.right - this.#dragWidth;
        const maxY = bounds.bottom - this.#dragHeight;

        // Keep the title bar visible.
        this.#setPosition(
            Math.min(Math.max(this.drag.startX + dx, bounds.left), maxX),
            Math.min(Math.max(this.drag.startY + dy, bounds.top), maxY)
        );

        // Update the window's position on screen.
        this.#scheduleRender();

        this.manager.updateSnapPreview(
            this,
            event.clientX,
            event.clientY
        );
    }

    onDragEnd(event) {
        console.log("drag end");

        if (event.pointerId !== this.drag.pointerId) return;

        this.#pendingRestoreDrag = false;
        this.drag.active = false;

        const rect = this.manager.getActiveSnapRect();
        this.manager.clearSnapPreview();
        let workArea;

        if (rect) {
            workArea = this.manager.getWorkArea();

            const isFullScreenSnap =
                Math.abs(rect.width - workArea.width) < 2 &&
                Math.abs(rect.height - workArea.height) < 2;

            if (isFullScreenSnap) {
                // Save restore position before maximizing
                this.#restoreBounds = {
                    x: this.#x,
                    y: this.#y,
                    width: this.#width,
                    height: this.#height
                };

                this.#x = rect.x;
                this.#y = rect.y;
                this.#width = rect.width;
                this.#height = rect.height;

                this.#isSnapped = false;

                this.#setState(WindowState.MAXIMIZED);
                this.#scheduleRender();

            } else {
                // Normal side snap
                this.#isSnapped = true;

                this.#x = rect.x;
                this.#y = rect.y;
                this.#width = rect.width;
                this.#height = rect.height;

                this.#scheduleRender();
            }
        }

        if (this.#titleBar.hasPointerCapture(event.pointerId)) {
            this.#titleBar.releasePointerCapture(event.pointerId);
        }

        this.#titleBar.removeEventListener(
            "pointermove",
            this.onDragMove
        );


        this.#titleBar.removeEventListener(
            "pointerup",
            this.onDragEnd
        );

        this.#titleBar.removeEventListener(
            "pointercancel",
            this.onDragEnd
        );

        // Clear drag cache
        this.#dragWidth = 0;
        this.#dragHeight = 0;
        this.#dragTitleHeight = 0;
        this.#dragWorkArea = null;

        this.manager.hideSnapPreview();
    }

    #beginRestoreDrag(event) {
        this.#pendingRestoreDrag = false;

        const restoreOffsetX = this.#restoreGrabOffsetX;
        const restoreOffsetY = this.#restoreGrabOffsetY;

        this.restore();

        const newX = event.clientX - restoreOffsetX;
        const newY = event.clientY - restoreOffsetY;

        this.#setPosition(newX, newY);

        this.drag.active = true;

        this.drag.startPointerX = event.clientX;
        this.drag.startPointerY = event.clientY;

        this.drag.startX = newX;
        this.drag.startY = newY;

        this.#dragWidth = this.#element.offsetWidth;
        this.#dragHeight = this.#element.offsetHeight;
        this.#dragTitleHeight = this.#titleBar.offsetHeight;
        this.#dragWorkArea = this.manager.getWorkArea();
    }

    _setFocused(focused) {
        this.#focused = focused;

        this.element.classList.toggle("window--focused", focused);
        this.element.classList.toggle("window--inactive", !focused);
    }
    _setZIndex(zIndex) {
        this.element.style.zIndex = zIndex;
    }

    mount(parent) {
        parent.append(this.#element);
    }

    unmount() {
        this.#element.remove();
    }

    maximize() {
        if (this.state === WindowState.MAXIMIZED) {
            return;
        }

        this.#restoreBounds = {
            x: this.#x,
            y: this.#y,
            width: this.#width,
            height: this.#height
        };

        const workArea = this.manager.getWorkArea();

        this.#x = workArea.left;
        this.#y = workArea.top;
        this.#width = workArea.width;
        this.#height = workArea.height;;

        this.#applyStyles();

        this.#setState(WindowState.MAXIMIZED);
    }

    restore() {
        this.#visible = true;
        this.element.style.display = "";

        if (!this.#restoreBounds && !this.#isSnapped) {
            return;
        }

        if (this.#restoreBounds) {
            this.#x = this.#restoreBounds.x;
            this.#y = this.#restoreBounds.y;
            this.#width = this.#restoreBounds.width;
            this.#height = this.#restoreBounds.height;
        }

        this.#applyStyles();

        this.#restoreBounds = null;
        this.#isSnapped = false;
        this.#snapType = null;

        this.#setState(WindowState.NORMAL);
    }

    minimize() {
        this.#visible = false;
        this.element.style.display = "none";
    }

    close() {
        this.#setState(WindowState.CLOSED);
    }

    get element() {
        return this.#element;
    }

    get content() {
        return this.#content;
    }

    get state() {
        return this.#state;
    }

    get isFocused() {
        return this.#focused;
    }

    getTitle() {
        return this.#title;
    }

    focus() {
        this.manager.focus(this);
    }

    destroy() {
        this.#element.remove();
    }

    isVisible() {
        return this.#visible;
    }

    requestFocus() {
        this.manager.focus(this);
    }
}
