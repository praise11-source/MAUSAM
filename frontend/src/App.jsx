import { useEffect, useMemo, useState } from "react";
import "./App.css";

const DEFAULT_LOCATION = {
  name: "Delhi",
  country: "India",
  latitude: 28.6139,
  longitude: 77.209,
};

const PERSONAS = [
  {
    id: "commuter",
    icon: "🚗",
    title: "Commuter",
    description:
      "Know how the weather could affect your journey.",
  },
  {
    id: "traveller",
    icon: "✈️",
    title: "Traveller",
    description:
      "Plan outdoor activities around the weather.",
  },
  {
    id: "agriculture",
    icon: "🌱",
    title: "Agriculture",
    description:
      "Get useful information about crops, soil and irrigation.",
  },
];

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

  return descriptions[code] || "Unknown conditions";
}

function weatherIcon(code, isNight = false) {
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
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
      code
    )
  ) {
    return "🌧️";
  }

  if (
    [71, 73, 75, 77, 85, 86].includes(code)
  ) {
    return "❄️";
  }

  if ([95, 96, 99].includes(code)) {
    return "⛈️";
  }

  return "🌤️";
}

function formatHour(time) {
  const date = new Date(time);

  return date.toLocaleTimeString([], {
    hour: "numeric",
  });
}

function formatDay(time) {
  const date = new Date(`${time}T12:00:00`);

  return date.toLocaleDateString([], {
    weekday: "short",
  });
}

function App() {
  const [page, setPage] = useState("home");

  const [location, setLocation] =
    useState(DEFAULT_LOCATION);

  const [search, setSearch] = useState("");

  const [weather, setWeather] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [persona, setPersona] =
    useState("commuter");

  const [insights, setInsights] = useState([]);

  const [searching, setSearching] = useState(false);

  // ------------------------------------
  // LOAD WEATHER
  // ------------------------------------

  async function loadWeather() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/weather?lat=${location.latitude}&lon=${location.longitude}`
      );

      if (!response.ok) {
        throw new Error("Weather request failed");
      }

      const data = await response.json();

      setWeather(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load weather right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather();
  }, [location]);

  // ------------------------------------
  // LOAD PERSONALIZED DATA
  // ------------------------------------

  async function loadPersonalizedWeather(
    selectedPersona
  ) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/personalized?persona=${selectedPersona}&lat=${location.latitude}&lon=${location.longitude}`
      );

      if (!response.ok) {
        throw new Error(
          "Personalized weather request failed"
        );
      }

      const data = await response.json();

      setWeather({
        current: data.weather,
        hourly: data.hourly,
        daily: data.daily,
      });

      setInsights(data.insights);

      setPage("persona");
    } catch (err) {
      console.error(err);
      setError(
        "Unable to generate personalized weather information."
      );
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------
  // SEARCH LOCATION
  // ------------------------------------

  async function searchLocation(event) {
    event.preventDefault();

    const query = search.trim();

    if (!query) return;

    try {
      setSearching(true);
      setError("");

      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=1&language=en&format=json`
      );

      if (!response.ok) {
        throw new Error("Location search failed");
      }

      const data = await response.json();

      if (!data.results?.length) {
        setError("Location not found.");
        return;
      }

      const result = data.results[0];

      setLocation({
        name: result.name,
        country: result.country || "",
        latitude: result.latitude,
        longitude: result.longitude,
      });

      setSearch("");
      setPage("home");
    } catch (err) {
      console.error(err);
      setError("Unable to find that location.");
    } finally {
      setSearching(false);
    }
  }

  // ------------------------------------
  // CURRENT WEATHER
  // ------------------------------------

  const current = weather?.current || {};

  const temperature = Math.round(
    Number(current.temperature_2m ?? 0)
  );

  const feelsLike = Math.round(
    Number(current.apparent_temperature ?? temperature)
  );

  const humidity = Math.round(
    Number(current.relative_humidity_2m ?? 0)
  );

  const wind = Math.round(
    Number(current.wind_speed_10m ?? 0)
  );

  const uv = Number(current.uv_index ?? 0);

  const condition = weatherDescription(
    current.weather_code
  );

  const currentIcon = weatherIcon(
    current.weather_code
  );

  // ------------------------------------
  // HOURLY FORECAST
  // ------------------------------------

  const hourlyForecast = useMemo(() => {
    if (!weather?.hourly?.time) return [];

    const currentTime = new Date(
      current.time || Date.now()
    ).getTime();

    let startIndex = 0;

    weather.hourly.time.forEach(
      (time, index) => {
        const difference = Math.abs(
          new Date(time).getTime() -
            currentTime
        );

        if (
          difference <
          Math.abs(
            new Date(
              weather.hourly.time[startIndex]
            ).getTime() - currentTime
          )
        ) {
          startIndex = index;
        }
      }
    );

    return weather.hourly.time
      .slice(startIndex, startIndex + 8)
      .map((time, offset) => {
        const index = startIndex + offset;

        return {
          time,
          temperature:
            weather.hourly.temperature_2m?.[
              index
            ],
          probability:
            weather.hourly
              .precipitation_probability?.[
              index
            ],
          code:
            weather.hourly.weather_code?.[
              index
            ],
        };
      });
  }, [weather, current.time]);

  // ------------------------------------
  // DAILY FORECAST
  // ------------------------------------

  const dailyForecast = useMemo(() => {
    if (!weather?.daily?.time) return [];

    return weather.daily.time.map(
      (time, index) => ({
        time,
        max:
          weather.daily.temperature_2m_max?.[
            index
          ],
        min:
          weather.daily.temperature_2m_min?.[
            index
          ],
        code:
          weather.daily.weather_code?.[
            index
          ],
        rain:
          weather.daily
            .precipitation_probability_max?.[
            index
          ],
      })
    );
  }, [weather]);

  // ------------------------------------
  // LOADING
  // ------------------------------------

  if (loading && !weather) {
    return (
      <div className="app loading-screen">
        <div className="loading-card">
          <div className="brand-mark">A</div>
          <h1>Atmos</h1>
          <p>Reading the sky...</p>
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <header className="topbar">
        <button
          className="brand"
          onClick={() => setPage("home")}
        >
          <span className="brand-icon">A</span>
          <span>Atmos</span>
        </button>

        <form
          className="location-search"
          onSubmit={searchLocation}
        >
          <span className="search-icon">⌕</span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search a city..."
          />

          {searching && (
            <span className="search-loading">
              ...
            </span>
          )}
        </form>

        <div className="location-label">
          <span>⌖</span>
          <div>
            <strong>{location.name}</strong>
            <small>{location.country}</small>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <main className="main-content">
        {page === "home" ? (
          <HomePage
            location={location}
            current={current}
            temperature={temperature}
            feelsLike={feelsLike}
            humidity={humidity}
            wind={wind}
            uv={uv}
            condition={condition}
            currentIcon={currentIcon}
            hourlyForecast={hourlyForecast}
            dailyForecast={dailyForecast}
            onPersonaSelect={
              loadPersonalizedWeather
            }
            loading={loading}
          />
        ) : (
          <PersonaPage
            persona={persona}
            setPersona={setPersona}
            location={location}
            current={current}
            temperature={temperature}
            condition={condition}
            currentIcon={currentIcon}
            humidity={humidity}
            wind={wind}
            uv={uv}
            insights={insights}
            dailyForecast={dailyForecast}
            onBack={() => setPage("home")}
            onRefresh={() =>
              loadPersonalizedWeather(persona)
            }
            loading={loading}
          />
        )}
      </main>

      <footer className="footer">
        <span>Atmos</span>
        <span>Weather that adapts to you.</span>
      </footer>
    </div>
  );
}

// ====================================
// HOME PAGE
// ====================================

function HomePage({
  location,
  current,
  temperature,
  feelsLike,
  humidity,
  wind,
  uv,
  condition,
  currentIcon,
  hourlyForecast,
  dailyForecast,
  onPersonaSelect,
  loading,
}) {
  return (
    <>
      <section className="hero-grid">
        <div className="hero-weather glass-card">
          <div className="hero-top">
            <div>
              <p className="eyebrow">
                CURRENT WEATHER
              </p>

              <h1>{location.name}</h1>

              <p className="date-text">
                {new Date().toLocaleDateString(
                  [],
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            </div>

            <div className="hero-icon">
              {currentIcon}
            </div>
          </div>

          <div className="temperature-row">
            <span className="big-temperature">
              {temperature}°
            </span>

            <div className="condition">
              <strong>{condition}</strong>
              <span>
                Feels like {feelsLike}°
              </span>
            </div>
          </div>

          <div className="weather-stats">
            <WeatherStat
              icon="💧"
              label="Humidity"
              value={`${humidity}%`}
            />

            <WeatherStat
              icon="♨"
              label="Wind"
              value={`${wind} km/h`}
            />

            <WeatherStat
              icon="☀"
              label="UV Index"
              value={uv}
            />
          </div>
        </div>

        <div className="side-card glass-card">
          <p className="eyebrow">
            TODAY
          </p>

          <h2>
            {condition}
          </h2>

          <p>
            Here is what the weather looks like
            around {location.name}.
          </p>

          {dailyForecast[0] && (
            <div className="high-low">
              <div>
                <span>High</span>
                <strong>
                  {Math.round(
                    dailyForecast[0].max
                  )}
                  °
                </strong>
              </div>

              <div>
                <span>Low</span>
                <strong>
                  {Math.round(
                    dailyForecast[0].min
                  )}
                  °
                </strong>
              </div>

              <div>
                <span>Rain</span>
                <strong>
                  {dailyForecast[0].rain}%
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
              NEXT HOURS
            </p>
            <h2>Hourly forecast</h2>
          </div>
        </div>

        <div className="hourly-row">
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
                <span className="hour">
                  {index === 0
                    ? "Now"
                    : formatHour(
                        hour.time
                      )}
                </span>

                <span className="hour-icon">
                  {weatherIcon(hour.code)}
                </span>

                <strong>
                  {Math.round(
                    hour.temperature
                  )}
                  °
                </strong>

                {hour.probability > 0 && (
                  <small>
                    {hour.probability}% rain
                  </small>
                )}
              </div>
            )
          )}
        </div>
      </section>

      <section className="persona-section glass-card">
        <div className="persona-heading">
          <div>
            <p className="eyebrow">
              MAKE IT PERSONAL
            </p>

            <h2>
              What matters to you?
            </h2>

            <p>
              Choose a persona and Atmos will
              turn the forecast into useful
              recommendations.
            </p>
          </div>
        </div>

        <div className="persona-grid">
          <PersonaCard
            icon="🚗"
            title="Commuter"
            description="Travel, rain, heat and road conditions."
            onClick={() =>
              onPersonaSelect("commuter")
            }
            loading={loading}
          />

          <PersonaCard
            icon="✈️"
            title="Traveller"
            description="Outdoor plans, comfort and UV exposure."
            onClick={() =>
              onPersonaSelect("traveller")
            }
            loading={loading}
          />

          <PersonaCard
            icon="🌱"
            title="Agriculture"
            description="Rain, soil, irrigation and crop conditions."
            onClick={() =>
              onPersonaSelect("agriculture")
            }
            loading={loading}
          />
        </div>
      </section>
    </>
  );
}

// ====================================
// PERSONA PAGE
// ====================================

function PersonaPage({
  persona,
  setPersona,
  location,
  current,
  temperature,
  condition,
  currentIcon,
  humidity,
  wind,
  uv,
  insights,
  dailyForecast,
  onBack,
  onRefresh,
  loading,
}) {
  const personaData = {
    commuter: {
      icon: "🚗",
      title: "Your commute",
      subtitle:
        "Weather information focused on getting you where you need to go.",
    },

    traveller: {
      icon: "✈️",
      title: "Your travel outlook",
      subtitle:
        "Weather information focused on making the most of your plans.",
    },

    agriculture: {
      icon: "🌱",
      title: "Your farm outlook",
      subtitle:
        "Weather information focused on crops, soil and irrigation.",
    },
  };

  const selected = personaData[persona];

  return (
    <>
      <div className="persona-page-header">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <button
          className="refresh-button"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Updating..." : "Refresh"}
        </button>
      </div>

      <section className="persona-hero glass-card">
        <div className="persona-hero-content">
          <div className="persona-large-icon">
            {selected.icon}
          </div>

          <div>
            <p className="eyebrow">
              {location.name.toUpperCase()}
            </p>

            <h1>{selected.title}</h1>

            <p>{selected.subtitle}</p>
          </div>
        </div>

        <div className="persona-current-weather">
          <span>{currentIcon}</span>

          <div>
            <strong>{temperature}°</strong>
            <small>{condition}</small>
          </div>
        </div>
      </section>

      <section className="quick-stats">
        <WeatherStat
          icon="💧"
          label="Humidity"
          value={`${humidity}%`}
        />

        <WeatherStat
          icon="♨"
          label="Wind"
          value={`${wind} km/h`}
        />

        <WeatherStat
          icon="☀"
          label="UV Index"
          value={uv}
        />
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              PERSONALIZED FOR YOU
            </p>

            <h2>Today's recommendations</h2>
          </div>
        </div>

        <div className="insights-grid">
          {insights.map(
            (insight, index) => (
              <InsightCard
                insight={insight}
                key={`${insight.type}-${index}`}
              />
            )
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              7 DAYS
            </p>

            <h2>Upcoming weather</h2>
          </div>
        </div>

        <div className="daily-list">
          {dailyForecast.map(
            (day, index) => (
              <div
                className={`daily-card ${
                  index === 0
                    ? "today"
                    : ""
                }`}
                key={day.time}
              >
                <span>
                  {index === 0
                    ? "Today"
                    : formatDay(
                        day.time
                      )}
                </span>

                <span className="daily-icon">
                  {weatherIcon(
                    day.code
                  )}
                </span>

                <span className="daily-condition">
                  {weatherDescription(
                    day.code
                  )}
                </span>

                <span className="daily-rain">
                  {day.rain}% rain
                </span>

                <strong>
                  {Math.round(day.max)}°
                  <small>
                    {" "}
                    {Math.round(day.min)}°
                  </small>
                </strong>
              </div>
            )
          )}
        </div>
      </section>

      <section className="change-persona glass-card">
        <div>
          <p className="eyebrow">
            DIFFERENT NEED?
          </p>

          <h2>
            Change your perspective
          </h2>
        </div>

        <div className="persona-switcher">
          <button
            className={
              persona === "commuter"
                ? "active"
                : ""
            }
            onClick={() => {
              setPersona("commuter");
              onRefresh();
            }}
          >
            🚗
          </button>

          <button
            className={
              persona === "traveller"
                ? "active"
                : ""
            }
            onClick={() => {
              setPersona("traveller");
              onRefresh();
            }}
          >
            ✈️
          </button>

          <button
            className={
              persona === "agriculture"
                ? "active"
                : ""
            }
            onClick={() => {
              setPersona("agriculture");
              onRefresh();
            }}
          >
            🌱
          </button>
        </div>
      </section>
    </>
  );
}

// ====================================
// COMPONENTS
// ====================================

function WeatherStat({
  icon,
  label,
  value,
}) {
  return (
    <div className="weather-stat">
      <span className="stat-icon">
        {icon}
      </span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function PersonaCard({
  icon,
  title,
  description,
  onClick,
  loading,
}) {
  return (
    <button
      className="persona-card"
      onClick={onClick}
      disabled={loading}
    >
      <span className="persona-icon">
        {icon}
      </span>

      <span className="persona-card-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>

      <span className="arrow">
        →
      </span>
    </button>
  );
}

function InsightCard({
  insight,
}) {
  const icons = {
    rain: "🌧️",
    irrigation: "💧",
    heat: "🌡️",
    wind: "💨",
    uv: "☀️",
    humidity: "💧",
    good: "✓",
  };

  return (
    <article
      className={`insight-card priority-${insight.priority}`}
    >
      <div className="insight-icon">
        {icons[insight.type] || "•"}
      </div>

      <div>
        <div className="insight-title-row">
          <h3>{insight.title}</h3>

          {insight.priority === "high" && (
            <span className="priority-label">
              Important
            </span>
          )}
        </div>

        <p>{insight.message}</p>
      </div>
    </article>
  );
}

export default App;
