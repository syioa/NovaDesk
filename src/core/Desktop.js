import { Taskbar } from "../ui/Taskbar.js";
import StartMenu from "../ui/StartMenu.js";
import DesktopIcons from "../ui/DesktopIcons.js";
import ContextMenu from "../ui/ContextMenu.js";
import SelectionBox from "./SelectionBox.js";

export default class Desktop {
    #element;
    #snapPreview;
    #taskbar;
    #eventBus;
    #startMenu;
    #registry;
    #contextMenu;
    #selectionRect;
    #settingsStore;


    #desktopIcons;
    #uiManager;
    #overlayLayer;
    #layers = {};

    #selectionBox;
    #selecting = false;

    #selectionStartX = 0;
    #selectionStartY = 0;

    constructor(eventBus, registry, uiManager, settingsStore) {
        this.#eventBus = eventBus;
        this.#registry = registry;
        this.#uiManager = uiManager;
        this.#settingsStore = settingsStore;

        this.#element = document.createElement("main");
        this.#element.className = "desktop";
        this.#startMenu = new StartMenu(
            this.#eventBus,
            this.#registry,
            this.#uiManager
        );

        this.#createLayers();

        this.#applyWallpaper();

        this.#overlayLayer = this.getLayer("overlay");

        this.#contextMenu = new ContextMenu(
            this.#layers.contextmenu,
            this.#uiManager
        );

        this.#taskbar = new Taskbar(
            this.#eventBus,
            this.#registry
        );
        this.#taskbar.bindEvents();

        this.getLayer("taskbar").append(
            this.#taskbar.getElement()
        );

        this.#desktopIcons = new DesktopIcons(
            eventBus,
            registry,
            settingsStore
        );
        this.getLayer("icons").append(
            this.#desktopIcons.element
        );

        this.#eventBus.on(
            "desktop:contextmenu",
            ({ appId, x, y }) => {
                this.#onDesktopIconContextMenu(
                    appId,
                    x,
                    y
                );
            }
        );

        this.#eventBus.on(
            "notes:contextmenu",
            ({ event, noteId, view, pinned }) => {
                this.#onNotesContextMenu(
                    event,
                    noteId,
                    view,
                    pinned
                );
            }
        );

        this.#eventBus.on(
            "desktop:contextmenu",
            ({ appId, x, y }) => {
                this.#onDesktopIconContextMenu(
                    appId,
                    x,
                    y
                );
            }
        );

        this.#eventBus.on(
            "settings:changed",
            ({ path }) => {
                if (
                    path ===
                    "appearance.wallpaper"
                ) {
                    this.#applyWallpaper();
                }
            }
        );

        this.#element.addEventListener("contextmenu", (event) => {
            this.#onContextMenu(event);
        });
        this.#element.addEventListener("pointerdown", (event) => {
            this.#onPointerDown(event);
        });

        this.#createSnapPreview();
        this.#selectionBox = new SelectionBox();

        this.#overlayLayer.append(
            this.#selectionBox.element
        );

        document.addEventListener("pointermove", (event) => {
            this.#onPointerMove(event);
        });

        document.addEventListener("pointerup", (event) => {
            this.#onPointerUp(event);
        });
    }

    #createSnapPreview() {
        this.#snapPreview = document.createElement("div");
        this.#snapPreview.className = "desktop__snap-preview";

        this.getLayer("snap-preview").appendChild(this.#snapPreview);
    }

    showSnapPreview({ x, y, width, height }) {
        Object.assign(this.#snapPreview.style, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            opacity: "1"
        });
    }

    hideSnapPreview() {
        this.#snapPreview.style.opacity = "0";
    }

    #createLayers() {
        const names = [
            "wallpaper",
            "icons",
            "snap-preview",
            "windows",
            "overlay",
            "contextmenu",
            "taskbar"
        ];

        for (const name of names) {
            const layer = document.createElement("div");

            layer.className = `desktop-layer desktop-layer-${name}`;

            this.#layers[name] = layer;
            this.#element.append(layer);
        }

        this.getLayer("taskbar").append(
            this.#startMenu.getElement()
        );
    }

    #onContextMenu(event) {
        event.preventDefault();

        // Only show menu on empty desktop
        if (event.target !== this.#element) {
            return;
        }

        this.#contextMenu.show(
            event.clientX,
            event.clientY,
            this.#createDesktopContextMenuItems(),
            this.getWorkArea()
        );
    }

    #removeAllIconsFromDesktop() {
        const apps = this.#registry.getApps();

        for (const AppClass of apps) {
            this.#eventBus.emit(
                "desktop:remove",
                AppClass.manifest.id
            );
        }
    }

    #createDesktopContextMenuItems() {
        const setView = (iconSize, iconSpacing) => {
            this.#settingsStore.set(
                "desktop.iconSize",
                iconSize
            );

            this.#settingsStore.set(
                "desktop.iconSpacing",
                iconSpacing
            );
        };

        const setSortBy = (sortBy) => {
            this.#settingsStore.set(
                "desktop.sortBy",
                sortBy
            );
        };

        const setArrange = (arrangement) => {
            this.#settingsStore.set(
                "desktop.arrangement",
                arrangement
            );
        };

        const setSortAlignment = (sortAlignment) => {
            this.#settingsStore.set(
                "desktop.sortAlignment",
                sortAlignment
            );
        };

        const currentSortBy = this.#settingsStore.get("desktop.sortBy");
        const currentArrangement = this.#settingsStore.get("desktop.arrangement");
        const currentSortAlignment = this.#settingsStore.get("desktop.sortAlignment");

        return [
            {
                label: "View",
                items: [
                    {
                        label: "Large Icons",
                        action: () => {
                            setView(80, 20);
                        }
                    },
                    {
                        label: "Medium Icons",
                        action: () => {
                            setView(64, 16);
                        }
                    },
                    {
                        label: "Small Icons",
                        action: () => {
                            setView(48, 12);
                        }
                    }
                ]
            },

            {
                type: "separator"
            },

            {
                label: "Sort by",
                items: [
                    {
                        label: "Unsorted",
                        checked: currentSortBy === "unsorted",
                        action: () => {
                            setSortBy("unsorted");
                        }
                    },
                    {
                        label: "Name",
                        checked: currentSortBy === "name",
                        action: () => {
                            setSortBy("name");
                        }
                    },
                ]
            },

            {
                label: "Arrange",
                items: [
                    {
                        label: "In Columns",
                        checked: currentArrangement === "columns",
                        action: () => {
                            setArrange("columns");
                        }
                    },
                    {
                        label: "In Rows",
                        checked: currentArrangement === "rows",
                        action: () => {
                            setArrange("rows");
                        }
                    }
                ]
            },

            {
                label: "Sort alignment",
                items: [
                    {
                        label: "Left to Right",
                        checked: currentSortAlignment === "ltr",
                        action: () => {
                            setSortAlignment("ltr");
                        }
                    },
                    {
                        label: "Right to Left",
                        checked: currentSortAlignment === "rtl",
                        action: () => {
                            setSortAlignment("rtl");
                        }
                    }
                ]
            },

            {
                type: "separator"
            },

            {
                label: "Wallpaper",
                action: () => {
                    this.#eventBus.emit("app:launch", {
                        id: "settings",
                        options: {
                            page: {
                                category: "appearance",
                                id: "wallpaper"
                            }
                        }
                    });
                }
            },
            {
                type: "separator"
            },

            {
                label: this.#areAllIconsRemoved()
                    ? "Add All Icons to Desktop"
                    : "Remove All Icons from Desktop",

                action: () => {
                    if (this.#areAllIconsRemoved()) {
                        this.#eventBus.emit(
                            "desktop:restore-all"
                        );
                    } else {
                        this.#eventBus.emit(
                            "desktop:remove-all"
                        );
                    }
                }
            }
        ];
    }

    #onPointerUp() {
        if (!this.#selecting) {
            return;
        }

        this.#selecting = false;

        this.#selectionBox.hide();

        if (this.#selectionRect) {
            this.#desktopIcons.selectInRect(
                this.#selectionRect
            );
        }

        this.#selectionRect = null;
    }

    #onPointerMove(event) {
        if (!this.#selecting) {
            return;
        }

        const left = Math.min(
            this.#selectionStartX,
            event.clientX
        );

        const top = Math.min(
            this.#selectionStartY,
            event.clientY
        );

        const width = Math.abs(
            event.clientX - this.#selectionStartX
        );

        const height = Math.abs(
            event.clientY - this.#selectionStartY
        );

        this.#selectionBox.setRect(
            left,
            top,
            width,
            height
        );

        this.#selectionRect = {
            x: left,
            y: top,
            width,
            height
        };
    }

    #onPointerDown(event) {
        this.#contextMenu.close();

        if (event.button !== 0) {
            return;
        }

        if (event.target !== this.#element) {
            return;
        }

        this.#desktopIcons.clearSelection();

        this.#selecting = true;

        this.#selectionStartX = event.clientX;
        this.#selectionStartY = event.clientY;

        this.#selectionBox.show();

        this.#selectionBox.setRect(
            event.clientX,
            event.clientY,
            0,
            0
        );
    }

    #onDesktopIconContextMenu(appId, x, y) {
        const AppClass = this.#registry.get(appId);

        if (!AppClass) {
            return;
        }

        const manifest = AppClass.manifest;

        const pinned = localStorage.getItem(
            "novadesk-taskbar-pinned"
        );

        let isPinned = false;

        try {
            const pinnedApps = pinned
                ? JSON.parse(pinned)
                : [];

            isPinned =
                Array.isArray(pinnedApps) &&
                pinnedApps.includes(appId);
        } catch {
            isPinned = false;
        }

        const bounds = this.#element.getBoundingClientRect();

        const items = [
            {
                label: "Open",
                action: () => {
                    this.#eventBus.emit(
                        "app:launch",
                        appId
                    );
                }
            },

            {
                type: "separator"
            },

            {
                label: isPinned
                    ? "Unpin from Taskbar"
                    : "Pin to Taskbar",

                action: () => {
                    this.#eventBus.emit(
                        "taskbar:toggle-pin",
                        {
                            appId
                        }
                    );
                }
            },

            {
                label: "Remove from Desktop",

                action: () => {
                    this.#eventBus.emit(
                        "desktop:remove",
                        appId
                    );
                }
            }
        ];

        this.#contextMenu.show(
            x,
            y,
            items,
            {
                left: bounds.left,
                top: bounds.top,
                right: bounds.right,
                bottom: bounds.bottom
            }
        );
    }

    #onNotesContextMenu(event, noteId, view, pinned) {
        const bounds =
            this.#element.getBoundingClientRect();

        const items = [];

        if (view === "notes") {
            items.push(
                {
                    label: pinned ? "Unpin" : "Pin to Top",
                    action: () => {
                        this.#eventBus.emit(
                            "notes:pin",
                            noteId
                        );
                    }
                },
                {
                    type: "separator"
                },
                {
                    label: "Rename",
                    action: () => {
                        this.#eventBus.emit(
                            "notes:rename",
                            noteId
                        );
                    }
                },
                {
                    label: "Duplicate",
                    action: () => {
                        this.#eventBus.emit(
                            "notes:duplicate",
                            noteId
                        );
                    }
                },
                {
                    type: "separator"
                },
                {
                    label: "Delete",
                    danger: true,
                    action: () => {
                        this.#eventBus.emit(
                            "notes:delete",
                            noteId
                        );
                    }
                }
            );
        }

        if (view === "trash") {
            items.push(
                {
                    label: "Restore",
                    action: () => {
                        this.#eventBus.emit(
                            "notes:restore",
                            noteId
                        );
                    }
                },
                {
                    type: "separator"
                },
            );
        }

        this.#contextMenu.show(
            event.clientX,
            event.clientY,
            items,
            {
                left: bounds.left,
                top: bounds.top,
                right: bounds.right,
                bottom: bounds.bottom
            }
        );
    }

    #areAllIconsRemoved() {
        const apps = this.#registry.getApps();

        return (
            apps.length > 0 &&
            apps.every(
                AppClass =>
                    this.#desktopIcons
                        .isHidden(
                            AppClass.manifest.id
                        )
            )
        );
    }

    getWorkArea() {
        const rect = this.#taskbar
            .getElement()
            .getBoundingClientRect();

        const left = 0;
        const top = 0;
        const right = window.innerWidth;
        const bottom = window.innerHeight - rect.height;

        return {
            left,
            top,
            right,
            bottom,
            width: right - left,
            height: bottom - top
        };
    }

    #applyWallpaper() {
        const wallpaper =
            this.#settingsStore.get(
                "appearance.wallpaper"
            );

        if (!wallpaper) {
            console.warn(
                "No wallpaper settings found."
            );

            return;
        }

        switch (wallpaper.type) {
            case "image":
                this.#applyImageWallpaper(wallpaper.value);
                break;

            case "color":
                this.#applyColorWallpaper(wallpaper.value);
                break;

            default:
                console.warn(
                    `Unknown wallpaper type: ${wallpaper.type}`
                );
        }
    }

    #applyImageWallpaper(value) {
        const wallpaperLayer =
            this.getLayer("wallpaper");

        if (!wallpaperLayer) {
            console.error(
                "Wallpaper layer does not exist."
            );

            return;
        }

        wallpaperLayer.style.backgroundImage =
            `url("${value}")`;

        wallpaperLayer.style.backgroundColor =
            "";

        wallpaperLayer.style.backgroundSize =
            "cover";

        wallpaperLayer.style.backgroundPosition =
            "center";

        wallpaperLayer.style.backgroundRepeat =
            "no-repeat";
    }

    #applyColorWallpaper(value) {
        const wallpaperLayer =
            this.getLayer("wallpaper");

        if (!wallpaperLayer) {
            console.error(
                "Wallpaper layer does not exist."
            );

            return;
        }

        wallpaperLayer.style.backgroundImage =
            "none";

        wallpaperLayer.style.backgroundColor =
            value;
    }

    get element() {
        return this.#element;
    }

    get taskbar() {
        return this.#taskbar;
    }

    getLayer(name) {
        return this.#layers[name];
    }
}