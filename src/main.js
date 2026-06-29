import "@catppuccin/palette/css/catppuccin.css"
import './style.css'

import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

import { maximize } from "./utils/window"
import { setWallpaper } from "./utils/settings"

let settingsWindow =
  null;

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
    settings
  );

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

    };

  // let maximized = false;
  // let prev = {};
  maximize(w);

  w.onclick =
    () => w.style.zIndex = ++z;

  return w;

}

function drag(el) {

  const title =
    el.querySelector(
      ".title"
    );

  let dragging =
    false;

  let offsetX =
    0;

  let offsetY =
    0;

  let targetX =
    0;

  let targetY =
    0;

  let frame =
    null;

  function render() {

    el.style.left =
      targetX +
      "px";

    el.style.top =
      targetY +
      "px";

    frame =
      null;

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

      document.body.style.cursor =
        "grabbing";

    };

  document.addEventListener(
    "mousemove",

    e => {

      if (
        !dragging
      )
        return;

      targetX =
        e.clientX -
        offsetX;

      targetY =
        e.clientY -
        offsetY;

      if (
        !frame
      ) {

        frame =
          requestAnimationFrame(
            render
          );

      }

    }
  );

  document.addEventListener(
    "mouseup",

    () => {

      dragging =
        false;

      document.body.style.cursor =
        "";

    }
  );

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
                class="editorjs"></div>
            `
    );
  //#region 1
  // let editor =
  //   new EditorJS({

  //     holder:
  //       "editorjs",

  //     autofocus:
  //       true,

  //     data:
  //       saved
  //         ?
  //         JSON.parse(
  //           saved
  //         )
  //         :
  //         {
  //           blocks: []
  //         },

  //     tools: {

  //       header: Header,

  //       list: EditorjsList,

  //       paragraph:
  //         Paragraph

  //     },

  //     async onChange() {

  //       const data =
  //         await editor.save();

  //       localStorage.setItem(
  //         "notes",
  //         JSON.stringify(
  //           data
  //         )
  //       );

  //     }

  //   });
  //#endregion

  const crepe = new Crepe({
    root: w.querySelector("#editorjs"),

    defaultValue:
      saved ??
      "# Welcome\n\nStart typing..."
  });

  await crepe.create();
  crepe.create()
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
`
    );

  settingsWindow.addEventListener(
    "remove",
    () => {

      settingsWindow =
        null;

    }
  );

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
        "<h2>Empty</h2>"
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