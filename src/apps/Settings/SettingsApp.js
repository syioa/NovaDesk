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
                        "Customize the wallpaper shown on your desktop."
                },
                {
                    id: "theme",
                    name: "Theme",
                    description:
                        "Choose how NovaDesk looks."
                },
                {
                    id: "accent-color",
                    name: "Accent Color",
                    description:
                        "Choose the accent color used throughout NovaDesk."
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
                        "Change the size of desktop icons."
                },
                {
                    id: "grid-size",
                    name: "Grid Size",
                    description:
                        "Configure the desktop icon grid."
                },
                {
                    id: "icon-spacing",
                    name: "Icon Spacing",
                    description:
                        "Control the spacing between desktop icons."
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
                        "Configure window animations and transitions."
                },
                {
                    id: "snap",
                    name: "Snap Behavior",
                    description:
                        "Configure how windows behave when snapped."
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
                        "View the current NovaDesk version."
                },
                {
                    id: "about",
                    name: "About",
                    description:
                        "Learn more about NovaDesk."
                }
            ]
        }
    ];

    mount(window) {
        super.mount(window);

        this.#window = window;

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

        this.#updateNavigationState();
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
                    category.id ===
                    this.#activeCategory
            );

        if (!category) {
            return;
        }

        const page =
            category.pages.find(
                (page) =>
                    page.id ===
                    this.#activePage
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

            <section class="settings__page-content">
                <div class="settings__placeholder">
                    <h2>
                        ${page.name}
                    </h2>

                    <p>
                        Settings for this page
                        will be implemented later.
                    </p>
                </div>
            </section>
        `;
    }

    destroy() {
        this.#window = null;
    }
}