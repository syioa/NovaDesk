export default class DesktopIcons {
    #eventBus;
    #registry;
    #element;
    #desktopIcons;

    #selectedIcons = new Set();
    #iconPositions = new Map();

    #dragging = false;

    #dragIcon = null;

    #dragStartX = 0;
    #dragStartY = 0;

    #iconStartX = 0;
    #iconStartY = 0;

    constructor(eventBus, registry) {
        this.#eventBus = eventBus;
        this.#registry = registry;

        this.#element = document.createElement("div");
        this.#element.className = "desktop-icons";

        this.#render();

        this.#element.addEventListener("click", (event) => {
            if (event.target === this.#element) {
                this.clearSelection();
            }
        });

        document.addEventListener(
            "pointermove",
            (event) => {
                this.#moveDrag(event);
            }
        );

        document.addEventListener(
            "pointerup",
            () => {
                this.#endDrag();
            }
        );
    }

    get element() {
        return this.#element;
    }

    #render() {
        this.#element.replaceChildren();

        const apps = this.#registry.getApps();

        for (const AppClass of apps) {
            this.#element.append(
                this.#createIcon(AppClass)
            );
        }
    }

    #createIcon(AppClass) {
        const icon = document.createElement("div");
        icon.className = "desktop-icon";

        const manifest = AppClass.manifest;

        const image = document.createElement("div");
        image.className = "desktop-icon-image";
        image.textContent = manifest.icon;

        const label = document.createElement("div");
        label.className = "desktop-icon-label";
        label.textContent = manifest.name;

        icon.append(image, label);

        icon.addEventListener("click", () => {
            this.#selectIcon(icon);
        });

        icon.addEventListener(
            "pointerdown",
            (event) => {
                this.#startDrag(icon, event);
            }
        );

        icon.addEventListener("dblclick", () => {
            this.#eventBus.emit(
                "app:launch",
                manifest.id
            );
        });


        const index = this.#iconPositions.size;

        const column = index % 6;
        const row = Math.floor(index / 6);

        const x = 32 + column * 96;
        const y = 32 + row * 96;

        this.#iconPositions.set(icon, {
            x,
            y
        });

        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;

        return icon;
    }

    #selectIcon(icon) {
        this.#selectedIcons.add(icon);
        icon.classList.add("selected");

        console.log("selected:", icon);
    }

    clearSelection() {
        for (const icon of this.#selectedIcons) {
            icon.classList.remove("selected");
        }

        this.#selectedIcons.clear();
    }
    selectInRect(rect) {
        this.clearSelection();

        const icons = this.#element.querySelectorAll(
            ".desktop-icon"
        );

        for (const icon of icons) {
            const iconRect = icon.getBoundingClientRect();

            const intersects =
                rect.x < iconRect.right &&
                rect.x + rect.width > iconRect.left &&
                rect.y < iconRect.bottom &&
                rect.y + rect.height > iconRect.top;

            if (intersects) {
                this.#selectIcon(icon);
            }
        }
    }

    #startDrag(icon, event) {
        event.preventDefault();

        if (!this.#selectedIcons.has(icon)) {
            this.clearSelection();
            this.#selectIcon(icon);
        }

        this.#dragging = true;

        this.#dragIcon = icon;

        this.#dragStartX = event.clientX;
        this.#dragStartY = event.clientY;

        const rect = icon.getBoundingClientRect();

        this.#iconStartX = rect.left;
        this.#iconStartY = rect.top;

        icon.setPointerCapture(
            event.pointerId
        );
    }

    #moveDrag(event) {
        if (!this.#dragging) {
            return;
        }

        const dx = event.clientX - this.#dragStartX;
        const dy = event.clientY - this.#dragStartY;

        let x = this.#iconStartX + dx;
        let y = this.#iconStartY + dy;


        if (!this.#checkCollision(
            this.#dragIcon,
            x,
            y
        )) {
            this.#dragIcon.style.left = `${x}px`;
            this.#dragIcon.style.top = `${y}px`;

            this.#iconPositions.set(
                this.#dragIcon,
                {
                    x,
                    y
                }
            );
        }
    }

    #endDrag() {
        if (!this.#dragging) {
            return;
        }

        const position = this.#iconPositions.get(
            this.#dragIcon
        );

        const grid = 16;

        const x =
            Math.round(position.x / grid) * grid;

        const y =
            Math.round(position.y / grid) * grid;


        this.#dragIcon.style.left = `${x}px`;
        this.#dragIcon.style.top = `${y}px`;

        this.#iconPositions.set(
            this.#dragIcon,
            {
                x,
                y
            }
        );


        this.#dragging = false;
        this.#dragIcon = null;
    }

    #checkCollision(draggedIcon, x, y) {
        const size = draggedIcon.getBoundingClientRect();

        const draggedRect = {
            left: x,
            top: y,
            right: x + size.width,
            bottom: y + size.height
        };


        for (const icon of this.#iconPositions.keys()) {

            if (icon === draggedIcon) {
                continue;
            }

            const position = this.#iconPositions.get(icon);

            const iconRect = {
                left: position.x,
                top: position.y,
                right: position.x + size.width,
                bottom: position.y + size.height
            };


            const collision =
                draggedRect.left < iconRect.right &&
                draggedRect.right > iconRect.left &&
                draggedRect.top < iconRect.bottom &&
                draggedRect.bottom > iconRect.top;


            if (collision) {
                return true;
            }
        }

        return false;
    }
}