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