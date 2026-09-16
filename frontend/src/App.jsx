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
    short: "Daily travel",
    description:
      "Road conditions, rain risk and comfortable travel windows.",
  },
  {
    id: "traveller",
    icon: "✈️",
    title: "Traveller",
    short: "Outdoor plans",
    description:
      "Weather conditions that can affect your plans and activities.",
  },
  {
    id: "agriculture",
    icon: "🌾",
    title: "Agriculture",
    short: "Crops & soil",
    description:
      "Rain, soil moisture, temperature and irrigation guidance.",
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
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67].includes(code)) return "🌧️";
  if ([71, 73, 75, 77].includes(code)) return "🌨️";
  if ([80, 81, 82].includes(code)) return "🌧️";
  if ([85, 86].includes(code)) return "🌨️";
  if ([95, 96, 99].includes(code)) return "⛈️";

  return day ? "☀️" : "🌙";
}

function getWeatherDescription(code, isDay = 1) {
  const value = Number(code ?? 0);
  const day = Number(isDay) === 1;

  if (value === 0) return day ? "Clear sky" : "Clear night";
  if (value === 1) return day ? "Mainly clear" : "Mostly clear";
  if (value === 2) return "Partly cloudy";
  if (value === 3) return "Overcast";
  if ([45, 48].includes(value)) return "Foggy";
  if ([51, 53, 55].includes(value)) return "Drizzle";
  if ([56, 57].includes(value)) return "Freezing drizzle";
  if ([61, 63, 65].includes(value)) return "Rain";
  if ([66, 67].includes(value)) return "Freezing rain";
  if ([71, 73, 75, 77].includes(value)) return "Snow";
  if ([80, 81, 82].includes(value)) return "Rain showers";
  if ([85, 86].includes(value)) return "Snow showers";
  if ([95, 96, 99].includes(value)) return "Thunderstorm";

  return day ? "Clear" : "Clear night";
}

function getWeatherTheme(code, isDay) {
  const value = Number(code ?? 0);
  const day = Number(isDay) === 1;

  if ([95, 96, 99].includes(value)) return "storm";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(value))
    return "rain";
  if ([45, 48].includes(value)) return "fog";
  if ([71, 73, 75, 77, 85, 86].includes(value))
    return "snow";

  if ([2, 3].includes(value)) {
    return day ? "cloud-day" : "cloud-night";
  }

  if (!day) return "night";

  if (value === 0) return "clear-day";

  return "day";
}

function getTimeGreeting(isDay) {
  return Number(isDay) === 1 ? "Good day" : "Good evening";
}

function getTimeLabel(time) {
  if (!time) return "--";

  const date = new Date(time);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDayLabel(time, index) {
  if (!time) {
    return index === 0 ? "Today" : `Day ${index + 1}`;
  }

  if (index === 0) return "Today";

  const date = new Date(`${time}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return `Day ${index + 1}`;
  }

  return date.toLocaleDateString([], {
    weekday: "short",
  });
}

function getForecastIcon(
  rainProbability,
  temperature,
  weatherCode,
  isDay
) {
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
        "Conditions are hot. Stay hydrated and reduce prolonged exposure during peak heat.",
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
    if (rainProbability >= 50) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Allow extra commute time",
        message:
          "Rain may affect road conditions and visibility. Consider leaving earlier.",
      });
    } else if (wind < 25) {
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
    if (rainProbability >= 50) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Outdoor plans may be affected",
        message:
          "Rain is possible. Keep outdoor activities flexible and carry suitable protection.",
      });
    } else if (
      temperature < 35 &&
      rainProbability < 30 &&
      wind < 25
    ) {
      insights.push({
        type: "good",
        priority: "low",
        title: "Good outdoor conditions",
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
        priorityOrder[a.priority] -
        priorityOrder[b.priority]
    )
    .slice(0, 5);
}

async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      signal: controller.signal,
    });
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
  } catch {
    return "Current location";
  }
}

function AtmosLogo() {
  return (
    <div className="brand-mark">
      <span />
      <span />
      <i />
    </div>
  );
}

function App() {
  const [page, setPage] = useState("weather");
  const [persona, setPersona] = useState("commuter");

  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState(
    "Detecting location..."
  );

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    function detectLocation() {
      if (!navigator.geolocation) {
        setLocation(DEFAULT_LOCATION);
        setLocationName("New Delhi");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (cancelled) return;

          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          setLocation({ latitude, longitude });

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

        try {
          data = await fetchBackendWeather(
            location.latitude,
            location.longitude,
            persona
          );

          if (!data?.current && !data?.weather) {
            throw new Error("Invalid backend response");
          }
        } catch (backendError) {
          console.warn(
            "Backend unavailable. Using Open-Meteo directly.",
            backendError
          );

          const directWeather =
            await fetchDirectWeather(
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
        console.error(err);

        if (!cancelled) {
          setError(
            "Unable to load live weather. Check your internet connection."
          );
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

  const temperature = Number(
    weather.temperature_2m ?? 0
  );

  const feelsLike = Number(
    weather.apparent_temperature ?? temperature
  );

  const humidity = Number(
    weather.relative_humidity_2m ?? 0
  );

  const rainfall = Number(
    weather.precipitation ?? 0
  );

  const wind = Number(
    weather.wind_speed_10m ?? 0
  );

  const uv = Number(weather.uv_index ?? 0);

  const weatherCode = Number(
    weather.weather_code ?? 0
  );

  const isDay = Number(weather.is_day ?? 1);

  const icon = getWeatherIcon(
    weatherCode,
    isDay
  );

  const condition = getWeatherDescription(
    weatherCode,
    isDay
  );

  const theme = getWeatherTheme(
    weatherCode,
    isDay
  );

  const insights = Array.isArray(
    weatherData?.insights
  )
    ? weatherData.insights
    : [];

  const selectedPersona = PERSONAS.find(
    (item) => item.id === persona
  );

  const rainChance = Number(
    hourly?.precipitation_probability?.[0] ?? 0
  );

  const soilMoisture =
    hourly?.soil_moisture_0_to_7cm?.[0] ?? null;

  const soilTemperature =
    hourly?.soil_temperature_0cm?.[0] ?? null;

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

    let startIndex = 0;

    if (weather?.time) {
      const currentTime = new Date(
        weather.time
      ).getTime();

      let closest = Infinity;

      times.forEach((time, index) => {
        const difference = Math.abs(
          new Date(time).getTime() -
            currentTime
        );

        if (difference < closest) {
          closest = difference;
          startIndex = index;
        }
      });
    }

    return times
      .slice(startIndex, startIndex + 6)
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
  }, [hourly, weather]);

  const dailyForecast = useMemo(() => {
    const times = Array.isArray(daily.time)
      ? daily.time
      : [];

    const max = Array.isArray(
      daily.temperature_2m_max
    )
      ? daily.temperature_2m_max
      : [];

    const min = Array.isArray(
      daily.temperature_2m_min
    )
      ? daily.temperature_2m_min
      : [];

    const rain = Array.isArray(
      daily.precipitation_probability_max
    )
      ? daily.precipitation_probability_max
      : [];

    const codes = Array.isArray(
      daily.weather_code
    )
      ? daily.weather_code
      : [];

    return times
      .slice(0, 5)
      .map((time, index) => ({
        time,
        max: max[index],
        min: min[index],
        rain: rain[index],
        code: codes[index],
      }));
  }, [daily]);

  function selectPersona(id) {
    setPersona(id);
    setPage("personalized");
  }

  if (loading && !weatherData) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <AtmosLogo />
          <strong>atmos</strong>
        </div>

        <div className="loader" />

        <p>Reading the atmosphere around you...</p>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="loading-screen">
        <div className="error-box">
          <span>⚠️</span>
          <h2>Weather unavailable</h2>
          <p>{error}</p>
          <button
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

  return (
    <div className={`atmos ${theme}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <button
          className="brand"
          onClick={() => setPage("weather")}
        >
          <AtmosLogo />

          <div>
            <div className="brand-name">
              atmos
            </div>

            <div className="brand-tag">
              adaptive weather intelligence
            </div>
          </div>
        </button>

        <div className="top-location">
          <span>⌖</span>
          <div>
            <small>LIVE LOCATION</small>
            <strong>{locationName}</strong>
          </div>
        </div>
      </header>

      <div className="step-nav">
        <button
          className={
            page === "weather" ? "active" : ""
          }
          onClick={() => setPage("weather")}
        >
          <span>01</span>
          Weather
        </button>

        <div className="step-line" />

        <button
          className={
            page === "personas" ? "active" : ""
          }
          onClick={() => setPage("personas")}
        >
          <span>02</span>
          Purpose
        </button>

        <div className="step-line" />

        <button
          className={
            page === "personalized"
              ? "active"
              : ""
          }
          onClick={() => setPage("personalized")}
        >
          <span>03</span>
          My Atmos
        </button>
      </div>

      {error && (
        <div className="small-notice">
          ⚠️ {error}
        </div>
      )}

      {/* =====================================================
          SCREEN 1 — CURRENT WEATHER
      ===================================================== */}

      {page === "weather" && (
        <main className="screen weather-screen">
          <section className="weather-main-card">
            <div className="weather-copy">
              <div className="status-line">
                <span className="live-dot" />
                LIVE CONDITIONS
              </div>

              <div className="greeting">
                {getTimeGreeting(isDay)}
              </div>

              <h1 className="temperature">
                {Math.round(temperature)}
                <sup>°C</sup>
              </h1>

              <div className="condition-large">
                <span>{icon}</span>
                <strong>{condition}</strong>
              </div>

              <p className="feels">
                Feels like {Math.round(feelsLike)}°C
              </p>
            </div>

            <div className="weather-visual">
              <div className="weather-orbit orbit-one" />
              <div className="weather-orbit orbit-two" />

              <span className="massive-icon">
                {icon}
              </span>

              <div className="weather-time">
                {isDay === 1 ? "DAYTIME" : "NIGHT"}
              </div>
            </div>

            <div className="weather-stats">
              <div>
                <small>HUMIDITY</small>
                <strong>{humidity}%</strong>
              </div>

              <div>
                <small>RAIN</small>
                <strong>
                  {rainfall.toFixed(1)} mm
                </strong>
              </div>

              <div>
                <small>WIND</small>
                <strong>
                  {wind.toFixed(0)} km/h
                </strong>
              </div>

              <div>
                <small>UV INDEX</small>
                <strong>{uv.toFixed(1)}</strong>
              </div>
            </div>
          </section>

          <section className="weather-bottom">
            <div className="forecast-panel">
              <div className="panel-top">
                <div>
                  <small>SHORT RANGE</small>
                  <h2>Next 5 days</h2>
                </div>

                <span>
                  {locationName}
                </span>
              </div>

              <div className="forecast-row">
                {dailyForecast.map(
                  (day, index) => (
                    <div
                      className={`forecast-item ${
                        index === 0
                          ? "today"
                          : ""
                      }`}
                      key={day.time}
                    >
                      <small>
                        {getDayLabel(
                          day.time,
                          index
                        )}
                      </small>

                      <span>
                        {getForecastIcon(
                          day.rain,
                          day.max,
                          day.code,
                          1
                        )}
                      </span>

                      <strong>
                        {day.max !== undefined
                          ? `${Math.round(
                              day.max
                            )}°`
                          : "--"}
                      </strong>

                      <em>
                        {day.min !== undefined
                          ? `${Math.round(
                              day.min
                            )}°`
                          : "--"}
                      </em>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="side-weather-panel">
              <div className="mini-title">
                <span>☀️</span>
                <div>
                  <small>SOLAR WINDOW</small>
                  <strong>
                    Today's daylight
                  </strong>
                </div>
              </div>

              <div className="sun-row">
                <div>
                  <span>Sunrise</span>
                  <strong>
                    {getTimeLabel(sunrise)}
                  </strong>
                </div>

                <div>
                  <span>Sunset</span>
                  <strong>
                    {getTimeLabel(sunset)}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <button
            className="next-screen"
            onClick={() => setPage("personas")}
          >
            Personalise your weather
            <span>→</span>
          </button>
        </main>
      )}

      {/* =====================================================
          SCREEN 2 — PERSONA
      ===================================================== */}

      {page === "personas" && (
        <main className="screen persona-screen">
          <section className="persona-heading">
            <div className="screen-number">
              02 / 03
            </div>

            <h1>
              Weather means
              <br />
              something different to everyone.
            </h1>

            <p>
              Tell Atmos what you use weather for.
              We’ll turn raw conditions into
              information that actually matters.
            </p>
          </section>

          <section className="persona-options">
            {PERSONAS.map((item) => (
              <button
                key={item.id}
                className={`persona-option ${
                  persona === item.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  selectPersona(item.id)
                }
              >
                <div className="persona-number">
                  {item.id === "commuter"
                    ? "01"
                    : item.id === "traveller"
                    ? "02"
                    : "03"}
                </div>

                <div className="persona-symbol">
                  {item.icon}
                </div>

                <div className="persona-info">
                  <small>
                    {item.short}
                  </small>

                  <h2>{item.title}</h2>

                  <p>
                    {item.description}
                  </p>
                </div>

                <div className="persona-arrow">
                  {persona === item.id
                    ? "✓"
                    : "→"}
                </div>
              </button>
            ))}
          </section>

          <div className="persona-footer">
            <span>
              You can change your purpose anytime.
            </span>

            <button
              onClick={() =>
                setPage("personalized")
              }
            >
              Continue with{" "}
              {selectedPersona?.title} →
            </button>
          </div>
        </main>
      )}

      {/* =====================================================
          SCREEN 3 — PERSONALIZED
      ===================================================== */}

      {page === "personalized" && (
        <main className="screen personalized-screen">
          <section className="personalized-header">
            <div>
              <div className="screen-number">
                03 / 03
              </div>

              <div className="personal-title">
                <span>
                  {selectedPersona?.icon}
                </span>

                <div>
                  <small>
                    PERSONALIZED FOR
                  </small>

                  <h1>
                    {selectedPersona?.title}
                  </h1>
                </div>
              </div>
            </div>

            <button
              className="change-purpose"
              onClick={() =>
                setPage("personas")
              }
            >
              Change purpose
            </button>
          </section>

          <section className="personalized-grid">
            <div className="insight-main">
              <div className="panel-label">
                ATMOS INSIGHTS
              </div>

              <h2>
                What matters
                <br />
                right now.
              </h2>

              <div className="insight-stack">
                {insights
                  .slice(0, 3)
                  .map((insight, index) => (
                    <article
                      className={`insight ${
                        getInsightClass(
                          insight.priority
                        )
                      }`}
                      key={`${insight.type}-${index}`}
                    >
                      <div className="insight-symbol">
                        {getInsightIcon(
                          insight.type
                        )}
                      </div>

                      <div>
                        <div className="insight-top">
                          <strong>
                            {insight.title}
                          </strong>

                          <span>
                            {insight.priority}
                          </span>
                        </div>

                        <p>
                          {insight.message}
                        </p>
                      </div>
                    </article>
                  ))}
              </div>
            </div>

            <div className="personal-data">
              <div className="data-card current-card">
                <div className="data-card-head">
                  <small>
                    CURRENT ATMOSPHERE
                  </small>
                  <span>{icon}</span>
                </div>

                <strong>
                  {Math.round(temperature)}°
                </strong>

                <p>
                  {condition} · feels like{" "}
                  {Math.round(feelsLike)}°
                </p>
              </div>

              <div className="data-card">
                <div className="data-card-head">
                  <small>
                    {persona ===
                    "agriculture"
                      ? "GROWING CONDITIONS"
                      : persona ===
                        "commuter"
                      ? "TRAVEL CONDITIONS"
                      : "OUTDOOR CONDITIONS"}
                  </small>

                  <span>
                    {selectedPersona?.icon}
                  </span>
                </div>

                {persona ===
                "agriculture" ? (
                  <div className="metric-pair">
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
                        {soilTemperature !==
                        null
                          ? `${Number(
                              soilTemperature
                            ).toFixed(1)}°`
                          : "--"}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="metric-pair">
                    <div>
                      <small>
                        Rain chance
                      </small>

                      <strong>
                        {rainChance}%
                      </strong>
                    </div>

                    <div>
                      <small>
                        Wind
                      </small>

                      <strong>
                        {wind.toFixed(0)}
                        <small className="unit">
                          km/h
                        </small>
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="quick-metrics">
                <div>
                  <small>Humidity</small>
                  <strong>{humidity}%</strong>
                </div>

                <div>
                  <small>UV</small>
                  <strong>{uv.toFixed(1)}</strong>
                </div>

                <div>
                  <small>Rain</small>
                  <strong>
                    {rainChance}%
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="hour-strip">
            <div className="hour-strip-title">
              <small>COMING UP</small>
              <strong>Next few hours</strong>
            </div>

            <div className="hours">
              {hourlyForecast.map(
                (hour) => (
                  <div
                    className="hour"
                    key={hour.time}
                  >
                    <span>
                      {getTimeLabel(
                        hour.time
                      )}
                    </span>

                    <strong>
                      {getForecastIcon(
                        hour.rainProbability,
                        hour.temperature,
                        hour.weatherCode,
                        hour.isDay
                      )}
                    </strong>

                    <b>
                      {hour.temperature !==
                      undefined
                        ? `${Math.round(
                            hour.temperature
                          )}°`
                        : "--"}
                    </b>

                    <small>
                      {hour.rainProbability ??
                        0}
                      %
                    </small>
                  </div>
                )
              )}
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        <span>atmos</span>
        <span>
          Adaptive weather intelligence
        </span>
      </footer>
    </div>
  );
}

export default App;