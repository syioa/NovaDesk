export default class DesktopIcons {
    #eventBus;
    #registry;
    #element;
    #desktopIcons;
    #lastValidPosition;

    #selectedIcons = new Set();
    #iconPositions = new Map();
    #dragStartPositions = new Map();
    #previousZIndexes = new Map();

    #dragging = false;
    #wasDragging = false;

    #dragIcon = null;
    #dragIcons = [];

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

        this.#iconPositions.set(icon, {
            x,
            y
        });

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
            const position = this.#iconPositions.get(icon);

            this.#dragStartPositions.set(icon, {
                x: position.x,
                y: position.y
            });
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

        const position = this.#iconPositions.get(icon);

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

        const dx = event.clientX - this.#dragStartX;
        const dy = event.clientY - this.#dragStartY;

        for (const icon of this.#dragIcons) {
            const start = this.#dragStartPositions.get(icon);

            const x = start.x + dx;
            const y = start.y + dy;

            icon.style.left = `${x}px`;
            icon.style.top = `${y}px`;

            this.#iconPositions.set(icon, {
                x,
                y
            });
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
            const position = this.#iconPositions.get(icon);

            positions.set(icon, {
                x: position.x,
                y: position.y
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
                const position = this.#iconPositions.get(icon);

                const x = this.#snapToGrid(position.x);
                const y = this.#snapToGrid(position.y);

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

            const position = this.#iconPositions.get(icon);


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
            const position = this.#iconPositions.get(icon);
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
            const position = this.#iconPositions.get(icon);
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
        for (const icon of this.#dragIcons) {
            const start =
                this.#iconPositions.get(icon);

            const x = start.x + offsetX;
            const y = start.y + offsetY;

            icon.style.left = `${x}px`;
            icon.style.top = `${y}px`;

            this.#iconPositions.set(icon, {
                x,
                y
            });
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
        console.log(
            "split direction:",
            direction
        );

        console.log(
            "target:",
            targetIcon,
            "drag icons:",
            this.#dragIcons
        );

        for (const icon of this.#dragIcons) {
            console.log(
                "side:",
                this.#getIconSideRelativeToTarget(
                    icon,
                    targetIcon
                )
            );
        }

        const leftIcons = [];
        const rightIcons = [];
        const topIcons = [];
        const bottomIcons = [];

        for (const icon of this.#dragIcons) {
            switch (direction) {
                case "left":
                    leftIcons.push(icon);
                    break;

                case "right":
                    rightIcons.push(icon);
                    break;

                case "top":
                    topIcons.push(icon);
                    break;

                case "bottom":
                    bottomIcons.push(icon);
                    break;
            }
        }

        const targetPosition =
            this.#iconPositions.get(targetIcon);

        const targetRect =
            targetIcon.getBoundingClientRect();

        const gap = 16;

        leftIcons.sort((a, b) => {
            return (
                this.#dragStartPositions.get(a).x -
                this.#dragStartPositions.get(b).x
            );
        });


        // LEFT SIDE

        let leftX =
            targetPosition.x - gap;

        console.log(
            "left count:",
            leftIcons.length
        );

        for (const icon of [...leftIcons].reverse()) {

            const rect =
                icon.getBoundingClientRect();

            leftX -= rect.width;

            icon.style.transition =
                "left 0.15s ease, top 0.15s ease";

            icon.style.left =
                `${leftX}px`;

            icon.style.top =
                `${targetPosition.y}px`;

            this.#iconPositions.set(icon, {
                x: leftX,
                y: targetPosition.y
            });

            leftX -= gap;
        }

        // RIGHT SIDE

        let rightX =
            targetPosition.x +
            targetRect.width +
            gap;

        rightIcons.sort((a, b) => {
            return (
                this.#dragStartPositions.get(a).x -
                this.#dragStartPositions.get(b).x
            );
        });

        for (const icon of rightIcons) {
            icon.style.left =
                `${rightX}px`;

            icon.style.top =
                `${targetPosition.y}px`;

            this.#iconPositions.set(icon, {
                x: rightX,
                y: targetPosition.y
            });

            rightX +=
                icon.getBoundingClientRect().width +
                gap;
        }


        // TOP SIDE

        topIcons.sort((a, b) => {
            return (
                this.#dragStartPositions.get(a).y -
                this.#dragStartPositions.get(b).y
            );
        });

        let topY =
            targetPosition.y - gap;

        for (const icon of [...topIcons].reverse()) {

            const position =
                this.#iconPositions.get(icon);

            const rect =
                icon.getBoundingClientRect();

            icon.style.transition =
                "left 0.15s ease, top 0.15s ease";

            const y =
                targetPosition.y - rect.height - gap;

            icon.style.left =
                `${position.x}px`;

            icon.style.top =
                `${y}px`;

            this.#iconPositions.set(icon, {
                x: position.x,
                y
            });
        }


        // BOTTOM SIDE

        for (const icon of bottomIcons) {

            const position =
                this.#iconPositions.get(icon);

            const rect =
                icon.getBoundingClientRect();

            const y =
                targetPosition.y +
                targetRect.height +
                gap;

            icon.style.transition =
                "left 0.15s ease, top 0.15s ease";

            icon.style.left =
                `${position.x}px`;

            icon.style.top =
                `${y}px`;

            this.#iconPositions.set(icon, {
                x: position.x,
                y
            });
        }
    }

    #snapToGrid(value) {
        const grid = 16;

        return Math.round(value / grid) * grid;
    }
}
