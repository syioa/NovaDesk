export default class DesktopIcons {
    #eventBus;
    #registry;
    #element;
    #lastValidPosition;
    #settingsStore;

    #selectedIcons = new Set();
    #iconPositions = new Map();
    #manualIconPositions = new Map();

    #dragStartPositions = new Map();
    #previousZIndexes = new Map();
    #dragVisualPositions = new Map();
    #dragStartPositionsPixel = new Map();

    #positionStorageKey = "novadesk-icon-positions";

    #dragging = false;
    #wasDragging = false;

    #dragIcon = null;
    #dragIcons = [];

    #dragOffsetX = 0;
    #dragOffsetY = 0;

    #dragStartX = 0;
    #dragStartY = 0;

    #iconStartX = 0;
    #iconStartY = 0;

    #dragZIndex = 10;

    // Desktop settings
    #iconSize = 64;
    #gridColumns = 8;
    #iconSpacing = 16;

    #sortBy = "unsorted";
    #arrangement = "columns";
    #sortAlignment = "ltr";

    constructor(eventBus, registry, settingsStore) {
        this.#eventBus = eventBus;
        this.#registry = registry;
        this.#settingsStore = settingsStore;

        this.#element = document.createElement("div");
        this.#element.className = "desktop-icons";

        this.#loadDesktopSettings();

        this.#loadIconPositions();

        this.#render();

        this.#applyIconSize();

        this.#eventBus.on(
            "settings:changed",
            ({ path, value }) => {
                if (path === "desktop.iconSize") {
                    this.#iconSize = value;

                    this.#applyIconSize();

                    requestAnimationFrame(() => {
                        this.#reflowIcons();
                    });
                }

                if (path === "desktop.iconSpacing") {
                    this.#iconSpacing = value;

                    requestAnimationFrame(() => {
                        this.#reflowIcons();
                    });
                }

                if (path === "desktop.gridColumns") {
                    this.#gridColumns = value;

                    this.#reflowIcons();
                }

                if (
                    path === "desktop.sortBy" ||
                    path === "desktop.arrangement" ||
                    path === "desktop.sortAlignment"
                ) {
                    if (path === "desktop.sortBy") {
                        this.#sortBy = value;
                    }

                    if (path === "desktop.arrangement") {
                        this.#arrangement = value;
                    }

                    if (path === "desktop.sortAlignment") {
                        this.#sortAlignment = value;
                    }

                    requestAnimationFrame(() => {
                        this.#sortIcons();
                    });
                }
            }
        );

        this.#element.addEventListener("click", (event) => {
            if (event.target === this.#element) {
                this.clearSelection();
            }
        });

        document.addEventListener(
            "pointermove",
            (event) => {
                this.#moveDrag(event);
            }
        );

        document.addEventListener(
            "pointerup",
            () => {
                this.#endDrag();
            }
        );
    }

    get element() {
        return this.#element;
    }

    #render() {
        this.#element.replaceChildren();

        const apps = this.#registry.getApps();

        for (const AppClass of apps) {
            this.#element.append(
                this.#createIcon(AppClass)
            );
        }
    }

    #createIcon(AppClass) {
        const icon = document.createElement("div");
        icon.className = "desktop-icon";

        const manifest =
            AppClass.manifest;

        icon.dataset.appId =
            manifest.id;

        const image =
            document.createElement("div");

        image.className =
            "desktop-icon-image";

        image.textContent =
            manifest.icon;

        const label =
            document.createElement("div");

        label.className =
            "desktop-icon-label";

        label.textContent =
            manifest.name;

        icon.append(
            image,
            label
        );

        icon.addEventListener(
            "click",
            () => {
                if (this.#wasDragging) {
                    this.#wasDragging = false;
                    return;
                }

                this.#selectIcon(icon);
            }
        );

        icon.addEventListener(
            "pointerdown",
            (event) => {
                this.#startDrag(
                    icon,
                    event
                );
            }
        );

        icon.addEventListener(
            "dblclick",
            () => {
                this.#eventBus.emit(
                    "app:launch",
                    manifest.id
                );
            }
        );

        /*
         * Restore the saved position if this icon
         * already has one.
         */
        let grid =
            this.#iconPositions.get(
                icon.dataset.appId
            );

        /*
         * If this is a new icon with no saved position,
         * assign it the next available grid cell.
         */
        if (!grid) {

            const index =
                this.#iconPositions.size;

            const column =
                index % this.#gridColumns;

            const row =
                Math.floor(
                    index /
                    this.#gridColumns
                );

            grid =
                this.#findNearestFreeCell(
                    column,
                    row
                );

            /*
             * Save the newly assigned position.
             */
            this.#iconPositions.set(
                icon.dataset.appId,
                grid
            );
        }

        /*
         * Use the saved or newly assigned grid position.
         */
        const pixel =
            this.#gridToPixel(
                grid.column,
                grid.row
            );

        icon.style.left =
            `${pixel.x}px`;

        icon.style.top =
            `${pixel.y}px`;

        return icon;
    }

    #selectIcon(icon) {
        this.#selectedIcons.add(icon);
        icon.classList.add("selected");
    }

    #applyIconSize() {
        const iconSize =
            this.#settingsStore.get(
                "desktop.iconSize"
            ) ?? 36;

        this.#iconSize = iconSize;

        for (
            const icon
            of this.#element.querySelectorAll(
                ".desktop-icon-image"
            )
        ) {
            icon.style.width =
                `${iconSize}px`;

            icon.style.height =
                `${iconSize}px`;

            icon.style.fontSize =
                `${iconSize}px`;
        }
    }

    #sortIcons() {
        // Restore the manual arrangement first when
        // switching back to Unsorted.
        if (this.#sortBy === "unsorted") {
            if (this.#manualIconPositions.size > 0) {
                for (
                    const [id, position]
                    of this.#manualIconPositions
                ) {
                    this.#iconPositions.set(id, {
                        column: position.column,
                        row: position.row
                    });
                }
            }
        } else {
            // Save the manual arrangement only once.
            if (this.#manualIconPositions.size === 0) {
                this.#saveManualIconPositions();
            }
        }

        this.#reflowIcons(true);
    }

    #reflowIcons(forceArrange = false) {
        const icons = [
            ...this.#element.children
        ];

        if (forceArrange) {
            const icons = [
                ...this.#element.children
            ];

            // Sort alphabetically when requested.
            if (this.#sortBy === "name") {
                icons.sort((a, b) => {
                    const nameA =
                        a.querySelector(".desktop-icon-label")
                            ?.textContent.trim() ?? "";

                    const nameB =
                        b.querySelector(".desktop-icon-label")
                            ?.textContent.trim() ?? "";

                    return nameA.localeCompare(
                        nameB,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );
                });
            }

            for (
                let index = 0;
                index < icons.length;
                index++
            ) {
                const icon = icons[index];

                let column;
                let row;


                if (this.#arrangement === "rows") {
                    // One icon per row

                    column = 0;
                    row = index;

                } else {
                    // One icon per column
                    column = index;
                    row = 0;
                }

                if (this.#sortAlignment === "rtl") {
                    const bounds = this.#getGridBounds();
                    const maxColumn = bounds.maxColumn;

                    column = maxColumn - column;
                }

                // Right-to-left reverses the column
                // direction without changing the sort order.

                const pixel =
                    this.#gridToPixel(
                        column,
                        row
                    );

                this.#iconPositions.set(
                    icon.dataset.appId,
                    {
                        column,
                        row
                    }
                );

                icon.style.transition =
                    "left 0.15s ease, top 0.15s ease";

                icon.style.left =
                    `${pixel.x}px`;

                icon.style.top =
                    `${pixel.y}px`;
            }

            this.#saveIconPositions();

            return;
        }

        // Normal reflow:
        // preserve existing positions.
        const occupied = new Set();

        for (
            const icon
            of this.#element.children
        ) {
            const current =
                this.#iconPositions.get(
                    icon.dataset.appId
                );

            if (!current) {
                continue;
            }

            const key =
                `${current.column},${current.row}`;

            let grid = current;

            if (
                occupied.has(key) ||
                current.column >=
                this.#gridColumns
            ) {
                grid =
                    this.#findNearestFreeCell(
                        Math.min(
                            current.column,
                            this.#gridColumns - 1
                        ),
                        current.row
                    );
            }

            occupied.add(
                `${grid.column},${grid.row}`
            );

            this.#iconPositions.set(
                icon.dataset.appId,
                grid
            );

            const pixel =
                this.#gridToPixel(
                    grid.column,
                    grid.row
                );

            icon.style.transition =
                "left 0.15s ease, top 0.15s ease";

            icon.style.left =
                `${pixel.x}px`;

            icon.style.top =
                `${pixel.y}px`;
        }
    }

    #saveManualIconPositions() {
        this.#manualIconPositions.clear();

        for (const [id, position] of this.#iconPositions) {
            this.#manualIconPositions.set(id, {
                column: position.column,
                row: position.row
            });
        }
    }

    #loadDesktopSettings() {
        this.#iconSize =
            this.#settingsStore.get(
                "desktop.iconSize"
            ) ?? 64;

        this.#iconSpacing =
            this.#settingsStore.get(
                "desktop.iconSpacing"
            ) ?? 16;

        this.#gridColumns =
            this.#settingsStore.get(
                "desktop.gridColumns"
            ) ?? 8;

        this.#sortBy =
            this.#settingsStore.get(
                "desktop.sortBy"
            ) ?? "unsorted";

        this.#arrangement =
            this.#settingsStore.get(
                "desktop.arrangement"
            ) ?? "columns";

        this.#sortAlignment =
            this.#settingsStore.get(
                "desktop.sortAlignment"
            ) ?? "ltr";
    }

    #loadIconPositions() {
        try {
            const raw = localStorage.getItem(this.#positionStorageKey);

            if (!raw) {
                return;
            }

            const data = JSON.parse(raw);

            this.#iconPositions.clear();

            for (const [id, position] of Object.entries(data)) {
                if (
                    Number.isInteger(position.column) &&
                    Number.isInteger(position.row)
                ) {
                    this.#iconPositions.set(id, {
                        column: position.column,
                        row: position.row
                    });
                }
            }
        }
        catch (error) {
            console.warn("Failed to load desktop icon positions.", error);
        }
    }

    #saveIconPositions() {
        try {
            const data = {};

            for (const [id, position] of this.#iconPositions) {
                data[id] = {
                    column: position.column,
                    row: position.row
                };
            }

            localStorage.setItem(
                this.#positionStorageKey,
                JSON.stringify(data)
            );
        }
        catch (error) {
            console.warn("Failed to save desktop icon positions.", error);
        }
    }

    #findNearestFreeCell(
        preferredColumn,
        preferredRow
    ) {
        const isOccupied = (
            column,
            row
        ) => {
            return [
                ...this.#iconPositions.values()
            ].some(
                position =>
                    position.column === column &&
                    position.row === row
            );
        };

        /*
         * First, try the preferred cell.
         */
        if (
            preferredColumn >= 0 &&
            preferredColumn < this.#gridColumns &&
            preferredRow >= 0 &&
            !isOccupied(
                preferredColumn,
                preferredRow
            )
        ) {
            return {
                column: preferredColumn,
                row: preferredRow
            };
        }

        /*
         * Search outward from the preferred cell.
         */
        for (
            let distance = 1;
            distance < 100;
            distance++
        ) {
            for (
                let rowOffset = -distance;
                rowOffset <= distance;
                rowOffset++
            ) {
                for (
                    let columnOffset = -distance;
                    columnOffset <= distance;
                    columnOffset++
                ) {
                    /*
                     * Only check the outer edge
                     * of the current search ring.
                     */
                    if (
                        Math.abs(rowOffset) !== distance &&
                        Math.abs(columnOffset) !== distance
                    ) {
                        continue;
                    }

                    const column =
                        preferredColumn +
                        columnOffset;

                    const row =
                        preferredRow +
                        rowOffset;

                    if (
                        column < 0 ||
                        column >= this.#gridColumns ||
                        row < 0
                    ) {
                        continue;
                    }

                    if (
                        !isOccupied(
                            column,
                            row
                        )
                    ) {
                        return {
                            column,
                            row
                        };
                    }
                }
            }
        }

        /*
         * Fallback.
         */
        return {
            column: 0,
            row: 0
        };
    }

    clearSelection() {
        for (const icon of this.#selectedIcons) {
            icon.classList.remove("selected");
        }

        this.#selectedIcons.clear();
    }
    selectInRect(rect) {
        this.clearSelection();

        const icons = this.#element.querySelectorAll(
            ".desktop-icon"
        );

        for (const icon of icons) {
            const iconRect = icon.getBoundingClientRect();

            const intersects =
                rect.x < iconRect.right &&
                rect.x + rect.width > iconRect.left &&
                rect.y < iconRect.bottom &&
                rect.y + rect.height > iconRect.top;

            if (intersects) {
                this.#selectIcon(icon);
            }
        }
    }

    #startDrag(icon, event) {
        event.preventDefault();

        if (!this.#selectedIcons.has(icon)) {
            this.clearSelection();
            this.#selectIcon(icon);
        }

        this.#dragging = true;
        this.#wasDragging = true;
        this.#dragIcon = icon;

        this.#dragIcons = this.#selectedIcons.has(icon)
            ? [...this.#selectedIcons]
            : [icon];

        this.#dragStartPositions.clear();
        for (const icon of this.#dragIcons) {
            const position =
                this.#iconPositions.get(icon.dataset.appId)

            const pixel =
                this.#getIconPixelPosition(icon);


            this.#dragStartPositionsPixel.set(
                icon,
                {
                    x: pixel.x,
                    y: pixel.y
                }
            );

            this.#dragStartPositions.set(icon, {
                column: position.column,
                row: position.row
            });

            this.#dragVisualPositions.set(
                icon,
                {
                    x: pixel.x,
                    y: pixel.y
                }
            );
        }

        this.#dragZIndex++;

        this.#previousZIndexes.clear();

        for (const icon of this.#dragIcons) {
            this.#previousZIndexes.set(
                icon,
                icon.style.zIndex
            );

            icon.style.zIndex = this.#dragZIndex;
            icon.style.transition = "none";
        }

        this.#dragStartX = event.clientX;
        this.#dragStartY = event.clientY;

        const pixel =
            this.#getIconPixelPosition(icon);

        this.#dragOffsetX =
            event.clientX - pixel.x;

        this.#dragOffsetY =
            event.clientY - pixel.y;

        this.#lastValidPosition = {
            x: pixel.x,
            y: pixel.y
        };

        this.#iconStartX = pixel.x;
        this.#iconStartY = pixel.y;

        icon.setPointerCapture(
            event.pointerId
        );
    }

    #moveDrag(event) {
        if (!this.#dragging) {
            return;
        }

        const dx =
            event.clientX -
            this.#dragStartX;

        const dy =
            event.clientY -
            this.#dragStartY;

        const draggedStart =
            this.#dragStartPositionsPixel.get(
                this.#dragIcon
            );

        /*
         * Calculate the proposed position of every
         * dragged icon.
         */
        const proposedPositions = new Map();

        for (const icon of this.#dragIcons) {

            const start =
                this.#dragStartPositionsPixel.get(
                    icon
                );

            const offsetX =
                start.x -
                draggedStart.x;

            const offsetY =
                start.y -
                draggedStart.y;

            const x =
                this.#iconStartX +
                dx +
                offsetX;

            const y =
                this.#iconStartY +
                dy +
                offsetY;

            proposedPositions.set(
                icon,
                {
                    x,
                    y
                }
            );
        }

        /*
         * Find the desktop boundaries.
         */
        const desktopRect =
            this.#element.getBoundingClientRect();

        const desktopWidth =
            desktopRect.width;

        const taskbarHeight =
            document.querySelector(".taskbar")?.offsetHeight ?? 0;

        const desktopHeight =
            Math.min(
                desktopRect.height,
                window.innerHeight -
                desktopRect.top -
                taskbarHeight
            );

        /*
         * Find the bounding box of the entire
         * dragged group.
         */
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (
            const [icon, position]
            of proposedPositions
        ) {

            const width =
                icon.offsetWidth;

            const height =
                icon.offsetHeight;

            minX =
                Math.min(
                    minX,
                    position.x
                );

            minY =
                Math.min(
                    minY,
                    position.y
                );

            maxX =
                Math.max(
                    maxX,
                    position.x +
                    width
                );

            maxY =
                Math.max(
                    maxY,
                    position.y +
                    height
                );
        }

        /*
         * Calculate how far the entire group needs
         * to move to remain inside the desktop.
         */
        let correctionX = 0;
        let correctionY = 0;

        if (minX < 0) {
            correctionX =
                -minX;
        }

        if (maxX > desktopWidth) {
            correctionX =
                desktopWidth -
                maxX;
        }

        const viewportTop =
            -desktopRect.top;

        if (minY < viewportTop) {
            correctionY =
                viewportTop -
                minY;
        }

        if (maxY > desktopHeight) {
            correctionY =
                desktopHeight -
                maxY;
        }

        /*
         * Apply the corrected positions.
         */
        for (
            const [icon, position]
            of proposedPositions
        ) {

            const x =
                position.x +
                correctionX;

            const y =
                position.y +
                correctionY;

            icon.style.left =
                `${x}px`;

            icon.style.top =
                `${y}px`;
        }
    }

    #endDrag() {
        const center = this.#getGroupCenter();

        if (!this.#dragging) {
            return;
        }

        const positions = new Map();

        for (const icon of this.#dragIcons) {
            const x =
                parseInt(
                    icon.style.left
                );

            const y =
                parseInt(
                    icon.style.top
                );

            positions.set(icon, {
                x,
                y
            });
        }

        let collidedIcon = null;

        for (const icon of this.#dragIcons) {

            const position =
                positions.get(icon);

            const result =
                this.#checkCollision(
                    icon,
                    position.x,
                    position.y
                );

            if (result) {
                collidedIcon = result;
                break;
            }
        }

        if (collidedIcon) {
            const direction =
                this.#getApproachDirection(
                    collidedIcon
                );

            const resolved =
                this.#splitGroupAroundTarget(
                    collidedIcon,
                    direction
                );

            if (resolved) {
                this.#saveIconPositions();
            } else {
                /*
                 * Collision could not be resolved
                 * because the push chain reached
                 * the desktop boundary.
                 *
                 * Restore the dragged icons to
                 * their original positions.
                 */
                for (const icon of this.#dragIcons) {
                    const start =
                        this.#dragStartPositions.get(
                            icon
                        );

                    const pixel =
                        this.#gridToPixel(
                            start.column,
                            start.row
                        );

                    icon.style.left =
                        `${pixel.x}px`;

                    icon.style.top =
                        `${pixel.y}px`;
                }
            }
        } else {
            for (const icon of this.#dragIcons) {

                const x =
                    parseInt(
                        icon.style.left
                    );

                const y =
                    parseInt(
                        icon.style.top
                    );


                const snapped =
                    this.#snapPositionToGrid(
                        x,
                        y
                    );

                icon.style.transition =
                    "left 0.15s ease, top 0.15s ease";

                icon.style.left =
                    `${snapped.x}px`;

                icon.style.top =
                    `${snapped.y}px`;

                const grid =
                    this.#pixelToGrid(
                        snapped.x,
                        snapped.y
                    );

                // fix:
                this.#iconPositions.set(
                    icon.dataset.appId,
                    grid
                );
            }

            this.#saveIconPositions();
        }

        for (const icon of this.#dragIcons) {
            icon.style.zIndex =
                this.#previousZIndexes.get(icon) || "";
        }

        this.#previousZIndexes.clear();

        this.#dragging = false;
        this.#dragIcon = null;
        this.#dragIcons = [];
        this.#lastValidPosition = null;
        this.#dragStartPositions.clear();
        this.#dragVisualPositions.clear();
        this.#dragStartPositionsPixel.clear();
    }

    #checkCollision(draggedIcon, x, y) {

        const grid =
            this.#pixelToGrid(x, y);

        for (const icon of this.#element.children) {

            if (
                icon === draggedIcon ||
                this.#dragIcons.includes(icon)
            ) {
                continue;
            }

            const position =
                this.#iconPositions.get(icon.dataset.appId);

            if (!position) {
                continue;
            }

            const sameCell =
                grid.column === position.column &&
                grid.row === position.row;

            if (sameCell) {
                return icon;
            }
        }

        return null;
    }

    #getGroupBounds() {
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;

        for (const icon of this.#dragIcons) {
            const position =
                this.#getIconPixelPosition(icon);
            const rect = icon.getBoundingClientRect();

            left = Math.min(left, position.x);
            top = Math.min(top, position.y);

            right = Math.max(
                right,
                position.x + rect.width
            );

            bottom = Math.max(
                bottom,
                position.y + rect.height
            );
        }

        return {
            left,
            top,
            right,
            bottom,
            width: right - left,
            height: bottom - top
        };
    }

    #getGroupCenter() {
        let totalX = 0;
        let totalY = 0;

        for (const icon of this.#dragIcons) {
            const x =
                parseFloat(icon.style.left) || 0;

            const y =
                parseFloat(icon.style.top) || 0;

            const width =
                icon.offsetWidth;

            const height =
                icon.offsetHeight;

            totalX +=
                x +
                width / 2;

            totalY +=
                y +
                height / 2;
        }

        return {
            x:
                totalX /
                this.#dragIcons.length,

            y:
                totalY /
                this.#dragIcons.length
        };
    }

    #getApproachDirection(targetIcon) {
        const groupCenter =
            this.#getGroupCenter();

        const targetPosition =
            this.#iconPositions.get(
                targetIcon.dataset.appId
            );

        if (!targetPosition) {
            console.warn(
                "Missing icon position:",
                targetIcon.dataset.appId
            );

            return "right";
        }

        const targetPixel =
            this.#gridToPixel(
                targetPosition.column,
                targetPosition.row
            );

        const targetCenter = {
            x:
                targetPixel.x +
                targetIcon.offsetWidth / 2,

            y:
                targetPixel.y +
                targetIcon.offsetHeight / 2
        };

        const dx =
            groupCenter.x -
            targetCenter.x;

        const dy =
            groupCenter.y -
            targetCenter.y;

        if (
            Math.abs(dx) >
            Math.abs(dy)
        ) {
            return dx < 0
                ? "left"
                : "right";
        }

        return dy < 0
            ? "top"
            : "bottom";
    }

    #moveGroupByOffset(offsetX, offsetY) {
        const gridDelta =
            this.#pixelToGrid(
                offsetX,
                offsetY
            );

        for (const icon of this.#dragIcons) {

            const start =
                this.#iconPositions.get(icon.dataset.appId)


            const column =
                start.column +
                gridDelta.column;

            const row =
                start.row +
                gridDelta.row;


            const pixel =
                this.#gridToPixel(
                    column,
                    row
                );


            icon.style.left =
                `${pixel.x}px`;

            icon.style.top =
                `${pixel.y}px`;


            this.#iconPositions.set(
                icon.dataset.appId,
                {
                    column,
                    row
                }
            );
        }
    }

    #getPlacementOffset(targetIcon, direction) {
        const targetPosition =
            this.#iconPositions.get(
                targetIcon.dataset.appId
            );

        const targetRect =
            targetIcon.getBoundingClientRect();

        const gap = 16;

        switch (direction) {
            case "left":
                return {
                    x:
                        targetPosition.x -
                        this.#getGroupBounds().right -
                        gap,
                    y: 0
                };

            case "right":
                return {
                    x:
                        targetPosition.x +
                        targetRect.width -
                        this.#getGroupBounds().left +
                        gap,
                    y: 0
                };

            case "top":
                return {
                    x: 0,
                    y:
                        targetPosition.y -
                        this.#getGroupBounds().bottom -
                        gap
                };

            case "bottom":
                return {
                    x: 0,
                    y:
                        targetPosition.y +
                        targetRect.height -
                        this.#getGroupBounds().top +
                        gap
                };
        }
    }

    #getIconSideRelativeToTarget(icon, targetIcon) {
        const iconPos =
            this.#dragStartPositions.get(icon);

        const targetPos =
            this.#iconPositions.get(targetIcon);

        const iconRect =
            icon.getBoundingClientRect();

        const targetRect =
            targetIcon.getBoundingClientRect();


        const iconCenter = {
            x: iconPos.x + iconRect.width / 2,
            y: iconPos.y + iconRect.height / 2
        };

        const targetCenter = {
            x: targetPos.x + targetRect.width / 2,
            y: targetPos.y + targetRect.height / 2
        };


        const dx =
            iconCenter.x - targetCenter.x;

        const dy =
            iconCenter.y - targetCenter.y;


        if (Math.abs(dx) > Math.abs(dy)) {
            return dx < 0
                ? "left"
                : "right";
        }

        return dy < 0
            ? "top"
            : "bottom";
    }

    #splitGroupAroundTarget(targetIcon, direction) {
        const targetGrid =
            this.#iconPositions.get(
                targetIcon.dataset.appId
            );

        if (!targetGrid) {
            return false;
        }

        const {
            maxColumn,
            maxRow
        } = this.#getGridBounds();

        const horizontal =
            direction === "left" ||
            direction === "right";

        /*
         * All icons that are not being dragged.
         */
        const stationaryIcons =
            [...this.#element.children].filter(
                icon =>
                    !this.#dragIcons.includes(icon)
            );

        /*
         * Current occupancy map.
         *
         * key = "column,row"
         * value = icon
         */
        const occupancy =
            new Map();

        for (const icon of stationaryIcons) {
            const position =
                this.#iconPositions.get(
                    icon.dataset.appId
                );

            if (!position) {
                continue;
            }

            occupancy.set(
                `${position.column},${position.row}`,
                icon
            );
        }

        /*
         * The target is stationary and therefore
         * already exists in occupancy.
         */
        const targetColumn =
            targetGrid.column;

        const targetRow =
            targetGrid.row;

        /*
         * Determine the order of the dragged icons
         * based on their ORIGINAL positions.
         *
         * This is important because #iconPositions
         * may be changed later during resolution.
         */
        const orderedDragged =
            [...this.#dragIcons].sort(
                (a, b) => {
                    const aStart =
                        this.#dragStartPositions.get(
                            a
                        );

                    const bStart =
                        this.#dragStartPositions.get(
                            b
                        );

                    if (horizontal) {
                        return (
                            aStart.column -
                            bStart.column
                        );
                    }

                    return (
                        aStart.row -
                        bStart.row
                    );
                }
            );

        /*
         * Reverse order when approaching from the
         * opposite direction.
         */
        if (
            direction === "right" ||
            direction === "bottom"
        ) {
            orderedDragged.reverse();
        }

        /*
         * The desired cells for the dragged icons.
         *
         * Example with 2 dragged icons:
         *
         * LEFT:
         *
         *     A B C
         *
         * RIGHT:
         *
         *     C A B
         *
         * The target itself remains stationary.
         */
        const desiredPositions =
            new Map();

        const middleIndex =
            Math.floor(
                orderedDragged.length / 2
            );

        for (
            let i = 0;
            i < orderedDragged.length;
            i++
        ) {
            const icon =
                orderedDragged[i];

            let column =
                targetColumn;

            let row =
                targetRow;

            if (horizontal) {
                if (i < middleIndex) {
                    column =
                        targetColumn -
                        (
                            middleIndex -
                            i
                        );
                } else {
                    column =
                        targetColumn +
                        (
                            i -
                            middleIndex
                        ) +
                        1;
                }
            } else {
                if (i < middleIndex) {
                    row =
                        targetRow -
                        (
                            middleIndex -
                            i
                        );
                } else {
                    row =
                        targetRow +
                        (
                            i -
                            middleIndex
                        ) +
                        1;
                }
            }

            desiredPositions.set(
                icon,
                {
                    column,
                    row
                }
            );
        }

        /*
         * Check whether a cell is inside the
         * valid desktop grid.
         */
        const isValidCell = (
            column,
            row
        ) => {
            if (
                column < 0 ||
                column > maxColumn ||
                row < 0 ||
                row > maxRow
            ) {
                return false;
            }

            const taskbar =
                document.querySelector(".taskbar");

            const taskbarTop =
                taskbar?.getBoundingClientRect().top ??
                window.innerHeight;

            const desktopTop =
                this.#element.getBoundingClientRect().top;

            const pixel =
                this.#gridToPixel(
                    column,
                    row
                );

            const iconBottom =
                desktopTop +
                pixel.y +
                this.#iconSize;

            return iconBottom <= taskbarTop;
        };

        /*
         * We will construct the final state here.
         *
         * This is separate from #iconPositions so
         * the operation is atomic.
         */
        const finalPositions =
            new Map();

        /*
         * Copy all stationary positions first.
         */
        for (const icon of stationaryIcons) {
            const position =
                this.#iconPositions.get(
                    icon.dataset.appId
                );

            if (!position) {
                continue;
            }

            finalPositions.set(
                icon,
                {
                    column:
                        position.column,

                    row:
                        position.row
                }
            );
        }

        /*
         * Find the icon occupying a cell in the
         * temporary final state.
         */
        const getOccupant = (
            column,
            row,
            ignoreIcon = null
        ) => {
            for (
                const [
                    icon,
                    position
                ]
                of finalPositions
            ) {
                if (
                    icon === ignoreIcon
                ) {
                    continue;
                }

                if (
                    position.column === column &&
                    position.row === row
                ) {
                    return icon;
                }
            }

            return null;
        };

        /*
         * Recursively push an icon.
         *
         * The pushed icon moves in the SAME direction
         * as the collision.
         *
         * If anything in the chain cannot move,
         * the whole push fails.
         */
        const pushIcon = (
            icon,
            visited = new Set()
        ) => {
            if (visited.has(icon)) {
                return false;
            }

            visited.add(icon);

            const position =
                finalPositions.get(icon);

            if (!position) {
                return false;
            }

            let nextColumn =
                position.column;

            let nextRow =
                position.row;

            if (horizontal) {
                nextColumn +=
                    direction === "left"
                        ? -1
                        : 1;
            } else {
                nextRow +=
                    direction === "top"
                        ? -1
                        : 1;
            }

            /*
             * The chain reached the desktop edge.
             *
             * We cannot push this icon.
             */
            if (
                !isValidCell(
                    nextColumn,
                    nextRow
                )
            ) {
                return false;
            }

            const blocking =
                getOccupant(
                    nextColumn,
                    nextRow,
                    icon
                );

            /*
             * Push the blocking icon first.
             */
            if (blocking) {
                const pushed =
                    pushIcon(
                        blocking,
                        visited
                    );

                if (!pushed) {
                    return false;
                }
            }

            /*
             * After the recursive push,
             * the destination must now be free.
             */
            const stillBlocking =
                getOccupant(
                    nextColumn,
                    nextRow,
                    icon
                );

            if (stillBlocking) {
                return false;
            }

            /*
             * Move the icon.
             */
            finalPositions.set(
                icon,
                {
                    column:
                        nextColumn,

                    row:
                        nextRow
                }
            );

            return true;
        };

        /*
         * First resolve all dragged destinations.
         *
         * We do this one icon at a time.
         */
        for (
            const [
                draggedIcon,
                desired
            ]
            of desiredPositions
        ) {
            /*
             * The dragged icon itself is not in
             * finalPositions yet, so only stationary
             * icons can occupy this destination.
             */
            const blocking =
                getOccupant(
                    desired.column,
                    desired.row
                );

            if (blocking) {

                /*
                 * Push the stationary chain.
                 */
                const pushed =
                    pushIcon(
                        blocking
                    );

                if (!pushed) {
                    /*
                     * Collision cannot be resolved.
                     *
                     * Do not partially apply anything.
                     */
                    return false;
                }
            }

            /*
             * Verify the destination is now free.
             */
            const stillBlocking =
                getOccupant(
                    desired.column,
                    desired.row
                );

            if (stillBlocking) {
                return false;
            }

            /*
             * Place the dragged icon in the
             * resolved destination.
             */
            finalPositions.set(
                draggedIcon,
                {
                    column:
                        desired.column,

                    row:
                        desired.row
                }
            );
        }

        /*
         * Final safety check:
         *
         * No two icons may occupy the same cell.
         */
        const usedCells =
            new Set();

        for (
            const [
                icon,
                position
            ]
            of finalPositions
        ) {
            const key =
                `${position.column},${position.row}`;

            if (usedCells.has(key)) {
                return false;
            }

            usedCells.add(key);
        }

        /*
         * Final safety check:
         *
         * No icon may exist outside the desktop.
         */
        for (
            const position
            of finalPositions.values()
        ) {
            if (
                !isValidCell(
                    position.column,
                    position.row
                )
            ) {
                return false;
            }
        }

        /*
         * Everything is valid.
         *
         * Now apply the complete final state.
         */
        for (
            const [
                icon,
                grid
            ]
            of finalPositions
        ) {
            const pixel =
                this.#gridToPixel(
                    grid.column,
                    grid.row
                );

            icon.style.transition =
                "left 0.1s ease, top 0.1s ease";

            icon.style.left =
                `${pixel.x}px`;

            icon.style.top =
                `${pixel.y}px`;

            this.#iconPositions.set(
                icon.dataset.appId,
                {
                    column:
                        grid.column,

                    row:
                        grid.row
                }
            );
        }

        return true;
    }

    #getGridBounds() {
        const cellSize =
            this.#getGridCellSize();

        const desktopWidth =
            this.#element.clientWidth;

        const taskbarHeight =
            document.querySelector(".taskbar")?.offsetHeight ?? 0;

        const desktopRect =
            this.#element.getBoundingClientRect();

        const desktopHeight =
            Math.min(
                desktopRect.height,
                window.innerHeight -
                desktopRect.top -
                taskbarHeight
            );

        const maxColumn =
            Math.max(
                0,
                Math.floor(
                    (
                        desktopWidth -
                        this.#iconSize
                    ) /
                    cellSize
                )
            );

        const maxRow =
            Math.max(
                0,
                Math.floor(
                    (
                        desktopHeight -
                        this.#iconSize
                    ) /
                    cellSize
                )
            );

        return {
            maxColumn,
            maxRow
        };
    }

    #snapToGrid(value) {
        const grid = 16;

        return Math.round(value / grid) * grid;
    }
    #gridToPixel(column, row) {
        const cellSize =
            this.#getGridCellSize();

        return {
            x: column * cellSize,
            y: row * cellSize
        };
    }

    #pixelToGrid(x, y) {
        const cellSize =
            this.#getGridCellSize();

        return {
            column: Math.round(
                x / cellSize
            ),
            row: Math.round(
                y / cellSize
            )
        };
    }

    #snapPositionToGrid(x, y) {
        const grid =
            this.#pixelToGrid(
                x,
                y
            );

        return this.#gridToPixel(
            grid.column,
            grid.row
        );
    }

    #getIconPixelPosition(icon) {
        const grid =
            this.#iconPositions.get(icon.dataset.appId)

        if (!grid) {
            return {
                x: 0,
                y: 0
            };
        }

        return this.#gridToPixel(
            grid.column,
            grid.row
        );
    }

    #isSameGridCell(a, b) {
        return (
            a.column === b.column &&
            a.row === b.row
        );
    }

    #getGridCellSize() {
        return (
            88 +
            this.#iconSpacing
        );
    }

    #arrangeIcons(icons) {
        return icons;
    }
}