import Dialog from "./Dialog.js";

export default class DialogService {
    #uiManager;
    #overlayLayer;

    constructor(uiManager, overlayLayer) {
        this.#uiManager = uiManager;
        this.#overlayLayer = overlayLayer;
    }

    alert({
        title = "Alert",
        message = "",
        confirmText = "OK"
    } = {}) {
        const dialog = new Dialog(
            this.#uiManager,
            {
                title,
                message,
                confirmText
            }
        );

        return dialog.open(this.#overlayLayer);
    }

    confirm({
        title = "Confirm",
        message = "",
        confirmText = "OK",
        cancelText = "Cancel",
        destructive = false
    } = {}) {
        const dialog = new Dialog(
            this.#uiManager,
            {
                title,
                message,
                confirmText,
                cancelText,
                destructive
            }
        );

        return dialog.open(this.#overlayLayer);
    }
}