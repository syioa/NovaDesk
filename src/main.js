import "@catppuccin/palette/css/catppuccin.css"
import './style.css'

import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

import {
  maximize,
  drag,
  resize
}
  from "./utils/window"
import { setWallpaper, setInitialWallpaper } from "./utils/settings"

import { createWindow }
  from "./ui/windowManager";


import WindowManager from "./ui/windowManager";

const wm = new WindowManager();

wm.create({
  title: "Notes",
  content: "<h3>Hello Notes</h3>"
});

wm.create({
  title: "Explorer",
  content: "<p>Files here</p>"
});

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

function settings() {
  let settingsWindow = null;

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

  settingsWindow = createWindow({
    title: "Settings",
    content: `
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
    `,
    onClose() {
      settingsWindow = null;
    }
  });

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

  const w = createWindow({
    title: "Notes",
    icon: "/icons/notes.svg",
    content: `<div id="editorjs" class="editorjs"></div>`
  })

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
      createWindow({
        title: "Files",
        html: "<h2>Empty</h2>",
        icon: "/icons/folder.svg"
      })
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

document.addEventListener(
  "mousedown",

  e => {

    if (
      mainctx.style.display ===
      "block" &&

      !mainctx.contains(
        e.target
      )
    ) {

      mainctx.style.display =
        "none";

    }

  }
);

desktop.addEventListener(
  "contextmenu",

  e => {

    e.preventDefault();

    if (
      e.target.closest(
        ".window"
      )
    ) {

      mainctx.style.display =
        "none";

      return;
    }

    mainctx.style.left =
      `${e.clientX}px`;

    mainctx.style.top =
      `${e.clientY}px`;

    mainctx.style.display =
      "block";

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

document
  .getElementById(
    "ctxRefresh"
  )
  .onclick =
  () => {

    refreshDesktop();

    mainctx.style.display =
      "none";

  };

document
  .getElementById(
    "ctxNotes"
  )
  .onclick =
  () => {

    notes();

    mainctx.style.display =
      "none";

  };

document
  .getElementById(
    "ctxSettings"
  )
  .onclick =
  () => {

    settings();

    mainctx.style.display =
      "none";

  };

document
  .getElementById(
    "ctxWallpaper"
  )
  .onclick =
  () => {

    resetWallpaper();

    mainctx.style.display =
      "none";

  };

function resetWallpaper() {

  localStorage.removeItem(
    "wallpaper"
  );

  desktop.style.background =
    "";

}