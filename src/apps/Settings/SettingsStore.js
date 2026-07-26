export default class SettingsStore {
    #eventBus;
    #storageKey = "novadesk-settings";

    #settings = {
        appearance: {
            wallpaper: {
                type: "color",
                value: "#1e1e1e"
            }
        }
    };

    constructor(eventBus) {
        this.#eventBus = eventBus;

        this.#load();
    }

    #load() {
        const saved =
            localStorage.getItem(
                this.#storageKey
            );

        if (!saved) {
            return;
        }

        try {
            const parsed =
                JSON.parse(saved);

            this.#settings =
                this.#mergeSettings(
                    this.#settings,
                    parsed
                );
        } catch (error) {
            console.error(
                "Failed to load NovaDesk settings:",
                error
            );
        }
    }

    #mergeSettings(defaults, saved) {
        return {
            ...defaults,
            ...saved,

            appearance: {
                ...defaults.appearance,
                ...saved.appearance,

                wallpaper: {
                    ...defaults.appearance.wallpaper,
                    ...saved.appearance?.wallpaper
                }
            }
        };
    }

    #save() {
        localStorage.setItem(
            this.#storageKey,
            JSON.stringify(this.#settings)
        );
    }

    get(path) {
        const parts =
            path.split(".");

        let value =
            this.#settings;

        for (const part of parts) {
            if (
                value === null ||
                value === undefined
            ) {
                return undefined;
            }

            value = value[part];
        }

        return value;
    }

    set(path, value) {
        const parts =
            path.split(".");

        let target =
            this.#settings;

        for (
            let i = 0;
            i < parts.length - 1;
            i++
        ) {
            const part =
                parts[i];

            if (
                !target[part] ||
                typeof target[part] !== "object"
            ) {
                target[part] = {};
            }

            target =
                target[part];
        }

        const key =
            parts[parts.length - 1];

        target[key] = value;

        this.#save();

        this.#eventBus.emit(
            "settings:changed",
            {
                path,
                value
            }
        );
    }

    getAll() {
        return structuredClone(
            this.#settings
        );
    }
}