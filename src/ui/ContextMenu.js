export default class ContextMenu {
    #element;

    constructor(parentElement) {
        this.#element = document.createElement("div");
        this.#element.className = "context-menu";

        parentElement.append(
            this.#element
        );

        this.#element.addEventListener("pointerdown", (event) => {
            event.stopPropagation();
        });

        this.hide();
    }

    show(x, y, items, bounds) {
        this.#element.innerHTML = "";

        for (const item of items) {
            const entry = document.createElement("div");

            entry.className = "context-menu-item";
            entry.textContent = item.label;

            entry.addEventListener("pointerdown", (event) => {
                event.stopPropagation();

                item.action();
                this.hide();
            });

            this.#element.append(entry);
        }

        // Show temporarily so we can measure size
        this.#element.style.display = "block";

        const rect = this.#element.getBoundingClientRect();

        let finalX = x;
        let finalY = y;

        if (finalX + rect.width > bounds.right) {
            finalX = bounds.right - rect.width;
        }

        if (finalY + rect.height > bounds.bottom) {
            finalY = bounds.bottom - rect.height;
        }

        finalX = Math.max(bounds.left, finalX);
        finalY = Math.max(bounds.top, finalY);

        this.#element.style.left = `${finalX}px`;
        this.#element.style.top = `${finalY}px`;
    }

    hide() {
        this.#element.style.display = "none";
    }

    getElement() {
        return this.#element;
    }
}