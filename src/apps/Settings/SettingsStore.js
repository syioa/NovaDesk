export default class SettingsStore {
    #eventBus;
    #storageKey = "novadesk-settings";

    #settings = {
        appearance: {
            wallpaper: {
                type: "color",
                value: "#1e1e1e"
            },
            theme: "auto",
            accentColor: "theme",
        },
        desktop: {
            iconSize: 64,
            gridColumns: 8,
            iconSpacing: 16
        },
        videoPlayer: {
            autoplay: true,
            loop: false
        },
    };

    constructor(eventBus) {
        this.#eventBus = eventBus;
        this.#load();
    }

    #load() {
        const saved = localStorage.getItem(this.#storageKey);

        if (!saved) {
            return;
        }

        try {
            const parsed = JSON.parse(saved);
            this.#settings = this.#mergeSettings(this.#settings, parsed);
        } catch (error) {
            console.error("Failed to load NovaDesk settings:", error);
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
                    ...(saved.appearance?.wallpaper || {})
                }
            },
            desktop: {
                ...defaults.desktop,
                ...saved.desktop
            },
            videoPlayer: {
                ...defaults.videoPlayer,
                ...saved.videoPlayer
            },
            system: {
                ...defaults.system,
                ...saved.system
            }
        };
    }

    #save() {
        localStorage.setItem(this.#storageKey, JSON.stringify(this.#settings));
    }

    get(path) {
        const parts = path.split(".");
        let value = this.#settings;

        for (const part of parts) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[part];
        }

        return value;
    }

    set(path, value) {
        const parts = path.split(".");
        let target = this.#settings;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];

            if (!target[part] || typeof target[part] !== "object") {
                target[part] = {};
            }

            target = target[part];
        }

        const key = parts[parts.length - 1];
        target[key] = value;

        this.#save();

        this.#eventBus.emit("settings:changed", {
            path,
            value
        });
    }

    getAll() {
        return structuredClone(this.#settings);
    }

    reset() {
        this.#settings = {
            appearance: {
                wallpaper: {
                    type: "color",
                    value: "#1e1e1e"
                },
                theme: "system",
                accentColor: "theme"
            },
            desktop: {
                iconSize: 64,
                gridColumns: 8,
                iconSpacing: 16
            },
            videoPlayer: {
                autoplay: true,
                loop: false
            },
        };

        this.#save();

        this.#eventBus.emit("settings:reset", {});
    }
}