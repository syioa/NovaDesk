let z = 1;

const desktop =
    document.getElementById(
        "desktop"
    );

function win(title, html) {

    let w =
        document.createElement(
            "div"
        );

    w.className =
        "window";

    w.style.left =
        Math.random() * 400 + "px";

    w.style.top =
        Math.random() * 200 + "px";

    w.style.zIndex = ++z;

    w.innerHTML =
        `
    <div class="title">

    <span>${title}</span>

    <div class="controls">

    <button class="btn min">
    </button>

    <button class="btn close">
    </button>

    </div>

    </div>

    <div class="content">
    ${html}
    </div>
    `;

    desktop.appendChild(w);

    drag(w);

    w.querySelector(
        ".close"
    )
        .onclick =
        () => w.remove();

    w.querySelector(
        ".min"
    )
        .onclick =
        () => w.style.display =
            "none";

    w.onclick =
        () => w.style.zIndex = ++z;

    return w;

}

function drag(el) {

    let t =
        el.querySelector(
            ".title"
        );

    let x, y;

    t.onmousedown =
        e => {

            x =
                e.clientX -
                el.offsetLeft;

            y =
                e.clientY -
                el.offsetTop;

            document.onmousemove =
                e => {

                    el.style.left =
                        e.clientX - x +
                        "px";

                    el.style.top =
                        e.clientY - y +
                        "px";

                };

            document.onmouseup =
                () => {

                    document.onmousemove =
                        null;

                };

        };

}

function notes() {

    let text =
        localStorage.getItem(
            "notes"
        ) || "";

    let w =
        win(
            "Notes",

            `<textarea id=n>
        ${text}
        </textarea>`
        );

    let n =
        w.querySelector(
            "#n"
        );

    n.oninput =
        () => {

            localStorage.setItem(
                "notes",
                n.value
            );

        };

}

start.onclick = () => {
    menu.style.display =
        menu.style.display ===
            "block"
            ?
            "none"
            :
            "block";

};

setInterval(() => {

    clock.textContent =
        new Date()
            .toLocaleTimeString();

}, 1000);
