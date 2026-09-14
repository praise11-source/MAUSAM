import { useEffect, useMemo, useState } from "react";
import "./App.css";

const BACKEND_URL = "https://mausam-eta9.onrender.com";

const DEFAULT_LOCATION = {
  name: "New Delhi",
  country: "India",
  latitude: 28.6139,
  longitude: 77.209,
};

const PERSONAS = [
  {
    id: "commuter",
    icon: "🚗",
    title: "Commuter",
    description: "Know how weather could affect your journey.",
  },
  {
    id: "traveller",
    icon: "✈️",
    title: "Traveller",
    description: "Plan outdoor activities around the weather.",
  },
  {
    id: "agriculture",
    icon: "🌱",
    title: "Agriculture",
    description: "Get useful information about crops and soil.",
  },
];

/* ---------------------------------------
   WEATHER HELPERS
--------------------------------------- */

function weatherDescription(code) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    56: "Freezing drizzle",
    57: "Freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    85: "Snow showers",
    86: "Snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with hail",
  };

  return descriptions[Number(code)] || "Unknown conditions";
}

function weatherIcon(code, isNight = false) {
  code = Number(code);

  if (code === 0) {
    return isNight ? "🌙" : "☀️";
  }

  if (code === 1 || code === 2) {
    return isNight ? "🌙" : "🌤️";
  }

  if (code === 3) {
    return "☁️";
  }

  if ([45, 48].includes(code)) {
    return "🌫️";
  }

  if (
    [
      51,
      53,
      55,
      56,
      57,
      61,
      63,
      65,
      66,
      67,
      80,
      81,
      82,
    ].includes(code)
  ) {
    return "🌧️";
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "❄️";
  }

  if ([95, 96, 99].includes(code)) {
    return "⛈️";
  }

  return "🌤️";
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
    good: "✨",
  };

  return icons[type] || "💡";
}

function getInsightClass(priority) {
  if (priority === "high") return "insight-high";
  if (priority === "medium") return "insight-medium";
  return "insight-low";
}

/* ---------------------------------------
   FIND THE HOURLY INDEX CLOSEST TO NOW
--------------------------------------- */

function getCurrentHourlyIndex(hourly, currentTime) {
  const times = Array.isArray(hourly?.time)
    ? hourly.time
    : [];

  if (!times.length) return 0;

  const target = new Date(
    currentTime || Date.now()
  ).getTime();

  let closestIndex = 0;
  let closestDifference = Infinity;

  times.forEach((time, index) => {
    const timestamp = new Date(time).getTime();

    if (Number.isNaN(timestamp)) return;

    const difference = Math.abs(timestamp - target);

    if (difference < closestDifference) {
      closestDifference = difference;
      closestIndex = index;
    }
  });

  return closestIndex;
}

/* ---------------------------------------
   APP
--------------------------------------- */

function App() {
  const [persona, setPersona] = useState("commuter");

  const [location, setLocation] =
    useState(DEFAULT_LOCATION);

  const [locationName, setLocationName] =
    useState(DEFAULT_LOCATION.name);

  const [weatherData, setWeatherData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ---------------------------------------
     GET USER LOCATION
  --------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setLocation(DEFAULT_LOCATION);
      setLocationName(DEFAULT_LOCATION.name);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (cancelled) return;

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const detectedLocation = {
          latitude,
          longitude,
        };

        setLocation(detectedLocation);

        try {
          const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`
          );

          if (!response.ok) {
            throw new Error("Reverse geocoding failed");
          }

          const data = await response.json();

          const city =
            data?.name ||
            data?.city ||
            data?.locality ||
            "Your location";

          if (!cancelled) {
            setLocationName(city);
          }
        } catch {
          if (!cancelled) {
            setLocationName("Your location");
          }
        }
      },
      () => {
        if (cancelled) return;

        setLocation(DEFAULT_LOCATION);
        setLocationName(DEFAULT_LOCATION.name);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------------------------------
     LOAD PERSONALIZED WEATHER
  --------------------------------------- */

  useEffect(() => {
    if (!location) return;

    let cancelled = false;

    async function fetchWeather() {
      setLoading(true);
      setError("");

      try {
        const url =
          `${BACKEND_URL}/api/personalized` +
          `?persona=${encodeURIComponent(persona)}` +
          `&lat=${encodeURIComponent(location.latitude)}` +
          `&lon=${encodeURIComponent(location.longitude)}`;

        const response = await fetch(url);

        if (!response.ok) {
          const text = await response.text();

          throw new Error(
            `Weather server returned ${response.status}${
              text ? `: ${text}` : ""
            }`
          );
        }

        const data = await response.json();

        if (cancelled) return;

        if (!data || !data.weather) {
          throw new Error(
            "Backend returned an invalid weather response."
          );
        }

        setWeatherData(data);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Atmos weather error:",
          err
        );

        setError(
          "Unable to load live weather. Please try again in a moment."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, [location, persona]);

  /* ---------------------------------------
     WEATHER DATA
  --------------------------------------- */

  const weather =
    weatherData?.weather || {};

  const hourly =
    weatherData?.hourly || {};

  const daily =
    weatherData?.daily || {};

  const insights = Array.isArray(
    weatherData?.insights
  )
    ? weatherData.insights
    : [];

  const currentTemperature = Number(
    weather.temperature_2m ?? 0
  );

  const humidity = Number(
    weather.relative_humidity_2m ?? 0
  );

  const precipitation = Number(
    weather.precipitation ?? 0
  );

  const wind = Number(
    weather.wind_speed_10m ?? 0
  );

  const uv = Number(
    weather.uv_index ?? 0
  );

  const weatherCode =
    weather.weather_code;

  const condition =
    weatherDescription(weatherCode);

  const currentIcon =
    weatherIcon(weatherCode);

  /* ---------------------------------------
     CURRENT HOURLY INDEX
  --------------------------------------- */

  const currentHourlyIndex =
    useMemo(
      () =>
        getCurrentHourlyIndex(
          hourly,
          weather.time
        ),
      [hourly, weather.time]
    );

  /* ---------------------------------------
     SOIL DATA
  --------------------------------------- */

  const soilMoisture =
    hourly?.soil_moisture_0_to_7cm?.[
      currentHourlyIndex
    ] ?? null;

  const soilTemperature =
    hourly?.soil_temperature_0cm?.[
      currentHourlyIndex
    ] ?? null;

  /* ---------------------------------------
     HOURLY FORECAST
  --------------------------------------- */

  const hourlyForecast = useMemo(() => {
    const times = Array.isArray(hourly?.time)
      ? hourly.time
      : [];

    if (!times.length) return [];

    const startIndex =
      getCurrentHourlyIndex(
        hourly,
        weather.time
      );

    return times
      .slice(startIndex, startIndex + 8)
      .map((time, offset) => {
        const index =
          startIndex + offset;

        return {
          time,

          temperature:
            hourly?.temperature_2m?.[
              index
            ],

          probability:
            hourly?.precipitation_probability?.[
              index
            ],

          code:
            hourly?.weather_code?.[
              index
            ],
        };
      });
  }, [hourly, weather.time]);

  /* ---------------------------------------
     DAILY FORECAST
  --------------------------------------- */

  const dailyForecast = useMemo(() => {
    const times = Array.isArray(
      daily?.time
    )
      ? daily.time
      : [];

    return times
      .slice(0, 5)
      .map((time, index) => ({
        time,

        max:
          daily?.temperature_2m_max?.[
            index
          ],

        min:
          daily?.temperature_2m_min?.[
            index
          ],

        rain:
          daily?.precipitation_probability_max?.[
            index
          ],

        code:
          daily?.weather_code?.[
            index
          ],
      }));
  }, [daily]);

  const sunrise =
    daily?.sunrise?.[0];

  const sunset =
    daily?.sunset?.[0];

  const selectedPersona =
    PERSONAS.find(
      (item) => item.id === persona
    );

  /* ---------------------------------------
     LOCATION SEARCH
  --------------------------------------- */

  async function searchLocation(event) {
    event.preventDefault();

    const input =
      event.currentTarget.elements.search?.value?.trim();

    if (!input) return;

    try {
      setError("");

      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          input
        )}&count=1&language=en&format=json`
      );

      if (!response.ok) {
        throw new Error(
          "Location search failed"
        );
      }

      const data =
        await response.json();

      if (!data.results?.length) {
        setError(
          "Location not found."
        );
        return;
      }

      const result =
        data.results[0];

      setLocation({
        name: result.name,
        country:
          result.country || "",
        latitude:
          result.latitude,
        longitude:
          result.longitude,
      });

      setLocationName(
        result.name
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to find that location."
      );
    }
  }

  /* ---------------------------------------
     LOADING
  --------------------------------------- */

  if (loading && !weatherData) {
    return (
      <div className="app loading-screen">
        <div className="loading-card">
          <div className="loading-logo">
            A
          </div>

          <div className="loading-spinner" />

          <h2>
            Preparing your weather
          </h2>

          <p>
            Atmos is checking live
            conditions for your location.
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------
     ERROR
  --------------------------------------- */

  if (error && !weatherData) {
    return (
      <div className="app error-screen">
        <div className="error-card">
          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Weather unavailable
          </h2>

          <p>{error}</p>

          <button
            className="retry-button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------
     UI
  --------------------------------------- */

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            A
          </div>

          <div>
            <h1>Atmos</h1>

            <span>
              Adaptive weather intelligence
            </span>
          </div>
        </div>

        <div className="location">
          <span className="location-icon">
            📍
          </span>

          <div>
            <small>
              YOUR LOCATION
            </small>

            <strong>
              {locationName}
            </strong>
          </div>
        </div>
      </header>

      {error && (
        <div className="notice error-notice">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <main>
        {/* CURRENT WEATHER */}

        <section className="hero-section">
          <div className="hero-card">
            <div className="hero-top">
              <div>
                <p className="eyebrow">
                  CURRENT CONDITIONS
                </p>

                <h2>
                  {currentTemperature.toFixed(
                    1
                  )}
                  °
                </h2>

                <div className="condition">
                  <span className="condition-icon">
                    {currentIcon}
                  </span>

                  <span>
                    {condition}
                  </span>
                </div>
              </div>

              <div className="hero-weather-icon">
                {currentIcon}
              </div>
            </div>

            <div className="hero-bottom">
              <div>
                <span>Humidity</span>
                <strong>
                  {humidity}%
                </strong>
              </div>

              <div>
                <span>Rainfall</span>
                <strong>
                  {precipitation.toFixed(
                    1
                  )}{" "}
                  mm
                </strong>
              </div>

              <div>
                <span>Wind</span>
                <strong>
                  {wind.toFixed(0)}{" "}
                  km/h
                </strong>
              </div>

              <div>
                <span>UV Index</span>
                <strong>
                  {uv.toFixed(1)}
                </strong>
              </div>
            </div>
          </div>

          {/* PERSONA */}

          <div className="personalization-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">
                  PERSONALIZATION ENGINE
                </p>

                <h2>
                  What matters to you?
                </h2>
              </div>

              <span className="live-dot">
                LIVE
              </span>
            </div>

            <div className="persona-list">
              {PERSONAS.map((item) => (
                <button
                  key={item.id}
                  className={`persona-button ${
                    persona === item.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setPersona(item.id)
                  }
                  disabled={loading}
                >
                  <span className="persona-icon">
                    {item.icon}
                  </span>

                  <span className="persona-copy">
                    <strong>
                      {item.title}
                    </strong>

                    <small>
                      {item.description}
                    </small>
                  </span>

                  <span className="persona-arrow">
                    →
                  </span>
                </button>
              ))}
            </div>

            <div className="selected-persona">
              <span>
                {selectedPersona?.icon}
              </span>

              <div>
                <small>
                  ACTIVE PROFILE
                </small>

                <strong>
                  {selectedPersona?.title}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 5 DAY FORECAST */}

        <section className="forecast-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                FORECAST
              </p>

              <h2>
                Next 5 days
              </h2>
            </div>

            <span className="forecast-location">
              {locationName}
            </span>
          </div>

          <div className="daily-grid">
            {dailyForecast.map(
              (day, index) => (
                <div
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
                    {weatherIcon(day.code)}
                  </span>

                  <strong className="day-temperature">
                    {day.max !==
                    undefined
                      ? `${Math.round(
                          day.max
                        )}°`
                      : "--"}
                  </strong>

                  <span className="day-rain">
                    {day.rain !==
                    undefined
                      ? `${day.rain}% rain`
                      : "--"}
                  </span>

                  <small>
                    {day.min !==
                    undefined
                      ? `Low ${Math.round(
                          day.min
                        )}°`
                      : ""}
                  </small>
                </div>
              )
            )}
          </div>
        </section>

        {/* INSIGHTS */}

        <section className="content-grid">
          <div className="main-column">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  ADVISORY
                </p>

                <h2>
                  {selectedPersona?.title}{" "}
                  insights
                </h2>
              </div>

              <span className="insight-count">
                {insights.length} alerts
              </span>
            </div>

            <div className="insight-grid">
              {insights.length > 0 ? (
                insights.map(
                  (insight, index) => (
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
                            insight.description ||
                            "Atmos has detected a relevant weather condition."}
                        </p>
                      </div>
                    </article>
                  )
                )
              ) : (
                <div className="empty-insights">
                  <span>✨</span>

                  <h3>
                    Everything looks good
                  </h3>

                  <p>
                    Atmos does not currently
                    have any important alerts
                    for this profile.
                  </p>
                </div>
              )}
            </div>

            {/* HOURLY */}

            <div className="section-heading hourly-heading">
              <div>
                <p className="eyebrow">
                  HOURLY
                </p>

                <h2>
                  Coming up
                </h2>
              </div>
            </div>

            <div className="hourly-container">
              {hourlyForecast.map(
                (hour, index) => (
                  <div
                    className={`hour-card ${
                      index === 0
                        ? "current-hour"
                        : ""
                    }`}
                    key={hour.time}
                  >
                    <span className="hour-time">
                      {index === 0
                        ? "Now"
                        : getTimeLabel(
                            hour.time
                          )}
                    </span>

                    <span className="hour-icon">
                      {weatherIcon(
                        hour.code
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
                      {hour.probability !==
                      undefined
                        ? `${hour.probability}%`
                        : "--"}
                    </small>
                  </div>
                )
              )}
            </div>
          </div>

          {/* SIDE INFORMATION */}

          <aside className="side-column">
            <div className="metric-card">
              <div className="metric-card-heading">
                <span>☀️</span>

                <div>
                  <p className="eyebrow">
                    SOLAR
                  </p>

                  <h3>
                    Sun today
                  </h3>
                </div>
              </div>

              <div className="sun-times">
                <div>
                  <small>
                    Sunrise
                  </small>

                  <strong>
                    {getTimeLabel(
                      sunrise
                    )}
                  </strong>
                </div>

                <div>
                  <small>
                    Sunset
                  </small>

                  <strong>
                    {getTimeLabel(
                      sunset
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {persona ===
              "agriculture" && (
              <div className="metric-card">
                <div className="metric-card-heading">
                  <span>🌱</span>

                  <div>
                    <p className="eyebrow">
                      SOIL
                    </p>

                    <h3>
                      Growing conditions
                    </h3>
                  </div>
                </div>

                <div className="soil-metrics">
                  <div>
                    <small>
                      Moisture
                    </small>

                    <strong>
                      {soilMoisture !==
                      null
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
                      Temperature
                    </small>

                    <strong>
                      {soilTemperature !==
                      null
                        ? `${Number(
                            soilTemperature
                          ).toFixed(
                            1
                          )}°`
                        : "--"}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="metric-card atmosphere-card">
              <div className="metric-card-heading">
                <span>🌤️</span>

                <div>
                  <p className="eyebrow">
                    ATMOSPHERE
                  </p>

                  <h3>
                    Current snapshot
                  </h3>
                </div>
              </div>

              <div className="snapshot-list">
                <div>
                  <span>
                    Temperature
                  </span>

                  <strong>
                    {currentTemperature.toFixed(
                      1
                    )}
                    °
                  </strong>
                </div>

                <div>
                  <span>
                    Humidity
                  </span>

                  <strong>
                    {humidity}%
                  </strong>
                </div>

                <div>
                  <span>
                    Wind speed
                  </span>

                  <strong>
                    {wind.toFixed(0)}{" "}
                    km/h
                  </strong>
                </div>

                <div>
                  <span>
                    UV index
                  </span>

                  <strong>
                    {uv.toFixed(1)}
                  </strong>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <footer className="footer">
        <span>Atmos</span>
        <span>
          Personalized weather intelligence
        </span>
      </footer>
    </div>
  );
}

export default App;
