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

        const x = 32 + column * 96;
        const y = 32 + row * 96;

        const grid =
            this.#pixelToGrid(
                x,
                y
            );

        this.#iconPositions.set(
            icon,
            grid
        );

        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;

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

            this.#dragStartPositions.set(icon, {
                column: position.column,
                row: position.row
            });

            const pixel =
                this.#getIconPixelPosition(icon);

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


        for (const icon of this.#dragIcons) {

            const start =
                this.#dragStartPositions.get(icon);


            const pixel =
                this.#gridToPixel(
                    start.column,
                    start.row
                );


            const x =
                pixel.x + dx;

            const y =
                pixel.y + dy;


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
            const position = positions.get(icon);

            const result = this.#checkCollision(
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
    }

    #checkCollision(draggedIcon, x, y) {
        const size = draggedIcon.getBoundingClientRect();

        const draggedRect = {
            left: x,
            top: y,
            right: x + size.width,
            bottom: y + size.height
        };


        for (const icon of this.#iconPositions.keys()) {

            if (
                icon === draggedIcon ||
                this.#dragIcons.includes(icon)
            ) {
                continue;
            }

            const position =
                this.#getIconPixelPosition(icon);


            const iconRect = {
                left: position.x,
                top: position.y,
                right: position.x + size.width,
                bottom: position.y + size.height
            };


            const collision =
                draggedRect.left < iconRect.right &&
                draggedRect.right > iconRect.left &&
                draggedRect.top < iconRect.bottom &&
                draggedRect.bottom > iconRect.top;


            if (collision) {
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
        const groupCenter = this.#getGroupCenter();

        const targetPosition =
            this.#iconPositions.get(targetIcon);

        const targetRect =
            targetIcon.getBoundingClientRect();

        const targetCenter = {
            x: targetPosition.x + targetRect.width / 2,
            y: targetPosition.y + targetRect.height / 2
        };

        const dx = groupCenter.x - targetCenter.x;
        const dy = groupCenter.y - targetCenter.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx < 0 ? "left" : "right";
        }

        return dy < 0 ? "top" : "bottom";
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
        const targetPosition =
            this.#iconPositions.get(targetIcon);

        const targetRect =
            targetIcon.getBoundingClientRect();

        const gap = 16;

        const allIcons = [
            ...this.#element.children
        ];

        const stationaryIcons =
            allIcons.filter(
                icon => !this.#dragIcons.includes(icon)
            );


        const affectedIcons = [];

        for (const icon of stationaryIcons) {
            const position =
                this.#iconPositions.get(icon);

            if (!position) {
                continue;
            }

            if (
                direction === "left" ||
                direction === "right"
            ) {
                if (
                    Math.abs(
                        position.y -
                        targetPosition.y
                    ) < 5
                ) {
                    affectedIcons.push(icon);
                }
            }

            else {
                if (
                    Math.abs(
                        position.x -
                        targetPosition.x
                    ) < 5
                ) {
                    affectedIcons.push(icon);
                }
            }
        }


        const horizontal =
            direction === "left" ||
            direction === "right";


        affectedIcons.sort((a, b) => {
            const aPos =
                this.#iconPositions.get(a);

            const bPos =
                this.#iconPositions.get(b);

            return horizontal
                ? aPos.x - bPos.x
                : aPos.y - bPos.y;
        });


        const dragged =
            [...this.#dragIcons];


        dragged.sort((a, b) => {
            const aStart =
                this.#dragStartPositions.get(a);

            const bStart =
                this.#dragStartPositions.get(b);

            return horizontal
                ? aStart.x - bStart.x
                : aStart.y - bStart.y;
        });


        let insertIndex = 0;

        const groupCenter =
            this.#getGroupCenter();


        for (let i = 0; i < affectedIcons.length; i++) {

            const icon =
                affectedIcons[i];

            const pos =
                this.#iconPositions.get(icon);


            if (horizontal) {

                const iconCenter =
                    pos.x +
                    icon.getBoundingClientRect().width / 2;


                if (groupCenter.x > iconCenter) {
                    insertIndex = i + 1;
                }

            } else {

                const iconCenter =
                    pos.y +
                    icon.getBoundingClientRect().height / 2;


                if (groupCenter.y > iconCenter) {
                    insertIndex = i + 1;
                }
            }
        }


        affectedIcons.splice(
            insertIndex,
            0,
            ...dragged
        );


        let cursor;


        if (horizontal) {

            cursor =
                affectedIcons[0]
                    ? this.#iconPositions.get(
                        affectedIcons[0]
                    ).x
                    : targetPosition.x;

        } else {

            cursor =
                affectedIcons[0]
                    ? this.#iconPositions.get(
                        affectedIcons[0]
                    ).y
                    : targetPosition.y;
        }


        for (const icon of affectedIcons) {

            const rect =
                icon.getBoundingClientRect();


            let x;
            let y;


            if (horizontal) {

                x = cursor;
                y = targetPosition.y;

                cursor +=
                    rect.width + gap;

            } else {

                x = targetPosition.x;
                y = cursor;

                cursor +=
                    rect.height + gap;
            }


            icon.style.transition =
                "left 0.15s ease, top 0.15s ease";


            icon.style.left =
                `${x}px`;

            icon.style.top =
                `${y}px`;


            this.#iconPositions.set(
                icon,
                {
                    x,
                    y
                }
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
}
