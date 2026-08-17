import App from "../app.js";
import "../../styles/apps/calculator.css";

export default class CalculatorApp extends App {
    static manifest = {
        id: "calculator",
        name: "Calculator",
        icon: "C",

        width: 340,
        height: 500,

        minWidth: 340,
        minHeight: 500
    };

    #window = null;

    #display = "0";
    #stored = null;
    #operator = null;
    #waitingForOperand = false;
    #expression = "";

    async mount(window, eventBus, settingsStore) {
        super.mount(window);

        this.#window = window;

        window.content.innerHTML = `
            <div class="calculator-app">

                <div class="calculator-app__display">
                    <div
                        class="calculator-app__expression"
                        data-calculator="expression">
                    </div>

                    <div
                        class="calculator-app__value"
                        data-calculator="display">
                        0
                    </div>
                </div>

                <div class="calculator-app__keypad">

                    <button
                        class="calculator-app__button calculator-app__button--function"
                        type="button"
                        data-type="clear">
                        C
                    </button>

                    <button
                        class="calculator-app__button calculator-app__button--function"
                        type="button"
                        data-type="fn"
                        data-value="sign">
                        +/−
                    </button>

                    <button
                        class="calculator-app__button calculator-app__button--function"
                        type="button"
                        data-type="fn"
                        data-value="percent">
                        %
                    </button>

                    <button
                        class="calculator-app__button calculator-app__button--operator"
                        type="button"
                        data-type="operator"
                        data-value="/">
                        ÷
                    </button>


                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="digit"
                        data-value="7">
                        7
                    </button>

                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="digit"
                        data-value="8">
                        8
                    </button>

                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="digit"
                        data-value="9">
                        9
                    </button>

                    <button
                        class="calculator-app__button calculator-app__button--operator"
                        type="button"
                        data-type="operator"
                        data-value="*">
                        ×
                    </button>


                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="digit"
                        data-value="4">
                        4
                    </button>

                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="digit"
                        data-value="5">
                        5
                    </button>

                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="digit"
                        data-value="6">
                        6
                    </button>

                    <button
                        class="calculator-app__button calculator-app__button--operator"
                        type="button"
                        data-type="operator"
                        data-value="-">
                        −
                    </button>


                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="digit"
                        data-value="1">
                        1
                    </button>

                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="digit"
                        data-value="2">
                        2
                    </button>

                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="digit"
                        data-value="3">
                        3
                    </button>

                    <button
                        class="calculator-app__button calculator-app__button--operator"
                        type="button"
                        data-type="operator"
                        data-value="+">
                        +
                    </button>


                    <button
                        class="calculator-app__button calculator-app__button--zero"
                        type="button"
                        data-type="digit"
                        data-value="0">
                        0
                    </button>

                    <button
                        class="calculator-app__button"
                        type="button"
                        data-type="decimal">
                        .
                    </button>

                    <button
                        class="calculator-app__button calculator-app__button--equals"
                        type="button"
                        data-type="equals">
                        =
                    </button>

                </div>

            </div>
        `;

        this.#setupEvents();
        this.#updateDisplay();
    }

    #setupEvents() {
        const buttons =
            this.#window.content.querySelectorAll(
                ".calculator-app__button"
            );

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                this.#handleButton(button);
            });
        });

        this.#window.content.addEventListener(
            "keydown",
            (event) => {
                this.#handleKeyboard(event);
            }
        );
    }

    #handleButton(button) {
        if (
            this.#display === "Error" &&
            button.dataset.type !== "clear"
        ) {
            return;
        }

        const type = button.dataset.type;
        const value = button.dataset.value;

        switch (type) {
            case "digit":
                this.#handleDigit(value);
                break;

            case "decimal":
                this.#handleDecimal();
                break;

            case "operator":
                this.#handleOperator(value);
                break;

            case "equals":
                this.#handleEquals();
                break;

            case "clear":
                this.#handleClear();
                break;

            case "fn":
                if (value === "sign") {
                    this.#handleToggleSign();
                } else if (value === "percent") {
                    this.#handlePercent();
                }
                break;
        }

        this.#updateDisplay();
    }

    #handleKeyboard(event) {
        const key = event.key;

        if (/^[0-9]$/.test(key)) {
            this.#handleDigit(key);
        } else if (key === ".") {
            this.#handleDecimal();
        } else if (
            key === "+" ||
            key === "-" ||
            key === "*" ||
            key === "/"
        ) {
            this.#handleOperator(key);
        } else if (
            key === "Enter" ||
            key === "="
        ) {
            event.preventDefault();
            this.#handleEquals();
        } else if (
            key === "Escape" ||
            key === "Delete"
        ) {
            this.#handleClear();
        } else if (key === "Backspace") {
            this.#handleBackspace();
        } else if (key === "%") {
            this.#handlePercent();
        } else {
            return;
        }

        this.#updateDisplay();
    }

    #handleDigit(digit) {
        if (this.#waitingForOperand) {
            this.#display = digit;
            this.#waitingForOperand = false;
            return;
        }

        if (this.#display === "0") {
            this.#display = digit;
            return;
        }

        if (this.#display.length < 12) {
            this.#display += digit;
        }
    }

    #handleDecimal() {
        if (this.#waitingForOperand) {
            this.#display = "0.";
            this.#waitingForOperand = false;
            return;
        }

        if (!this.#display.includes(".")) {
            this.#display += ".";
        }
    }

    #handleOperator(operator) {
        const current = Number.parseFloat(
            this.#display
        );

        if (
            this.#stored !== null &&
            !this.#waitingForOperand
        ) {
            const result = this.#calculate(
                this.#stored,
                this.#operator,
                current
            );

            const formatted = this.#formatNumber(result);

            this.#display = formatted;

            if (result === "Error") {
                this.#stored = null;
            } else {
                this.#stored = result;
            }

            this.#expression =
                `${formatted} ${this.#operatorSymbol(operator)}`;
        } else {
            this.#stored = current;

            this.#expression =
                `${this.#display} ${this.#operatorSymbol(operator)}`;
        }

        this.#operator = operator;
        this.#waitingForOperand = true;
    }

    #handleEquals() {
        if (
            this.#stored === null ||
            this.#operator === null
        ) {
            return;
        }

        const current =
            Number.parseFloat(this.#display);

        const result = this.#calculate(
            this.#stored,
            this.#operator,
            current
        );

        const formatted =
            this.#formatNumber(result);

        this.#expression =
            `${this.#stored} ` +
            `${this.#operatorSymbol(this.#operator)} ` +
            `${this.#display} =`;

        this.#display = formatted;

        this.#stored = null;
        this.#operator = null;
        this.#waitingForOperand = true;
    }

    #handleClear() {
        this.#display = "0";
        this.#stored = null;
        this.#operator = null;
        this.#waitingForOperand = false;
        this.#expression = "";
    }

    #handleToggleSign() {
        if (this.#display === "0") {
            return;
        }

        const value =
            Number.parseFloat(this.#display) * -1;

        this.#display = value.toString();
    }

    #handlePercent() {
        const value =
            Number.parseFloat(this.#display) / 100;

        this.#display = value.toString();
    }

    #handleBackspace() {
        if (
            this.#waitingForOperand ||
            this.#display === "Error"
        ) {
            return;
        }

        if (this.#display.length <= 1) {
            this.#display = "0";
            return;
        }

        this.#display =
            this.#display.slice(0, -1);
    }

    #calculate(a, operator, b) {
        switch (operator) {
            case "+":
                return a + b;

            case "-":
                return a - b;

            case "*":
                return a * b;

            case "/":
                return b !== 0
                    ? a / b
                    : "Error";

            default:
                return b;
        }
    }

    #operatorSymbol(operator) {
        return {
            "+": "+",
            "-": "−",
            "*": "×",
            "/": "÷"
        }[operator] ?? operator;
    }

    #formatNumber(value) {
        if (value === "Error") {
            return "Error";
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "Error";
        }

        const string = number.toString();

        if (string.includes(".")) {
            const parts = string.split(".");

            if (
                parts[1] &&
                parts[1].length > 8
            ) {
                return Number(
                    number.toFixed(8)
                ).toString();
            }
        }

        if (Math.abs(number) >= 1e10) {
            return number.toExponential(4);
        }

        return string;
    }

    #updateDisplay() {
        if (!this.#window) {
            return;
        }

        const display =
            this.#window.content.querySelector(
                '[data-calculator="display"]'
            );

        const expression =
            this.#window.content.querySelector(
                '[data-calculator="expression"]'
            );

        if (!display || !expression) {
            return;
        }

        display.textContent = this.#display;
        expression.textContent = this.#expression;

        display.classList.toggle(
            "is-error",
            this.#display === "Error"
        );

        display.classList.remove(
            "is-large",
            "is-medium",
            "is-small"
        );

        if (this.#display.length > 9) {
            display.classList.add("is-small");
        } else if (this.#display.length > 6) {
            display.classList.add("is-medium");
        } else {
            display.classList.add("is-large");
        }

        const buttons =
            this.#window.content.querySelectorAll(
                ".calculator-app__button--operator"
            );

        buttons.forEach((button) => {
            const active =
                button.dataset.value === this.#operator &&
                this.#waitingForOperand;

            button.classList.toggle(
                "is-active",
                active
            );
        });
    }

    unmount() {
        this.#window = null;

        super.unmount();
    }
}