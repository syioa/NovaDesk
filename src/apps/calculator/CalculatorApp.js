import App from "../app.js";
import "../../styles/apps/calculator.css";

export default class CalculatorApp extends App {
    static manifest = {
        id: "calculator",
        name: "Calculator",
        icon: "/icons/calculator.svg",

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

    #angleMode = "deg";
    #inverseMode = false;
    #exponentMode = false;
    #parenthesisCount = 0;

    async mount(window, eventBus, settingsStore) {
        super.mount(window);

        this.#window = window;

        this.#window.content.tabIndex = 0;

        this.#window.content.focus();

        window.content.innerHTML = `
<div class="calculator-app">

    <!-- ========================================
         Display
    ======================================== -->

    <div class="calculator-app__display">

        <div class="calculator-app__expression" data-calculator="expression">
        </div>

        <div class="calculator-app__value" data-calculator="display">
            0
        </div>

    </div>

    <!-- ========================================
         Basic Calculator
    ======================================== -->

    <div class="calculator-app__keypad calculator-app__keypad--basic">

        <button class="calculator-app__button calculator-app__button--function" type="button" data-type="clear">
            CE
        </button>

        <button class="calculator-app__button calculator-app__button--function" type="button" data-type="fn"
            data-value="sign">
            +/−
        </button>

        <button class="calculator-app__button calculator-app__button--function" type="button" data-type="fn"
            data-value="percent">
            %
        </button>

        <button class="calculator-app__button calculator-app__button--operator" type="button" data-type="operator"
            data-value="/">
            ÷
        </button>

        <button class="calculator-app__button" type="button" data-type="digit" data-value="7">
            7
        </button>

        <button class="calculator-app__button" type="button" data-type="digit" data-value="8">
            8
        </button>

        <button class="calculator-app__button" type="button" data-type="digit" data-value="9">
            9
        </button>

        <button class="calculator-app__button calculator-app__button--operator" type="button" data-type="operator"
            data-value="*">
            ×
        </button>

        <button class="calculator-app__button" type="button" data-type="digit" data-value="4">
            4
        </button>

        <button class="calculator-app__button" type="button" data-type="digit" data-value="5">
            5
        </button>

        <button class="calculator-app__button" type="button" data-type="digit" data-value="6">
            6
        </button>

        <button class="calculator-app__button calculator-app__button--operator" type="button" data-type="operator"
            data-value="-">

            −
        </button>
        <button class="calculator-app__button" type="button" data-type="digit" data-value="1">
            1
        </button>

        <button class="calculator-app__button" type="button" data-type="digit" data-value="2">
            2
        </button>

        <button class="calculator-app__button" type="button" data-type="digit" data-value="3">
            3
        </button>

        <button class="calculator-app__button calculator-app__button--operator" type="button" data-type="operator"
            data-value="+">
            +
        </button>

        <button class="calculator-app__button calculator-app__button--zero" type="button" data-type="digit"
            data-value="0">
            0
        </button>

        <button class="calculator-app__button" type="button" data-type="decimal">
            .
        </button>

        <button class="calculator-app__button calculator-app__button--equals" type="button" data-type="equals">
            =
        </button>

    </div>

    <!-- ========================================
     Scientific Calculator
======================================== -->

    <div class="calculator-app__scientific">

        <div class="calculator-app__scientific-keypad">

            <!-- Row 1 -->

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="angle"
                data-value="deg">
                Deg
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="angle"
                data-value="rad">
                Rad
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button"
                data-type="factorial">
                x!
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button"
                data-type="parenthesis" data-value="(">
                (
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button"
                data-type="parenthesis" data-value=")">
                )
            </button>

            <button class="calculator-app__button calculator-app__button--function" type="button" data-type="fn"
                data-value="percent">
                %
            </button>

            <button class="calculator-app__button calculator-app__button--function" type="button" data-type="clear">
                CE
            </button>

            <!-- Row 2 -->

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="inverse">
                Inv
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="function"
                data-value="sin">
                sin
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="function"
                data-value="ln">
                ln
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="7">
                7
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="8">
                8
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="9">
                9
            </button>

            <button class="calculator-app__button calculator-app__button--operator" type="button" data-type="operator"
                data-value="/">
                ÷
            </button>

            <!-- Row 3 -->

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="constant"
                data-value="pi">
                π
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="function"
                data-value="cos">
                cos
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="function"
                data-value="log">
                log
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="4">
                4
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="5">
                5
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="6">
                6
            </button>

            <button class="calculator-app__button calculator-app__button--operator" type="button" data-type="operator"
                data-value="*">
                ×
            </button>

            <!-- Row 4 -->

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="constant"
                data-value="e">
                e
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="function"
                data-value="tan">
                tan
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="function"
                data-value="sqrt">
                √
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="1">
                1
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="2">
                2
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="3">
                3
            </button>

            <button class="calculator-app__button calculator-app__button--operator" type="button" data-type="operator"
                data-value="-">
                −
            </button>

            <!-- Row 5 -->

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="fn"
                data-value="sign">
                +/−
            </button>

            <button class="calculator-app__button calculator-app__button--scientific" type="button" data-type="exp">
                EXP
            </button>

            <button
                class="calculator-app__button calculator-app__button--scientific"
                type="button"
                data-type="operator"
                data-value="^">
                xʸ
            </button>

            <button class="calculator-app__button" type="button" data-type="digit" data-value="0">
                0
            </button>

            <button class="calculator-app__button" type="button" data-type="decimal">
                .
            </button>

            <button class="calculator-app__button calculator-app__button--equals" type="button" data-type="equals">
                =
            </button>

            <button class="calculator-app__button calculator-app__button--operator" type="button" data-type="operator"
                data-value="+">
                +
            </button>

        </div>

    </div>

</div>`;

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
                this.#handleClearEntry();
                break;

            case "fn":
                if (value === "sign") {
                    this.#handleToggleSign();
                } else if (value === "percent") {
                    this.#handlePercent();
                }
                break;

            case "angle":
                this.#handleAngle(value);
                break;

            case "inverse":
                this.#handleInverse();
                break;

            case "function":
                this.#handleScientificFunction(value);
                break;

            case "constant":
                this.#handleConstant(value);
                break;

            case "factorial":
                this.#handleFactorial();
                break;

            case "parenthesis":
                this.#handleParenthesis(value);
                break;

            case "exp":
                this.#handleExp();
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

            if (
                this.#expression &&
                /[+\-*/^]$/.test(this.#expression)
            ) {
                this.#expression += digit;
            } else {
                this.#expression = digit;
            }

            return;
        }

        if (this.#display === "0") {
            this.#display = digit;
            this.#expression = digit;
            return;
        }

        if (this.#display.length < 12) {
            this.#display += digit;

            // If we're entering the first number,
            // the expression must exactly match it.
            if (this.#stored === null) {
                this.#expression = this.#display;
            } else {
                // We're entering the second/current operand.
                const match = this.#expression.match(/(\d*\.?\d+)$/);

                if (match) {
                    const start =
                        this.#expression.length - match[0].length;

                    this.#expression =
                        this.#expression.slice(0, start) +
                        this.#display;
                } else {
                    this.#expression += this.#display;
                }
            }
        }
    }

    #handleDecimal() {
        if (this.#waitingForOperand) {
            this.#display = "0.";
            this.#waitingForOperand = false;

            this.#expression += "0.";

            return;
        }

        if (!this.#display.includes(".")) {
            this.#display += ".";

            this.#expression += ".";
        }
    }

    #handleOperator(operator) {
        const current = Number.parseFloat(this.#display);

        // Always synchronize the current operand before
        // committing an operator.
        if (
            this.#stored === null &&
            !this.#waitingForOperand
        ) {
            this.#expression = this.#display;
        }

        // If the previous action was "=",
        // start a new calculation using the displayed result.
        if (
            this.#expression.endsWith(" =") &&
            this.#waitingForOperand
        ) {
            this.#expression =
                `${this.#display}${operator}`;

            this.#stored = current;
            this.#operator = operator;
            this.#waitingForOperand = true;

            return;
        }

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
                this.#operator = null;
                this.#waitingForOperand = true;
                this.#expression = "Error";
                return;
            }

            this.#stored = result;
        } else {
            this.#stored = current;
        }

        if (!this.#expression) {
            this.#expression = this.#display;
        }

        // Replace an existing operator instead of adding another one.
        if (/[+\-*/^]$/.test(this.#expression)) {
            this.#expression =
                this.#expression.slice(0, -1);
        }

        this.#expression += operator;

        this.#operator = operator;
        this.#waitingForOperand = true;
    }

    #handleEquals() {
        if (!this.#expression) {
            return;
        }

        if (this.#expression.endsWith(" =")) {
            return;
        }

        if (this.#parenthesisCount !== 0) {
            return;
        }

        let expression = this.#expression;

        // Remove trailing operator.
        expression = expression.replace(
            /[+\-*/^]$/,
            ""
        );

        const result =
            this.#evaluateExpression(expression);

        if (result === "Error") {
            this.#display = "Error";
            this.#expression = "";
            this.#stored = null;
            this.#operator = null;
            this.#waitingForOperand = true;
            return;
        }

        this.#expression = `${expression} =`;
        this.#display = this.#formatNumber(result);

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

        this.#angleMode = "deg";
        this.#inverseMode = false;
        this.#exponentMode = false;
        this.#parenthesisCount = 0;
    }

    #handleClearEntry() {
        if (this.#display === "Error") {
            this.#handleClear();
            return;
        }

        // CE immediately after "=":
        // clear the result and start a fresh calculation.
        if (
            this.#expression.endsWith(" =") &&
            this.#waitingForOperand
        ) {
            this.#display = "0";
            this.#stored = null;
            this.#operator = null;
            this.#waitingForOperand = false;
            this.#expression = "";

            return;
        }

        if (this.#waitingForOperand) {
            this.#display = "0";
            this.#waitingForOperand = false;
            return;
        }

        if (this.#stored !== null && this.#display === "0") {
            this.#handleClear();
            return;
        }

        if (
            this.#display.length <= 1 ||
            (this.#display.length === 2 &&
                this.#display.startsWith("-"))
        ) {
            this.#display = "0";
            return;
        }

        this.#display = this.#display.slice(0, -1);

        // Keep the expression synchronized with the display
        // while editing the current number.
        if (this.#stored === null) {
            this.#expression = this.#display;
        } else {
            const match = this.#expression.match(/(\d*\.?\d+)$/);

            if (match) {
                const start =
                    this.#expression.length - match[0].length;

                this.#expression =
                    this.#expression.slice(0, start) +
                    this.#display;
            }
        }
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

    #handleAngle(mode) {
        this.#angleMode = mode;
    }

    #handleInverse() {
        this.#inverseMode = !this.#inverseMode;
    }

    #handleScientificFunction(fn) {
        const value = Number.parseFloat(this.#display);

        if (!Number.isFinite(value)) {
            this.#display = "Error";
            return;
        }

        let result;

        switch (fn) {
            case "sin": {
                const angle = this.#angleMode === "deg"
                    ? value * Math.PI / 180
                    : value;

                result = this.#inverseMode
                    ? Math.asin(value)
                    : Math.sin(angle);

                if (this.#inverseMode && this.#angleMode === "deg") {
                    result *= 180 / Math.PI;
                }

                break;
            }

            case "cos": {
                const angle = this.#angleMode === "deg"
                    ? value * Math.PI / 180
                    : value;

                result = this.#inverseMode
                    ? Math.acos(value)
                    : Math.cos(angle);

                if (this.#inverseMode && this.#angleMode === "deg") {
                    result *= 180 / Math.PI;
                }

                break;
            }

            case "tan": {
                const angle = this.#angleMode === "deg"
                    ? value * Math.PI / 180
                    : value;

                result = this.#inverseMode
                    ? Math.atan(value)
                    : Math.tan(angle);

                if (this.#inverseMode && this.#angleMode === "deg") {
                    result *= 180 / Math.PI;
                }

                break;
            }

            case "sqrt":
                result = Math.sqrt(value);
                break;

            case "ln":
                result = Math.log(value);
                break;

            case "log":
                result = Math.log10(value);
                break;

            default:
                return;
        }

        this.#display = this.#formatNumber(result);
        this.#waitingForOperand = true;
        this.#expression = `${fn}(${value})`;
    }

    #handleConstant(constant) {
        if (constant === "pi") {
            this.#display = Math.PI.toString();
        } else if (constant === "e") {
            this.#display = Math.E.toString();
        }

        this.#waitingForOperand = true;
    }

    #handleFactorial() {
        const value = Number.parseFloat(this.#display);

        if (!Number.isInteger(value) || value < 0 || value > 170) {
            this.#display = "Error";
            return;
        }

        let result = 1;

        for (let i = 2; i <= value; i++) {
            result *= i;
        }

        this.#display = this.#formatNumber(result);
        this.#waitingForOperand = true;
        this.#expression = `${value}!`;
    }


    #handleExp() {
        const value = Number.parseFloat(this.#display);

        if (!Number.isFinite(value)) {
            this.#display = "Error";
            return;
        }

        this.#display = this.#formatNumber(
            value * Math.pow(10, 1)
        );

        this.#waitingForOperand = true;
        this.#expression = `${value} × 10`;
    }

    #handleParenthesis(value) {
        if (value === "(") {
            if (
                this.#display !== "0" &&
                !this.#waitingForOperand
            ) {
                this.#expression += "*";
            }

            this.#expression += "(";
            this.#parenthesisCount++;

            this.#display = "0";
            this.#waitingForOperand = false;

            return;
        }

        if (
            value === ")" &&
            this.#parenthesisCount > 0
        ) {
            if (
                this.#waitingForOperand ||
                this.#expression.endsWith("(")
            ) {
                return;
            }

            this.#expression += ")";
            this.#parenthesisCount--;

            const result =
                this.#evaluateExpression(this.#expression);

            if (result !== "Error") {
                this.#display =
                    this.#formatNumber(result);
            }

            this.#waitingForOperand = true;
        }
    }

    #handleBackspace() {
        if (
            this.#display === "Error" ||
            this.#waitingForOperand
        ) {
            return;
        }

        if (
            this.#display.length <= 1 ||
            (
                this.#display.length === 2 &&
                this.#display.startsWith("-")
            )
        ) {
            this.#display = "0";
        } else {
            this.#display = this.#display.slice(0, -1);
        }

        // Before an operator exists, the expression IS the display.
        if (this.#stored === null) {
            this.#expression = this.#display;
            return;
        }

        // After an operator, replace the current operand.
        const match = this.#expression.match(/(\d*\.?\d+)$/);

        if (match) {
            const start =
                this.#expression.length - match[0].length;

            this.#expression =
                this.#expression.slice(0, start) +
                this.#display;
        }
    }

    #evaluateExpression(expression) {
        try {
            const normalized = expression
                .replace(/×/g, "*")
                .replace(/÷/g, "/")
                .replace(/−/g, "-")
                .replace(/\^/g, "**");

            if (!/^[0-9+\-*/().\s*]+$/.test(normalized)) {
                return "Error";
            }

            const result = Function(
                `"use strict"; return (${normalized})`
            )();

            return Number.isFinite(result)
                ? result
                : "Error";
        } catch {
            return "Error";
        }
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

            case "^":
                return Math.pow(a, b);

            default:
                return b;
        }
    }

    #operatorSymbol(operator) {
        return {
            "+": "+",
            "-": "−",
            "*": "×",
            "/": "÷",
            "^": "^"
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

        const angleButtons =
            this.#window.content.querySelectorAll(
                '[data-type="angle"]'
            );

        angleButtons.forEach((button) => {
            const active =
                button.dataset.value === this.#angleMode;

            button.classList.toggle("is-active", active);
        });
    }

    unmount() {
        this.#window = null;

        super.unmount();
    }
}