export default class Desktop {
    #element;
    #snapPreview;

    #layers = {};

    constructor() {
        this.#element = document.createElement("main");
        this.#element.className = "desktop";

        this.#createLayers();
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
            "contextmenu"
        ];

        for (const name of names) {
            const layer = document.createElement("div");

            layer.className = `desktop-layer desktop-layer-${name}`;

            this.#layers[name] = layer;
            this.#element.append(layer);
        }
    }

    get element() {
        return this.#element;
    }

    getLayer(name) {
        return this.#layers[name];
    }
}
