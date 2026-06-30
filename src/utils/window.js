export function maximize(w) {

    let max =
        w.querySelector(
            ".max"
        );

    let prev =
        {};

    max.onclick =
        () => {

            if (
                !w.classList.contains(
                    "maximized"
                )
            ) {

                prev = {

                    left:
                        w.offsetLeft,

                    top:
                        w.offsetTop,

                    width:
                        w.offsetWidth,

                    height:
                        w.offsetHeight

                };

                w.style.left =
                    "0";

                w.style.top =
                    "0";

                w.style.width =
                    "100%";

                w.style.height =
                    "calc(100vh - 50px)";

                w.style.borderRadius =
                    "0";

                w.classList.add(
                    "maximized"
                );

                max.textContent =
                    "❐";

            } else {

                w.style.left =
                    prev.left +
                    "px";

                w.style.top =
                    prev.top +
                    "px";

                w.style.width =
                    prev.width +
                    "px";

                w.style.height =
                    prev.height +
                    "px";

                w.style.borderRadius =
                    "10px";

                w.classList.remove(
                    "maximized"
                );

                max.textContent =
                    "□";

            }

        };

}

export function drag(el) {

    const title =
        el.querySelector(
            ".title"
        );

    const preview =
        document.getElementById(
            "snapPreview"
        );

    let dragging =
        false;

    let offsetX =
        0;

    let offsetY =
        0;

    function snap(
        x,
        y,
        w,
        h
    ) {

        el.style.left =
            x + "px";

        el.style.top =
            y + "px";

        el.style.width =
            w + "px";

        el.style.height =
            h + "px";

    }

    function previewSnap(
        x,
        y,
        w,
        h
    ) {

        preview.style.display =
            "block";

        preview.style.left =
            x + "px";

        preview.style.top =
            y + "px";

        preview.style.width =
            w + "px";

        preview.style.height =
            h + "px";

    }

    function hidePreview() {

        preview.style.display =
            "none";

    }

    title.onmousedown =
        e => {

            if (
                el.classList.contains(
                    "maximized"
                )
            )
                return;

            dragging =
                true;

            offsetX =
                e.clientX -
                el.offsetLeft;

            offsetY =
                e.clientY -
                el.offsetTop;

        };

    document.addEventListener(
        "mousemove",

        e => {

            if (
                !dragging
            )
                return;

            const x =
                e.clientX -
                offsetX;

            const y =
                e.clientY -
                offsetY;

            el.style.left =
                x +
                "px";

            el.style.top =
                y +
                "px";

            const W =
                window.innerWidth;

            const H =
                window.innerHeight -
                50;

            const edge =
                40;

            if (
                e.clientX <
                edge &&
                e.clientY <
                edge
            ) {

                previewSnap(
                    0,
                    0,
                    W / 2,
                    H / 2
                );

            }

            else if (
                e.clientX >
                W -
                edge &&
                e.clientY <
                edge
            ) {

                previewSnap(
                    W / 2,
                    0,
                    W / 2,
                    H / 2
                );

            }

            else if (
                e.clientX <
                edge &&
                e.clientY >
                H
            ) {

                previewSnap(
                    0,
                    H / 2,
                    W / 2,
                    H / 2
                );

            }

            else if (
                e.clientX >
                W -
                edge &&
                e.clientY >
                H
            ) {

                previewSnap(
                    W / 2,
                    H / 2,
                    W / 2,
                    H / 2
                );

            }

            else if (
                e.clientY <
                edge
            ) {

                previewSnap(
                    0,
                    0,
                    W,
                    H
                );

            }

            else if (
                e.clientX <
                edge
            ) {

                previewSnap(
                    0,
                    0,
                    W / 2,
                    H
                );

            }

            else if (
                e.clientX >
                W -
                edge
            ) {

                previewSnap(
                    W / 2,
                    0,
                    W / 2,
                    H
                );

            }

            else {

                hidePreview();

            }

        }
    );

    document.addEventListener(
        "mouseup",

        e => {

            if (
                !dragging
            )
                return;

            dragging =
                false;

            hidePreview();

            const W =
                window.innerWidth;

            const H =
                window.innerHeight -
                50;

            const edge =
                40;

            if (
                e.clientX <
                edge &&
                e.clientY <
                edge
            )
                snap(
                    0,
                    0,
                    W / 2,
                    H / 2
                );

            else if (
                e.clientX >
                W -
                edge &&
                e.clientY <
                edge
            )
                snap(
                    W / 2,
                    0,
                    W / 2,
                    H / 2
                );

            else if (
                e.clientX <
                edge &&
                e.clientY >
                H
            )
                snap(
                    0,
                    H / 2,
                    W / 2,
                    H / 2
                );

            else if (
                e.clientX >
                W -
                edge &&
                e.clientY >
                H
            )
                snap(
                    W / 2,
                    H / 2,
                    W / 2,
                    H / 2
                );

            else if (
                e.clientY <
                edge
            )
                snap(
                    0,
                    0,
                    W,
                    H
                );

            else if (
                e.clientX <
                edge
            )
                snap(
                    0,
                    0,
                    W / 2,
                    H
                );

            else if (
                e.clientX >
                W -
                edge
            )
                snap(
                    W / 2,
                    0,
                    W / 2,
                    H
                );

        }
    );

}

document.addEventListener(
    "click",
    e => {

        if (
            !menu.contains(e.target) &&
            e.target !== start
        ) {

            menu.style.display =
                "none";

        }

    }
);
