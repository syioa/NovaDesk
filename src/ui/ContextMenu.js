export default class ContextMenu {
    #element;
    #submenus = [];
    #submenuTimeout;
    #uiManager;

    constructor(parentElement, uiManager) {
        this.#uiManager = uiManager;

        this.#element = document.createElement("div");
        this.#element.className = "context-menu";

        parentElement.append(
            this.#element
        );

        window.addEventListener("blur", () => {
            this.#closeAll();
        });

        document.addEventListener("pointerdown", (event) => {
            if (!this.#element.contains(event.target)) {
                this.#closeAll();
            }
        });

        this.#element.style.display = "none";
    }

    show(x, y, items, bounds) {
        this.#closeSubmenus();

        this.#element.innerHTML = "";

        this.#renderItems(items);

        this.#element.style.display = "block";

        this.#position(x, y, bounds);

        this.#uiManager.register(this);
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
        entry.addEventListener("pointerenter", () => {
            entry.classList.add("active");
        });

        entry.addEventListener("pointerleave", () => {
            entry.classList.remove("active");
        });

        label.textContent = item.label;

        entry.append(label);

        if (item.items) {
            entry.addEventListener("pointerdown", (event) => {
                event.stopPropagation();
            });
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
                    this.#closeSubmenus();
                }, 300);
            });
        }

        else {
            entry.addEventListener("pointerdown", (event) => {
                event.stopPropagation();

                item.action();
                this.#closeAll();
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
        this.#closeSubmenus();

        const submenu = document.createElement("div");

        submenu.addEventListener("pointerenter", () => {
            clearTimeout(this.#submenuTimeout);
        });

        submenu.addEventListener("pointerleave", () => {
            this.#submenuTimeout = setTimeout(() => {
                this.#closeSubmenus();
            }, 500);
        });

        submenu.className = "context-menu";

        for (const child of item.items) {
            submenu.append(
                this.#createMenuItem(child)
            );
        }

        this.#element.parentElement.append(submenu);

        submenu.style.display = "block";

        const rect = parentElement.getBoundingClientRect();

        this.#positionSubmenu(
            submenu,
            rect
        );

        this.#submenus.push(submenu);
    }

    #positionSubmenu(element, parentRect) {
        const rect = element.getBoundingClientRect();

        let x = parentRect.right;
        let y = parentRect.top;

        // Open to the left if there is not enough space
        if (x + rect.width > window.innerWidth) {
            x = parentRect.left - rect.width;
        }

        // Prevent going below the screen
        if (y + rect.height > window.innerHeight) {
            y = window.innerHeight - rect.height;
        }

        // Prevent negative positions
        x = Math.max(0, x);
        y = Math.max(0, y);

        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }

    #closeSubmenus() {
        clearTimeout(this.#submenuTimeout);

        for (const submenu of this.#submenus) {
            submenu.remove();
        }

        this.#submenus = [];
    }

    #closeAll() {
        clearTimeout(this.#submenuTimeout);

        this.close();
        this.#closeSubmenus();
    }

    close() {
        if (this.#element.style.display === "none") {
            return;
        }

        this.#uiManager.unregister(this);

        this.#element.style.display = "none";
    }

    #containsTarget(target) {
        if (this.#element.contains(target)) {
            return true;
        }

        for (const submenu of this.#submenus) {
            if (submenu.contains(target)) {
                return true;
            }
        }

        return false;
    }

    getElement() {
        return this.#element;
    }
}