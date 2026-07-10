import "./styles/main.css";

import Application from "./core/Application.js";

const app = new Application();

app.boot();


window.app = app;