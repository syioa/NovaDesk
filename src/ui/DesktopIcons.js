export default class DesktopIcons {
    #eventBus;
    #registry;
    #element;
    #lastValidPosition;

    #selectedIcons = new Set();
    #iconPositions = new Map();
    #dragStartPositions = new Map();
    #previousZIndexes = new Map();
    #dragVisualPositions = new Map();
    #dragStartPositionsPixel = new Map();

    #gridSize = 96;
    #gridGap = 16;

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

    constructor(eventBus, registry) {
        this.#eventBus = eventBus;
        this.#registry = registry;

        this.#element = document.createElement("div");
        this.#element.className = "desktop-icons";

        this.#render();

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

        const manifest = AppClass.manifest;

        const image = document.createElement("div");
        image.className = "desktop-icon-image";
        image.textContent = manifest.icon;

        const label = document.createElement("div");
        label.className = "desktop-icon-label";
        label.textContent = manifest.name;

        icon.append(image, label);

        icon.addEventListener("click", () => {
            if (this.#wasDragging) {
                this.#wasDragging = false;
                return;
            }

            this.#selectIcon(icon);
        });

        icon.addEventListener(
            "pointerdown",
            (event) => {
                this.#startDrag(icon, event);
            }
        );

        icon.addEventListener("dblclick", () => {
            this.#eventBus.emit(
                "app:launch",
                manifest.id
            );
        });


        const index = this.#iconPositions.size;

        const column = index % 6;
        const row = Math.floor(index / 6);

        const grid = {
            column,
            row
        };

        const pixel =
            this.#gridToPixel(
                column,
                row
            );

        this.#iconPositions.set(
            icon,
            grid
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

        console.log("selected:", icon);
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
                this.#iconPositions.get(icon);

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

        const position =
            this.#getIconPixelPosition(icon);

        this.#lastValidPosition = {
            x: position.x,
            y: position.y
        };

        this.#iconStartX = position.x;
        this.#iconStartY = position.y;

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

            icon.style.left =
                `${x}px`;

            icon.style.top =
                `${y}px`;
        }
    }

    #endDrag() {
        const center = this.#getGroupCenter();

        console.log("Group center:", center);

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

            console.log(
                "drop direction:",
                direction
            );

            this.#splitGroupAroundTarget(
                collidedIcon,
                direction
            );
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

                this.#iconPositions.set(
                    icon,
                    grid
                );
            }
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
            this.#pixelToGrid(
                x,
                y
            );


        for (const [icon, position] of this.#iconPositions) {

            if (
                icon === draggedIcon ||
                this.#dragIcons.includes(icon)
            ) {
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
            const position =
                this.#getIconPixelPosition(icon);
            const rect = icon.getBoundingClientRect();

            totalX += position.x + rect.width / 2;
            totalY += position.y + rect.height / 2;
        }

        return {
            x: totalX / this.#dragIcons.length,
            y: totalY / this.#dragIcons.length
        };
    }

    #getApproachDirection(targetIcon) {
        const groupCenter =
            this.#getGroupCenter();

        const targetPosition =
            this.#iconPositions.get(targetIcon);

        const targetPixel =
            this.#gridToPixel(
                targetPosition.column,
                targetPosition.row
            );

        const targetRect =
            targetIcon.getBoundingClientRect();

        const targetCenter = {
            x:
                targetPixel.x +
                targetRect.width / 2,

            y:
                targetPixel.y +
                targetRect.height / 2
        };

        const dx =
            groupCenter.x -
            targetCenter.x;

        const dy =
            groupCenter.y -
            targetCenter.y;

        if (Math.abs(dx) > Math.abs(dy)) {
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
                this.#iconPositions.get(icon);


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
                icon,
                {
                    column,
                    row
                }
            );
        }
    }

    #getPlacementOffset(targetIcon, direction) {
        const targetPosition =
            this.#iconPositions.get(targetIcon);

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
            this.#iconPositions.get(targetIcon);

        if (!targetGrid) {
            return;
        }

        const horizontal =
            direction === "left" ||
            direction === "right";

        const dragged =
            [...this.#dragIcons];

        const stationaryIcons =
            [...this.#element.children].filter(
                icon => !this.#dragIcons.includes(icon)
            );

        /*
         * Sort the dragged icons according to their
         * original grid order so multi-selection order
         * is preserved.
         */
        dragged.sort((a, b) => {
            const aStart =
                this.#dragStartPositions.get(a);

            const bStart =
                this.#dragStartPositions.get(b);

            return horizontal
                ? aStart.column - bStart.column
                : aStart.row - bStart.row;
        });

        /*
         * Determine the grid cells the dragged group
         * should occupy relative to the target.
         */
        const targetColumn =
            targetGrid.column;

        const targetRow =
            targetGrid.row;

        const newPositions = new Map();

        let minColumn = Infinity;
        let maxColumn = -Infinity;
        let minRow = Infinity;
        let maxRow = -Infinity;

        for (const icon of dragged) {

            const position =
                this.#dragStartPositions.get(icon);

            minColumn =
                Math.min(
                    minColumn,
                    position.column
                );

            maxColumn =
                Math.max(
                    maxColumn,
                    position.column
                );

            minRow =
                Math.min(
                    minRow,
                    position.row
                );

            maxRow =
                Math.max(
                    maxRow,
                    position.row
                );
        }

        /*
         * Calculate the group's size in grid cells.
         */
        const groupWidth =
            maxColumn - minColumn;

        const groupHeight =
            maxRow - minRow;


        /*
         * Place the dragged group around the target.
         *
         * The target is inserted into the middle of
         * the dragged group's sequence.
         */
        if (horizontal) {

            const orderedDragged =
                [...dragged].sort((a, b) => {

                    const aStart =
                        this.#dragStartPositions.get(a);

                    const bStart =
                        this.#dragStartPositions.get(b);

                    return (
                        aStart.column -
                        bStart.column
                    );
                });

            /*
             * When approaching from the right,
             * reverse the group order.
             */
            if (direction === "right") {
                orderedDragged.reverse();
            }

            /*
             * For two icons:
             *
             * left approach:
             *   A C B
             *
             * right approach:
             *   B C A
             */
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

                let column;

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

                newPositions.set(
                    icon,
                    {
                        column,
                        row: targetRow
                    }
                );
            }

        } else {

            /*
             * Get every stationary icon in the target's
             * column.
             */
            const columnIcons =
                stationaryIcons
                    .filter(icon => {

                        const position =
                            this.#iconPositions.get(icon);

                        return (
                            position &&
                            position.column ===
                            targetColumn
                        );
                    })
                    .sort((a, b) => {

                        const aPosition =
                            this.#iconPositions.get(a);

                        const bPosition =
                            this.#iconPositions.get(b);

                        return (
                            aPosition.row -
                            bPosition.row
                        );
                    });

            /*
             * Remove dragged icons from the sequence.
             * They will be inserted at the target position.
             */
            const sequence =
                columnIcons.filter(
                    icon =>
                        !this.#dragIcons.includes(icon)
                );

            /*
             * Find the target's position in the sequence.
             */
            let targetIndex =
                sequence.indexOf(targetIcon);

            if (targetIndex === -1) {
                targetIndex = 0;
            }

            /*
             * If the group approaches from the bottom,
             * insert after the target instead.
             */
            if (direction === "bottom") {
                targetIndex += 1;
            }

            /*
             * Insert the dragged icons into the sequence.
             */
            sequence.splice(
                targetIndex,
                0,
                ...dragged
            );

            /*
             * Rebuild the entire affected column.
             *
             * Every icon receives exactly one unique
             * grid cell.
             */
            for (
                let i = 0;
                i < sequence.length;
                i++
            ) {

                const icon =
                    sequence[i];

                const oldPosition =
                    this.#iconPositions.get(icon);

                if (!oldPosition) {
                    continue;
                }

                const grid = {
                    column:
                        targetColumn,

                    row:
                        oldPosition.row
                };

                /*
                 * Use the first available row from the
                 * target's original position.
                 */
                const baseRow =
                    this.#iconPositions.get(
                        targetIcon
                    ).row;

                grid.row =
                    baseRow +
                    (
                        i -
                        targetIndex
                    );

                newPositions.set(
                    icon,
                    grid
                );
            }
        }

        /*
         * Find stationary icons occupying cells that
         * the dragged group wants to use.
         */
        const occupiedCells =
            new Set();

        for (const icon of stationaryIcons) {

            const position =
                this.#iconPositions.get(icon);

            if (!position) {
                continue;
            }

            occupiedCells.add(
                `${position.column},${position.row}`
            );
        }

        /*
 * Shift stationary icons as a chain.
 *
 * If one icon is pushed into another icon's cell,
 * the second icon is pushed as well.
 */
        const occupiedByStationary =
            new Map();

        for (const icon of stationaryIcons) {

            const position =
                this.#iconPositions.get(icon);

            if (!position) {
                continue;
            }

            occupiedByStationary.set(
                `${position.column},${position.row}`,
                icon
            );
        }

        /*
         * Process collisions repeatedly until every
         * icon has a unique grid cell.
         */
        let changed = true;

        while (changed) {

            changed = false;

            for (
                const [icon, position]
                of newPositions
            ) {

                if (
                    !stationaryIcons.includes(icon)
                ) {
                    continue;
                }

                const key =
                    `${position.column},${position.row}`;

                const draggedOccupies =
                    [...this.#dragIcons]
                        .some(
                            draggedIcon => {

                                const draggedPosition =
                                    newPositions.get(
                                        draggedIcon
                                    );

                                return (
                                    draggedPosition &&
                                    draggedPosition.column ===
                                    position.column &&
                                    draggedPosition.row ===
                                    position.row
                                );
                            }
                        );

                if (!draggedOccupies) {
                    continue;
                }

                let nextColumn =
                    position.column;

                let nextRow =
                    position.row;

                do {

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

                    const nextKey =
                        `${nextColumn},${nextRow}`;

                    const occupiedByDragged =
                        [...newPositions.values()]
                            .some(
                                otherPosition =>
                                    otherPosition.column ===
                                    nextColumn &&
                                    otherPosition.row ===
                                    nextRow
                            );

                    const occupiedByOtherStationary =
                        [...newPositions.entries()]
                            .some(
                                ([otherIcon, otherPosition]) =>
                                    otherIcon !== icon &&
                                    otherPosition.column ===
                                    nextColumn &&
                                    otherPosition.row ===
                                    nextRow
                            );

                    if (
                        !occupiedByDragged &&
                        !occupiedByOtherStationary
                    ) {
                        break;
                    }

                } while (true);

                newPositions.set(
                    icon,
                    {
                        column:
                            nextColumn,

                        row:
                            nextRow
                    }
                );

                changed = true;
            }
        }


        /*
         * Apply all new grid positions.
         */
        for (const [icon, grid] of newPositions) {

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

            this.#iconPositions.set(
                icon,
                grid
            );
        }
    }

    #snapToGrid(value) {
        const grid = 16;

        return Math.round(value / grid) * grid;
    }
    #gridToPixel(column, row) {
        return {
            x: column * this.#gridSize,
            y: row * this.#gridSize
        };
    }
    #pixelToGrid(x, y) {
        return {
            column: Math.round(
                x / this.#gridSize
            ),
            row: Math.round(
                y / this.#gridSize
            )
        };
    }
    #snapPositionToGrid(x, y) {
        const grid =
            this.#pixelToGrid(x, y);

        return this.#gridToPixel(
            grid.column,
            grid.row
        );
    }

    #getIconPixelPosition(icon) {
        const grid =
            this.#iconPositions.get(icon);

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
}
