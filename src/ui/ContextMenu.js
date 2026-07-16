export default class ContextMenu {
    #element;
    #submenu;
    #submenuTimeout;

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

        this.#renderItems(items);

        this.#element.style.display = "block";

        this.#position(x, y, bounds);
    }

    #renderItems(items) {
        for (const item of items) {
            if (item.type === "separator") {
                this.#element.append(
                    this.#createSeparator()
                );

                continue;
            }

            this.#element.append(
                this.#createMenuItem(item)
            );
        }
    }

    #createMenuItem(item) {
        const entry = document.createElement("div");

        entry.className = "context-menu-item";

        const label = document.createElement("span");
        label.textContent = item.label;

        entry.append(label);

        if (item.items) {
            const arrow = document.createElement("span");

            arrow.textContent = "▶";
            arrow.className = "context-menu-arrow";

            entry.append(arrow);

            entry.addEventListener("pointerenter", () => {
                clearTimeout(this.#submenuTimeout);

                this.#openSubmenu(item, entry);
            });

            entry.addEventListener("pointerleave", () => {
                this.#submenuTimeout = setTimeout(() => {
                    this.#closeSubmenu();
                }, 300);
            });
        }

        else {
            entry.addEventListener("pointerdown", (event) => {
                event.stopPropagation();

                item.action();
                this.hide();
            });
        }

        return entry;
    }

    #createSeparator() {
        const separator = document.createElement("div");

        separator.className = "context-menu-separator";

        return separator;
    }

    #position(x, y, bounds) {
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

    #openSubmenu(item, parentElement) {
        if (this.#submenu) {
            this.#submenu.remove();
        }

        this.#submenu = document.createElement("div");

        this.#submenu.addEventListener("pointerenter", () => {
            clearTimeout(this.#submenuTimeout);
        });
        this.#submenu.addEventListener("pointerleave", () => {
            this.#submenuTimeout = setTimeout(() => {
                this.#closeSubmenu();
            }, 300);
        });

        this.#submenu.className = "context-menu";

        for (const child of item.items) {
            const childItem = this.#createMenuItem(child);

            this.#submenu.append(childItem);
        }

        document.body.append(this.#submenu);

        const rect = parentElement.getBoundingClientRect();

        this.#submenu.style.display = "block";
        this.#submenu.style.left = `${rect.right}px`;
        this.#submenu.style.top = `${rect.top}px`;
    }

    #closeSubmenu() {
        if (!this.#submenu) {
            return;
        }

        this.#submenu.remove();
        this.#submenu = null;
    }

    hide() {
        this.#element.style.display = "none";
    }

    getElement() {
        return this.#element;
    }
}