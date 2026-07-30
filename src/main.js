import Application from "./core/Application.js";
import { flavors } from "@catppuccin/palette";

import "./styles/main.css";

const app = new Application();
const themeManager = new ThemeManager();

app.boot();

import ThemeManager from "./core/ThemeManager.js";

window.app = app;