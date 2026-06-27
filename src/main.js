import "@catppuccin/palette/css/catppuccin.css"
import './style.css'

import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

import { maximize } from "./utils/window"

// document
//   .querySelector(".app.notes")
//   .addEventListener(
//     "click",
//     notes
//   );


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

    <button class="btn max">
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

  document.onmousemove = e => {

    if (el.style.width === "100vw")
      return;

    el.style.left =
      e.clientX - x + "px";

    el.style.top =
      e.clientY - y + "px";
  };

  w.querySelector(
    ".close"
  )
    .onclick =
    () => w.remove();

  // let maximized = false;
  // let prev = {};
  maximize(w);

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