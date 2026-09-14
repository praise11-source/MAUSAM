import { useEffect, useMemo, useState } from "react";
import "./App.css";

const BACKEND_URL = "https://mausam-eta9.onrender.com";

const DEFAULT_LOCATION = {
  latitude: 28.6139,
  longitude: 77.209,
};

const PERSONAS = [
  {
    id: "commuter",
    icon: "🚗",
    title: "Commuter",
    description: "Travel & road conditions",
  },
  {
    id: "traveller",
    icon: "✈️",
    title: "Traveller",
    description: "Outdoor plans & comfort",
  },
  {
    id: "agriculture",
    icon: "🌾",
    title: "Agriculture",
    description: "Crops, soil & irrigation",
  },
];

function getWeatherIcon(weatherCode, isDay = 1) {
  const code = Number(weatherCode ?? 0);
  const day = Number(isDay) === 1;

  if (code === 0) return day ? "☀️" : "🌙";

  if (code === 1) return day ? "🌤️" : "🌙";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";

  if ([45, 48].includes(code)) return "🌫️";

  if ([51, 53, 55, 56, 57].includes(code)) {
    return "🌦️";
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return "🌧️";
  }

  if ([71, 73, 75, 77].includes(code)) {
    return "🌨️";
  }

  if ([80, 81, 82].includes(code)) {
    return "🌧️";
  }

  if ([85, 86].includes(code)) {
    return "🌨️";
  }

  if ([95, 96, 99].includes(code)) {
    return "⛈️";
  }

  return day ? "☀️" : "🌙";
}

function getWeatherDescription(code, isDay = 1) {
  const value = Number(code ?? 0);
  const day = Number(isDay) === 1;

  if (value === 0) return day ? "Clear sky" : "Clear night";
  if ([1].includes(value)) return day ? "Mainly clear" : "Mostly clear";
  if ([2].includes(value)) return "Partly cloudy";
  if ([3].includes(value)) return "Overcast";

  if ([45, 48].includes(value)) return "Foggy";

  if ([51, 53, 55].includes(value)) return "Drizzle";
  if ([56, 57].includes(value)) return "Freezing drizzle";

  if ([61, 63, 65].includes(value)) return "Rain";
  if ([66, 67].includes(value)) return "Freezing rain";

  if ([71, 73, 75, 77].includes(value)) return "Snow";

  if ([80, 81, 82].includes(value)) return "Rain showers";
  if ([85, 86].includes(value)) return "Snow showers";

  if ([95].includes(value)) return "Thunderstorm";
  if ([96, 99].includes(value)) return "Thunderstorm with hail";

  return day ? "Clear" : "Clear night";
}

function getTimeLabel(time) {
  if (!time) return "--";

  const date = new Date(time);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDayLabel(time, index) {
  if (!time) {
    return index === 0 ? "Today" : `Day ${index + 1}`;
  }

  if (index === 0) {
    return "Today";
  }

  const date = new Date(`${time}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return `Day ${index + 1}`;
  }

  return date.toLocaleDateString([], {
    weekday: "short",
  });
}

function getInsightIcon(type) {
  const icons = {
    rain: "🌧️",
    irrigation: "💧",
    heat: "🌡️",
    wind: "💨",
    uv: "☀️",
    humidity: "💦",
    soil: "🌱",
    good: "✨",
  };

  return icons[type] || "💡";
}

function getInsightClass(priority) {
  if (priority === "high") return "insight-high";
  if (priority === "medium") return "insight-medium";
  return "insight-low";
}

function getForecastIcon(rainProbability, temperature, weatherCode, isDay) {
  if (weatherCode !== undefined && weatherCode !== null) {
    return getWeatherIcon(weatherCode, isDay);
  }

  const rain = Number(rainProbability ?? 0);
  const temp = Number(temperature ?? 0);

  if (rain >= 60) return "🌧️";
  if (rain >= 30) return "🌦️";
  if (temp >= 35) return "☀️";
  if (temp <= 15) return "🌥️";

  return "☀️";
}

function buildLocalInsights(persona, weather) {
  const current = weather?.current || {};
  const hourly = weather?.hourly || {};
  const insights = [];

  const temperature = Number(current.temperature_2m ?? 0);
  const humidity = Number(current.relative_humidity_2m ?? 0);
  const precipitation = Number(current.precipitation ?? 0);
  const wind = Number(current.wind_speed_10m ?? 0);
  const uv = Number(current.uv_index ?? 0);

  const rainProbability = Number(
    hourly?.precipitation_probability?.[0] ?? 0
  );

  const soilMoisture = Number(
    hourly?.soil_moisture_0_to_7cm?.[0] ?? 0
  );

  if (rainProbability >= 60 || precipitation > 0) {
    insights.push({
      type: "rain",
      priority: "high",
      title: "Rain expected",
      message:
        "Rain is likely around the current period. Keep outdoor plans flexible and carry rain protection.",
    });
  }

  if (temperature >= 35) {
    insights.push({
      type: "heat",
      priority: "high",
      title: "High temperature",
      message:
        "Conditions are hot. Stay hydrated and reduce prolonged exposure during the hottest part of the day.",
    });
  }

  if (wind >= 30) {
    insights.push({
      type: "wind",
      priority: "medium",
      title: "Strong winds",
      message:
        "Wind speeds are elevated. Take extra care while travelling and around exposed areas.",
    });
  }

  if (uv >= 7) {
    insights.push({
      type: "uv",
      priority: "medium",
      title: "High UV",
      message:
        "UV exposure may be significant. Consider shade, sunscreen and protective clothing outdoors.",
    });
  }

  if (humidity >= 80) {
    insights.push({
      type: "humidity",
      priority: "medium",
      title: "High humidity",
      message:
        "Humidity is high, which can make the air feel warmer and less comfortable.",
    });
  }

  if (persona === "agriculture") {
    if (rainProbability < 30 && soilMoisture < 0.25) {
      insights.push({
        type: "irrigation",
        priority: "high",
        title: "Irrigation may help",
        message:
          "Rain chances are limited and near-surface soil moisture is relatively low.",
      });
    } else {
      insights.push({
        type: "soil",
        priority: "low",
        title: "Monitor soil conditions",
        message:
          "Keep an eye on soil moisture as weather conditions change through the day.",
      });
    }
  }

  if (persona === "commuter") {
    if (rainProbability < 30 && wind < 25) {
      insights.push({
        type: "good",
        priority: "low",
        title: "Favourable commute",
        message:
          "Current weather indicators suggest relatively comfortable travel conditions.",
      });
    }
  }

  if (persona === "traveller") {
    if (rainProbability < 30 && temperature < 35 && wind < 25) {
      insights.push({
        type: "good",
        priority: "low",
        title: "Good conditions outdoors",
        message:
          "Current conditions look generally comfortable for outdoor activities.",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: "good",
      priority: "low",
      title: "Conditions look stable",
      message:
        "Atmos has not detected any major weather concern for this profile.",
    });
  }

  const priorityOrder = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return insights
    .sort(
      (a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority]
    )
    .slice(0, 5);
}

async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDirectWeather(latitude, longitude) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    "&current=" +
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "wind_speed_10m",
      "uv_index",
      "weather_code",
      "is_day",
    ].join(",") +
    "&hourly=" +
    [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "wind_speed_10m",
      "weather_code",
      "is_day",
      "soil_moisture_0_to_7cm",
      "soil_temperature_0cm",
    ].join(",") +
    "&daily=" +
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
      "uv_index_max",
    ].join(",") +
    "&timezone=auto";

  const response = await fetchWithTimeout(url, 10000);

  if (!response.ok) {
    throw new Error(
      `Open-Meteo returned ${response.status}`
    );
  }

  return response.json();
}

async function fetchBackendWeather(
  latitude,
  longitude,
  persona
) {
  const url =
    `${BACKEND_URL}/api/personalized` +
    `?persona=${encodeURIComponent(persona)}` +
    `&lat=${latitude}` +
    `&lon=${longitude}`;

  const response = await fetchWithTimeout(url, 10000);

  if (!response.ok) {
    throw new Error(
      `Backend returned ${response.status}`
    );
  }

  return response.json();
}

async function reverseGeocode(latitude, longitude) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${latitude}` +
      `&lon=${longitude}` +
      `&format=json` +
      `&zoom=10` +
      `&addressdetails=1`;

    const response = await fetchWithTimeout(url, 8000);

    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const data = await response.json();
    const address = data?.address || {};

    return (
      address.city ||
      address.town ||
      address.municipality ||
      address.village ||
      address.county ||
      address.state ||
      "Current location"
    );
  } catch (error) {
    console.warn("Location name unavailable:", error);
    return "Current location";
  }
}

function AtmosLogo() {
  return (
    <div className="brand-icon" aria-label="Atmos">
      <span className="logo-horizontal" />
      <span className="logo-vertical" />
    </div>
  );
}

function App() {
  const [persona, setPersona] = useState("commuter");

  const [page, setPage] = useState("weather");

  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState(
    "Detecting location..."
  );

  const [weatherData, setWeatherData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function detectLocation() {
      if (!navigator.geolocation) {
        if (cancelled) return;

        setLocation(DEFAULT_LOCATION);
        setLocationName("New Delhi");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (cancelled) return;

          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          setLocation({
            latitude,
            longitude,
          });

          const name = await reverseGeocode(
            latitude,
            longitude
          );

          if (!cancelled) {
            setLocationName(name);
          }
        },
        () => {
          if (cancelled) return;

          setLocation(DEFAULT_LOCATION);
          setLocationName("New Delhi");
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    }

    detectLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;

    async function loadWeather() {
      setLoading(true);
      setError("");

      try {
        let data;

        // Try Render backend first.
        try {
          data = await fetchBackendWeather(
            location.latitude,
            location.longitude,
            persona
          );

          // Make sure backend actually returned weather.
          if (!data?.current && !data?.weather) {
            throw new Error(
              "Backend response did not contain weather data"
            );
          }
        } catch (backendError) {
          console.warn(
            "Backend unavailable. Using Open-Meteo directly.",
            backendError
          );

          // Direct fallback means the frontend still works
          // even when Render is sleeping/down.
          const directWeather = await fetchDirectWeather(
            location.latitude,
            location.longitude
          );

          data = {
            persona,
            current: directWeather.current,
            weather: directWeather.current,
            hourly: directWeather.hourly,
            daily: directWeather.daily,
            timezone: directWeather.timezone,
            timezone_abbreviation:
              directWeather.timezone_abbreviation,
            latitude: directWeather.latitude,
            longitude: directWeather.longitude,
            insights: buildLocalInsights(
              persona,
              directWeather
            ),
          };
        }

        if (cancelled) return;

        // Normalize both possible backend structures.
        const normalized = {
          ...data,
          current:
            data.current ||
            data.weather ||
            {},
          weather:
            data.current ||
            data.weather ||
            {},
          hourly: data.hourly || {},
          daily: data.daily || {},
          insights:
            Array.isArray(data.insights)
              ? data.insights
              : buildLocalInsights(persona, data),
        };

        setWeatherData(normalized);
      } catch (err) {
        console.error("Weather loading failed:", err);

        if (!cancelled) {
          setError(
            "Unable to load live weather. Please check your internet connection and try again."
          );
          setWeatherData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [location, persona]);

  const weather = weatherData?.current || {};
  const hourly = weatherData?.hourly || {};
  const daily = weatherData?.daily || {};

  const insights = Array.isArray(weatherData?.insights)
    ? weatherData.insights
    : [];

  const currentTemperature = Number(
    weather?.temperature_2m ?? 0
  );

  const apparentTemperature = Number(
    weather?.apparent_temperature ??
      currentTemperature
  );

  const humidity = Number(
    weather?.relative_humidity_2m ?? 0
  );

  const precipitation = Number(
    weather?.precipitation ?? 0
  );

  const wind = Number(
    weather?.wind_speed_10m ?? 0
  );

  const uv = Number(weather?.uv_index ?? 0);

  const weatherCode = Number(
    weather?.weather_code ?? 0
  );

  const isDay = Number(weather?.is_day ?? 1);

  const conditionIcon = getWeatherIcon(
    weatherCode,
    isDay
  );

  const conditionLabel = getWeatherDescription(
    weatherCode,
    isDay
  );

  const selectedPersona = PERSONAS.find(
    (item) => item.id === persona
  );

  const soilMoisture =
    hourly?.soil_moisture_0_to_7cm?.[0] ??
    null;

  const soilTemperature =
    hourly?.soil_temperature_0cm?.[0] ??
    null;

  const sunrise = daily?.sunrise?.[0];
  const sunset = daily?.sunset?.[0];

  const hourlyForecast = useMemo(() => {
    const times = Array.isArray(hourly.time)
      ? hourly.time
      : [];

    const temperatures = Array.isArray(
      hourly.temperature_2m
    )
      ? hourly.temperature_2m
      : [];

    const rainProbabilities = Array.isArray(
      hourly.precipitation_probability
    )
      ? hourly.precipitation_probability
      : [];

    const codes = Array.isArray(
      hourly.weather_code
    )
      ? hourly.weather_code
      : [];

    const dayFlags = Array.isArray(hourly.is_day)
      ? hourly.is_day
      : [];

    // Find current hour instead of blindly showing
    // midnight / old hours.
    let startIndex = 0;

    if (weatherData?.current?.time) {
      const currentTime = new Date(
        weatherData.current.time
      ).getTime();

      let closestDifference = Infinity;

      times.forEach((time, index) => {
        const difference = Math.abs(
          new Date(time).getTime() - currentTime
        );

        if (difference < closestDifference) {
          closestDifference = difference;
          startIndex = index;
        }
      });
    }

    return times
      .slice(startIndex, startIndex + 12)
      .map((time, offset) => {
        const index = startIndex + offset;

        return {
          time,
          temperature: temperatures[index],
          rainProbability:
            rainProbabilities[index],
          weatherCode: codes[index],
          isDay: dayFlags[index],
        };
      });
  }, [hourly, weatherData]);

  const dailyForecast = useMemo(() => {
    const times = Array.isArray(daily.time)
      ? daily.time
      : [];

    const maxTemperatures = Array.isArray(
      daily.temperature_2m_max
    )
      ? daily.temperature_2m_max
      : [];

    const minTemperatures = Array.isArray(
      daily.temperature_2m_min
    )
      ? daily.temperature_2m_min
      : [];

    const rainProbabilities = Array.isArray(
      daily.precipitation_probability_max
    )
      ? daily.precipitation_probability_max
      : [];

    const codes = Array.isArray(
      daily.weather_code
    )
      ? daily.weather_code
      : [];

    return times.slice(0, 5).map((time, index) => ({
      time,
      maxTemperature:
        maxTemperatures[index],
      minTemperature:
        minTemperatures[index],
      rainProbability:
        rainProbabilities[index],
      weatherCode: codes[index],
    }));
  }, [daily]);

  function selectPersona(id) {
    setPersona(id);
    setPage("personalized");
  }

  function goToWeather() {
    setPage("weather");
  }

  function goToPersonas() {
    setPage("personas");
  }

  if (loading && !weatherData) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <AtmosLogo />

          <div className="loading-spinner" />

          <h2>Preparing your weather</h2>

          <p>
            Atmos is checking live conditions for
            your location.
          </p>
        </div>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="error-screen">
        <div className="error-card">
          <div className="error-icon">⚠️</div>

          <h2>Weather unavailable</h2>

          <p>{error}</p>

          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <button
          className="brand"
          onClick={goToWeather}
          aria-label="Go to current weather"
        >
          <AtmosLogo />

          <div>
            <h1>Atmos</h1>
            <span>
              Adaptive weather intelligence
            </span>
          </div>
        </button>

        <div className="location">
          <span className="location-icon">
            📍
          </span>

          <div>
            <small>YOUR LOCATION</small>
            <strong>{locationName}</strong>
          </div>
        </div>
      </header>

      {error && (
        <div className="notice">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <nav className="page-nav">
        <button
          className={
            page === "weather" ? "active" : ""
          }
          onClick={goToWeather}
        >
          Current Weather
        </button>

        <button
          className={
            page === "personas" ? "active" : ""
          }
          onClick={goToPersonas}
        >
          Choose Purpose
        </button>

        <button
          className={
            page === "personalized" ? "active" : ""
          }
          onClick={() => setPage("personalized")}
        >
          My Weather
        </button>
      </nav>

      {page === "weather" && (
        <main className="page">
          <section className="hero-card">
            <div className="hero-content">
              <div>
                <p className="eyebrow">
                  CURRENT CONDITIONS
                </p>

                <h2>
                  {currentTemperature.toFixed(1)}°
                </h2>

                <div className="condition">
                  <span>{conditionIcon}</span>
                  <span>{conditionLabel}</span>
                </div>

                <p className="feels-like">
                  Feels like{" "}
                  {apparentTemperature.toFixed(1)}°
                </p>
              </div>

              <div className="hero-weather-icon">
                {conditionIcon}
              </div>
            </div>

            <div className="hero-bottom">
              <div>
                <span>Humidity</span>
                <strong>{humidity}%</strong>
              </div>

              <div>
                <span>Rainfall</span>
                <strong>
                  {precipitation.toFixed(1)} mm
                </strong>
              </div>

              <div>
                <span>Wind</span>
                <strong>
                  {wind.toFixed(1)} km/h
                </strong>
              </div>

              <div>
                <span>UV Index</span>
                <strong>
                  {uv.toFixed(1)}
                </strong>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  FORECAST
                </p>
                <h2>Next 5 days</h2>
              </div>

              <span>
                {locationName}
              </span>
            </div>

            <div className="daily-grid">
              {dailyForecast.map((day, index) => (
                <article
                  className="day-card"
                  key={day.time}
                >
                  <span className="day-name">
                    {getDayLabel(
                      day.time,
                      index
                    )}
                  </span>

                  <span className="day-icon">
                    {getForecastIcon(
                      day.rainProbability,
                      day.maxTemperature,
                      day.weatherCode,
                      1
                    )}
                  </span>

                  <strong className="day-temperature">
                    {day.maxTemperature !==
                    undefined
                      ? `${Math.round(
                          day.maxTemperature
                        )}°`
                      : "--"}
                  </strong>

                  <span className="day-min">
                    {day.minTemperature !==
                    undefined
                      ? `${Math.round(
                          day.minTemperature
                        )}°`
                      : "--"}
                  </span>

                  <span className="day-rain">
                    {day.rainProbability !==
                    undefined
                      ? `${day.rainProbability}% rain`
                      : "--"}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section className="two-column">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    HOURLY
                  </p>
                  <h2>Coming up</h2>
                </div>
              </div>

              <div className="hourly-container">
                {hourlyForecast.map((hour) => (
                  <div
                    className="hour-card"
                    key={hour.time}
                  >
                    <span className="hour-time">
                      {getTimeLabel(hour.time)}
                    </span>

                    <span className="hour-icon">
                      {getForecastIcon(
                        hour.rainProbability,
                        hour.temperature,
                        hour.weatherCode,
                        hour.isDay
                      )}
                    </span>

                    <strong>
                      {hour.temperature !==
                      undefined
                        ? `${Math.round(
                            hour.temperature
                          )}°`
                        : "--"}
                    </strong>

                    <small>
                      {hour.rainProbability !==
                      undefined
                        ? `${hour.rainProbability}%`
                        : "--"}
                    </small>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    SOLAR
                  </p>
                  <h2>Sun today</h2>
                </div>

                <span className="panel-icon">
                  {isDay === 1
                    ? "☀️"
                    : "🌙"}
                </span>
              </div>

              <div className="sun-times">
                <div>
                  <small>Sunrise</small>
                  <strong>
                    {getTimeLabel(sunrise)}
                  </strong>
                </div>

                <div>
                  <small>Sunset</small>
                  <strong>
                    {getTimeLabel(sunset)}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="cta-card">
            <div>
              <p className="eyebrow">
                PERSONALIZATION
              </p>

              <h2>
                Want weather that matters to you?
              </h2>

              <p>
                Choose your purpose and Atmos will
                turn weather data into useful advice.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={goToPersonas}
            >
              Choose purpose →
            </button>
          </section>
        </main>
      )}

      {page === "personas" && (
        <main className="page">
          <section className="page-intro">
            <p className="eyebrow">
              PERSONALIZATION
            </p>

            <h2>What matters to you?</h2>

            <p>
              Atmos adapts weather information to
              the way you use it.
            </p>
          </section>

          <section className="persona-grid">
            {PERSONAS.map((item) => (
              <button
                className={`persona-card ${
                  persona === item.id
                    ? "selected"
                    : ""
                }`}
                key={item.id}
                onClick={() =>
                  selectPersona(item.id)
                }
              >
                <span className="persona-icon">
                  {item.icon}
                </span>

                <span className="persona-copy">
                  <strong>{item.title}</strong>
                  <small>
                    {item.description}
                  </small>
                </span>

                <span className="persona-arrow">
                  →
                </span>
              </button>
            ))}
          </section>
        </main>
      )}

      {page === "personalized" && (
        <main className="page">
          <section className="personalized-hero">
            <div>
              <p className="eyebrow">
                PERSONALIZED WEATHER
              </p>

              <div className="profile-title">
                <span>
                  {selectedPersona?.icon}
                </span>

                <div>
                  <h2>
                    {selectedPersona?.title}
                  </h2>

                  <p>
                    Weather insights for{" "}
                    {locationName}
                  </p>
                </div>
              </div>
            </div>

            <button
              className="secondary-button"
              onClick={goToPersonas}
            >
              Change purpose
            </button>
          </section>

          <section className="section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  ADVISORY
                </p>

                <h2>
                  What you should know
                </h2>
              </div>

              <span>
                {insights.length} insights
              </span>
            </div>

            <div className="insight-grid">
              {insights.map((insight, index) => (
                <article
                  className={`insight-card ${getInsightClass(
                    insight.priority
                  )}`}
                  key={`${insight.type}-${index}`}
                >
                  <div className="insight-icon">
                    {getInsightIcon(
                      insight.type
                    )}
                  </div>

                  <div className="insight-content">
                    <div className="insight-header">
                      <h3>
                        {insight.title}
                      </h3>

                      <span
                        className={`priority-badge ${insight.priority}`}
                      >
                        {insight.priority}
                      </span>
                    </div>

                    <p>
                      {insight.message ||
                        insight.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="two-column">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    ATMOSPHERE
                  </p>
                  <h2>
                    Current snapshot
                  </h2>
                </div>

                <span className="panel-icon">
                  {conditionIcon}
                </span>
              </div>

              <div className="snapshot-list">
                <div>
                  <span>Condition</span>
                  <strong>
                    {conditionLabel}
                  </strong>
                </div>

                <div>
                  <span>Temperature</span>
                  <strong>
                    {currentTemperature.toFixed(
                      1
                    )}
                    °
                  </strong>
                </div>

                <div>
                  <span>Feels like</span>
                  <strong>
                    {apparentTemperature.toFixed(
                      1
                    )}
                    °
                  </strong>
                </div>

                <div>
                  <span>Humidity</span>
                  <strong>
                    {humidity}%
                  </strong>
                </div>

                <div>
                  <span>Wind speed</span>
                  <strong>
                    {wind.toFixed(1)} km/h
                  </strong>
                </div>

                <div>
                  <span>UV index</span>
                  <strong>
                    {uv.toFixed(1)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    RELATED
                  </p>

                  <h2>
                    {persona === "agriculture"
                      ? "Growing conditions"
                      : persona === "commuter"
                      ? "Travel conditions"
                      : "Outdoor comfort"}
                  </h2>
                </div>

                <span className="panel-icon">
                  {persona === "agriculture"
                    ? "🌱"
                    : persona === "commuter"
                    ? "🚗"
                    : "✈️"}
                </span>
              </div>

              {persona === "agriculture" ? (
                <div className="soil-metrics">
                  <div>
                    <small>
                      Soil moisture
                    </small>

                    <strong>
                      {soilMoisture !== null
                        ? `${(
                            Number(
                              soilMoisture
                            ) * 100
                          ).toFixed(0)}%`
                        : "--"}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Soil temperature
                    </small>

                    <strong>
                      {soilTemperature !== null
                        ? `${Number(
                            soilTemperature
                          ).toFixed(1)}°`
                        : "--"}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="related-info">
                  <div>
                    <span>Rain chance</span>
                    <strong>
                      {hourly?.precipitation_probability?.[0] ??
                        0}
                      %
                    </strong>
                  </div>

                  <div>
                    <span>Current wind</span>
                    <strong>
                      {wind.toFixed(1)} km/h
                    </strong>
                  </div>

                  <div>
                    <span>Humidity</span>
                    <strong>
                      {humidity}%
                    </strong>
                  </div>

                  <div>
                    <span>UV index</span>
                    <strong>
                      {uv.toFixed(1)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  HOURLY
                </p>

                <h2>
                  Plan ahead
                </h2>
              </div>
            </div>

            <div className="hourly-container">
              {hourlyForecast.map((hour) => (
                <div
                  className="hour-card"
                  key={hour.time}
                >
                  <span className="hour-time">
                    {getTimeLabel(hour.time)}
                  </span>

                  <span className="hour-icon">
                    {getForecastIcon(
                      hour.rainProbability,
                      hour.temperature,
                      hour.weatherCode,
                      hour.isDay
                    )}
                  </span>

                  <strong>
                    {hour.temperature !==
                    undefined
                      ? `${Math.round(
                          hour.temperature
                        )}°`
                      : "--"}
                  </strong>

                  <small>
                    {hour.rainProbability !==
                    undefined
                      ? `${hour.rainProbability}% rain`
                      : "--"}
                  </small>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        <strong>Atmos</strong>
        <span>
          Personalized weather intelligence
        </span>
      </footer>
    </div>
  );
}

export default App;
