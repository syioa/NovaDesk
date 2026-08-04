export default class AppearanceSettings {
    #store;
    #eventBus;
    #element;

    #checkSvg = `
    <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <polyline points="20 6 9 17 4 12"/>
    </svg>
`;

    #accents = [
        {
            id: "blue",
            label: "Blue",
            hex: "#0A84FF"
        },
        {
            id: "teal",
            label: "Teal",
            hex: "#40C8E0"
        },
        {
            id: "green",
            label: "Green",
            hex: "#32D74B"
        },
        {
            id: "yellow",
            label: "Yellow",
            hex: "#FFD60A"
        },
        {
            id: "orange",
            label: "Orange",
            hex: "#FF9F0A"
        },
        {
            id: "red",
            label: "Red",
            hex: "#FF453A"
        },
        {
            id: "pink",
            label: "Pink",
            hex: "#FF375F"
        },
        {
            id: "purple",
            label: "Purple",
            hex: "#BF5AF2"
        },
        {
            id: "graphite",
            label: "Graphite",
            hex: "#98989D"
        }
    ];

    #lightGlyphHexes = new Set([
        "#FFD60A",
        "#40C8E0",
        "#98989D"
    ]);

    constructor(store, eventBus) {
        this.#store = store;
        this.#eventBus = eventBus;

        this.#element =
            document.createElement("div");

        this.#element.className =
            "appearance-settings";
    }

    mount(parent) {
        parent.append(
            this.#element
        );

        this.#render();
    }

    #render() {
        // We will build the Appearance UI here.

        const theme =
            this.#store.get(
                "appearance.theme"
            ) ?? "auto";

        const accentColor =
            this.#store.get(
                "appearance.accentColor"
            ) ?? "#0A84FF";

        this.#element.replaceChildren();

        /*
         * Main panel
         */
        const panel =
            document.createElement("div");

        panel.className =
            "panel";

        /*
         * Container
         */
        const container =
            document.createElement("div");

        container.className =
            "container";

        /*
         * Breadcrumb
         */
        const breadcrumb =
            document.createElement("div");

        breadcrumb.className =
            "breadcrumb";

        breadcrumb.textContent =
            "Settings / Appearance";

        /*
         * Title
         */
        const title =
            document.createElement("h1");

        title.className =
            "title";

        title.textContent =
            "Appearance";

        /*
         * Subtitle
         */
        const subtitle =
            document.createElement("p");

        subtitle.className =
            "subtitle";

        subtitle.textContent =
            "Customize the look and feel of NovaDesk.";

        /*
         * Preview
         */
        const preview =
            this.#createPreview(
                accentColor,
                theme
            );

        /*
         * Theme section
         */
        const themeSection =
            this.#createThemeSection(
                theme
            );

        /*
         * Accent section
         */
        const accentSection =
            this.#createAccentSection(
                accentColor
            );

        container.append(
            breadcrumb,
            title,
            subtitle,
            preview,
            themeSection,
            accentSection
        );

        panel.append(
            container
        );

        this.#element.append(
            panel
        );
    }

    #createPreview(
        accentColor,
        theme
    ) {
        const section =
            document.createElement("div");

        section.className =
            "preview-outer";

        const isDark =
            this.#isDarkTheme(
                theme
            );

        section.classList.toggle(
            "is-light",
            !isDark
        );

        /*
         * Preview card
         */
        const card =
            document.createElement("div");

        card.className =
            "preview-card";

        /*
         * Top row
         */
        const top =
            document.createElement("div");

        top.className =
            "preview-top";

        /*
         * Text group
         */
        const textGroup =
            document.createElement("div");

        const heading =
            document.createElement("div");

        heading.className =
            "preview-heading";

        heading.textContent =
            "NovaDesk";

        const subheading =
            document.createElement("div");

        subheading.className =
            "preview-subheading";

        subheading.textContent =
            "Your desktop, your way";

        textGroup.append(
            heading,
            subheading
        );

        /*
         * Accent dot
         */
        const dot =
            document.createElement("div");

        dot.className =
            "preview-dot";

        dot.style.background =
            accentColor;

        dot.textContent =
            "N";

        /*
         * Top row
         */
        top.append(
            textGroup,
            dot
        );

        /*
         * Controls
         */
        const controls =
            document.createElement("div");

        controls.className =
            "preview-controls";

        /*
         * Button
         */
        const button =
            document.createElement("button");

        button.className =
            "preview-btn";

        button.textContent =
            "Apply";

        button.style.background =
            accentColor;

        /*
         * Toggle
         */
        const toggle =
            document.createElement("div");

        toggle.className =
            "preview-toggle";

        toggle.style.background =
            accentColor;

        const knob =
            document.createElement("div");

        knob.className =
            "preview-toggle-knob";

        toggle.append(
            knob
        );

        /*
         * Track
         */
        const track =
            document.createElement("div");

        track.className =
            "preview-track";

        const trackFill =
            document.createElement("div");

        trackFill.className =
            "preview-track-fill";

        trackFill.style.background =
            accentColor;

        track.append(
            trackFill
        );

        controls.append(
            button,
            toggle,
            track
        );

        card.append(
            top,
            controls
        );

        section.append(
            card
        );

        return section;
    }

    #createThemeSection(
        currentTheme
    ) {
        const section =
            document.createElement("section");

        section.className =
            "section";

        const label =
            document.createElement("h2");

        label.className =
            "section-label";

        label.textContent =
            "Theme";

        const grid =
            document.createElement("div");

        grid.className =
            "theme-grid";

        const themes = [
            {
                id: "light",
                label: "Light"
            },
            {
                id: "dark",
                label: "Dark"
            },
            {
                id: "auto",
                label: "System"
            }
        ];

        for (const theme of themes) {
            const card =
                this.#createThemeCard(
                    theme,
                    currentTheme
                );

            grid.append(
                card
            );
        }

        section.append(
            label,
            grid
        );

        return section;
    }

    #createThemeCard(
        theme,
        currentTheme
    ) {
        const card =
            document.createElement("button");

        card.type =
            "button";

        card.className =
            "theme-card";

        card.dataset.theme =
            theme.id;

        card.classList.toggle(
            "selected",
            currentTheme === theme.id
        );

        /*
         * Theme thumbnail
         */
        const thumbnail =
            document.createElement("div");

        thumbnail.className =
            "theme-thumb split";

        const light =
            this.#createThemeThumbnailHalf(
                "light"
            );

        const dark =
            this.#createThemeThumbnailHalf(
                "dark"
            );

        thumbnail.append(
            light,
            dark
        );

        /*
         * Label
         */
        const label =
            document.createElement("span");

        label.className =
            "theme-label";

        label.textContent =
            theme.label;

        /*
         * Check icon
         */
        const check =
            document.createElement("span");

        check.className =
            "check-icon";

        check.innerHTML =
            this.#checkSvg;

        label.append(
            check
        );

        card.append(
            thumbnail,
            label
        );

        console.log(
            "Creating theme card:",
            theme
        );

        card.addEventListener(
            "click",
            () => {
                console.log(
                    "THEME CARD CLICKED:",
                    theme
                );

                console.log(
                    "THEME ID:",
                    theme?.id
                );

                this.#store.set(
                    "appearance.theme",
                    theme.id
                );

                this.#render();
            }
        );

        return card;
    }

    #createThemeThumbnailHalf(
        theme
    ) {
        const half =
            document.createElement("div");

        half.className =
            "thumb-half-split";

        half.classList.add(
            theme === "light"
                ? "thumb-light"
                : "thumb-dark"
        );

        /*
         * Top bar
         */
        const bar =
            document.createElement("div");

        bar.className =
            "thumb-bar";

        const dot1 =
            document.createElement("span");

        dot1.className =
            "dot";

        const dot2 =
            document.createElement("span");

        dot2.className =
            "dot";

        bar.append(
            dot1,
            dot2
        );

        /*
         * Lines
         */
        const lines =
            document.createElement("div");

        lines.className =
            "thumb-lines";

        const accentLine =
            document.createElement("div");

        accentLine.className =
            "thumb-line";

        accentLine.classList.add(
            "thumb-line-accent"
        );

        const mutedLine =
            document.createElement("div");

        mutedLine.className =
            "thumb-line";

        mutedLine.classList.add(
            "thumb-line-muted"
        );

        lines.append(
            accentLine,
            mutedLine
        );

        half.append(
            bar,
            lines
        );

        return half;
    }

    #createAccentSection(
        currentAccent
    ) {
        const section =
            document.createElement("section");

        section.className =
            "section";

        const label =
            document.createElement("h2");

        label.className =
            "section-label";

        label.textContent =
            "Accent Color";

        const card =
            document.createElement("div");

        card.className =
            "accent-card";

        /*
         * Preset swatches
         */
        const swatchGrid =
            document.createElement("div");

        swatchGrid.className =
            "swatch-grid";

        for (
            const accent
            of this.#accents
        ) {
            const swatch =
                this.#createAccentSwatch(
                    accent,
                    currentAccent
                );

            swatchGrid.append(
                swatch
            );
        }

        /*
         * Divider
         */
        const divider =
            document.createElement("div");

        divider.className =
            "divider";

        /*
         * Custom accent row
         */
        const customRow =
            this.#createCustomAccentRow(
                currentAccent
            );

        card.append(
            swatchGrid,
            divider,
            customRow
        );

        section.append(
            label,
            card
        );

        return section;
    }

    #createAccentSwatch(
        accent,
        currentAccent
    ) {
        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "swatch";

        button.style.background =
            accent.hex;

        button.style.color =
            accent.hex;

        button.dataset.accentId =
            accent.id;

        button.setAttribute(
            "aria-label",
            accent.id
        );

        button.innerHTML =
            this.#checkSvg;

        const check =
            button.querySelector(
                "svg"
            );

        check.style.color =
            this.#lightGlyphHexes.has(
                accent.hex
            )
                ? "#19191B"
                : "#FFFFFF";

        button.classList.toggle(
            "selected",
            currentAccent.toUpperCase() ===
            accent.hex.toUpperCase()
        );

        button.addEventListener(
            "click",
            () => {
                this.#store.set(
                    "appearance.accentColor",
                    accent.hex
                );

                this.#render();
            }
        );

        return button;
    }

    #createCustomAccentRow(
        currentAccent
    ) {
        const row =
            document.createElement("div");

        row.className =
            "custom-row";

        const isPreset =
            this.#accents.some(
                accent =>
                    accent.hex.toUpperCase() ===
                    currentAccent.toUpperCase()
            );

        const isCustom =
            !isPreset;

        row.classList.toggle(
            "selected",
            isCustom
        );

        /*
         * Left side
         */
        const left =
            document.createElement("div");

        left.className =
            "custom-left";

        /*
         * Custom color swatch
         */
        const swatch =
            document.createElement("div");

        swatch.className =
            "custom-swatch";

        swatch.style.background =
            currentAccent;

        swatch.style.color =
            currentAccent;

        /*
         * Label
         */
        const label =
            document.createElement("span");

        label.className =
            "custom-label";

        label.textContent =
            "Custom";

        left.append(
            swatch,
            label
        );

        /*
         * Picker
         */
        const picker =
            document.createElement("label");

        picker.className =
            "custom-picker";

        /*
         * Hex value
         */
        const hex =
            document.createElement("span");

        hex.className =
            "custom-hex";

        hex.textContent =
            currentAccent.toUpperCase();

        /*
         * Color input
         */
        const input =
            document.createElement("input");

        input.type =
            "color";

        input.value =
            this.#isValidHex(
                currentAccent
            )
                ? currentAccent
                : "#3584e4";

        input.addEventListener(
            "click",
            event => {
                event.stopPropagation();
            }
        );

        input.addEventListener(
            "input",
            event => {
                this.#store.set(
                    "appearance.accentColor",
                    event.target.value
                );

                this.#render();
            }
        );

        picker.append(
            hex,
            input
        );

        row.append(
            left,
            picker
        );

        /*
         * Clicking the row itself does not
         * need to manually update state.
         *
         * The color picker controls the value.
         */
        row.addEventListener(
            "click",
            () => {
                if (
                    !isCustom
                ) {
                    this.#store.set(
                        "appearance.accentColor",
                        currentAccent
                    );

                    this.#render();
                }
            }
        );

        return row;
    }

    #isDarkTheme(
        theme
    ) {
        if (
            theme === "dark"
        ) {
            return true;
        }

        if (
            theme === "light"
        ) {
            return false;
        }

        /*
         * "auto" / system theme.
         */
        return window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
    }

    #isValidHex(
        value
    ) {
        return /^#[0-9A-Fa-f]{6}$/.test(
            value
        );
    }

    get element() {
        return this.#element;
    }
}