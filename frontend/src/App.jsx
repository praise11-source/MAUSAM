import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const BACKEND_URL = "https://mausam-eta9.onrender.com";

const DEFAULT_LOCATION = {
  name: "New Delhi",
  admin1: "Delhi",
  country: "India",
  latitude: 28.6139,
  longitude: 77.209,
};

const PERSONAS = {
  commuter: {
    title: "Commuter",
    icon: "→",
    description: "Get practical advice for getting around safely and comfortably.",
  },
  traveller: {
    title: "Traveller",
    icon: "✈",
    description: "Plan your day around weather, comfort and changing conditions.",
  },
  agriculture: {
    title: "Agriculture",
    icon: "⌁",
    description: "Useful weather information for crops, irrigation and field work.",
  },
};

function weatherDescription(code) {
  const map = {
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
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light showers",
    81: "Showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Heavy thunderstorm with hail",
  };

  return map[Number(code)] || "Unknown conditions";
}

function weatherIcon(code, isDay = true) {
  const c = Number(code);

  if (!isDay) {
    if ([95, 96, 99].includes(c)) return "⛈";
    if ([61, 63, 65, 80, 81, 82].includes(c)) return "☾";
    if ([45, 48].includes(c)) return "☾";
    if ([71, 73, 75, 77, 85, 86].includes(c)) return "☾";
    if ([1, 2, 3].includes(c)) return "☾";
    return "☾";
  }

  if (c === 0) return "☀";
  if ([1, 2].includes(c)) return "◐";
  if (c === 3) return "☁";
  if ([45, 48].includes(c)) return "≋";
  if ([51, 53, 55, 56, 57].includes(c)) return "♨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return "☂";
  if ([71, 73, 75, 77, 85, 86].includes(c)) return "❄";
  if ([95, 96, 99].includes(c)) return "⛈";

  return "☀";
}

function getCurrentHourlyIndex(weather) {
  const times = weather?.hourly?.time || [];
  const currentTime = weather?.current?.time;

  if (!times.length || !currentTime) return 0;

  const current = new Date(currentTime).getTime();

  let closestIndex = 0;
  let smallestDifference = Infinity;

  times.forEach((time, index) => {
    const difference = Math.abs(
      new Date(time).getTime() - current
    );

    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function formatHour(time) {
  if (!time) return "--";

  const date = new Date(time);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDay(time, index) {
  if (!time) return "--";

  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";

  return new Date(time).toLocaleDateString([], {
    weekday: "short",
  });
}

function getLocationLabel(location) {
  if (!location) return "Unknown location";

  const parts = [
    location.name,
    location.admin1,
  ].filter(Boolean);

  return parts.join(", ");
}

async function reverseGeocode(latitude, longitude) {
  const url =
    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}` +
    `&longitude=${longitude}&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to resolve location");
  }

  const data = await response.json();
  const result = data?.results?.[0];

  if (!result) {
    throw new Error("Location not found");
  }

  return {
    name: result.name || "Unknown location",
    admin1: result.admin1 || "",
    country: result.country || "",
    latitude,
    longitude,
  };
}

async function searchLocation(query) {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}` +
    `&count=5&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Location search failed");
  }

  const data = await response.json();

  return (data.results || []).map((result) => ({
    name: result.name,
    admin1: result.admin1 || "",
    country: result.country || "",
    latitude: result.latitude,
    longitude: result.longitude,
  }));
}

function App() {
  const [page, setPage] = useState("weather");

  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [weather, setWeather] = useState(null);

  const [selectedPersona, setSelectedPersona] = useState(null);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const current = weather?.current || {};
  const hourly = weather?.hourly || {};
  const daily = weather?.daily || {};

  const currentHourlyIndex = useMemo(
    () => getCurrentHourlyIndex(weather),
    [weather]
  );

  const actualIsDay = Boolean(
    Number(current.is_day) === 1
  );

  const currentCode = Number(current.weather_code ?? 0);

  const condition = weatherDescription(currentCode);

  const currentIcon = weatherIcon(
    currentCode,
    actualIsDay
  );

  async function loadWeather(
    latitude = location.latitude,
    longitude = location.longitude,
    persona = selectedPersona
  ) {
    setLoading(true);
    setError("");

    try {
      const personaQuery = persona
        ? `&persona=${encodeURIComponent(persona)}`
        : "";

      const url =
        `${BACKEND_URL}/api/personalized?lat=${latitude}&lon=${longitude}` +
        personaQuery;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Weather server returned ${response.status}`
        );
      }

      const data = await response.json();

      if (!data?.current && !data?.weather?.current) {
        throw new Error("Invalid weather response");
      }

      const normalizedWeather = data.current
        ? data
        : data.weather;

      setWeather(normalizedWeather);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load weather right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      await loadWeather();
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const resolved = await reverseGeocode(
            latitude,
            longitude
          );

          setLocation(resolved);

          await loadWeather(
            latitude,
            longitude,
            selectedPersona
          );
        } catch (err) {
          console.error(err);
          await loadWeather(latitude, longitude);
        }
      },
      async () => {
        await loadWeather();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }

  async function performSearch(event) {
    event?.preventDefault();

    const query = searchText.trim();

    if (!query) return;

    setSearching(true);
    setError("");

    try {
      const results = await searchLocation(query);

      setSearchResults(results);

      if (results.length === 1) {
        await selectLocation(results[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Could not find that location.");
    } finally {
      setSearching(false);
    }
  }

  async function selectLocation(nextLocation) {
    setLocation(nextLocation);
    setSearchResults([]);
    setSearchText("");

    await loadWeather(
      nextLocation.latitude,
      nextLocation.longitude,
      selectedPersona
    );
  }

  function choosePersona(persona) {
    setSelectedPersona(persona);
    setPage("personalized");
  }

  function goToPersonaSelection() {
    setPage("personas");
  }

  function goBackToWeather() {
    setPage("weather");
  }

  useEffect(() => {
    useMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPersona || page !== "personalized") return;

    loadWeather(
      location.latitude,
      location.longitude,
      selectedPersona
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersona]);

  if (loading && !weather) {
    return (
      <div className="app-shell loading-screen">
        <div className="loading-card">
          <div className="loading-logo">
            <span />
          </div>

          <div>
            <h1>Atmos</h1>
            <p>Reading the atmosphere...</p>
          </div>
        </div>
      </div>
    );
  }

  const temperature = Math.round(
    Number(current.temperature_2m ?? 0)
  );

  const apparentTemperature = Math.round(
    Number(current.apparent_temperature ?? temperature)
  );

  const humidity = Math.round(
    Number(current.relative_humidity_2m ?? 0)
  );

  const wind = Math.round(
    Number(current.wind_speed_10m ?? 0)
  );

  const uv = Number(current.uv_index ?? 0);

  const todayHigh = Math.round(
    Number(daily.temperature_2m_max?.[0] ?? temperature)
  );

  const todayLow = Math.round(
    Number(daily.temperature_2m_min?.[0] ?? temperature)
  );

  const rainChance = Math.round(
    Number(
      daily.precipitation_probability_max?.[0] ??
      hourly.precipitation_probability?.[currentHourlyIndex] ??
      0
    )
  );

  const personalizedInsights =
    weather?.insights ||
    [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={goBackToWeather}
          aria-label="Atmos home"
        >
          <div className="brand-icon">
            <span />
          </div>

          <span className="brand-name">
            Atmos
          </span>
        </button>

        <form
          className="location-search"
          onSubmit={performSearch}
        >
          <span className="search-symbol">⌕</span>

          <input
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
            placeholder="Search city..."
            aria-label="Search city"
          />

          {searching && (
            <span className="search-status">
              ...
            </span>
          )}
        </form>

        <button
          className="location-button"
          onClick={useMyLocation}
        >
          <span>⌖</span>
          <span className="location-button-text">
            My location
          </span>
        </button>
      </header>

      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result, index) => (
            <button
              key={`${result.latitude}-${result.longitude}-${index}`}
              onClick={() => selectLocation(result)}
              className="search-result"
            >
              <strong>
                {result.name}
              </strong>

              <span>
                {[result.admin1, result.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <main className="page-container">
        {page === "weather" && (
          <section className="page weather-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  CURRENT WEATHER
                </span>

                <h2>
                  {getLocationLabel(location)}
                </h2>

                <p>
                  {location.country || "Selected location"}
                </p>
              </div>

              <div className="live-status">
                <span className="status-dot" />
                Live conditions
              </div>
            </div>

            <section className="weather-hero">
              <div className="hero-main">
                <div className="hero-icon">
                  {currentIcon}
                </div>

                <div>
                  <div className="temperature">
                    {temperature}
                    <span>°C</span>
                  </div>

                  <div className="condition">
                    {condition}
                  </div>

                  <div className="feels-like">
                    Feels like {apparentTemperature}°C
                  </div>
                </div>
              </div>

              <div className="hero-summary">
                <div>
                  <span>Today's range</span>
                  <strong>
                    {todayHigh}° / {todayLow}°
                  </strong>
                </div>

                <div>
                  <span>Rain chance</span>
                  <strong>{rainChance}%</strong>
                </div>

                <div>
                  <span>UV index</span>
                  <strong>{uv.toFixed(1)}</strong>
                </div>
              </div>
            </section>

            <section className="metrics-grid">
              <Metric
                label="Humidity"
                value={`${humidity}%`}
                symbol="◌"
              />

              <Metric
                label="Wind"
                value={`${wind} km/h`}
                symbol="↗"
              />

              <Metric
                label="Precipitation"
                value={`${Number(
                  current.precipitation ?? 0
                ).toFixed(1)} mm`}
                symbol="⌁"
              />

              <Metric
                label="Atmosphere"
                value={
                  actualIsDay
                    ? "Daytime"
                    : "Nighttime"
                }
                symbol={
                  actualIsDay
                    ? "☀"
                    : "☾"
                }
              />
            </section>

            <section className="forecast-section">
              <div className="section-title">
                <div>
                  <span className="eyebrow">
                    FORECAST
                  </span>
                  <h3>Next few days</h3>
                </div>
              </div>

              <div className="daily-grid">
                {(daily.time || [])
                  .slice(0, 5)
                  .map((day, index) => {
                    const code =
                      daily.weather_code?.[index];

                    return (
                      <div
                        className="day-card"
                        key={day}
                      >
                        <span className="day-name">
                          {formatDay(day, index)}
                        </span>

                        <span className="day-icon">
                          {weatherIcon(
                            code,
                            index === 0
                              ? actualIsDay
                              : true
                          )}
                        </span>

                        <strong>
                          {Math.round(
                            daily.temperature_2m_max?.[
                              index
                            ] ?? 0
                          )}
                          °
                        </strong>

                        <span className="day-low">
                          {Math.round(
                            daily.temperature_2m_min?.[
                              index
                            ] ?? 0
                          )}
                          °
                        </span>

                        <span className="day-rain">
                          {Math.round(
                            daily
                              .precipitation_probability_max?.[
                              index
                            ] ?? 0
                          )}
                          % rain
                        </span>
                      </div>
                    );
                  })}
              </div>
            </section>

            <section className="hourly-section">
              <div className="section-title">
                <div>
                  <span className="eyebrow">
                    HOURLY
                  </span>
                  <h3>Coming up</h3>
                </div>
              </div>

              <div className="hourly-scroll">
                {(hourly.time || [])
                  .slice(
                    currentHourlyIndex,
                    currentHourlyIndex + 8
                  )
                  .map((time, visibleIndex) => {
                    const index =
                      currentHourlyIndex +
                      visibleIndex;

                    const code =
                      hourly.weather_code?.[index];

                    const hourIsDay =
                      hourly.is_day?.[index] !== undefined
                        ? Number(
                            hourly.is_day[index]
                          ) === 1
                        : actualIsDay;

                    return (
                      <div
                        className="hour-card"
                        key={time}
                      >
                        <span>
                          {visibleIndex === 0
                            ? "Now"
                            : formatHour(time)}
                        </span>

                        <div className="hour-icon">
                          {weatherIcon(
                            code,
                            hourIsDay
                          )}
                        </div>

                        <strong>
                          {Math.round(
                            hourly.temperature_2m?.[
                              index
                            ] ?? 0
                          )}
                          °
                        </strong>

                        <small>
                          {Math.round(
                            hourly
                              .precipitation_probability?.[
                              index
                            ] ?? 0
                          )}
                          %
                        </small>
                      </div>
                    );
                  })}
              </div>
            </section>

            <section className="personalize-callout">
              <div>
                <span className="eyebrow">
                  MAKE IT PERSONAL
                </span>

                <h3>
                  Weather that works for you.
                </h3>

                <p>
                  Choose what matters to you and
                  Atmos will turn the forecast into
                  useful advice.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={goToPersonaSelection}
              >
                Personalize weather →
              </button>
            </section>
          </section>
        )}

        {page === "personas" && (
          <section className="page persona-page">
            <button
              className="back-button"
              onClick={goBackToWeather}
            >
              ← Current weather
            </button>

            <div className="persona-heading">
              <span className="eyebrow">
                PERSONALIZATION
              </span>

              <h2>
                What are you using Atmos for?
              </h2>

              <p>
                Choose a purpose and we'll tailor
                the weather information to you.
              </p>
            </div>

            <div className="persona-grid">
              {Object.entries(PERSONAS).map(
                ([key, persona]) => (
                  <button
                    className="persona-card"
                    key={key}
                    onClick={() =>
                      choosePersona(key)
                    }
                  >
                    <span className="persona-icon">
                      {persona.icon}
                    </span>

                    <div>
                      <h3>{persona.title}</h3>

                      <p>
                        {persona.description}
                      </p>
                    </div>

                    <span className="persona-arrow">
                      →
                    </span>
                  </button>
                )
              )}
            </div>
          </section>
        )}

        {page === "personalized" && (
          <section className="page personalized-page">
            <button
              className="back-button"
              onClick={goToPersonaSelection}
            >
              ← Change purpose
            </button>

            <div className="personalized-heading">
              <div>
                <span className="eyebrow">
                  PERSONALIZED FOR
                </span>

                <h2>
                  {PERSONAS[selectedPersona]?.title}
                </h2>

                <p>
                  {getLocationLabel(location)}
                </p>
              </div>

              <div className="personalized-current">
                <span className="mini-weather-icon">
                  {currentIcon}
                </span>

                <strong>
                  {temperature}°
                </strong>

                <span>
                  {condition}
                </span>
              </div>
            </div>

            <section className="insights-section">
              <div className="section-title">
                <div>
                  <span className="eyebrow">
                    YOUR WEATHER
                  </span>

                  <h3>
                    Today's useful insights
                  </h3>
                </div>
              </div>

              {personalizedInsights.length > 0 ? (
                <div className="insights-grid">
                  {personalizedInsights.map(
                    (insight, index) => (
                      <article
                        className={`insight-card ${
                          insight.priority || ""
                        }`}
                        key={index}
                      >
                        <div className="insight-number">
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div>
                          <span className="insight-priority">
                            {insight.priority ||
                              "INFO"}
                          </span>

                          <p>
                            {insight.message ||
                              insight.text ||
                              insight}
                          </p>
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="empty-insights">
                  Personalized insights are being
                  prepared for this weather.
                </div>
              )}
            </section>

            <section className="related-grid">
              <div className="related-card">
                <span className="eyebrow">
                  CONDITIONS
                </span>

                <h3>
                  What the atmosphere is doing
                </h3>

                <div className="related-values">
                  <InfoRow
                    label="Temperature"
                    value={`${temperature}°C`}
                  />

                  <InfoRow
                    label="Feels like"
                    value={`${apparentTemperature}°C`}
                  />

                  <InfoRow
                    label="Humidity"
                    value={`${humidity}%`}
                  />

                  <InfoRow
                    label="Wind"
                    value={`${wind} km/h`}
                  />
                </div>
              </div>

              <div className="related-card">
                <span className="eyebrow">
                  TODAY
                </span>

                <h3>
                  Things worth knowing
                </h3>

                <div className="related-values">
                  <InfoRow
                    label="High"
                    value={`${todayHigh}°C`}
                  />

                  <InfoRow
                    label="Low"
                    value={`${todayLow}°C`}
                  />

                  <InfoRow
                    label="Rain probability"
                    value={`${rainChance}%`}
                  />

                  <InfoRow
                    label="UV"
                    value={uv.toFixed(1)}
                  />
                </div>
              </div>
            </section>

            <section className="personalized-forecast">
              <div className="section-title">
                <div>
                  <span className="eyebrow">
                    RELATED FORECAST
                  </span>

                  <h3>
                    Plan around the next few days
                  </h3>
                </div>
              </div>

              <div className="compact-forecast">
                {(daily.time || [])
                  .slice(0, 5)
                  .map((day, index) => (
                    <div
                      className="compact-day"
                      key={day}
                    >
                      <span>
                        {formatDay(day, index)}
                      </span>

                      <span>
                        {weatherIcon(
                          daily.weather_code?.[
                            index
                          ],
                          index === 0
                            ? actualIsDay
                            : true
                        )}
                      </span>

                      <strong>
                        {Math.round(
                          daily.temperature_2m_max?.[
                            index
                          ] ?? 0
                        )}
                        °
                      </strong>
                    </div>
                  ))}
              </div>
            </section>

            <button
              className="secondary-button"
              onClick={goBackToWeather}
            >
              ← Back to current weather
            </button>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <span>Atmos</span>
        <span>Weather, made useful.</span>
      </footer>
    </div>
  );
}

function Metric({ label, value, symbol }) {
  return (
    <div className="metric-card">
      <span className="metric-symbol">
        {symbol}
      </span>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
