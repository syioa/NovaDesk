import { Taskbar } from "../ui/Taskbar.js";
import StartMenu from "../ui/StartMenu.js";
import DesktopIcons from "../ui/DesktopIcons.js";

export default class Desktop {
    #element;
    #snapPreview;
    #taskbar;
    #eventBus;
    #startMenu;
    #registry;

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

        this.#element.addEventListener("pointerdown", (event) => {
            if (event.target === this.#element) {
                this.#desktopIcons.clearSelection();
            }
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