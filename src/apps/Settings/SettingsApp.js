import App from "../app.js";
import DesktopSettingsPanel from "./DesktopSettingsPanel.js";

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
    #autoplay;
    #activeCategory = "appearance";
    #activePage = "wallpaper";
    #searchQuery = "";

    #settingsStore = null;

    #categories = [
        {
            id: "appearance",
            name: "Appearance",
            icon: "🎨",
            pages: [
                {
                    id: "wallpaper",
                    name: "Wallpaper",
                    description: "Customize the wallpaper shown on your desktop.",
                    render: (container) => this.#renderWallpaperPage(container)
                },
                {
                    id: "theme",
                    name: "Theme",
                    description: "Choose how NovaDesk looks.",
                    render: (container) => this.#renderThemePage(container)
                },
                {
                    id: "accent-color",
                    name: "Accent Color",
                    description: "Choose the accent color used throughout NovaDesk.",
                    render: (container) => this.#renderAccentColorPage(container)
                }
            ]
        },
        {
            id: "desktop",
            name: "Desktop",
            icon: "🖥",
            pages: [
                {
                    id: "desktop-settings",
                    name: "Desktop",
                    description: "Customize your desktop icons, grid, and spacing.",
                    render: (container) =>
                        this.#renderDesktopSettingsPage(container)
                }
            ]
        },
        {
            id: "video-player",
            name: "Video Player",
            icon: "🎬",
            pages: [
                {
                    id: "video-player-settings",
                    name: "Video Player",
                    description: "Customize video playback behavior.",
                    render: (container) =>
                        this.#renderVideoPlayerSettingsPage(container)
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
                    description: "View the current NovaDesk version.",
                    render: (container) => this.#renderVersionPage(container)
                },
                {
                    id: "about",
                    name: "About",
                    description: "Learn more about NovaDesk.",
                    render: (container) => this.#renderAboutPage(container)
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
            <h2 class="settings__sidebar-title">Settings</h2>
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
</div>`;

        this.#bindEvents();
        this.#renderNavigation();
        this.#renderPage();
    }

    #renderDesktopSettingsPage(container) {
        const panel = new DesktopSettingsPanel(
            this.#settingsStore,
            this.#eventBus
        );

        panel.mount(container);
    }

    #bindEvents() {
        const searchInput = this.#window.content.querySelector(".settings__search");
        searchInput.addEventListener("input", () => {
            this.#searchQuery = searchInput.value;
            this.#renderNavigation();
        });
    }

    #renderVideoPlayerSettingsPage(container) {
        container.innerHTML = /*html*/`
        <div class="settings__section">

            <div class="settings__row">
                <div class="settings__row-info">
                    <div class="settings__row-title">
                        Autoplay
                    </div>

                    <div class="settings__row-description">
                        Automatically play videos when they are opened.
                    </div>
                </div>

                <label class="settings__toggle settings__toggle--switch-only">
                    <input
                        type="checkbox"
                        class="settings__toggle-input settings__video-autoplay"
                    >
                    <span class="settings__toggle-track"></span>
                    <span class="settings__toggle-thumb"></span>
                </label>
            </div>

            <div class="settings__row">
                <div class="settings__row-info">
                    <div class="settings__row-title">
                        Loop
                    </div>

                    <div class="settings__row-description">
                        Automatically replay videos when they end.
                    </div>
                </div>

                <label class="settings__toggle settings__toggle--switch-only">
                    <input
                        type="checkbox"
                        class="settings__toggle-input settings__video-loop"
                    >
                    <span class="settings__toggle-track"></span>
                    <span class="settings__toggle-thumb"></span>
                </label>
            </div>

        </div>
    `;

        const autoplayInput = container.querySelector(
            ".settings__video-autoplay"
        );

        autoplayInput.checked =
            this.#settingsStore.get("videoPlayer.autoplay");

        autoplayInput.addEventListener("change", () => {
            this.#settingsStore.set(
                "videoPlayer.autoplay",
                autoplayInput.checked
            );
        });

        const loopInput = container.querySelector(
            ".settings__video-loop"
        );

        loopInput.checked =
            this.#settingsStore.get("videoPlayer.loop");

        loopInput.addEventListener("change", () => {
            this.#settingsStore.set(
                "videoPlayer.loop",
                loopInput.checked
            );
        });
    }

    #renderNavigation() {
        const navigation = this.#window.content.querySelector(".settings__navigation");
        navigation.innerHTML = "";

        const query = this.#searchQuery.trim().toLowerCase();
        let hasResults = false;

        for (const category of this.#categories) {
            const matchingPages = category.pages.filter((page) => {
                if (!query) return true;
                return (
                    category.name.toLowerCase().includes(query) ||
                    page.name.toLowerCase().includes(query) ||
                    page.description.toLowerCase().includes(query)
                );
            });

            if (query && matchingPages.length === 0) continue;

            hasResults = true;

            const categoryElement = document.createElement("section");
            categoryElement.className = "settings__category";

            const categoryButton = document.createElement("button");
            categoryButton.type = "button";
            categoryButton.className = "settings__category-button";
            categoryButton.dataset.category = category.id;
            categoryButton.innerHTML = `
                <span class="settings__category-icon">${category.icon}</span>
                <span class="settings__category-name">${category.name}</span>
            `;
            categoryButton.addEventListener("click", () => {
                this.#selectCategory(category.id);
            });

            categoryElement.append(categoryButton);

            const pagesElement = document.createElement("div");
            pagesElement.className = "settings__pages";

            for (const page of matchingPages) {
                const pageButton = document.createElement("button");
                pageButton.type = "button";
                pageButton.className = "settings__page-button";
                pageButton.dataset.category = category.id;
                pageButton.dataset.page = page.id;
                pageButton.textContent = page.name;
                pageButton.addEventListener("click", () => {
                    this.#selectPage(category.id, page.id);
                });

                pagesElement.append(pageButton);
            }

            categoryElement.append(pagesElement);
            navigation.append(categoryElement);
        }

        if (query && !hasResults) {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "settings__empty";
            emptyMessage.textContent = "No settings found.";
            navigation.append(emptyMessage);
        }

        this.#updateNavigationState();
    }

    #updateSetting(path, value) {
        this.#settingsStore.set(path, value);
    }

    #renderWallpaperPage(container) {
        const wallpaper = this.#settingsStore.get("appearance.wallpaper");
        const currentImageUrl = wallpaper.type === "image" ? wallpaper.value : "";

        container.innerHTML = `
            <div class="settings__wallpaper">
                <div class="settings__setting-group">
                    <h2 class="settings__section-title">Wallpaper</h2>
                    <p class="settings__section-description">
                        Choose the wallpaper displayed on the NovaDesk desktop.
                    </p>
                    <div class="settings__wallpaper-preview"></div>
                </div>

                <div class="settings__setting-group">
                    <label class="settings__field-label" for="settings-wallpaper-url">
                        Image URL
                    </label>
                    <p class="settings__section-description">
                        Paste the URL of an image to use as your wallpaper. Supports common image formats (JPG, PNG, GIF, WebP).
                    </p>
                    <input
                        id="settings-wallpaper-url"
                        class="settings__url-input"
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        value="${currentImageUrl}"
                    />
                    <div class="settings__url-status"></div>
                </div>

                <div class="settings__actions">
                    <button class="settings__button settings__button--primary" type="button" data-action="apply-wallpaper">
                        Apply
                    </button>
                    <button class="settings__button" type="button" data-action="reset-wallpaper">
                        Reset to Default
                    </button>
                </div>
            </div>
        `;

        const preview = container.querySelector(".settings__wallpaper-preview");
        const urlInput = container.querySelector(".settings__url-input");
        const statusDiv = container.querySelector(".settings__url-status");
        const applyButton = container.querySelector('[data-action="apply-wallpaper"]');
        const resetButton = container.querySelector('[data-action="reset-wallpaper"]');

        const updatePreview = (url) => {
            if (!url.trim()) {
                preview.style.backgroundImage = "none";
                preview.style.backgroundColor = "#1e1e1e";
                statusDiv.innerHTML = "";
                return;
            }

            const img = new Image();
            img.onload = () => {
                preview.style.backgroundImage = `url('${url}')`;
                preview.style.backgroundColor = "#1e1e1e";
                statusDiv.innerHTML = '<span class="settings__status-success">✓ Image loaded successfully</span>';
            };
            img.onerror = () => {
                preview.style.backgroundImage = "none";
                preview.style.backgroundColor = "#1e1e1e";
                statusDiv.innerHTML = '<span class="settings__status-error">✗ Failed to load image. Check the URL and try again.</span>';
            };
            img.src = url;
        };

        // Initialize preview with current wallpaper
        if (currentImageUrl) {
            updatePreview(currentImageUrl);
        } else {
            preview.style.backgroundColor = "#1e1e1e";
        }

        urlInput.addEventListener("input", () => {
            // Debounce preview updates
            clearTimeout(urlInput.debounceTimer);
            urlInput.debounceTimer = setTimeout(() => {
                updatePreview(urlInput.value);
            }, 500);
        });

        applyButton.addEventListener("click", () => {
            const url = urlInput.value.trim();

            if (!url) {
                statusDiv.innerHTML = '<span class="settings__status-error">✗ Please enter an image URL</span>';
                return;
            }

            // Validate URL format
            try {
                new URL(url);
            } catch {
                statusDiv.innerHTML = '<span class="settings__status-error">✗ Invalid URL format</span>';
                return;
            }

            // Test if image loads
            const img = new Image();
            img.onload = () => {
                this.#updateSetting("appearance.wallpaper", {
                    type: "image",
                    value: url
                });
                statusDiv.innerHTML = '<span class="settings__status-success">✓ Wallpaper applied successfully</span>';
            };
            img.onerror = () => {
            };
            img.src = url;
        });
        statusDiv.innerHTML = '<span class="settings__status-error">✗ Failed to load image. The URL may be invalid or the image may not be accessible.</span>';

        resetButton.addEventListener("click", () => {
            urlInput.value = "";
            preview.style.backgroundImage = "none";
            preview.style.backgroundColor = "#1e1e1e";
            statusDiv.innerHTML = "";
            this.#updateSetting("appearance.wallpaper", {
                type: "color",
                value: "#1e1e1e"
            });
        });
    }

    #renderThemePage(container) {
        const theme = this.#settingsStore.get("appearance.theme") || "auto";

        container.innerHTML = `
            <div class="settings__theme">
                <div class="settings__setting-group">
                    <h2 class="settings__section-title">Color scheme</h2>
                    <p class="settings__section-description">
                        Select how NovaDesk should look based on your system settings or preference.
                    </p>

                    <div class="settings__radio-group">
                        <label class="settings__radio">
                            <input type="radio" name="theme" value="light" ${theme === "light" ? "checked" : ""} />
                            <span class="settings__radio-label">Light</span>
                        </label>
                        <label class="settings__radio">
                            <input type="radio" name="theme" value="dark" ${theme === "dark" ? "checked" : ""} />
                            <span class="settings__radio-label">Dark</span>
                        </label>
                        <label class="settings__radio">
                            <input type="radio" name="theme" value="auto" ${theme === "auto" ? "checked" : ""} />
                            <span class="settings__radio-label">Auto (follow system)</span>
                        </label>
                    </div>
                </div>
            </div>
        `;

        const radioInputs = container.querySelectorAll('input[name="theme"]');
        radioInputs.forEach((input) => {
            input.addEventListener("change", (e) => {
                this.#updateSetting("appearance.theme", e.target.value);
            });
        });
    }

    #renderAccentColorPage(container) {
        const accentColor =
            this.#settingsStore.get("appearance.accentColor")
            ?? "theme";

        const colorPickerValue =
            accentColor === "theme"
                ? "#3584e4"
                : accentColor;

        const colors = [
            { name: "Theme", value: "theme" },

            { name: "Rosewater", value: "rosewater" },
            { name: "Flamingo", value: "flamingo" },
            { name: "Pink", value: "pink" },
            { name: "Mauve", value: "mauve" },
            { name: "Red", value: "red" },
            { name: "Maroon", value: "maroon" },
            { name: "Peach", value: "peach" },
            { name: "Yellow", value: "yellow" },
            { name: "Green", value: "green" },
            { name: "Teal", value: "teal" },
            { name: "Sky", value: "sky" },
            { name: "Sapphire", value: "sapphire" },
            { name: "Blue", value: "blue" },
            { name: "Lavender", value: "lavender" }
        ];

        container.innerHTML = `
            <div class="settings__accent-color">
                <div class="settings__setting-group">
                    <h2 class="settings__section-title">Accent color</h2>
                    <p class="settings__section-description">
                        Choose a primary accent color for buttons, highlights, and other interactive elements.
                    </p>

                    <div class="settings__color-palette">
                        ${colors.map(color => `
                            <button
                                class="settings__color-button ${accentColor === color.value ? "settings__color-button--active" : ""}"
                                data-color="${color.value}"
                                title="${color.name}"
                                ${color.value === "theme"
                ? ""
                : `style="background: var(--catppuccin-${color.value});"`}
                            >
                                ${accentColor === color.value ? '✓' : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        const colorButtons = container.querySelectorAll(".settings__color-button");
        const colorInput = container.querySelector(".settings__color-input");

        colorButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const color = button.dataset.color;
                this.#updateSetting("appearance.accentColor", color);
                this.#renderAccentColorPage(container);
            });
        });
    }

    #renderSnapPage(container) {
        const snapEnabled = this.#settingsStore.get("windows.snapEnabled") ?? true;
        const snapAssist = this.#settingsStore.get("windows.snapAssist") ?? true;

        container.innerHTML = `
            <div class="settings__snap">
                <div class="settings__setting-group">
                    <h2 class="settings__section-title">Window snapping</h2>
                    <p class="settings__section-description">
                        Configure how windows snap to the edges and corners of the screen.
                    </p>

                    <label class="settings__toggle">
                        <input
                            type="checkbox"
                            class="settings__toggle-input settings__toggle-snap-enabled"
                            ${snapEnabled ? "checked" : ""}
                        />
                        <span class="settings__toggle-track"></span>
                        <span class="settings__toggle-thumb"></span>
                        <span class="settings__toggle-label">Enable window snapping</span>
                    </label>

                    <label class="settings__toggle" ${!snapEnabled ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                        <input
                            type="checkbox"
                            class="settings__toggle-input settings__toggle-snap-assist"
                            ${snapAssist && snapEnabled ? "checked" : ""}
                            ${!snapEnabled ? "disabled" : ""}
                        />
                        <span class="settings__toggle-track"></span>
                        <span class="settings__toggle-thumb"></span>
                        <span class="settings__toggle-label">Snap assist (suggested layouts)</span>
                    </label>

                    <p class="settings__setting-description">
                        Snap assist shows layout suggestions when you drag windows to the edges of the screen.
                    </p>
                </div>
            </div>
        `;

        const snapToggle = container.querySelector(".settings__toggle-snap-enabled");
        const assistToggle = container.querySelector(".settings__toggle-snap-assist");
        const assistLabel = assistToggle.closest(".settings__toggle");

        snapToggle.addEventListener("change", (e) => {
            this.#updateSetting("windows.snapEnabled", e.target.checked);
            assistToggle.disabled = !e.target.checked;
            assistLabel.style.opacity = e.target.checked ? "1" : "0.5";
            assistLabel.style.pointerEvents = e.target.checked ? "auto" : "none";
        });

        assistToggle.addEventListener("change", (e) => {
            this.#updateSetting("windows.snapAssist", e.target.checked);
        });
    }

    #renderVersionPage(container) {
        container.innerHTML = `
        <div class="settings__version">

            <div class="settings__version-info-grid">

                <div class="settings__version-info-card">
                    <div class="settings__version-info-label">
                        Version
                    </div>

                    <div class="settings__version-info-value settings__version-info-value--accent">
                        3.2.1
                    </div>

                    <div class="settings__version-info-sub">
                        Stable channel
                    </div>
                </div>

                <div class="settings__version-info-card">
                    <div class="settings__version-info-label">
                        Build number
                    </div>

                    <div class="settings__version-info-value">
                        4521
                    </div>

                    <div class="settings__version-info-sub">
                        Release build
                    </div>
                </div>

                <div class="settings__version-info-card">
                    <div class="settings__version-info-label">
                        Build date
                    </div>

                    <div class="settings__version-info-value settings__version-info-value--date">
                        Jan 15
                    </div>

                    <div class="settings__version-info-sub">
                        2026
                    </div>
                </div>

            </div>

            <div class="settings__version-changelog">

                <div class="settings__version-changelog-item">
                    <span class="settings__version-tag settings__version-tag--new">
                        New
                    </span>

                    <div class="settings__version-changelog-description">
                        Quick settings panel now accessible via keyboard shortcut.
                    </div>
                </div>

                <div class="settings__version-changelog-item">
                    <span class="settings__version-tag settings__version-tag--fix">
                        Fix
                    </span>

                    <div class="settings__version-changelog-description">
                        Resolved a crash when switching themes with multiple monitors.
                    </div>
                </div>

                <div class="settings__version-changelog-item">
                    <span class="settings__version-tag settings__version-tag--improved">
                        Improved
                    </span>

                    <div class="settings__version-changelog-description">
                        Startup time reduced by ~30% on supported hardware.
                    </div>
                </div>

            </div>

            <div class="settings__version-final-note">
                NovaDesk 3.2.1 is the last version of this software.
                Thank you for using it.
            </div>

        </div>
    `;
    }

    #renderAboutPage(container) {
        const version = "3.2.1";

        container.innerHTML = `
        <div class="settings__about">

            <div class="settings__about-hero">
                <div class="settings__about-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1.25em" viewBox="0 0 24 24">
	                    <path d="M0 0h24v24H0z" fill="none" />
	                    <path fill="currentColor" d="m14.712 7.596l-2.289-2.288l2.289-2.289L17 5.308zm5 3l-1.289-1.288l1.289-1.289L21 9.308zM12.075 21q-1.888 0-3.543-.713T5.64 18.336t-1.951-2.893t-.714-3.543q0-2.92 1.68-5.265t4.436-3.27q-.104 2.34.717 4.501q.82 2.161 2.48 3.82q1.66 1.66 3.82 2.481t4.502.717q-.92 2.754-3.268 4.435T12.075  21" />
                    </svg>
                </div>

                <div class="settings__about-hero-text">
                    <h2 class="settings__about-title">
                        NovaDesk
                    </h2>

                    <p class="settings__about-subtitle">
                        A modern desktop environment
                    </p>
                </div>

                <div class="settings__about-version">
                    v${version}
                </div>
            </div>

            <div class="settings__about-card">
                <h3 class="settings__about-card-title">
                    <span>ⓘ</span>
                    What is NovaDesk?
                </h3>

                <p class="settings__about-description">
                    NovaDesk is a modern, feature-rich desktop environment
                    designed to provide a clean and intuitive interface —
                    combining minimalist design with powerful customization
                    options.
                </p>
            </div>

            <div class="settings__about-card">
                <h3 class="settings__about-card-title">
                    <span>✦</span>
                    Key features
                </h3>

                <div class="settings__features-grid">

                    <div class="settings__feature-item">
                        <span class="settings__feature-icon">🎨</span>
                        <span>
                            Highly customizable appearance and behavior
                        </span>
                    </div>

                    <div class="settings__feature-item">
                        <span class="settings__feature-icon">▦</span>
                        <span>
                            Smooth animations and snap layouts
                        </span>
                    </div>

                    <div class="settings__feature-item">
                        <span class="settings__feature-icon">▣</span>
                        <span>
                            Advanced desktop management
                        </span>
                    </div>

                    <div class="settings__feature-item">
                        <span class="settings__feature-icon">◈</span>
                        <span>
                            Built-in launcher and file manager
                        </span>
                    </div>

                    <div class="settings__feature-item">
                        <span class="settings__feature-icon">ϟ</span>
                        <span>
                            Lightweight and performance-optimized
                        </span>
                    </div>

                </div>
            </div>

            <div class="settings__about-footer">
                © 2026 NovaDesk. All rights reserved.
            </div>

        </div>
    `;
    }

    #selectCategory(categoryId) {
        const category = this.#categories.find((c) => c.id === categoryId);
        if (!category) return;

        this.#activeCategory = category.id;
        this.#activePage = category.pages[0]?.id ?? null;

        this.#renderNavigation();
        this.#renderPage();
    }

    #selectPage(categoryId, pageId) {
        const category = this.#categories.find((c) => c.id === categoryId);
        if (!category) return;

        const page = category.pages.find((p) => p.id === pageId);

        if (!page) return;
        this.#activeCategory = categoryId;
        this.#activePage = pageId;

        this.#renderNavigation();
        this.#renderPage();
    }

    #updateNavigationState() {
        const categoryButtons = this.#window.content.querySelectorAll(
            ".settings__category-button"
        );

        for (const button of categoryButtons) {
            button.classList.toggle(
                "settings__category-button--active",
                button.dataset.category === this.#activeCategory
            );
        }

        const pageButtons = this.#window.content.querySelectorAll(
            ".settings__page-button"
        );

        for (const button of pageButtons) {
            button.classList.toggle(
                "settings__page-button--active",
                button.dataset.category === this.#activeCategory &&
                button.dataset.page === this.#activePage
            );
        }
    }

    #renderPage() {
        const category = this.#categories.find((c) => c.id === this.#activeCategory);
        if (!category) return;

        const page = category.pages.find((p) => p.id === this.#activePage);
        if (!page) return;

        const breadcrumb = this.#window.content.querySelector(".settings__breadcrumb");
        const content = this.#window.content.querySelector(".settings__page");

        breadcrumb.textContent = `${category.name} / ${page.name}`;

        content.innerHTML = `
            <header class="settings__page-header">
                <h1 class="settings__page-title">${page.name}</h1>
                <p class="settings__page-description">${page.description}</p>
                <section class="settings__page-content"></section>
                </header>
        `;

        const pageContent = content.querySelector(".settings__page-content");

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
                <h2>${message}</h2>
                <p>This settings page will be implemented later.</p>
            </div>
        `;
    }

    destroy() {
        this.#window = null;
    }
}