export default class DesktopIcons {
    #eventBus;
    #registry;
    #element;
    #desktopIcons;
    #selectedIcon;

    constructor(eventBus, registry) {
        this.#eventBus = eventBus;
        this.#registry = registry;

        this.#element = document.createElement("div");
        this.#element.className = "desktop-icons";

        this.#render();

        this.#element.addEventListener("click", (event) => {
            if (event.target === this.#element) {
                this.#clearSelection();
            }
        });
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
        console.log("CREATING ICON:", AppClass.id);
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

        icon.addEventListener("dblclick", () => {
            this.#eventBus.emit(
                "app:launch",
                manifest.id
            );
        });

        return icon;
    }

    #selectIcon(icon) {
        if (this.#selectedIcon) {
            this.#selectedIcon.classList.remove("selected");
        }

        this.#selectedIcon = icon;
        this.#selectedIcon.classList.add("selected");

        console.log("selected:", icon);
    }

    #clearSelection() {
        if (!this.#selectedIcon) return;

        this.#selectedIcon.classList.remove("selected");
        this.#selectedIcon = null;
    }

    clearSelection() {
        if (!this.#selectedIcon) {
            return;
        }

        this.#selectedIcon.classList.remove("selected");
        this.#selectedIcon = null;
    }

    clearSelection() {
        this.#clearSelection();
    }
}