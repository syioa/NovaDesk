export default class StartMenu {
    #element;
    #eventBus;
    #registry;
    #uiManager;

    #previousFocusedElement = null;
    #isOpen = false;

    #profileStorageKey = "novadesk-profile";

    #profile = {
        name: "Jane Doe",
        role: "Administrator",
        avatar: ""
    };

    constructor(eventBus, registry, uiManager) {
        this.#eventBus = eventBus;
        this.#registry = registry;
        this.#uiManager = uiManager;

        this.#element = document.createElement("div");
        this.#element.className = "start-menu";

        this.#loadProfile();
        this.#render();

        this.#eventBus.on("start:toggle", () => {
            this.toggle();
        });

        document.addEventListener("pointerdown", (event) => {
            if (!this.#isOpen) {
                return;
            }

            if (this.#element.contains(event.target)) {
                return;
            }

            this.close();
        });

        document.addEventListener("keydown", (event) => {
            if (!this.#isOpen) {
                return;
            }

            if (event.key === "Escape") {
                this.close();
            }
        })
    }

    #getInitials(name) {
        return name
            .trim()
            .split(/\s+/)
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    #openProfileEditor() {
        let draftProfile = {
            ...this.#profile
        };

        const overlay = document.createElement("div");
        overlay.className = "start-menu__profile-overlay";

        const modal = document.createElement("div");
        modal.className = "start-menu__profile-modal";

        modal.innerHTML = `
        <div class="start-menu__profile-modal-title">
            Edit profile
        </div>

        <button
            type="button"
            class="start-menu__avatar-preview"
            title="Upload photo"
        >
            ${draftProfile.avatar
                ? `<img src="${draftProfile.avatar}" alt="">`
                : this.#getInitials(draftProfile.name)
            }
        </button>

        <div class="start-menu__avatar-hint">
            Click avatar to upload photo
        </div>

        <input
            class="start-menu__avatar-input"
            type="file"
            accept="image/*"
        >

        <div class="start-menu__profile-field">
            <label for="start-menu-profile-name">
                Display name
            </label>

            <input
                id="start-menu-profile-name"
                type="text"
                value="${draftProfile.name}"
                placeholder="Your name"
            >
        </div>

        <div class="start-menu__profile-field">
            <label for="start-menu-profile-role">
                Role
            </label>

            <input
                id="start-menu-profile-role"
                type="text"
                value="${draftProfile.role}"
                placeholder="e.g. Administrator"
            >
        </div>

        <button
            type="button"
            class="start-menu__profile-button start-menu__profile-button--remove"
            ${draftProfile.avatar ? "" : "hidden"}
        >
            Remove photo
        </button>

        <div class="start-menu__profile-modal-actions">
            <button
                type="button"
                class="start-menu__profile-button start-menu__profile-button--secondary"
            >
                Cancel
            </button>

            <button
                type="button"
                class="start-menu__profile-button start-menu__profile-button--primary"
            >
                Save
            </button>
        </div>
    `;

        overlay.append(modal);
        document.body.append(overlay);

        const avatarPreview = modal.querySelector(
            ".start-menu__avatar-preview"
        );
        const avatarInput = modal.querySelector(
            ".start-menu__avatar-input"
        );
        const removeButton = modal.querySelector(
            ".start-menu__profile-button--remove"
        );
        const nameInput = modal.querySelector(
            "#start-menu-profile-name"
        );
        const roleInput = modal.querySelector(
            "#start-menu-profile-role"
        );

        nameInput.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            roleInput.focus();

            roleInput.setSelectionRange(
                roleInput.value.length,
                roleInput.value.length
            );
        });

        roleInput.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            saveButton.click();
        });

        const cancelButton = modal.querySelector(
            ".start-menu__profile-button--secondary"
        );
        const saveButton = modal.querySelector(
            ".start-menu__profile-button--primary"
        );
        const updateAvatarPreview = () => {
            if (draftProfile.avatar) {
                avatarPreview.innerHTML = `
                <img
                    src="${draftProfile.avatar}"
                    alt=""
                >
            `;

                removeButton.hidden = false;
            } else {
                avatarPreview.textContent =
                    this.#getInitials(draftProfile.name);

                removeButton.hidden = true;
            }
        };

        avatarPreview.addEventListener("click", () => {
            avatarInput.click();
        });

        avatarInput.addEventListener("change", (event) => {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            const reader = new FileReader();

            reader.addEventListener("load", () => {
                draftProfile.avatar = reader.result;
                updateAvatarPreview();
            });

            reader.readAsDataURL(file);
        });

        removeButton.addEventListener("click", () => {
            draftProfile.avatar = "";
            avatarInput.value = "";
            updateAvatarPreview();
        });

        nameInput.addEventListener("input", () => {
            draftProfile.name = nameInput.value;

            if (!draftProfile.avatar) {
                avatarPreview.textContent =
                    this.#getInitials(draftProfile.name);
            }
        });

        cancelButton.addEventListener("click", () => {
            overlay.remove();
        });

        saveButton.addEventListener("click", () => {
            this.#profile = {
                ...draftProfile,
                name: nameInput.value.trim() || "NovaDesk User",
                role: roleInput.value.trim() || "User"
            };

            this.#saveProfile();
            overlay.remove();
            this.#render();
        });

        overlay.addEventListener("pointerdown", (event) => {
            if (event.target === overlay) {
                overlay.remove();
            }
        });

        nameInput.focus();
        nameInput.select();
    }

    #loadProfile() {
        try {
            const saved = localStorage.getItem(
                this.#profileStorageKey
            );

            if (!saved) {
                return;
            }

            const profile = JSON.parse(saved);

            this.#profile = {
                name:
                    typeof profile.name === "string"
                        ? profile.name
                        : "Jane Doe",

                role:
                    typeof profile.role === "string"
                        ? profile.role
                        : "Administrator",

                avatar:
                    typeof profile.avatar === "string"
                        ? profile.avatar
                        : ""
            };
        } catch (error) {
            console.warn(
                "NovaDesk: failed to load profile",
                error
            );
        }
    }

    #saveProfile() {
        try {
            localStorage.setItem(
                this.#profileStorageKey,
                JSON.stringify(this.#profile)
            );
        } catch (error) {
            console.warn(
                "NovaDesk: failed to save profile",
                error
            );
        }
    }

    #render() {
        this.#element.innerHTML = `
        <div class="start-menu__profile" data-action="edit-profile">
            <div class="start-menu__avatar">
                ${this.#profile.avatar
                ? `<img
                        src="${this.#profile.avatar}"
                        alt=""
                    >`
                : this.#getInitials(this.#profile.name)
            }
            </div>

            <div class="start-menu__profile-info">
                <div class="start-menu__profile-name">
                    ${this.#profile.name}
                </div>

                <div class="start-menu__profile-role">
                    ${this.#profile.role}
                </div>
            </div>
        </div>

        <div class="start-menu__search">
            <input
                type="search"
                class="start-menu__search-input"
                placeholder="Search apps..."
                aria-label="Search apps"
            >
        </div>

        <div class="start-menu__apps"></div>
    `;

        const appsContainer = this.#element.querySelector(
            ".start-menu__apps"
        );
        const searchInput = this.#element.querySelector(
            ".start-menu__search-input"
        );
        const pinnedGrid = this.#element.querySelector(
            ".start-menu__pinned-grid"
        );
        const profile = this.#element.querySelector(
            ".start-menu__profile"
        );

        profile.addEventListener("click", () => {
            this.#openProfileEditor();
        });

        const renderApps = (searchTerm = "") => {
            appsContainer.innerHTML = "";

            const normalizedSearch = searchTerm
                .trim()
                .toLowerCase();

            const apps = this.#registry.getApps();

            const filteredApps = apps.filter((AppClass) => {
                const manifest = AppClass.manifest;

                return manifest.name
                    .toLowerCase()
                    .includes(normalizedSearch);
            });

            if (filteredApps.length === 0) {
                const empty = document.createElement("div");

                empty.className = "start-menu__empty";
                empty.textContent = "No apps found";

                appsContainer.append(empty);

                return;
            }

            for (const AppClass of filteredApps) {
                const manifest = AppClass.manifest;

                const button = document.createElement("button");

                button.type = "button";
                button.className = "start-menu__app";
                button.textContent = manifest.name;

                button.addEventListener("click", () => {
                    this.#eventBus.emit(
                        "app:launch",
                        manifest.id
                    );

                    this.close();
                });

                button.addEventListener("contextmenu", (event) => {
                    event.preventDefault();

                    const menu =
                        document.createElement("div");

                    menu.className =
                        "taskbar-context-menu";

                    menu.innerHTML = `
        <button type="button">
            Add to Desktop
        </button>
    `;

                    menu.style.position = "fixed";
                    menu.style.left = `${event.clientX}px`;
                    menu.style.top = `${event.clientY}px`;
                    menu.style.zIndex = "9999";

                    document.body.appendChild(menu);

                    const menuRect =
                        menu.getBoundingClientRect();

                    if (
                        menuRect.right >
                        window.innerWidth
                    ) {
                        menu.style.left =
                            `${window.innerWidth - menuRect.width - 8}px`;
                    }

                    if (
                        menuRect.bottom >
                        window.innerHeight
                    ) {
                        menu.style.top =
                            `${window.innerHeight - menuRect.height - 8}px`;
                    }

                    const addButton =
                        menu.querySelector("button");

                    addButton.addEventListener("click", () => {
                        this.#eventBus.emit(
                            "desktop:restore",
                            manifest.id
                        );

                        menu.remove();
                    });

                    const closeMenu = (event) => {
                        if (!menu.contains(event.target)) {
                            menu.remove();

                            document.removeEventListener(
                                "pointerdown",
                                closeMenu
                            );
                        }
                    };

                    requestAnimationFrame(() => {
                        document.addEventListener(
                            "pointerdown",
                            closeMenu
                        );
                    });
                });

                appsContainer.appendChild(button);
            }
        };

        renderApps();

        searchInput.addEventListener("input", () => {
            renderApps(searchInput.value);
        });
    }

    open() {
        this.#previousFocusedElement = document.activeElement;

        this.#isOpen = true;
        this.#element.style.display = "flex";
        this.#uiManager.register(this);

        const firstApp = this.#element.querySelector(
            ".start-menu__apps button"
        );

        firstApp?.focus();
    }

    close() {
        this.#isOpen = false;
        this.#element.style.display = "none";
        this.#uiManager.unregister(this);

        this.#previousFocusedElement?.focus();
        this.#previousFocusedElement = null;
    }

    toggle() {
        if (this.#isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    getElement() {
        return this.#element;
    }
}