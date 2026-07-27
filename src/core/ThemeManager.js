import { flavors } from "@catppuccin/palette";

export default class ThemeManager {
    #root;
    #flavor;

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
        flavor = "mocha"
    } = {}) {
        this.#root = root;

        this.setFlavor(flavor);
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