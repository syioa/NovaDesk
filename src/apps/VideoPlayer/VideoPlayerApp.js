import App from "../app.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import "../../styles/apps/video-player.css";
import WindowState from "../../core/WindowState.js";

export default class VideoPlayerApp extends App {
    #window = null;
    #player = null;
    #videoUrl = null;
    #fileInput = null;
    #openButton = null;
    #openButtonHandler = null;

    #autoplay = true;
    #settingsStore = null;

    #urlButton = null;
    #urlButtonHandler = null;

    #element = null;
    #titleElement = null;
    #titleTextElement = null;
    #dropZone = null;

    #fullscreenControlsTimer = null;
    #fullscreenMouseMoveHandler = null;
    #keyboardHandler = null;

    #closeVideoButton = null;
    #closeVideoButtonHandler = null;

    #dragEnterHandler = null;
    #dragOverHandler = null;
    #dragleaveHandler = null;
    #dropHandler = null;

    static get manifest() {
        return {
            id: "video-player",
            name: "Video Player",
            icon: "V",
            width: 800,
            height: 500,
        };
    }

    mount(window, eventBus, settingsStore) {
        super.mount(window);

        this.#window = window;
        this.#settingsStore = settingsStore;

        this.#autoplay =
            this.#settingsStore.get("videoPlayer.autoplay");

        window.content.innerHTML = /*html*/`    
    <div class="video-player-app">
    <div class="video-player-app__empty">
        <div class="video-player-app__empty-content">

            <div class="video-player-app__empty-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" width="1em" height="1em">
                    <rect x="8" y="14" width="38" height="36" rx="7"></rect>
                    <path d="M46 25L57 19V45L46 39Z"></path>
                    <path d="M24 25L35 32L24 39Z"></path>
                </svg>
            </div>

            <div class="video-player-app__empty-title">
                No video playing
            </div>

            <div class="video-player-app__empty-description">
                Select or Drop a video here to play
            </div>

            <div class="video-player-app__open-actions">
                <button class="video-player-app__open-button" type="button">
                    Open Video
                </button>

                <button class="video-player-app__url-button" type="button">
                    Open from URL
                </button>
            </div>

        </div>

        <input class="video-player-app__file-input" type="file" accept="video/*" hidden>
    </div>
    <video class="video-player" playsinline>
    Your browser does not support HTML5 video.
</video>

    <div class="video-player-app__title">
        <span class="video-player-app__title-text"></span>

        <button class="video-player-app__close-video" type="button" aria-label="Close video" title="Close video">
            ×
        </button>
    </div>

    <div class="video-player-app__drop-zone" aria-hidden="true">
        <div class="video-player-app__drop-zone-content">

            <div class="video-player-app__drop-zone-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64">
                    <path d="M32 8V40"></path>
                    <path d="M20 28L32 40L44 28"></path>
                    <path d="M12 48H52"></path>
                </svg>
            </div>

            <div class="video-player-app__drop-zone-title">
                Select or Drop video to play
            </div>

            <div class="video-player-app__drop-zone-description">
                Release to open this video
            </div>

        </div>
    </div>
</div>
`;

        this.#element = window.content.querySelector(
            ".video-player-app"
        );

        this.#dropZone = window.content.querySelector(
            ".video-player-app__drop-zone"
        );

        const video = window.content.querySelector(".video-player");

        this.#fileInput = window.content.querySelector(
            ".video-player-app__file-input"
        );

        this.#openButton = window.content.querySelector(
            ".video-player-app__open-button"
        );

        this.#urlButton = window.content.querySelector(
            ".video-player-app__url-button"
        );

        this.#player = new Plyr(video, {
            controls: [
                "play-large",
                "play",
                "progress",
                "current-time",
                "mute",
                "volume",
                "settings",
                "pip",
                "fullscreen",
            ],

            settings: [
                "speed",
                "loop",
            ],

            youtube: {
                controls: 0,
                modestbranding: 1,
                rel: 0,
            },
        });


        this.#fullscreenMouseMoveHandler = () => {
            if (!this.#player || !this.#element || !this.#window) {
                return;
            }

            const container = this.#player.elements.container;

            if (!container) {
                return;
            }

            const isAppMaximized =
                this.#window.state === WindowState.MAXIMIZED;

            if (!isAppMaximized) {
                return;
            }

            // Show controls and title.
            container.classList.remove(
                "video-player-app__fullscreen-controls-hidden"
            );

            this.#element.classList.remove(
                "video-player-app__fullscreen-controls-hidden"
            );

            clearTimeout(this.#fullscreenControlsTimer);

            if (!this.#player.paused) {
                this.#fullscreenControlsTimer = setTimeout(() => {
                    container.classList.add(
                        "video-player-app__fullscreen-controls-hidden"
                    );

                    this.#element.classList.add(
                        "video-player-app__fullscreen-controls-hidden"
                    );
                }, 2250);
            }
        };
        this.#keyboardHandler = (event) => {
            if (!this.#player) {
                return;
            }

            const activeElement = document.activeElement;

            // Don't interfere with text fields or form controls.
            if (
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLSelectElement
            ) {
                return;
            }

            switch (event.code) {
                case "Space":
                    event.preventDefault();
                    event.stopPropagation();

                    this.#player.togglePlay();
                    break;

                case "ArrowLeft":
                    event.preventDefault();
                    event.stopPropagation();

                    this.#player.currentTime = Math.max(
                        0,
                        this.#player.currentTime - 5
                    );
                    break;

                case "ArrowRight":
                    event.preventDefault();
                    event.stopPropagation();

                    this.#player.currentTime = Math.min(
                        this.#player.duration,
                        this.#player.currentTime + 5
                    );
                    break;

                case "KeyM":
                    event.preventDefault();
                    event.stopPropagation();

                    this.#player.muted = !this.#player.muted;
                    break;

                default:
                    return;

                case "KeyF":
                    event.preventDefault();
                    event.stopPropagation();

                    this.#player.fullscreen.toggle();
                    break;

                case "ArrowUp":
                    event.preventDefault();
                    event.stopPropagation();

                    this.#player.volume = Math.min(
                        1,
                        this.#player.volume + 0.1
                    );
                    break;

                case "ArrowDown":
                    event.preventDefault();
                    event.stopPropagation();

                    this.#player.volume = Math.max(
                        0,
                        this.#player.volume - 0.1
                    );
                    break;

                case "Home":
                    event.preventDefault();
                    event.stopPropagation();

                    this.#player.currentTime = 0;
                    break;

                case "End":
                    event.preventDefault();
                    event.stopPropagation();

                    this.#player.currentTime = this.#player.duration;
                    break;
            }
        };

        document.addEventListener(
            "keydown",
            this.#keyboardHandler,
            true
        );

        document.addEventListener(
            "keydown",
            this.#keyboardHandler
        );



        this.#player.elements.container.addEventListener(
            "mousemove",
            this.#fullscreenMouseMoveHandler
        );

        this.#titleElement = window.content.querySelector(
            ".video-player-app__title"
        );

        this.#titleTextElement = window.content.querySelector(
            ".video-player-app__title-text"
        );

        this.#closeVideoButton = window.content.querySelector(
            ".video-player-app__close-video"
        );

        this.#closeVideoButtonHandler = () => {
            this.#clearVideo();
        };

        this.#closeVideoButton.addEventListener(
            "click",
            this.#closeVideoButtonHandler
        );

        this.#openButtonHandler = () => {
            this.#fileInput.click();
        };

        this.#openButton.addEventListener(
            "click",
            this.#openButtonHandler
        );

        this.#urlButtonHandler = () => {
            const dialog = document.createElement("div");

            dialog.className = "video-player-app__url-dialog";

            dialog.innerHTML = /*html*/`
        <div class="video-player-app__url-dialog-content">
            <div class="video-player-app__url-dialog-title">
                Open Video from URL
            </div>

            <input
                class="video-player-app__url-input"
                type="url"
                placeholder="Video URL or YouTube URL"
                autocomplete="off"
            >

            <div class="video-player-app__url-dialog-actions">
                <button
                    class="video-player-app__url-cancel"
                    type="button"
                >
                    Cancel
                </button>

                <button
                    class="video-player-app__url-open"
                    type="button"
                >
                    Open
                </button>
            </div>
        </div>
    `;

            this.#window.content.appendChild(dialog);

            const input = dialog.querySelector(
                ".video-player-app__url-input"
            );

            const cancelButton = dialog.querySelector(
                ".video-player-app__url-cancel"
            );

            const openButton = dialog.querySelector(
                ".video-player-app__url-open"
            );

            cancelButton.addEventListener("click", () => {
                dialog.remove();
            });

            openButton.addEventListener("click", () => {
                const url = input.value.trim();

                if (!url) {
                    input.focus();
                    return;
                }

                this.#loadVideoUrl(url);

                dialog.remove();
            });

            input.focus();
        };

        this.#urlButton.addEventListener(
            "click",
            this.#urlButtonHandler
        );

        this.#fileInput.addEventListener("change", (event) => {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            this.#loadVideo(file);
        });

        this.#dragEnterHandler = (event) => {
            event.preventDefault();

            if (!event.dataTransfer?.types.includes("Files")) {
                return;
            }

            this.#element.classList.add(
                "video-player-app--dragging"
            );
        };

        this.#dragOverHandler = (event) => {
            event.preventDefault();

            if (!event.dataTransfer?.types.includes("Files")) {
                return;
            }

            event.dataTransfer.dropEffect = "copy";

            this.#element.classList.add(
                "video-player-app--dragging"
            );
        };

        this.#dragleaveHandler = (event) => {
            if (
                event.relatedTarget &&
                this.#element.contains(event.relatedTarget)
            ) {
                return;
            }

            this.#element.classList.remove(
                "video-player-app--dragging"
            );
        };

        this.#dropHandler = (event) => {
            event.preventDefault();

            this.#element.classList.remove(
                "video-player-app--dragging"
            );

            const file = event.dataTransfer?.files?.[0];

            if (!file || !file.type.startsWith("video/")) {
                return;
            }

            this.#loadVideo(file);
        };

        this.#element.addEventListener(
            "dragenter",
            this.#dragEnterHandler
        );

        this.#element.addEventListener(
            "dragover",
            this.#dragOverHandler
        );

        this.#element.addEventListener(
            "dragleave",
            this.#dragleaveHandler
        );

        this.#element.addEventListener(
            "drop",
            this.#dropHandler
        );
    }

    #loadVideo(file) {
        this.#autoplay =
            this.#settingsStore.get("videoPlayer.autoplay");

        if (this.#videoUrl) {
            URL.revokeObjectURL(this.#videoUrl);
        }

        this.#videoUrl = URL.createObjectURL(file);
        this.#titleTextElement.textContent = file.name;

        this.#player.source = {
            type: "video",
            title: file.name,
            sources: [
                {
                    src: this.#videoUrl,
                    type: file.type,
                },
            ],
        };

        this.#element.classList.add(
            "video-player-app--loaded"
        );

        if (this.#autoplay) {
            const playResult = this.#player.play();

            if (
                playResult &&
                typeof playResult.catch === "function"
            ) {
                playResult.catch(() => {
                    // Browser may block autoplay.
                });
            }
        } else {
            this.#player.pause();
        }
    }

    #isYouTubeUrl(url) {
        try {
            const parsedUrl = new URL(url);

            return (
                parsedUrl.hostname === "youtube.com" ||
                parsedUrl.hostname === "www.youtube.com" ||
                parsedUrl.hostname === "m.youtube.com" ||
                parsedUrl.hostname === "youtu.be" ||
                parsedUrl.hostname === "www.youtu.be"
            );
        } catch {
            return false;
        }
    }

    #loadVideoUrl(url) {
        this.#autoplay =
            this.#settingsStore.get("videoPlayer.autoplay");

        if (this.#isYouTubeUrl(url)) {
            const videoId = this.#getYouTubeVideoId(url);

            if (!videoId) {
                return;
            }

            this.#titleTextElement.textContent = "YouTube";

            this.#player.source = {
                type: "video",
                title: "YouTube",
                sources: [
                    {
                        src: videoId,
                        provider: "youtube",
                    },
                ],
            };

            this.#element.classList.add(
                "video-player-app--loaded"
            );

            if (this.#autoplay) {
                this.#player.once("ready", () => {
                    this.#player.play().catch(() => { });
                });
            } else {
                this.#player.once("ready", () => {
                    this.#player.pause();
                });
            }

            return;
        }

        this.#titleTextElement.textContent = url;

        this.#player.source = {
            type: "video",
            title: url,
            sources: [
                {
                    src: url,
                    type: "video/mp4",
                },
            ],
        };

        this.#element.classList.add(
            "video-player-app--loaded"
        );

        if (this.#autoplay) {
            const playVideo = () => {
                const playResult = this.#player.play();

                if (playResult && typeof playResult.catch === "function") {
                    playResult.catch(() => {
                        // Browser may block autoplay.
                    });
                }
            };

            this.#player.once("canplay", playVideo);
        } else {
            this.#player.pause();
        }
    }

    #getYouTubeVideoId(url) {
        try {
            const parsedUrl = new URL(url);

            if (
                parsedUrl.hostname === "youtu.be" ||
                parsedUrl.hostname === "www.youtu.be"
            ) {
                return parsedUrl.pathname.slice(1);
            }

            if (
                parsedUrl.hostname === "youtube.com" ||
                parsedUrl.hostname === "www.youtube.com" ||
                parsedUrl.hostname === "m.youtube.com"
            ) {
                if (parsedUrl.pathname === "/watch") {
                    return parsedUrl.searchParams.get("v");
                }

                if (parsedUrl.pathname.startsWith("/shorts/")) {
                    return parsedUrl.pathname.split("/")[2];
                }

                if (parsedUrl.pathname.startsWith("/embed/")) {
                    return parsedUrl.pathname.split("/")[2];
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    #clearVideo() {
        if (!this.#player) {
            return;
        }

        this.#player.pause();

        this.#player.source = {
            type: "video",
            sources: [],
        };

        if (this.#videoUrl) {
            URL.revokeObjectURL(this.#videoUrl);
            this.#videoUrl = null;
        }

        this.#titleTextElement.textContent = "";

        this.#element.classList.remove(
            "video-player-app--loaded"
        );
    }

    unmount() {
        if (this.#openButton && this.#openButtonHandler) {
            this.#openButton.removeEventListener(
                "click",
                this.#openButtonHandler
            );
        }

        if (this.#urlButton && this.#urlButtonHandler) {
            this.#urlButton.removeEventListener(
                "click",
                this.#urlButtonHandler
            );
        }

        if (
            this.#player &&
            this.#fullscreenMouseMoveHandler
        ) {
            this.#player.elements.container.removeEventListener(
                "mousemove",
                this.#fullscreenMouseMoveHandler
            );
        }

        clearTimeout(this.#fullscreenControlsTimer);
        this.#fullscreenControlsTimer = null;
        this.#fullscreenMouseMoveHandler = null;

        if (this.#keyboardHandler) {
            document.removeEventListener(
                "keydown",
                this.#keyboardHandler,
                true
            );
        }

        this.#keyboardHandler = null;

        if (
            this.#closeVideoButton &&
            this.#closeVideoButtonHandler
        ) {
            this.#closeVideoButton.removeEventListener(
                "click",
                this.#closeVideoButtonHandler
            );
        }

        if (this.#element) {
            if (this.#dragEnterHandler) {
                this.#element.removeEventListener(
                    "dragenter",
                    this.#dragEnterHandler
                );
            }

            if (this.#dragOverHandler) {
                this.#element.removeEventListener(
                    "dragover",
                    this.#dragOverHandler
                );
            }

            if (this.#dragleaveHandler) {
                this.#element.removeEventListener(
                    "dragleave",
                    this.#dragleaveHandler
                );
            }

            if (this.#dropHandler) {
                this.#element.removeEventListener(
                    "drop",
                    this.#dropHandler
                );
            }
        }


        this.#player?.destroy();
        this.#player = null;

        if (this.#videoUrl) {
            URL.revokeObjectURL(this.#videoUrl);
            this.#videoUrl = null;
        }

        this.#fileInput = null;
        this.#openButton = null;
        this.#openButtonHandler = null;
        this.#urlButton = null;
        this.#urlButtonHandler = null;
        this.#element = null;
        this.#titleElement = null;
        this.#closeVideoButton = null;
        this.#closeVideoButtonHandler = null;
        this.#titleTextElement = null;
        this.#window = null;
        this.#dragEnterHandler = null;
        this.#dragOverHandler = null;
        this.#dragleaveHandler = null;
        this.#dropHandler = null;
        this.#dropZone = null;
        this.#settingsStore = null;
    }
}