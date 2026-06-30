import "@catppuccin/palette/css/catppuccin.css"
import './style.css'

import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

import { maximize, drag } from "./utils/window"
import { setWallpaper, setInitialWallpaper } from "./utils/settings"

let z = 1;
let settingsWindow = null;

const taskbarApps =
  document.getElementById(
    "taskbarApps"
  );

const taskMap =
  new Map();

document
  .querySelector(".menu>.notes")
  .addEventListener(
    "click",
    notes
  );
document
  .querySelector(".menu>.settings")
  .addEventListener(
    "click",
    () => settings(z),
  );


setInitialWallpaper()

const desktop =
  document.getElementById(
    "desktop"
  );

function createIndicator(
  id,
  icon,
  window
) {

  const btn =
    document.createElement(
      "button"
    );

  btn.className =
    "task-indicator active";

  btn.innerHTML =
    icon
      ? `<img src="${icon}">`
      : "⬜";

  btn.onclick =
    e => {

      e.stopPropagation();

      if (
        window.classList.contains(
          "hidden"
        )
      ) {

        window.classList.remove(
          "hidden"
        );

        window.style.zIndex =
          ++z;

      }

      else {

        window.style.zIndex =
          ++z;

      }

    };

  taskbarApps.append(
    btn
  );

  taskMap.set(
    id,
    btn
  );

}

function win(title, html, icon = "") {

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

  w.innerHTML = `
<div class="title">

<div class="title-left">

${icon
      ?
      `<img
class="title-icon"
src="${icon}">`
      :
      ""
    }

<span>${title}</span>

</div>

<div class="controls">

<button
class="btn min">
—
</button>

<button
class="btn max">
□
</button>

<button
class="btn close">
✕
</button>

</div>

</div>

<div class="content">

${html}

</div>
`;


  desktop.appendChild(w);

  const minimize =
    w.querySelector(
      ".min"
    );

  minimize.onclick =
    e => {

      e.stopPropagation();

      w.classList.add(
        "hidden"
      );

    };

  const id =
    crypto.randomUUID();

  createIndicator(
    id,
    icon,
    w
  );

  drag(w);

  w.querySelector(
    ".close"
  )
    .onclick =
    () => {

      if (
        w ===
        settingsWindow
      ) {

        settingsWindow =
          null;

      }

      w.remove();

      taskMap
        .get(id)
        ?.remove();

      taskMap
        .delete(id);

    };

  // let maximized = false;
  // let prev = {};

  maximize(w);

  w.onclick =
    () => {

      w.style.zIndex =
        ++z;

      document
        .querySelectorAll(
          ".task-indicator"
        )
        .forEach(
          b =>
            b.classList.remove(
              "active"
            )
        );

      taskMap
        .get(id)
        ?.classList.add(
          "active"
        );

    };

  return w;

}

function settings() {

  if (
    settingsWindow &&
    document.body.contains(
      settingsWindow
    )
  ) {

    settingsWindow.style.zIndex =
      ++z;

    return;
  }

  settingsWindow =
    win(
      "Settings",

      `
<div class="settings">

<h2>
Personalization
</h2>

<div
class="wall-preview"
id="preview">
</div>

<label>

Wallpaper URL

<input
type="text"
id="wallUrl"
placeholder=
"https://...">

</label>

<button id="apply">

Apply Wallpaper

</button>

</div>
`);

  const input =
    settingsWindow.querySelector("#wallUrl");

  const apply =
    settingsWindow.querySelector("#apply");

  const preview =
    settingsWindow.querySelector("#preview");

  input.addEventListener("input", () => {
    preview.style.backgroundImage =
      `url("${input.value}")`;
  });

  apply.onclick = () => {

    const url =
      input.value.trim();

    if (!url) return;

    localStorage.setItem(
      "wallpaper",
      url
    );

    setWallpaper(url);

  };

}

async function notes() {

  let saved =
    localStorage.getItem(
      "notes"
    );

  let w =
    win(
      "Notes",

      `
            <div
                id="editorjs"
                "/icons/notes.svg"
                class="editorjs"></div>
            `
    );

  const crepe = new Crepe({
    root: w.querySelector("#editorjs"),

    defaultValue:
      saved ??
      "# Welcome\n\nStart typing..."
  });

  await crepe.create();
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
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

}, 1000);


const apps = [
  {
    name: "Notes",
    icon: "/icons/notes.svg",
    open: notes
  },
  {
    name: "Files",
    icon: "/icons/folder.svg",
    open: () =>
      win(
        "Files",
        "<h2>Empty</h2>",
        "/icons/folder.svg"
      )
  }
];

const area =
  document.getElementById(
    "icons"
  );

apps.forEach(app => {

  const el =
    document.createElement(
      "button"
    );

  el.className =
    "app";

  el.innerHTML =
    `
  <img src="${app.icon}">
  <span>${app.name}</span>
  `;

  el.onclick =
    app.open;

  area.append(el);

});

const taskbar =
  document.querySelector(
    ".taskbar"
  );

let visible =
  false;

document.addEventListener(
  "mousemove",

  e => {

    const threshold =
      window.innerHeight -
      25;

    const show =
      e.clientY >=
      threshold;

    if (
      show &&
      !visible
    ) {

      taskbar.style.bottom =
        "0";

      visible =
        true;

    }

    else if (
      !show &&
      visible
    ) {

      taskbar.style.bottom =
        "-42px";

      visible =
        false;

    }

  }
);

//right click refresh option
const mainctx =
  document.getElementById(
    "contextMenu"
  );

desktop.addEventListener(
  "contextmenu",

  e => {

    e.preventDefault();

    if (
      e.target.closest(
        ".window"
      )
    )
      return;

    mainctx.style.display =
      "block";

    mainctx.style.left =
      e.clientX +
      "px";

    mainctx.style.top =
      e.clientY +
      "px";

  }
);

const previewctx =
  document.getElementById(
    "contextMenu"
  );

desktop.addEventListener(
  "contextmenu",

  e => {

    e.preventDefault();

    if (
      e.target.closest(
        ".window"
      )
    )
      return;

    previewctx.style.display =
      "block";

    previewctx.style.left =
      e.clientX +
      "px";

    previewctx.style.top =
      e.clientY +
      "px";

  }
);

document.addEventListener(
  "click",

  e => {

    if (
      !previewctx.contains(
        e.target
      )
    ) {

      previewctx.style.display =
        "none";

    }

  }
);

function refreshDesktop() {

  document
    .querySelectorAll(
      ".window"
    )
    .forEach(
      w => {

        w.style.zIndex =
          ++z;

      }
    );

}

function resetWallpaper() {

  localStorage.removeItem(
    "wallpaper"
  );

  desktop.style.background =
    "";

}