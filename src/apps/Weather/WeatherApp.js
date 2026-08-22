import App from "../app.js";
import "../../styles/apps/weather.css";

export default class WeatherApp extends App {
    static manifest = {
        id: "weather",
        name: "Weather",
        icon: "🌤️",
        width: 420,
        height: 520
    };

    #window = null;
    #city = null;

    #unit = "celsius";
    #currentWeatherData = null;
    #currentLocation = null;

    async mount(window, eventBus, settingsStore) {
        super.mount(window);

        this.#window = window;

        window.content.innerHTML = `
    <div class="weather-app">

        <div class="weather-app__search">
            <input class="weather-app__search-input" type="text" placeholder="Search city..." autocomplete="off" />

            <button class="weather-app__search-button" type="button">
                Search
            </button>
        </div>
        <div class="weather-app__controls">

            <div class="weather-app__units">
                <button class="weather-app__unit-button is-active" type="button" data-unit="celsius">
                    °C
                </button>

                <button class="weather-app__unit-button" type="button" data-unit="fahrenheit">
                    °F
                </button>
            </div>

            <button class="weather-app__refresh" type="button" aria-label="Refresh weather">
                ↻ Refresh
            </button>

        </div>

        <div class="weather-app__search-results" data-weather="search-results"></div>

        <div class="weather-app__header">
            <div>
                <div class="weather-app__location">
                    Loading...
                </div>

                <div class="weather-app__condition">
                    Loading weather...
                </div>
            </div>

            <div class="weather-app__icon" aria-hidden="true">
                🌤️
            </div>
        </div>

        <div class="weather-app__temperature">
            --°
        </div>

        <div class="weather-app__details">

            <div class="weather-app__detail">
                <span class="weather-app__detail-label">
                    Feels like
                </span>

                <span class="weather-app__detail-value" data-weather="feels-like">
                    --°
                </span>
            </div>

            <div class="weather-app__detail">
                <span class="weather-app__detail-label">
                    Humidity
                </span>

                <span class="weather-app__detail-value" data-weather="humidity">
                    --%
                </span>
            </div>

            <div class="weather-app__detail">
                <span class="weather-app__detail-label">
                    Wind
                </span>

                <span class="weather-app__detail-value" data-weather="wind">
                    -- km/h
                </span>
            </div>

        </div>

        <div class="weather-app__forecast">

            <div class="weather-app__forecast-title">
                Forecast
            </div>

            <div class="weather-app__forecast-list" data-weather="forecast"></div>

        </div>

    </div>
    `;

        const searchInput =
            window.content.querySelector(
                ".weather-app__search-input"
            );

        const searchButton =
            window.content.querySelector(
                ".weather-app__search-button"
            );

        searchButton.addEventListener("click", () => {
            this.#searchCity(searchInput.value);
        });

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.#searchCity(searchInput.value);
            }
        });

        const refreshButton =
            window.content.querySelector(
                ".weather-app__refresh"
            );

        refreshButton.addEventListener("click", () => {
            this.#refreshWeather();
        });

        const unitButtons =
            window.content.querySelectorAll(
                ".weather-app__unit-button"
            );

        unitButtons.forEach((button) => {
            button.addEventListener("click", () => {
                this.#setUnit(button.dataset.unit);
            });
        });

        const savedLocation =
            localStorage.getItem("novadesk-weather-location");

        if (savedLocation) {
            try {
                const location = JSON.parse(savedLocation);

                await this.#loadWeather(location);
            } catch {
                localStorage.removeItem(
                    "novadesk-weather-location"
                );

                await this.#searchCity("New Delhi");
            }
        } else {
            await this.#searchCity("New Delhi");
        }
    }

    async #loadWeather(location) {
        this.#currentLocation = location;

        try {
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?` +
                new URLSearchParams({
                    latitude: location.latitude,
                    longitude: location.longitude,

                    current: [
                        "temperature_2m",
                        "relative_humidity_2m",
                        "apparent_temperature",
                        "weather_code",
                        "wind_speed_10m"
                    ].join(","),

                    daily: [
                        "weather_code",
                        "temperature_2m_max",
                        "temperature_2m_min"
                    ].join(","),

                    timezone: "auto",
                    forecast_days: "5"
                })
            );

            if (!weatherResponse.ok) {
                throw new Error("Failed to load weather.");
            }

            const weatherData = await weatherResponse.json();
            this.#currentWeatherData = weatherData;

            this.#renderWeather(location, weatherData);

        } catch (error) {
            console.error("WeatherApp:", error);

            this.#showError();
        }
    }

    #renderWeather(location, data) {
        const current = data.current;
        const daily = data.daily;

        const condition = this.#getWeatherCondition(
            current.weather_code
        );

        const locationElement =
            this.#window.content.querySelector(
                ".weather-app__location"
            );

        const conditionElement =
            this.#window.content.querySelector(
                ".weather-app__condition"
            );

        const iconElement =
            this.#window.content.querySelector(
                ".weather-app__icon"
            );

        const temperatureElement =
            this.#window.content.querySelector(
                ".weather-app__temperature"
            );

        const feelsLikeElement =
            this.#window.content.querySelector(
                '[data-weather="feels-like"]'
            );

        const humidityElement =
            this.#window.content.querySelector(
                '[data-weather="humidity"]'
            );

        const windElement =
            this.#window.content.querySelector(
                '[data-weather="wind"]'
            );

        locationElement.textContent =
            `${location.name}, ${location.country_code}`;

        conditionElement.textContent =
            condition.description;

        iconElement.textContent =
            condition.icon;

        temperatureElement.textContent =
            this.#formatTemperature(
                current.temperature_2m
            );

        feelsLikeElement.textContent =
            this.#formatTemperature(
                current.apparent_temperature
            );

        humidityElement.textContent =
            `${Math.round(current.relative_humidity_2m)}%`;

        windElement.textContent =
            `${Math.round(current.wind_speed_10m)} km/h`;

        this.#renderForecast(daily);
    }

    async #refreshWeather() {
        if (!this.#currentLocation) {
            return;
        }

        const button =
            this.#window.content.querySelector(
                ".weather-app__refresh"
            );

        button.disabled = true;
        button.textContent = "↻ Refreshing...";

        try {
            await this.#loadWeather(
                this.#currentLocation
            );
        } finally {
            button.disabled = false;
            button.textContent = "↻ Refresh";
        }
    }

    #renderForecast(daily) {
        const forecastElement =
            this.#window.content.querySelector(
                '[data-weather="forecast"]'
            );

        forecastElement.innerHTML = "";

        for (let i = 0; i < daily.time.length; i++) {
            const date = new Date(
                `${daily.time[i]}T12:00:00`
            );

            const condition =
                this.#getWeatherCondition(
                    daily.weather_code[i]
                );

            const day = i === 0
                ? "Today"
                : date.toLocaleDateString("en-US", {
                    weekday: "short"
                });

            const item = document.createElement("div");

            item.className = "weather-app__forecast-item";

            item.innerHTML = `
                <span class="weather-app__forecast-day">
                    ${day}
                </span>

                <span class="weather-app__forecast-icon">
                    ${condition.icon}
                </span>

                <span class="weather-app__forecast-condition">
                    ${condition.description}
                </span>

                <span class="weather-app__forecast-temperature">
                    ${this.#formatTemperature(
                daily.temperature_2m_max[i]
            )}
                    /
                    ${this.#formatTemperature(
                daily.temperature_2m_min[i]
            )}
                </span>
            `;

            forecastElement.appendChild(item);
        }
    }

    #getWeatherCondition(code) {
        const conditions = {
            0: {
                description: "Clear sky",
                icon: "☀️"
            },

            1: {
                description: "Mainly clear",
                icon: "🌤️"
            },

            2: {
                description: "Partly cloudy",
                icon: "⛅"
            },

            3: {
                description: "Overcast",
                icon: "☁️"
            },

            45: {
                description: "Fog",
                icon: "🌫️"
            },

            48: {
                description: "Rime fog",
                icon: "🌫️"
            },

            51: {
                description: "Light drizzle",
                icon: "🌦️"
            },

            53: {
                description: "Drizzle",
                icon: "🌦️"
            },

            55: {
                description: "Heavy drizzle",
                icon: "🌧️"
            },

            61: {
                description: "Light rain",
                icon: "🌦️"
            },

            63: {
                description: "Rain",
                icon: "🌧️"
            },

            65: {
                description: "Heavy rain",
                icon: "🌧️"
            },

            71: {
                description: "Light snow",
                icon: "🌨️"
            },

            73: {
                description: "Snow",
                icon: "🌨️"
            },

            75: {
                description: "Heavy snow",
                icon: "❄️"
            },

            80: {
                description: "Rain showers",
                icon: "🌦️"
            },

            81: {
                description: "Rain showers",
                icon: "🌧️"
            },

            82: {
                description: "Heavy showers",
                icon: "⛈️"
            },

            95: {
                description: "Thunderstorm",
                icon: "⛈️"
            },

            96: {
                description: "Thunderstorm with hail",
                icon: "⛈️"
            },

            99: {
                description: "Thunderstorm with heavy hail",
                icon: "⛈️"
            }
        };

        return conditions[code] ?? {
            description: "Unknown",
            icon: "🌡️"
        };
    }

    async #searchCity(city) {
        city = city.trim();

        if (!city) {
            return;
        }

        const resultsElement =
            this.#window.content.querySelector(
                '[data-weather="search-results"]'
            );

        resultsElement.innerHTML = `
        <div class="weather-app__search-loading">
            Searching...
        </div>
    `;

        try {
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?` +
                new URLSearchParams({
                    name: city,
                    count: "5",
                    language: "en",
                    format: "json"
                })
            );

            if (!response.ok) {
                throw new Error("Failed to search location.");
            }

            const data = await response.json();

            if (!data.results?.length) {
                resultsElement.innerHTML = `
                <div class="weather-app__search-empty">
                    No cities found.
                </div>
            `;

                return;
            }

            this.#renderSearchResults(data.results);

        } catch (error) {
            console.error("Weather search:", error);

            resultsElement.innerHTML = `
            <div class="weather-app__search-empty">
                Unable to search for cities.
            </div>
        `;
        }
    }

    async #selectCity(location) {
        const resultsElement =
            this.#window.content.querySelector(
                '[data-weather="search-results"]'
            );

        const searchInput =
            this.#window.content.querySelector(
                ".weather-app__search-input"
            );

        searchInput.value = location.name;

        resultsElement.innerHTML = "";

        this.#city = location.name;

        localStorage.setItem(
            "novadesk-weather-location",
            JSON.stringify({
                name: location.name,
                latitude: location.latitude,
                longitude: location.longitude,
                country: location.country,
                country_code: location.country_code,
                admin1: location.admin1
            })
        );

        await this.#loadWeather(location);
    }

    #renderSearchResults(results) {
        const resultsElement =
            this.#window.content.querySelector(
                '[data-weather="search-results"]'
            );

        resultsElement.innerHTML = "";

        for (const location of results) {
            const button = document.createElement("button");

            button.type = "button";
            button.className =
                "weather-app__search-result";

            const region = location.admin1
                ? `${location.admin1}, `
                : "";

            button.innerHTML = `
            <span class="weather-app__search-result-name">
                ${location.name}
            </span>

            <span class="weather-app__search-result-location">
                ${region}${location.country}
            </span>
        `;

            button.addEventListener("click", async () => {
                await this.#selectCity(location);
            });

            resultsElement.appendChild(button);
        }
    }

    #showError() {
        const conditionElement =
            this.#window.content.querySelector(
                ".weather-app__condition"
            );

        const locationElement =
            this.#window.content.querySelector(
                ".weather-app__location"
            );

        const temperatureElement =
            this.#window.content.querySelector(
                ".weather-app__temperature"
            );

        locationElement.textContent = "Weather unavailable";
        conditionElement.textContent = "Unable to load weather";
        temperatureElement.textContent = "--°";
    }

    #setUnit(unit) {
        if (
            unit !== "celsius" &&
            unit !== "fahrenheit"
        ) {
            return;
        }

        this.#unit = unit;

        const buttons =
            this.#window.content.querySelectorAll(
                ".weather-app__unit-button"
            );

        buttons.forEach((button) => {
            button.classList.toggle(
                "is-active",
                button.dataset.unit === unit
            );
        });

        if (
            this.#currentWeatherData &&
            this.#currentLocation
        ) {
            this.#renderWeather(
                this.#currentLocation,
                this.#currentWeatherData
            );
        }
    }

    #convertTemperature(celsius) {
        if (this.#unit === "fahrenheit") {
            return (Math.round(celsius) * 9 / 5) + 32;
        }

        return celsius;
    }

    #formatTemperature(value) {
        return `${Math.round(
            this.#convertTemperature(value)
        )}°`;
    }

    unmount() {
        this.#window = null;

        super.unmount();
    }
}