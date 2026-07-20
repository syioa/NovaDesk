import App from "../app.js";

export default class WelcomeApp extends App {
    static get manifest() {
        return {
            id: "welcome",
            name: "Welcome",
            icon: "W",
        };
    }

    mount(window) {
        super.mount(window);

        window.content.innerHTML = `
            <h1>Welcome to NovaDesk</h1>
            <p>Your operating system has successfully started.</p>
        `;
    }
}