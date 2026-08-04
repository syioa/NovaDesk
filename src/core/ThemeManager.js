import { flavors } from "@catppuccin/palette";

export default class ThemeManager {
    #root;
    #flavor;
    #eventBus;
    #settingsStore;
    #systemThemeMediaQuery;

    #colorMap = {
        rosewater: "--catppuccin-rosewater",
        flamingo: "--catppuccin-flamingo",
        pink: "--catppuccin-pink",
        mauve: "--catppuccin-mauve",
        red: "--catppuccin-red",
        maroon: "--catppuccin-maroon",
        peach: "--catppuccin-peach",
        yellow: "--catppuccin-yellow",
        green: "--catppuccin-green",
        teal: "--catppuccin-teal",
        sky: "--catppuccin-sky",
        sapphire: "--catppuccin-sapphire",
        blue: "--catppuccin-blue",
        lavender: "--catppuccin-lavender",

        text: "--catppuccin-text",
        subtext1: "--catppuccin-subtext-1",
        subtext0: "--catppuccin-subtext-0",

        overlay2: "--catppuccin-overlay-2",
        overlay1: "--catppuccin-overlay-1",
        overlay0: "--catppuccin-overlay-0",

        surface2: "--catppuccin-surface-2",
        surface1: "--catppuccin-surface-1",
        surface0: "--catppuccin-surface-0",

        base: "--catppuccin-base",
        mantle: "--catppuccin-mantle",
        crust: "--catppuccin-crust"
    };

    constructor({
        root = document.documentElement,
        eventBus,
        settingsStore
    } = {}) {
        this.#root = root;
        this.#eventBus = eventBus;
        this.#settingsStore = settingsStore;

        this.#systemThemeMediaQuery =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );

        this.#bindEvents();

        this.#bindSystemThemeChanges();

        this.#applySavedSettings();
    }

    #applySavedSettings() {
        const theme =
            this.#settingsStore.get(
                "appearance.theme"
            );

        const accentColor =
            this.#settingsStore.get(
                "appearance.accentColor"
            );

        this.#applyTheme(theme);

        this.#applyAccentColor(accentColor);
    }

    #bindEvents() {
        this.#eventBus.on(
            "settings:changed",
            ({ path, value }) => {
                console.log(
                    "ThemeManager received:",
                    path,
                    value
                );

                if (
                    path === "appearance.theme"
                ) {
                    if (
                        value !== "light" &&
                        value !== "dark" &&
                        value !== "system" &&
                        value !== "auto"
                    ) {
                        console.warn(
                            "Ignoring invalid theme:",
                            value
                        );

                        return;
                    }

                    this.#applyTheme(value);

                    return;
                }

                if (
                    path === "appearance.accentColor"
                ) {
                    if (!value) {
                        return;
                    }

                    this.#applyAccentColor(value);
                }
            }
        );

        this.#eventBus.on(
            "settings:reset",
            () => {
                this.#applySavedSettings();
            }
        );
    }

    #bindSystemThemeChanges() {
        this.#systemThemeMediaQuery.addEventListener(
            "change",
            () => {
                const theme =
                    this.#settingsStore.get(
                        "appearance.theme"
                    );

                if (
                    theme === "system" ||
                    theme === "auto"
                ) {
                    this.#applySystemTheme();
                }
            }
        );
    }

    #applyTheme(theme) {
        console.log(
            "Applying theme:",
            theme
        );


        if (theme === "dark") {
            this.#applyDarkTheme();
            return;
        }

        if (theme === "light") {
            this.#applyLightTheme();
            return;
        }

        if (
            theme === "system" ||
            theme === "auto"
        ) {
            this.#applySystemTheme();
            return;
        }

        console.warn(
            `Unknown theme "${theme}". Falling back to system theme.`
        );

        this.#applySystemTheme();
    }

    #applyDarkTheme() {
        this.#root.dataset.theme = "dark";

        this.setFlavor("mocha");
    }

    #applyLightTheme() {
        this.#root.dataset.theme = "light";

        this.setFlavor("latte");
    }

    #applySystemTheme() {
        if (
            this.#systemThemeMediaQuery.matches
        ) {
            this.#applyDarkTheme();
        } else {
            this.#applyLightTheme();
        }
    }

    #applyAccentColor(color) {
        if (!color) {
            return;
        }

        this.#root.style.setProperty(
            "--color-accent",
            color
        );
    }

    setFlavor(flavorName) {
        const flavor = flavors[flavorName];

        if (!flavor) {
            throw new Error(
                `Unknown Catppuccin flavor: "${flavorName}"`
            );
        }

        this.#flavor = flavor;

        this.#applyFlavor();
    }

    getFlavor() {
        return this.#flavor;
    }

    getFlavorName() {
        return this.#flavor.name;
    }

    #applyFlavor() {
        const colors = this.#flavor.colors;

        for (const [
            colorName,
            variableName
        ] of Object.entries(this.#colorMap)) {
            const color = colors[colorName];

            if (!color) {
                console.warn(
                    `Catppuccin color "${colorName}" is not available.`
                );

                continue;
            }

            this.#root.style.setProperty(
                variableName,
                color.hex
            );
        }
    }
}