export default class Dialog {
    #element;
    #backdrop;
    #titleElement;
    #messageElement;
    #actionsElement;

    #uiManager;
    #resolve;
    #previouslyFocusedElement;

    #closed = false;

    constructor(
        uiManager,
        {
            title = "",
            message = "",
            confirmText = "OK",
            cancelText = null,
            destructive = false
        } = {}
    ) {
        this.#uiManager = uiManager;
        this.#previouslyFocusedElement = document.activeElement;

        // ========================================
        // Backdrop
        // ========================================

        this.#backdrop = document.createElement("div");
        this.#backdrop.className = "dialog-backdrop";

        // ========================================
        // Dialog
        // ========================================

        this.#element = document.createElement("div");
        this.#element.className = "dialog";

        this.#element.setAttribute(
            "role",
            "dialog"
        );

        this.#element.setAttribute(
            "aria-modal",
            "true"
        );

        // ========================================
        // Header
        // ========================================

        const header = document.createElement("div");
        header.className = "dialog__header";

        this.#titleElement =
            document.createElement("h2");

        this.#titleElement.className =
            "dialog__title";

        this.#titleElement.textContent = title;

        header.append(
            this.#titleElement
        );

        // ========================================
        // Content
        // ========================================

        const content = document.createElement("div");
        content.className = "dialog__content";

        this.#messageElement =
            document.createElement("p");

        this.#messageElement.className =
            "dialog__message";

        this.#messageElement.textContent =
            message;

        content.append(
            this.#messageElement
        );

        // ========================================
        // Actions
        // ========================================

        this.#actionsElement =
            document.createElement("div");

        this.#actionsElement.className =
            "dialog__actions";

        // Cancel button
        if (cancelText) {
            const cancelButton =
                this.#createButton(
                    cancelText,
                    "dialog__button dialog__button--secondary"
                );

            cancelButton.addEventListener(
                "click",
                () => {
                    this.close(false);
                }
            );

            this.#actionsElement.append(
                cancelButton
            );
        }

        // Confirm button
        const confirmButton =
            this.#createButton(
                confirmText,
                destructive
                    ? "dialog__button dialog__button--danger"
                    : "dialog__button dialog__button--primary"
            );

        confirmButton.addEventListener(
            "click",
            () => {
                this.close(true);
            }
        );

        this.#actionsElement.append(
            confirmButton
        );

        // ========================================
        // Assemble
        // ========================================

        this.#element.append(
            header,
            content,
            this.#actionsElement
        );

        this.#backdrop.append(
            this.#element
        );

        // ========================================
        // Backdrop click
        // ========================================

        this.#backdrop.addEventListener(
            "pointerdown",
            (event) => {
                if (
                    event.target === this.#backdrop &&
                    cancelText
                ) {
                    this.close(false);
                }
            }
        );
    }

    #createButton(
        text,
        className
    ) {
        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            className;

        button.textContent =
            text;

        return button;
    }

    open(parentElement) {
        return new Promise((resolve) => {
            this.#resolve = resolve;
            this.#closed = false;

            parentElement.append(
                this.#backdrop
            );

            // Register with UIManager
            this.#uiManager.register(
                this
            );

            requestAnimationFrame(() => {
                this.#backdrop.classList.add(
                    "dialog-backdrop--visible"
                );

                this.#element.classList.add(
                    "dialog--visible"
                );
            });

            // Focus first action
            const firstButton =
                this.#actionsElement
                    .querySelector("button");

            firstButton?.focus();
        });
    }

    close(result = false) {
        if (this.#closed) {
            return;
        }

        this.#closed = true;

        // Unregister from UIManager
        this.#uiManager.unregister(
            this
        );

        this.#backdrop.classList.remove(
            "dialog-backdrop--visible"
        );

        this.#element.classList.remove(
            "dialog--visible"
        );

        const cleanup = () => {
            this.#backdrop.remove();

            this.#previouslyFocusedElement
                ?.focus();

            this.#resolve?.(
                result
            );

            this.#resolve = null;
        };

        this.#backdrop.addEventListener(
            "transitionend",
            cleanup,
            { once: true }
        );
    }
}