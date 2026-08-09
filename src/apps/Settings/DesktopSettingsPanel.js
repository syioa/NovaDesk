export default class DesktopSettingsPanel {
    #store;
    #eventBus;
    #container;
    #unsubscribe;

    // Slider ranges — tweak to match NovaDesk's actual constraints
    #limits = {
        iconSize: { min: 32, max: 128, step: 4 },
        gridColumns: { min: 4, max: 16, step: 1 },
        iconSpacing: { min: 0, max: 48, step: 2 }
    };

    #els = {};

    constructor(store, eventBus) {
        this.#store = store;
        this.#eventBus = eventBus;
    }

    mount(container) {
        this.#container = container;
        this.#container.innerHTML = this.#template();
        this.#cacheEls();
        this.#bindEvents();
        this.#syncFromStore();

        // Keep UI in sync if settings change elsewhere (e.g. reset)
        this.#unsubscribe = this.#eventBus.on("settings:changed", (payload) => {
            if (payload.path?.startsWith("desktop.")) {
                this.#syncFromStore();
            }
        });

        this.#eventBus.on("settings:reset", () => this.#syncFromStore());
    }

    unmount() {
        this.#unsubscribe?.();
        this.#container.innerHTML = "";
    }

    #template() {
        return `
        <section class="settings-section" data-section="desktop">

            <div class="settings-section__label">
                Icon Grid
            </div>

            <div class="settings-group">
                ${this.#rowTemplate(
            "iconSize",
            "Icon Size",
            "Size of desktop icons",
            "px"
        )}

                ${this.#rowTemplate(
            "gridColumns",
            "Grid Columns",
            "Icons per row",
            ""
        )}

                ${this.#rowTemplate(
            "iconSpacing",
            "Icon Spacing",
            "Gap between icons",
            "px"
        )}
            </div>

            <div class="settings-section__footer">
                <button
                    class="settings-reset-button"
                    type="button"
                    id="desktop-reset-button"
                >
                    Reset to Default
                </button>
            </div>

        </section>
    `;
    }

    #rowTemplate(key, label, description, unit) {
        const { min, max, step } = this.#limits[key];

        return `
        <div class="settings-row" data-key="${key}">

            <div class="settings-row__info">
                <label
                    class="settings-row__label"
                    for="${key}-input"
                >
                    ${label}
                </label>

                <div class="settings-row__description">
                    ${description}
                </div>
            </div>

            <div class="settings-row__control">

                <input
                    class="settings-row__slider"
                    type="range"
                    id="${key}-slider"
                    min="${min}"
                    max="${max}"
                    step="${step}"
                />

                <input
                    class="settings-row__value"
                    type="number"
                    id="${key}-input"
                    min="${min}"
                    max="${max}"
                    step="${step}"
                    aria-label="${label} value"
                />

                <span class="settings-row__unit">
                    ${unit}
                </span>

            </div>
        </div>
    `;
    }

    #cacheEls() {
        for (const key of Object.keys(this.#limits)) {
            this.#els[key] = {
                slider: this.#container.querySelector(
                    `#${key}-slider`
                ),
                input: this.#container.querySelector(
                    `#${key}-input`
                )
            };
        }

        this.#els.reset =
            this.#container.querySelector(
                "#desktop-reset-button"
            );
    }

    #bindEvents() {
        this.#els.reset.addEventListener(
            "click",
            () => {
                this.#store.set(
                    "desktop.iconSize",
                    64
                );

                this.#store.set(
                    "desktop.gridColumns",
                    8
                );

                this.#store.set(
                    "desktop.iconSpacing",
                    16
                );
            }
        );

        for (const key of Object.keys(this.#limits)) {
            const { slider, input } = this.#els[key];

            slider.addEventListener("input", () => {
                const value =
                    this.#clamp(key, Number(slider.value));

                input.value = value;

                this.#store.set(
                    `desktop.${key}`,
                    value
                );
            });

            input.addEventListener("change", () => {
                const value =
                    this.#clamp(key, Number(input.value));

                input.value = value;
                slider.value = value;

                this.#store.set(
                    `desktop.${key}`,
                    value
                );
            });
        }
    }

    #clamp(key, value) {
        const { min, max } = this.#limits[key];
        if (Number.isNaN(value)) return min;
        return Math.min(max, Math.max(min, value));
    }

    #syncFromStore() {
        for (const key of Object.keys(this.#limits)) {
            const value =
                this.#store.get(`desktop.${key}`);

            const { slider, input } =
                this.#els[key];

            slider.value = value;
            input.value = value;
        }
    }
}