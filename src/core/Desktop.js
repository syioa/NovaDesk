export default class Desktop {
    #element;

    #layers = {};

    constructor() {
        this.#element = document.createElement("main");
        this.#element.className = "desktop";

        this.#createLayers();
    }

    #createLayers() {
        const names = [
            "wallpaper",
            "icons",
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
