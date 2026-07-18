import { Taskbar } from "../ui/Taskbar.js";
import StartMenu from "../ui/StartMenu.js";
import DesktopIcons from "../ui/DesktopIcons.js";
import ContextMenu from "../ui/ContextMenu.js";
import SelectionBox from "./SelectionBox.js";

export default class Desktop {
    #element;
    #snapPreview;
    #taskbar;
    #eventBus;
    #startMenu;
    #registry;
    #contextMenu;

    #desktopIcons;
    #uiManager;
    #overlayLayer;

    #layers = {};

    #selectionBox;
    #selecting = false;

    #selectionStartX = 0;
    #selectionStartY = 0;

    constructor(eventBus, registry, uiManager) {
        this.#eventBus = eventBus;
        this.#registry = registry;
        this.#uiManager = uiManager;

        this.#element = document.createElement("main");
        this.#element.className = "desktop";
        this.#startMenu = new StartMenu(
            this.#eventBus,
            this.#registry,
            this.#uiManager
        );

        this.#createLayers();

        this.#overlayLayer = this.getLayer("overlay");

        this.#contextMenu = new ContextMenu(
            this.#layers.contextmenu,
            this.#uiManager
        );

        this.#taskbar = new Taskbar(this.#eventBus);
        this.#taskbar.bindEvents();

        this.getLayer("taskbar").append(
            this.#taskbar.getElement()
        );

        this.#desktopIcons = new DesktopIcons(
            this.#eventBus,
            this.#registry
        );
        this.getLayer("icons").append(
            this.#desktopIcons.element
        );

        this.#element.addEventListener("contextmenu", (event) => {
            this.#onContextMenu(event);
        });
        this.#element.addEventListener("pointerdown", (event) => {
            this.#onPointerDown(event);
        });

        this.#createSnapPreview();
        this.#selectionBox = new SelectionBox();

        this.#overlayLayer.append(
            this.#selectionBox.element
        );

        document.addEventListener("pointermove", (event) => {
            this.#onPointerMove(event);
        });

        document.addEventListener("pointerup", (event) => {
            this.#onPointerUp(event);
        });
    }

    #createSnapPreview() {
        this.#snapPreview = document.createElement("div");
        this.#snapPreview.className = "desktop__snap-preview";

        this.getLayer("snap-preview").appendChild(this.#snapPreview);
    }

    showSnapPreview({ x, y, width, height }) {
        Object.assign(this.#snapPreview.style, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            opacity: "1"
        });
    }

    hideSnapPreview() {
        this.#snapPreview.style.opacity = "0";
    }

    #createLayers() {
        const names = [
            "wallpaper",
            "icons",
            "snap-preview",
            "windows",
            "overlay",
            "contextmenu",
            "taskbar"
        ];

        for (const name of names) {
            const layer = document.createElement("div");

            layer.className = `desktop-layer desktop-layer-${name}`;

            this.#layers[name] = layer;
            this.#element.append(layer);
        }

        this.getLayer("taskbar").append(
            this.#startMenu.getElement()
        );
    }

    #onContextMenu(event) {
        event.preventDefault();

        // Only show menu on empty desktop
        if (event.target !== this.#element) {
            return;
        }

        this.#contextMenu.show(
            event.clientX,
            event.clientY,
            this.#createDesktopContextMenuItems(),
            this.getWorkArea()
        );
    }

    #createDesktopContextMenuItems() {
        return [
            {
                label: "View",
                items: [
                    {
                        label: "Large Icons",
                        action: () => console.log("Large Icons")
                    },
                    {
                        label: "Small Icons",
                        action: () => console.log("Small Icons")
                    }
                ]
            },

            { type: "separator" },

            {
                label: "Refresh",
                action: () => this.#refresh()
            }
        ];
    }

    #onPointerUp() {
        if (!this.#selecting) {
            return;
        }

        this.#selecting = false;

        this.#selectionBox.hide();
    }

    #onPointerMove(event) {
        if (!this.#selecting) {
            return;
        }

        const left = Math.min(
            this.#selectionStartX,
            event.clientX
        );

        const top = Math.min(
            this.#selectionStartY,
            event.clientY
        );

        const width = Math.abs(
            event.clientX - this.#selectionStartX
        );

        const height = Math.abs(
            event.clientY - this.#selectionStartY
        );

        this.#selectionBox.setRect(
            left,
            top,
            width,
            height
        );
    }

    #onPointerDown(event) {
        this.#contextMenu.close();

        if (event.button !== 0) {
            return;
        }

        if (event.target !== this.#element) {
            return;
        }

        this.#desktopIcons.clearSelection();

        this.#selecting = true;

        this.#selectionStartX = event.clientX;
        this.#selectionStartY = event.clientY;

        this.#selectionBox.show();

        this.#selectionBox.setRect(
            event.clientX,
            event.clientY,
            0,
            0
        );
    }

    #refresh() {
        console.log("Refresh clicked");
    }

    #openSettings() {
        console.log("Settings clicked");
    }

    getWorkArea() {
        const rect = this.#taskbar
            .getElement()
            .getBoundingClientRect();

        return {
            left: 0,
            top: 0,
            right: window.innerWidth,
            bottom: window.innerHeight - rect.height
        };
    }

    get element() {
        return this.#element;
    }

    get taskbar() {
        return this.#taskbar;
    }

    getLayer(name) {
        return this.#layers[name];
    }
}