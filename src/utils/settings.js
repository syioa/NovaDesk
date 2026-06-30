export function setWallpaper(url) {

    const target =
        document.getElementById(
            "desktop"
        );

    target.style.backgroundImage =
        `url("${url}")`;

    target.style.backgroundSize =
        "cover";

    target.style.backgroundPosition =
        "center";

    target.style.backgroundRepeat =
        "no-repeat";

}

export function setInitialWallpaper() {
    window.addEventListener(
        "load",

        () => {

            const saved =
                localStorage.getItem(
                    "wallpaper"
                );

            if (
                saved
            ) {

                document
                    .getElementById(
                        "desktop"
                    )
                    .style.background =
                    `url("${saved}") center / cover no-repeat`;

            }

        }

    );
}