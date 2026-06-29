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
                    "100vw";

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