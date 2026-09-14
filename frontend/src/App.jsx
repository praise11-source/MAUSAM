import { useEffect, useMemo, useState } from "react";
import "./App.css";

const BACKEND_URL = "https://mausam-eta9.onrender.com";

const PERSONAS = [
  {
    id: "agriculture",
    icon: "🌾",
    title: "Agriculture",
    description: "Crops, soil & irrigation",
  },
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
];

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

function getWeatherCondition(weather) {
  const precipitation = Number(weather?.precipitation ?? 0);
  const humidity = Number(weather?.relative_humidity_2m ?? 0);
  const temperature = Number(weather?.temperature_2m ?? 0);

  if (precipitation > 0) {
    return {
      label: "Rainy",
      icon: "🌧️",
    };
  }

  if (temperature >= 35) {
    return {
      label: "Hot",
      icon: "☀️",
    };
  }

  if (humidity >= 80) {
    return {
      label: "Humid",
      icon: "🌤️",
    };
  }

  if (temperature <= 15) {
    return {
      label: "Cool",
      icon: "🌥️",
    };
  }

  return {
    label: "Clear",
    icon: "☀️",
  };
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

  const date = new Date(`${time}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return index === 0 ? "Today" : `Day ${index + 1}`;
  }

  if (index === 0) {
    return "Today";
  }

  return date.toLocaleDateString([], {
    weekday: "short",
  });
}

function getForecastIcon(precipitationProbability, temperature) {
  const rain = Number(precipitationProbability ?? 0);
  const temp = Number(temperature ?? 0);

  if (rain >= 60) {
    return "🌧️";
  }

  if (rain >= 30) {
    return "🌦️";
  }

  if (temp >= 35) {
    return "☀️";
  }

  if (temp <= 15) {
    return "🌥️";
  }

  return "☀️";
}

function getInsightClass(priority) {
  if (priority === "high") {
    return "insight-high";
  }

  if (priority === "medium") {
    return "insight-medium";
  }

  return "insight-low";
}

function App() {
  const [persona, setPersona] = useState("agriculture");
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("Detecting location...");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        latitude: 28.6139,
        longitude: 77.209,
      });

      setLocationName("New Delhi");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({
          latitude,
          longitude,
        });

        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );

          if (!response.ok) {
            throw new Error("Reverse geocoding failed");
          }

          const data = await response.json();

          const city =
            data.city ||
            data.locality ||
            data.principalSubdivision ||
            "Your location";

          setLocationName(city);
        } catch {
          setLocationName("Your location");
        }
      },
      () => {
        setLocation({
          latitude: 28.6139,
          longitude: 77.209,
        });

        setLocationName("New Delhi");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  useEffect(() => {
    if (!location) {
      return;
    }

    let cancelled = false;

    async function fetchWeather() {
      setLoading(true);
      setError("");

      try {
        const url =
          `${BACKEND_URL}/api/personalized` +
          `?persona=${encodeURIComponent(persona)}` +
          `&lat=${location.latitude}` +
          `&lon=${location.longitude}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Weather server returned ${response.status}`
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        setWeatherData(data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Weather fetch error:", err);

        setError(
          "Unable to load weather right now. Please check that the backend is running."
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

  const weather = weatherData?.weather || {};
  const hourly = weatherData?.hourly || {};
  const daily = weatherData?.daily || {};

  const insights = Array.isArray(weatherData?.insights)
    ? weatherData.insights
    : [];

  const currentTemperature = Number(
    weather?.temperature_2m ?? 0
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

  const uv = Number(
    weather?.uv_index ?? 0
  );

  const soilMoisture =
    hourly?.soil_moisture_0_to_7cm?.[0] ?? null;

  const soilTemperature =
    hourly?.soil_temperature_0cm?.[0] ?? null;

  const condition = useMemo(
    () => getWeatherCondition(weather),
    [weather]
  );

  const selectedPersona = PERSONAS.find(
    (item) => item.id === persona
  );

  const hourlyForecast = useMemo(() => {
    const times = Array.isArray(hourly?.time)
      ? hourly.time
      : [];

    const temperatures = Array.isArray(
      hourly?.temperature_2m
    )
      ? hourly.temperature_2m
      : [];

    const rainProbabilities = Array.isArray(
      hourly?.precipitation_probability
    )
      ? hourly.precipitation_probability
      : [];

    return times.slice(0, 12).map((time, index) => ({
      time,
      temperature: temperatures[index],
      rainProbability: rainProbabilities[index],
    }));
  }, [hourly]);

  const dailyForecast = useMemo(() => {
    const times = Array.isArray(daily?.time)
      ? daily.time
      : [];

    const temperatures = Array.isArray(
      daily?.temperature_2m_max
    )
      ? daily.temperature_2m_max
      : [];

    const rainProbabilities = Array.isArray(
      daily?.precipitation_probability_max
    )
      ? daily.precipitation_probability_max
      : [];

    return times.slice(0, 5).map((time, index) => ({
      time,
      temperature: temperatures[index],
      rainProbability: rainProbabilities[index],
    }));
  }, [daily]);

  const sunrise = daily?.sunrise?.[0];
  const sunset = daily?.sunset?.[0];

  if (loading && !weatherData) {
    return (
      <div className="app loading-screen">
        <div className="loading-card">
          <div className="loading-logo">A</div>

          <div className="loading-spinner"></div>

          <h2>Preparing your weather</h2>

          <p>
            Atmos is checking live conditions for your
            location.
          </p>
        </div>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="app error-screen">
        <div className="error-card">
          <div className="error-icon">⚠️</div>

          <h2>Weather unavailable</h2>

          <p>{error}</p>

          <button
            className="retry-button"
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
        <div className="brand">
          <div className="brand-icon">A</div>

          <div>
            <h1>Atmos</h1>
            <span>Adaptive weather intelligence</span>
          </div>
        </div>

        <div className="location">
          <span className="location-icon">📍</span>

          <div>
            <small>YOUR LOCATION</small>
            <strong>{locationName}</strong>
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
        <section className="hero-section">
          <div className="hero-card">
            <div className="hero-top">
              <div>
                <p className="eyebrow">CURRENT CONDITIONS</p>

                <h2>
                  {currentTemperature.toFixed(1)}°
                </h2>

                <div className="condition">
                  <span className="condition-icon">
                    {condition.icon}
                  </span>

                  <span>{condition.label}</span>
                </div>
              </div>

              <div className="hero-weather-icon">
                {condition.icon}
              </div>
            </div>

            <div className="hero-bottom">
              <div>
                <span>Humidity</span>
                <strong>{humidity}%</strong>
              </div>

              <div>
                <span>Rainfall</span>
                <strong>{precipitation} mm</strong>
              </div>

              <div>
                <span>Wind</span>
                <strong>{wind} km/h</strong>
              </div>

              <div>
                <span>UV Index</span>
                <strong>{uv.toFixed(1)}</strong>
              </div>
            </div>
          </div>

          <div className="personalization-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">PERSONALIZATION ENGINE</p>
                <h2>What matters to you?</h2>
              </div>

              <span className="live-dot">LIVE</span>
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
                  onClick={() => setPersona(item.id)}
                >
                  <span className="persona-icon">
                    {item.icon}
                  </span>

                  <span className="persona-copy">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>

                  <span className="persona-arrow">
                    →
                  </span>
                </button>
              ))}
            </div>

            <div className="selected-persona">
              <span>{selectedPersona?.icon}</span>

              <div>
                <small>ACTIVE PROFILE</small>
                <strong>
                  {selectedPersona?.title}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="forecast-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FORECAST</p>
              <h2>Next 5 days</h2>
            </div>

            <span className="forecast-location">
              {locationName}
            </span>
          </div>

          <div className="daily-grid">
            {dailyForecast.map((day, index) => (
              <div className="day-card" key={day.time}>
                <span className="day-name">
                  {getDayLabel(day.time, index)}
                </span>

                <span className="day-icon">
                  {getForecastIcon(
                    day.rainProbability,
                    day.temperature
                  )}
                </span>

                <strong className="day-temperature">
                  {day.temperature !== undefined
                    ? `${Math.round(day.temperature)}°`
                    : "--"}
                </strong>

                <span className="day-rain">
                  {day.rainProbability !== undefined
                    ? `${day.rainProbability}% rain`
                    : "--"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-grid">
          <div className="main-column">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ADVISORY</p>
                <h2>
                  {selectedPersona?.title} insights
                </h2>
              </div>

              <span className="insight-count">
                {insights.length} alerts
              </span>
            </div>

            <div className="insight-grid">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <article
                    className={`insight-card ${getInsightClass(
                      insight.priority
                    )}`}
                    key={`${insight.type}-${index}`}
                  >
                    <div className="insight-icon">
                      {getInsightIcon(insight.type)}
                    </div>

                    <div className="insight-content">
                      <div className="insight-header">
                        <h3>{insight.title}</h3>

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
                ))
              ) : (
                <div className="empty-insights">
                  <span>✨</span>
                  <h3>Everything looks good</h3>
                  <p>
                    Atmos does not currently have any
                    important alerts for this profile.
                  </p>
                </div>
              )}
            </div>

            <div className="section-heading hourly-heading">
              <div>
                <p className="eyebrow">HOURLY</p>
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
                      hour.temperature
                    )}
                  </span>

                  <strong>
                    {hour.temperature !== undefined
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

          <aside className="side-column">
            <div className="metric-card">
              <div className="metric-card-heading">
                <span>☀️</span>
                <div>
                  <p className="eyebrow">SOLAR</p>
                  <h3>Sun today</h3>
                </div>
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

            {persona === "agriculture" && (
              <div className="metric-card">
                <div className="metric-card-heading">
                  <span>🌱</span>

                  <div>
                    <p className="eyebrow">SOIL</p>
                    <h3>Growing conditions</h3>
                  </div>
                </div>

                <div className="soil-metrics">
                  <div>
                    <small>Moisture</small>

                    <strong>
                      {soilMoisture !== null
                        ? `${(
                            Number(soilMoisture) *
                            100
                          ).toFixed(0)}%`
                        : "--"}
                    </strong>
                  </div>

                  <div>
                    <small>Temperature</small>

                    <strong>
                      {soilTemperature !== null
                        ? `${Number(
                            soilTemperature
                          ).toFixed(1)}°`
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
                  <p className="eyebrow">ATMOSPHERE</p>
                  <h3>Current snapshot</h3>
                </div>
              </div>

              <div className="snapshot-list">
                <div>
                  <span>Temperature</span>
                  <strong>
                    {currentTemperature.toFixed(1)}°
                  </strong>
                </div>

                <div>
                  <span>Humidity</span>
                  <strong>{humidity}%</strong>
                </div>

                <div>
                  <span>Wind speed</span>
                  <strong>{wind} km/h</strong>
                </div>

                <div>
                  <span>UV index</span>
                  <strong>{uv.toFixed(1)}</strong>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <footer className="footer">
        <span>Atmos</span>
        <span>Personalized weather intelligence</span>
      </footer>
    </div>
  );
}

export default App;