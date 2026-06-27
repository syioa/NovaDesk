export function maximize(w) {
    let maximized =
        false;

    let prev =
        {};

    w.querySelector(
        ".max"
    ).onclick =
        () => {

            if (!maximized) {

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
                    "0px";

                w.style.top =
                    "0px";

                w.style.width =
                    "100vw";

                w.style.height =
                    "calc(100vh - 50px)";

                w.style.borderRadius =
                    "0";

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

            }

            maximized =
                !maximized;

        };
}