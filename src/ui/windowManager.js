import {
    maximize,
    drag,
    resize
} from "../utils/window";

let globalZ = 10;

class Window {
    Constructor(manager, options = {}) {
        this.manager = manager;

        this.id = options.id || `win_${Math.random().toString(36).slice(2)}`;
        this.title = options.title || "Window";
        this.content = options.content || "";

        this.isMinimized = false;
        this.isMaximized = false;
        this.lastBounds = null;

        this.createElement();
        this.attachEvents();

        this.focus();
    }

    createElement() {
        //Main window
        this.el = document.createElement("div");
        this.el.className = "wm-window";
        this.el.dataset.id = this.id;

        this.el.style.position = "absolute";
        this.el.style.top = "100px";
        this.el.style.left = "100px";
        this.el.style.width = "400px";
        this.el.style.height = "300px";
        this.el.style.zIndex = globalZ++;

        //Header
        this.header = document.createElement("div");
        this.header.className = "wm-header";
        this.header.innerHTML = `
            <span class="wm-title">${this.title}</span>
            <div class="wm-controls">
                <button class="wm-min">—</button>
                <button class="wm-max">▢</button>
                <button class="wm-close">✕</button>
            </div>
        `;

        //Body
        this.body = document.createElement("div");
        this.body.className = "wm-body";
        this.body.innerHTML = this.content;

        this.el.appendChild(this.header);
        this.el.appendChild(this.body);

        document.body.appendChild(this.el);

        this.createTaskbarButton();
    }

    createTaskbarButton() {
        const taskbar = document.getElementById("taskbar");
        if (!taskbar) return;

        this.taskBtn = document.createElement("button");
        this.taskBtn.className = "taskbar-btn";
        this.taskBtn.textContent = this.title;

        this.taskBtn.onclick = () => {
            if (this.isMinimized) {
                this.restore();
            } else {
                this.focus();
            }
        };

        taskbar.appendChild(this.taskBtn);
    }

    attachEvents() {
        // Focus on click
        this.el.addEventListener("mousedown", () => this.focus());

        // Window controls
        this.header.querySelector(".wm-close").onclick = () => this.close();
        this.header.querySelector(".wm-min").onclick = () => this.minimize();
        this.header.querySelector(".wm-max").onclick = () => this.toggleMaximize();

        // Dragging (basic)
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        this.header.addEventListener("mousedown", (e) => {
            if (this.isMaximized) return;

            isDragging = true;
            offsetX = e.clientX - this.el.offsetLeft;
            offsetY = e.clientY - this.el.offsetTop;

            this.focus();
        });

        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return;

            this.el.style.left = `${e.clientX - offsetX}px`;
            this.el.style.top = `${e.clientY - offsetY}px`;
        });

        window.addEventListener("mouseup", () => {
            isDragging = false;
        });
    }

    focus() {
        this.el.style.zIndex = globalZ++;
        this.manager.setActive(this);

        this.el.classList.add("focused");
    }

    minimize() {
        this.isMinimized = true;
        this.el.style.display = "none";
        this.el.classList.remove("focused");
    }

    restore() {
        this.isMinimized = false;
        this.el.style.display = "block";
        this.focus();
    }

    toggleMaximize() {
        if (!this.isMaximized) {
            this.lastBounds = {
                top: this.el.style.top,
                left: this.el.style.left,
                width: this.el.style.width,
                height: this.el.style.height,
            };

            this.el.style.top = "0";
            this.el.style.left = "0";
            this.el.style.width = "100%";
            this.el.style.height = "calc(100% - 40px)";
            this.isMaximized = true;
        } else {
            Object.assign(this.el.style, this.lastBounds);
            this.isMaximized = false;
        }
    }

    close() {
        this.el.remove();
        if (this.taskBtn) this.taskBtn.remove();
        this.manager.unregister(this);
    }

}

class WindowManager {
    constructor() {
        this.windows = [];
        this.activeWindow = null;
    }

    create(options) {
        const win = new Window(this, options);
        this.windows.push(win);
        return win;
    }

    setActive(win) {
        this.activeWindow = win;
    }

    unregister(win) {
        this.windows = this.windows.filter(w => w !== win);
        if (this.activeWindow === win) {
            this.activeWindow = null;
        }
    }
    setActive(win) {
        this.activeWindow = win;
    }

    unregister(win) {
        this.windows = this.windows.filter(w => w !== win);
        if (this.activeWindow === win) {
            this.activeWindow = null;
        }
    }

    getById(id) {
        return this.window.find(w => w.id === id);
    }

    closeAll() {
        [...this.windows].forEach(w => w.close());
    }
}

//export for usage
export default WindowManager;
export { Window };


const desktop =
    document.getElementById("desktop");

const taskbarApps =
    document.getElementById("taskbarApps");

let z = 1;

const taskMap =
    new Map();

function createIndicator(id, icon, window) {

    const btn =
        document.createElement("button");

    btn.className =
        "task-indicator active";

    btn.innerHTML =
        icon
            ? `<img src="${icon}">`
            : "⬜";

    btn.onclick = e => {

        e.stopPropagation();

        if (
            window.classList.contains(
                "hidden"
            )
        ) {

            window.classList.remove(
                "hidden"
            );

        }

        window.style.zIndex =
            ++z;

        focusWindow(window);

    };

    taskbarApps.append(btn);

    taskMap.set(id, btn);

}

export function focusWindow(window) {

    window.style.zIndex =
        ++z;

    document
        .querySelectorAll(".task-indicator")
        .forEach(btn =>
            btn.classList.remove(
                "active"
            )
        );

    const id =
        window.dataset.windowId;

    taskMap
        .get(id)
        ?.classList.add(
            "active"
        );

}

export function createWindow({

    title,

    content,

    icon = "",

    width = 700,

    height = 500,

    left = Math.random() * 350,

    top = Math.random() * 180,

    onClose = null

}) {

    const id =
        crypto.randomUUID();

    const window =
        document.createElement("div");

    window.className =
        "window";

    window.dataset.windowId =
        id;

    window.style.width =
        width + "px";

    window.style.height =
        height + "px";

    window.style.left =
        left + "px";

    window.style.top =
        top + "px";

    window.style.zIndex =
        ++z;

    window.innerHTML = `

<div class="title">

<div class="title-left">

${icon
            ?
            `<img class="title-icon" src="${icon}">`
            :
            ""
        }

<span>${title}</span>

</div>

<div class="controls">

<button class="btn min">—</button>

<button class="btn max">□</button>

<button class="btn close">✕</button>

</div>

</div>

<div class="content">

${content}

</div>

<div class="resize top"></div>
<div class="resize bottom"></div>
<div class="resize left"></div>
<div class="resize right"></div>

<div class="resize tl"></div>
<div class="resize tr"></div>
<div class="resize bl"></div>
<div class="resize br"></div>

`;

    desktop.append(window);

    createIndicator(
        id,
        icon,
        window
    );

    drag(window);

    resize(window);

    maximize(window);

    window.onclick =
        () =>
            focusWindow(window);

    window
        .querySelector(".min")
        .onclick =
        e => {

            e.stopPropagation();

            window.classList.add(
                "hidden"
            );

        };

    window
        .querySelector(".close")
        .onclick =
        () => {

            taskMap
                .get(id)
                ?.remove();

            taskMap.delete(id);

            window.remove();

            onClose?.();

        };

    return window;

}