import App from "../app.js";
import "../../styles/apps/weather.css";

export default class WeatherApp extends App {
    static manifest = {
        id: "weather",
        name: "Weather",
        icon: "W",
        width: 420,
        height: 520
    };

    #window = null;

    async mount(window, eventBus, settingsStore) {
        super.mount(window);

        this.#window = window;

        window.content.innerHTML = `
            <div class="weather-app">

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

                        <span class="weather-app__detail-value"
                              data-weather="feels-like">
                            --°
                        </span>
                    </div>

                    <div class="weather-app__detail">
                        <span class="weather-app__detail-label">
                            Humidity
                        </span>

                        <span class="weather-app__detail-value"
                              data-weather="humidity">
                            --%
                        </span>
                    </div>

                    <div class="weather-app__detail">
                        <span class="weather-app__detail-label">
                            Wind
                        </span>

                        <span class="weather-app__detail-value"
                              data-weather="wind">
                            -- km/h
                        </span>
                    </div>

                </div>

                <div class="weather-app__forecast">

                    <div class="weather-app__forecast-title">
                        Forecast
                    </div>

                    <div
                        class="weather-app__forecast-list"
                        data-weather="forecast"
                    ></div>

                </div>

            </div>
        `;

        await this.#loadWeather();
    }

    async #loadWeather() {
        // Change this city for testing.
        const city = "New Delhi";

        try {
            const locationResponse = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?` +
                new URLSearchParams({
                    name: city,
                    count: "1",
                    language: "en",
                    format: "json",
                    countryCode: "IN"
                })
            );

            if (!locationResponse.ok) {
                throw new Error("Failed to find location.");
            }

            const locationData = await locationResponse.json();

            if (!locationData.results?.length) {
                throw new Error("Location not found.");
            }

            const location = locationData.results[0];

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
            `${Math.round(current.temperature_2m)}°`;

        feelsLikeElement.textContent =
            `${Math.round(current.apparent_temperature)}°`;

        humidityElement.textContent =
            `${Math.round(current.relative_humidity_2m)}%`;

        windElement.textContent =
            `${Math.round(current.wind_speed_10m)} km/h`;

        this.#renderForecast(daily);
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
                    ${Math.round(daily.temperature_2m_max[i])}°
                    /
                    ${Math.round(daily.temperature_2m_min[i])}°
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

    unmount() {
        this.#window = null;

        super.unmount();
    }
}