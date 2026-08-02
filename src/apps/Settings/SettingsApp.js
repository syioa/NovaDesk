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
                    id: "icon-size",
                    name: "Icon Size",
                    description: "Change the size of desktop icons.",
                    render: (container) => this.#renderIconSizePage(container)
                },
                {
                    id: "grid-size",
                    name: "Grid Size",
                    description: "Configure the desktop icon grid.",
                    render: (container) => this.#renderGridSizePage(container)
                },
                {
                    id: "icon-spacing",
                    name: "Icon Spacing",
                    description: "Control the spacing between desktop icons.",
                    render: (container) => this.#renderIconSpacingPage(container)
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
                    description: "Configure window animations and transitions.",
                    render: (container) => this.#renderAnimationsPage(container)
                },
                {
                    id: "snap",
                    name: "Snap Behavior",
                    description: "Configure how windows behave when snapped.",
                    render: (container) => this.#renderSnapPage(container)
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
            </div>
        `;

        this.#bindEvents();
        this.#renderNavigation();
        this.#renderPage();
    }

    #bindEvents() {
        const searchInput = this.#window.content.querySelector(".settings__search");
        searchInput.addEventListener("input", () => {
            this.#searchQuery = searchInput.value;
            this.#renderNavigation();
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
        this.#eventBus.emit("settings:changed", { path });
    }

    #renderWallpaperPage(container) {
        const wallpaper = this.#settingsStore.get("appearance.wallpaper");

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
                    <label class="settings__field-label" for="settings-wallpaper-color">
                        Background Color
                    </label>
                    <div class="settings__color-control">
                        <input
                            id="settings-wallpaper-color"
                            class="settings__color-input"
                            type="color"
                            value="${wallpaper.type === "color" ? wallpaper.value : "#1e1e1e"}"
                        />
                        <input
                            class="settings__color-text"
                            type="text"
                            value="${wallpaper.type === "color" ? wallpaper.value : "#1e1e1e"}"
                            placeholder="#1e1e1e"
                        />
                    </div>
                </div>

                <div class="settings__actions">
                    <button class="settings__button settings__button--primary" type="button" data-action="apply-wallpaper">
                        Apply
                    </button>
                    <button class="settings__button" type="button" data-action="reset-wallpaper">
                        Reset
                    </button>
                </div>
            </div>
        `;

        const preview = container.querySelector(".settings__wallpaper-preview");
        const colorInput = container.querySelector(".settings__color-input");
        const colorText = container.querySelector(".settings__color-text");
        const applyButton = container.querySelector('[data-action="apply-wallpaper"]');
        const resetButton = container.querySelector('[data-action="reset-wallpaper"]');

        const updatePreview = (color) => {
            preview.style.backgroundColor = color;
        };

        updatePreview(colorInput.value);

        colorInput.addEventListener("input", () => {
            colorText.value = colorInput.value;
            updatePreview(colorInput.value);
        });

        colorText.addEventListener("input", () => {
            const value = colorText.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                colorInput.value = value;
                updatePreview(value);
            }
        });

        applyButton.addEventListener("click", () => {
            const color = colorInput.value;
            this.#updateSetting("appearance.wallpaper", {
                type: "color",
                value: color
            });
        });

        resetButton.addEventListener("click", () => {
            const defaultColor = "#1e1e1e";
            colorInput.value = defaultColor;
            colorText.value = defaultColor;
            updatePreview(defaultColor);
            this.#updateSetting("appearance.wallpaper", {
                type: "color",
                value: defaultColor
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
        const accentColor = this.#settingsStore.get("appearance.accentColor") || "#3584e4";

        const colors = [
            { name: "Blue", value: "#3584e4" },
            { name: "Purple", value: "#9945ff" },
            { name: "Pink", value: "#ff006e" },
            { name: "Red", value: "#ff3b30" },
            { name: "Orange", value: "#ff9500" },
            { name: "Yellow", value: "#ffd60a" },
            { name: "Green", value: "#30b0c0" },
            { name: "Teal", value: "#00d9ff" }
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
                                style="background-color: ${color.value};"
                            >
                                ${accentColor === color.value ? '✓' : ''}
                            </button>
                        `).join('')}
                    </div>

                    <div class="settings__custom-color">
                        <label class="settings__field-label">Custom color</label>
                        <div class="settings__color-control">
                            <input
                                class="settings__color-input"
                                type="color"
                                value="${accentColor}"
                            />
                            <input
                                class="settings__color-text"
                                type="text"
                                value="${accentColor}"
                                placeholder="#3584e4"
                            />
                        </div>
                    </div>
                </div>
            </div>
        `;

        const colorButtons = container.querySelectorAll(".settings__color-button");
        const colorInput = container.querySelector(".settings__color-input");
        const colorText = container.querySelector(".settings__color-text");

        colorButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const color = button.dataset.color;
                this.#updateSetting("appearance.accentColor", color);
                this.#renderAccentColorPage(container);
            });
        });

        colorInput.addEventListener("input", () => {
            colorText.value = colorInput.value;
            this.#updateSetting("appearance.accentColor", colorInput.value);
            this.#renderAccentColorPage(container);
        });

        colorText.addEventListener("input", () => {
            const value = colorText.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                colorInput.value = value;
                this.#updateSetting("appearance.accentColor", value);
                this.#renderAccentColorPage(container);
            }
        });
    }

    #renderIconSizePage(container) {
        const iconSize = this.#settingsStore.get("desktop.iconSize") || 64;

        container.innerHTML = `
            <div class="settings__icon-size">
                <div class="settings__setting-group">
                    <h2 class="settings__section-title">Icon size</h2>
                    <p class="settings__section-description">
                        Adjust the size of icons displayed on your desktop.
                    </p>

                    <div class="settings__slider-control">
                        <label class="settings__field-label">Size: <span class="settings__slider-value">${iconSize}px</span></label>
                        <input
                            type="range"
                            min="32"
                            max="128"
                            step="8"
                            value="${iconSize}"
                            class="settings__slider"
                        />
                        <div class="settings__slider-labels">
                            <span>Small (32px)</span>
                            <span>Large (128px)</span>
                        </div>
                    </div>

                    <div class="settings__icon-preview">
                        <div class="settings__icon-preview-item" style="width: ${iconSize}px; height: ${iconSize}px;">
                            📁
                        </div>
                    </div>
                </div>
            </div>
        `;

        const slider = container.querySelector(".settings__slider");
        const valueDisplay = container.querySelector(".settings__slider-value");
        const preview = container.querySelector(".settings__icon-preview-item");

        slider.addEventListener("input", (e) => {
            const value = parseInt(e.target.value);
            valueDisplay.textContent = `${value}px`;
            preview.style.width = `${value}px`;
            preview.style.height = `${value}px`;
            this.#updateSetting("desktop.iconSize", value);
        });
    }

    #renderGridSizePage(container) {
        const gridCols = this.#settingsStore.get("desktop.gridColumns") || 8;

        container.innerHTML = `
            <div class="settings__grid-size">
                <div class="settings__setting-group">
                    <h2 class="settings__section-title">Grid size</h2>
                    <p class="settings__section-description">
                        Configure how many icons fit across the desktop.
                    </p>

                    <div class="settings__slider-control">
                        <label class="settings__field-label">Columns: <span class="settings__slider-value">${gridCols}</span></label>
                        <input
                            type="range"
                            min="4"
                            max="16"
                            step="1"
                            value="${gridCols}"
                            class="settings__slider"
                        />
                        <div class="settings__slider-labels">
                            <span>4 columns</span>
                            <span>16 columns</span>
                        </div>
                    </div>

                    <div class="settings__grid-preview">
                        <div class="settings__grid-preview-grid" style="grid-template-columns: repeat(${gridCols}, 1fr);">
                            ${Array(gridCols).fill('📁').map(icon => `<div class="settings__grid-preview-item">${icon}</div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        const slider = container.querySelector(".settings__slider");
        const valueDisplay = container.querySelector(".settings__slider-value");
        const grid = container.querySelector(".settings__grid-preview-grid");

        slider.addEventListener("input", (e) => {
            const value = parseInt(e.target.value);
            valueDisplay.textContent = value;
            grid.style.gridTemplateColumns = `repeat(${value}, 1fr)`;
            grid.innerHTML = Array(value).fill('📁').map(icon => `<div class="settings__grid-preview-item">${icon}</div>`).join('');
            this.#updateSetting("desktop.gridColumns", value);
        });
    }

    #renderIconSpacingPage(container) {
        const spacing = this.#settingsStore.get("desktop.iconSpacing") || 16;

        container.innerHTML = `
            <div class="settings__icon-spacing">
                <div class="settings__setting-group">
                    <h2 class="settings__section-title">Icon spacing</h2>
                    <p class="settings__section-description">
                        Control the space between desktop icons.
                    </p>

                    <div class="settings__slider-control">
                        <label class="settings__field-label">Spacing: <span class="settings__slider-value">${spacing}px</span></label>
                        <input
                            type="range"
                            min="4"
                            max="32"
                            step="2"
                            value="${spacing}"
                            class="settings__slider"
                        />
                        <div class="settings__slider-labels">
                            <span>Compact (4px)</span>
                            <span>Spacious (32px)</span>
                        </div>
                    </div>

                    <div class="settings__spacing-preview">
                        <div class="settings__spacing-preview-items" style="gap: ${spacing}px;">
                            <div class="settings__spacing-preview-item">📁</div>
                            <div class="settings__spacing-preview-item">📄</div>
                            <div class="settings__spacing-preview-item">🖼</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const slider = container.querySelector(".settings__slider");
        const valueDisplay = container.querySelector(".settings__slider-value");
        const preview = container.querySelector(".settings__spacing-preview-items");

        slider.addEventListener("input", (e) => {
            const value = parseInt(e.target.value);
            valueDisplay.textContent = `${value}px`;
            preview.style.gap = `${value}px`;
            this.#updateSetting("desktop.iconSpacing", value);
        });
    }

    #renderAnimationsPage(container) {
        const enableAnimations = this.#settingsStore.get("windows.enableAnimations") ?? true;

        container.innerHTML = `
            <div class="settings__animations">
                <div class="settings__setting-group">
                    <h2 class="settings__section-title">Window animations</h2>
                    <p class="settings__section-description">
                        Enable or disable animations when opening, closing, and moving windows.
                    </p>

                    <label class="settings__toggle">
                        <input
                            type="checkbox"
                            class="settings__toggle-input"
                            ${enableAnimations ? "checked" : ""}
                        />
                        <span class="settings__toggle-track"></span>
                        <span class="settings__toggle-thumb"></span>
                        <span class="settings__toggle-label">Enable window animations</span>
                    </label>

                    <p class="settings__setting-description">
                        When enabled, windows will animate smoothly when opening and closing. Disable this for better performance on older systems.
                    </p>
                </div>
            </div>
        `;

        const toggle = container.querySelector(".settings__toggle-input");
        toggle.addEventListener("change", (e) => {
            this.#updateSetting("windows.enableAnimations", e.target.checked);
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
        const version = "3.2.1";
        const buildDate = "2026-01-15";
        const buildNumber = "4521";

        container.innerHTML = `
            <div class="settings__version">
                <div class="settings__setting-group">
                    <h2 class="settings__section-title">System information</h2>

                    <div class="settings__info-grid">
                        <div class="settings__info-item">
                            <span class="settings__info-label">NovaDesk version</span>
                            <span class="settings__info-value">${version}</span>
                        </div>
                        <div class="settings__info-item">
                            <span class="settings__info-label">Build number</span>
                            <span class="settings__info-value">${buildNumber}</span>
                        </div>
                        <div class="settings__info-item">
                            <span class="settings__info-label">Build date</span>
                            <span class="settings__info-value">${buildDate}</span>
                        </div>
                    </div>
                </div>

                <div class="settings__setting-group">
                    <h2 class="settings__section-title">Update</h2>
                    <p class="settings__section-description">
                        You're running the latest version of NovaDesk.
                    </p>
                    <button class="settings__button" type="button">Check for updates</button>
                </div>
            </div>
        `;
    }

    #renderAboutPage(container) {
        container.innerHTML = `
            <div class="settings__about">
                <div class="settings__about-header">
                    <div class="settings__about-logo">NovaDesk</div>
                    <h2 class="settings__about-title">About NovaDesk</h2>
                    <p class="settings__about-subtitle">A modern desktop environment</p>
                </div>

                <div class="settings__setting-group">
                    <h3 class="settings__section-title">What is NovaDesk?</h3>
                    <p class="settings__section-description">
                        NovaDesk is a modern, feature-rich desktop environment designed to provide users with a clean and intuitive interface. It combines the best of both worlds: the simplicity of minimalist design with powerful customization options.
                    </p>
                </div>

                <div class="settings__setting-group">
                    <h3 class="settings__section-title">Key features</h3>
                    <ul class="settings__features-list">
                        <li>Highly customizable appearance and behavior</li>
                        <li>Smooth window animations and snap layouts</li>
                        <li>Advanced desktop management</li>
                        <li>Built-in app launcher and file manager</li>
                        <li>Lightweight and performance-optimized</li>
                    </ul>
                </div>

                <div class="settings__setting-group">
                    <h3 class="settings__section-title">Credits</h3>
                    <p class="settings__section-description">
                        NovaDesk is developed by a passionate team of designers and developers who believe in creating beautiful, functional software.
                    </p>
                </div>

                <div class="settings__setting-group">
                    <p class="settings__copyright">
                        © 2026 NovaDesk. All rights reserved.
                    </p>
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
            </header>
            <section class="settings__page-content"></section>
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