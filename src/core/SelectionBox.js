export default class SelectionBox {
    #element;

    constructor() {
        this.#element = document.createElement("div");
        this.#element.className = "selection-box";

        this.hide();
    }

    get element() {
        return this.#element;
    }

    show() {
        this.#element.style.display = "block";
    }

    hide() {
        this.#element.style.display = "none";
    }

    setRect(x, y, width, height) {
        this.#element.style.left = `${x}px`;
        this.#element.style.top = `${y}px`;
        this.#element.style.width = `${width}px`;
        this.#element.style.height = `${height}px`;
    }
}