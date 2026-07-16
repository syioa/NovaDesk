import { Taskbar } from "../ui/Taskbar.js";
import StartMenu from "../ui/StartMenu.js";
import DesktopIcons from "../ui/DesktopIcons.js";
import ContextMenu from "../ui/ContextMenu.js";

export default class Desktop {
    #element;
    #snapPreview;
    #taskbar;
    #eventBus;
    #startMenu;
    #registry;
    #contextMenu;

    #desktopIcons;

    #layers = {};

    constructor(eventBus, registry) {
        this.#eventBus = eventBus;
        this.#registry = registry;

        this.#element = document.createElement("main");
        this.#element.className = "desktop";
        this.#startMenu = new StartMenu(
            this.#eventBus,
            this.#registry
        );

        this.#createLayers();

        this.#contextMenu = new ContextMenu(
            this.getLayer("contextmenu")
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
            [
                {
                    label: "Refresh",
                    action: () => console.log("Refresh clicked")
                },
                {
                    label: "Settings",
                    action: () => console.log("Settings clicked")
                }
            ],
            this.getWorkArea()
        );
    }

    #onPointerDown(event) {
        this.#contextMenu.hide();

        if (event.target !== this.#element) {
            return;
        }

        this.#desktopIcons.clearSelection();
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