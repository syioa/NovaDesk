import App from "../app.js";

export default class SettingsApp extends App {
    static get manifest() {
        return {
            id: "settings",
            name: "Settings",
            icon: "⚙",
            width: 900,
            height: 600
        };
    }

    #window;
    #eventBus;
    #settingsStore;
    #activeCategory = "appearance";
    #activePage = "wallpaper";
    #searchQuery = "";

    #categories = [
        {
            id: "appearance",
            name: "Appearance",
            icon: "🎨",
            pages: [
                {
                    id: "wallpaper",
                    name: "Wallpaper",
                    description:
                        "Customize the wallpaper shown on your desktop.",
                    render: (container) => {
                        this.#renderWallpaperPage(
                            container
                        );
                    }
                },
                {
                    id: "theme",
                    name: "Theme",
                    description:
                        "Choose how NovaDesk looks.",
                    render: (container) => {
                        this.#renderPlaceholderPage(
                            container,
                            "Theme settings will be implemented here."
                        );
                    }
                },
                {
                    id: "accent-color",
                    name: "Accent Color",
                    description:
                        "Choose the accent color used throughout NovaDesk.",
                    render: (container) => {
                        this.#renderPlaceholderPage(
                            container,
                            "Accent color settings will be implemented here."
                        );
                    }
                }
            ]
        },

        {
            id: "desktop",
            name: "Desktop",
            icon: "🖥",
            pages: [
                {
                    id: "icon-size",
                    name: "Icon Size",
                    description:
                        "Change the size of desktop icons.",
                    render: (container) => {
                        this.#renderPlaceholderPage(
                            container,
                            "Icon size settings will be implemented here."
                        );
                    }
                },
                {
                    id: "grid-size",
                    name: "Grid Size",
                    description:
                        "Configure the desktop icon grid.",
                    render: (container) => {
                        this.#renderPlaceholderPage(
                            container,
                            "Grid size settings will be implemented here."
                        );
                    }
                },
                {
                    id: "icon-spacing",
                    name: "Icon Spacing",
                    description:
                        "Control the spacing between desktop icons.",
                    render: (container) => {
                        this.#renderPlaceholderPage(
                            container,
                            "Icon spacing settings will be implemented here."
                        );
                    }
                }
            ]
        },

        {
            id: "windows",
            name: "Windows",
            icon: "▣",
            pages: [
                {
                    id: "animations",
                    name: "Animation Preferences",
                    description:
                        "Configure window animations and transitions.",
                    render: (container) => {
                        this.#renderPlaceholderPage(
                            container,
                            "Animation settings will be implemented here."
                        );
                    }
                },
                {
                    id: "snap",
                    name: "Snap Behavior",
                    description:
                        "Configure how windows behave when snapped.",
                    render: (container) => {
                        this.#renderPlaceholderPage(
                            container,
                            "Snap behavior settings will be implemented here."
                        );
                    }
                }
            ]
        },

        {
            id: "system",
            name: "System",
            icon: "⚙",
            pages: [
                {
                    id: "version",
                    name: "NovaDesk Version",
                    description:
                        "View the current NovaDesk version.",
                    render: (container) => {
                        this.#renderPlaceholderPage(
                            container,
                            "Version information will be implemented here."
                        );
                    }
                },
                {
                    id: "about",
                    name: "About",
                    description:
                        "Learn more about NovaDesk.",
                    render: (container) => {
                        this.#renderPlaceholderPage(
                            container,
                            "About NovaDesk will be implemented here."
                        );
                    }
                }
            ]
        }
    ];

    mount(window, eventBus, settingsStore) {
        super.mount(window);

        this.#window = window;
        this.#eventBus = eventBus;
        this.#settingsStore = settingsStore;

        window.content.innerHTML = `
            <div class="settings">

                <aside class="settings__sidebar">

                    <div class="settings__sidebar-header">
                        <h2 class="settings__sidebar-title">
                            Settings
                        </h2>
                    </div>

                    <div class="settings__search-wrapper">
                        <input
                            class="settings__search"
                            type="search"
                            placeholder="Search settings..."
                            aria-label="Search settings"
                        />
                    </div>

                    <nav
                        class="settings__navigation"
                        aria-label="Settings categories"
                    ></nav>

                </aside>

                <main class="settings__main">

                    <div class="settings__breadcrumb"></div>

                    <div class="settings__page"></div>

                </main>

            </div>
        `;

        this.#bindEvents();
        this.#renderNavigation();
        this.#renderPage();
    }

    #bindEvents() {
        const searchInput =
            this.#window.content.querySelector(
                ".settings__search"
            );

        searchInput.addEventListener(
            "input",
            () => {
                this.#searchQuery =
                    searchInput.value;

                this.#renderNavigation();
            }
        );
    }

    #renderNavigation() {
        const navigation =
            this.#window.content.querySelector(
                ".settings__navigation"
            );

        navigation.innerHTML = "";

        const query =
            this.#searchQuery
                .trim()
                .toLowerCase();

        let hasResults = false;

        for (const category of this.#categories) {
            const matchingPages =
                category.pages.filter(
                    (page) => {
                        if (!query) {
                            return true;
                        }

                        return (
                            category.name
                                .toLowerCase()
                                .includes(query) ||
                            page.name
                                .toLowerCase()
                                .includes(query) ||
                            page.description
                                .toLowerCase()
                                .includes(query)
                        );
                    }
                );

            if (
                query &&
                matchingPages.length === 0
            ) {
                continue;
            }

            hasResults = true;

            const categoryElement =
                document.createElement("section");

            categoryElement.className =
                "settings__category";

            const categoryButton =
                document.createElement("button");

            categoryButton.type = "button";

            categoryButton.className =
                "settings__category-button";

            categoryButton.dataset.category =
                category.id;

            categoryButton.innerHTML = `
            <span class="settings__category-icon">
                ${category.icon}
            </span>

            <span class="settings__category-name">
                ${category.name}
            </span>
        `;

            categoryButton.addEventListener(
                "click",
                () => {
                    this.#selectCategory(
                        category.id
                    );
                }
            );

            categoryElement.append(
                categoryButton
            );

            const pagesElement =
                document.createElement("div");

            pagesElement.className =
                "settings__pages";

            for (const page of matchingPages) {
                const pageButton =
                    document.createElement("button");

                pageButton.type = "button";

                pageButton.className =
                    "settings__page-button";

                pageButton.dataset.category =
                    category.id;

                pageButton.dataset.page =
                    page.id;

                pageButton.textContent =
                    page.name;

                pageButton.addEventListener(
                    "click",
                    () => {
                        this.#selectPage(
                            category.id,
                            page.id
                        );
                    }
                );

                pagesElement.append(
                    pageButton
                );
            }

            categoryElement.append(
                pagesElement
            );

            navigation.append(
                categoryElement
            );
        }

        if (query && !hasResults) {
            const emptyMessage =
                document.createElement("div");

            emptyMessage.className =
                "settings__empty";

            emptyMessage.textContent =
                "No settings found.";

            navigation.append(
                emptyMessage
            );
        }

        this.#updateNavigationState();
    }

    #updateSetting(path, value) {
        this.#settingsStore.set(
            path,
            value
        );

        this.#eventBus.emit(
            "settings:changed",
            {
                path
            }
        );
    }

    #renderWallpaperPage(container) {
        const wallpaper =
            this.#settingsStore.get(
                "appearance.wallpaper"
            );

        container.innerHTML = `
        <div class="settings__wallpaper">

            <div class="settings__setting-group">

                <h2 class="settings__section-title">
                    Wallpaper
                </h2>

                <p class="settings__section-description">
                    Choose the wallpaper displayed
                    on the NovaDesk desktop.
                </p>

                <div
                    class="settings__wallpaper-preview"
                ></div>

            </div>

            <div class="settings__setting-group">

                <label
                    class="settings__field-label"
                    for="settings-wallpaper-color"
                >
                    Background Color
                </label>

                <div
                    class="settings__color-control"
                >
                    <input
                        id="settings-wallpaper-color"
                        class="settings__color-input"
                        type="color"
                        value="${wallpaper.type === "color"
                ? wallpaper.value
                : "#1e1e1e"}"
                    />

                    <input
                        class="settings__color-text"
                        type="text"
                        value="${wallpaper.type === "color"
                ? wallpaper.value
                : "#1e1e1e"}"
                        placeholder="#1e1e1e"
                    />
                </div>

            </div>

            <div
                class="settings__actions"
            >

                <button
                    class="settings__button
                           settings__button--primary"
                    type="button"
                    data-action="apply-wallpaper"
                >
                    Apply
                </button>

                <button
                    class="settings__button"
                    type="button"
                    data-action="reset-wallpaper"
                >
                    Reset
                </button>

            </div>

        </div>
    `;

        const preview =
            container.querySelector(
                ".settings__wallpaper-preview"
            );

        const colorInput =
            container.querySelector(
                ".settings__color-input"
            );

        const colorText =
            container.querySelector(
                ".settings__color-text"
            );

        const applyButton =
            container.querySelector(
                '[data-action="apply-wallpaper"]'
            );

        const resetButton =
            container.querySelector(
                '[data-action="reset-wallpaper"]'
            );

        const updatePreview = (color) => {
            preview.style.backgroundColor =
                color;
        };

        updatePreview(
            colorInput.value
        );

        colorInput.addEventListener(
            "input",
            () => {
                colorText.value =
                    colorInput.value;

                updatePreview(
                    colorInput.value
                );
            }
        );

        colorText.addEventListener(
            "input",
            () => {
                const value =
                    colorText.value.trim();

                if (
                    /^#[0-9a-fA-F]{6}$/.test(
                        value
                    )
                ) {
                    colorInput.value =
                        value;

                    updatePreview(value);
                }
            }
        );

        applyButton.addEventListener(
            "click",
            () => {
                const color =
                    colorInput.value;

                this.#updateSetting(
                    "appearance.wallpaper",
                    {
                        type: "color",
                        value: color
                    }
                );
            }
        );

        resetButton.addEventListener(
            "click",
            () => {
                const defaultColor =
                    "#1e1e1e";

                colorInput.value =
                    defaultColor;

                colorText.value =
                    defaultColor;

                updatePreview(
                    defaultColor
                );

                this.#updateSetting(
                    "appearance.wallpaper",
                    {
                        type: "color",
                        value: defaultColor
                    }
                );
            }
        );
    }

    #selectCategory(categoryId) {
        const category =
            this.#categories.find(
                (category) =>
                    category.id === categoryId
            );

        if (!category) {
            return;
        }

        this.#activeCategory =
            category.id;

        this.#activePage =
            category.pages[0]?.id ?? null;

        this.#renderNavigation();
        this.#renderPage();
    }

    #selectPage(categoryId, pageId) {
        const category =
            this.#categories.find(
                (category) =>
                    category.id === categoryId
            );

        if (!category) {
            return;
        }

        const page =
            category.pages.find(
                (page) =>
                    page.id === pageId
            );

        if (!page) {
            return;
        }

        this.#activeCategory =
            categoryId;

        this.#activePage =
            pageId;

        this.#renderNavigation();
        this.#renderPage();
    }

    #updateNavigationState() {
        const categoryButtons =
            this.#window.content.querySelectorAll(
                ".settings__category-button"
            );

        for (const button of categoryButtons) {
            button.classList.toggle(
                "settings__category-button--active",
                button.dataset.category ===
                this.#activeCategory
            );
        }

        const pageButtons =
            this.#window.content.querySelectorAll(
                ".settings__page-button"
            );

        for (const button of pageButtons) {
            button.classList.toggle(
                "settings__page-button--active",
                button.dataset.category ===
                this.#activeCategory &&
                button.dataset.page ===
                this.#activePage
            );
        }
    }

    #renderPage() {
        const category =
            this.#categories.find(
                (category) =>
                    category.id === this.#activeCategory
            );

        if (!category) {
            return;
        }

        const page =
            category.pages.find(
                (page) =>
                    page.id === this.#activePage
            );

        if (!page) {
            return;
        }

        const breadcrumb =
            this.#window.content.querySelector(
                ".settings__breadcrumb"
            );

        const content =
            this.#window.content.querySelector(
                ".settings__page"
            );

        breadcrumb.textContent =
            `${category.name} / ${page.name}`;

        content.innerHTML = `
        <header class="settings__page-header">
            <h1 class="settings__page-title">
                ${page.name}
            </h1>

            <p class="settings__page-description">
                ${page.description}
            </p>
        </header>

        <section class="settings__page-content"></section>
    `;

        const pageContent =
            content.querySelector(
                ".settings__page-content"
            );

        if (typeof page.render === "function") {
            page.render(pageContent);
        } else {
            this.#renderPlaceholderPage(
                pageContent,
                "This settings page has not been implemented yet."
            );
        }
    }

    #renderPlaceholderPage(container, message) {
        container.innerHTML = `
        <div class="settings__placeholder">
            <h2>
                ${message}
            </h2>

            <p>
                This settings page will be implemented later.
            </p>
        </div>
    `;
    }

    destroy() {
        this.#window = null;
    }
}