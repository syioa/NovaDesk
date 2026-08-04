import Application from "./core/Application.js";

import "./styles/main.css";

const app = new Application();

app.boot();

window.app = app;