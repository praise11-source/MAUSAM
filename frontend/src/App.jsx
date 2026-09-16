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
    description: "Road hazards, rain risk, and travel visibility.",
  },
  {
    id: "traveller",
    icon: "✈️",
    title: "Traveller",
    short: "Outdoor plans",
    description: "Conditions impacting sightseeing and outdoor activities.",
  },
  {
    id: "agriculture",
    icon: "🌾",
    title: "Agriculture",
    short: "Crops & soil",
    description: "Soil moisture, rain windows, and temperature alerts.",
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
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "🌨️";
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
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(value)) return "Rain showers";
  if ([71, 73, 75, 77].includes(value)) return "Snowfall";
  if ([95, 96, 99].includes(value)) return "Thunderstorm";

  return day ? "Clear" : "Clear night";
}

function getWeatherTheme(code, isDay) {
  const value = Number(code ?? 0);
  const day = Number(isDay) === 1;

  if ([95, 96, 99].includes(value)) return "storm";
  if ([61, 63, 65, 80, 81, 82].includes(value)) return "rain";
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
  return Number.isNaN(date.getTime())
    ? "--"
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getDayLabel(time, index) {
  if (index === 0) return "Today";
  if (!time) return `Day ${index + 1}`;
  const date = new Date(`${time}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? `Day ${index + 1}`
    : date.toLocaleDateString([], { weekday: "short" });
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

function AtmosLogo() {
  return (
    <div className="brand-mark">
      <span />
      <span />
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("weather");
  const [persona, setPersona] = useState("commuter");
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("Detecting...");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setLocation(DEFAULT_LOCATION);
      setLocationName("New Delhi");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocationName("Live Location");
        }
      },
      () => {
        if (!cancelled) {
          setLocation(DEFAULT_LOCATION);
          setLocationName("New Delhi");
        }
      }
    );

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const url = `${BACKEND_URL}/api/personalized?persona=${persona}&lat=${location.latitude}&lon=${location.longitude}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Backend connection offline");
        const data = await res.json();
        
        if (!cancelled) setWeatherData(data);
      } catch (err) {
        // Fallback to direct fetch
        try {
          const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,uv_index,weather_code,is_day&hourly=temperature_2m,precipitation_probability,soil_moisture_0_to_7cm,soil_temperature_0cm,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,weather_code&timezone=auto`;
          const directRes = await fetch(directUrl);
          const directData = await directRes.json();

          if (!cancelled) {
            setWeatherData({
              current: directData.current,
              hourly: directData.hourly,
              daily: directData.daily,
              insights: [
                { type: "good", priority: "low", title: "Live Sync", message: "Weather data updated directly from source." }
              ]
            });
          }
        } catch {
          if (!cancelled) setError("Could not load weather data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [location, persona]);

  const weather = weatherData?.current || {};
  const hourly = weatherData?.hourly || {};
  const daily = weatherData?.daily || {};

  const temperature = Number(weather.temperature_2m ?? 0);
  const feelsLike = Number(weather.apparent_temperature ?? temperature);
  const humidity = Number(weather.relative_humidity_2m ?? 0);
  const rainfall = Number(weather.precipitation ?? 0);
  const wind = Number(weather.wind_speed_10m ?? 0);
  const uv = Number(weather.uv_index ?? 0);
  const weatherCode = Number(weather.weather_code ?? 0);
  const isDay = Number(weather.is_day ?? 1);

  const icon = getWeatherIcon(weatherCode, isDay);
  const condition = getWeatherDescription(weatherCode, isDay);
  const theme = getWeatherTheme(weatherCode, isDay);

  const insights = Array.isArray(weatherData?.insights) ? weatherData.insights : [];
  const selectedPersona = PERSONAS.find((item) => item.id === persona);

  const soilMoisture = hourly?.soil_moisture_0_to_7cm?.[0] ?? null;
  const soilTemperature = hourly?.soil_temperature_0cm?.[0] ?? null;

  const hourlyForecast = useMemo(() => {
    const times = Array.isArray(hourly.time) ? hourly.time.slice(0, 6) : [];
    return times.map((t, idx) => ({
      time: t,
      temp: hourly.temperature_2m?.[idx],
      rain: hourly.precipitation_probability?.[idx],
      code: hourly.weather_code?.[idx],
      day: hourly.is_day?.[idx],
    }));
  }, [hourly]);

  const dailyForecast = useMemo(() => {
    const times = Array.isArray(daily.time) ? daily.time.slice(0, 5) : [];
    return times.map((t, idx) => ({
      time: t,
      max: daily.temperature_2m_max?.[idx],
      min: daily.temperature_2m_min?.[idx],
      code: daily.weather_code?.[idx],
    }));
  }, [daily]);

  if (loading && !weatherData) {
    return (
      <div className="atmos loading-screen" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="brand-mark" style={{ width: 40, height: 40 }} />
        <p style={{ marginTop: 12, fontSize: 12 }}>Syncing with Atmos...</p>
      </div>
    );
  }

  return (
    <div className={`atmos ${theme}`}>
      <header className="topbar">
        <button className="brand" onClick={() => setPage("weather")}>
          <AtmosLogo />
          <span className="brand-name">atmos</span>
        </button>

        <div className="top-location">
          <span>⌖</span>
          <div>
            <small>LOCATION</small>
            <strong>{locationName}</strong>
          </div>
        </div>
      </header>

      <nav className="step-nav">
        <button className={page === "weather" ? "active" : ""} onClick={() => setPage("weather")}>
          01 Weather
        </button>
        <button className={page === "personas" ? "active" : ""} onClick={() => setPage("personas")}>
          02 Purpose
        </button>
        <button className={page === "personalized" ? "active" : ""} onClick={() => setPage("personalized")}>
          03 My Atmos
        </button>
      </nav>

      {page === "weather" && (
        <main className="screen">
          <section className="weather-main-card">
            <div className="status-line">
              <span className="live-dot" /> LIVE CONDITIONS
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
              {getTimeGreeting(isDay)}
            </div>
            <h1 className="temperature">
              {Math.round(temperature)}<sup>°C</sup>
            </h1>
            <div className="condition-large">
              <span>{icon}</span>
              <strong>{condition}</strong>
            </div>

            <div className="weather-visual">
              <span className="massive-icon">{icon}</span>
            </div>

            <div className="weather-stats">
              <div>
                <small>HUMIDITY</small>
                <strong>{humidity}%</strong>
              </div>
              <div>
                <small>RAIN</small>
                <strong>{rainfall.toFixed(1)}m</strong>
              </div>
              <div>
                <small>WIND</small>
                <strong>{Math.round(wind)}k/h</strong>
              </div>
              <div>
                <small>UV</small>
                <strong>{uv.toFixed(1)}</strong>
              </div>
            </div>
          </section>

          <section className="forecast-panel">
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}>
              <span>5-DAY FORECAST</span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{locationName}</span>
            </div>
            <div className="forecast-row">
              {dailyForecast.map((d, idx) => (
                <div key={d.time} className={`forecast-item ${idx === 0 ? "today" : ""}`}>
                  <small>{getDayLabel(d.time, idx)}</small>
                  <span>{getWeatherIcon(d.code, 1)}</span>
                  <strong>{d.max !== undefined ? `${Math.round(d.max)}°` : "--"}</strong>
                </div>
              ))}
            </div>
          </section>

          <button className="next-screen" onClick={() => setPage("personas")}>
            Personalize your weather →
          </button>
        </main>
      )}

      {page === "personas" && (
        <main className="screen">
          <section className="persona-heading">
            <small style={{ color: "rgba(255,255,255,0.4)", fontWeight: 800 }}>STEP 02 OF 03</small>
            <h1>What brings you here today?</h1>
          </section>

          <section className="persona-options">
            {PERSONAS.map((item) => (
              <button
                key={item.id}
                className={`persona-option ${persona === item.id ? "selected" : ""}`}
                onClick={() => {
                  setPersona(item.id);
                  setPage("personalized");
                }}
              >
                <div className="persona-symbol">{item.icon}</div>
                <div className="persona-info">
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </div>
              </button>
            ))}
          </section>
        </main>
      )}

      {page === "personalized" && (
        <main className="screen">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <small style={{ color: "rgba(255,255,255,0.4)", fontWeight: 800 }}>PERSONALIZED FOR</small>
              <h2 style={{ margin: 0, fontSize: 20 }}>{selectedPersona?.title}</h2>
            </div>
            <button className="change-purpose" style={{ width: "auto" }} onClick={() => setPage("personas")}>
              Change
            </button>
          </div>

          <section className="insight-main">
            <small style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 800 }}>ATMOS INSIGHTS</small>
            <div className="insight-stack">
              {insights.map((item, idx) => (
                <div key={idx} className={`insight ${getInsightClass(item.priority)}`}>
                  <div className="insight-top">
                    <span>{getInsightIcon(item.type)} {item.title}</span>
                  </div>
                  <p>{item.message}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="personal-data">
            <small style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 800 }}>KEY METRICS</small>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
              {persona === "agriculture" ? (
                <>
                  <div className="hour">
                    <span>Soil Moisture</span>
                    <strong>{soilMoisture !== null ? `${Math.round(Number(soilMoisture) * 100)}%` : "--"}</strong>
                  </div>
                  <div className="hour">
                    <span>Soil Temp</span>
                    <strong>{soilTemperature !== null ? `${Number(soilTemperature).toFixed(1)}°` : "--"}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="hour">
                    <span>Feels Like</span>
                    <strong>{Math.round(feelsLike)}°C</strong>
                  </div>
                  <div className="hour">
                    <span>Wind Speed</span>
                    <strong>{Math.round(wind)} km/h</strong>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="hour-strip">
            <div className="hours">
              {hourlyForecast.map((h) => (
                <div key={h.time} className="hour">
                  <span>{getTimeLabel(h.time)}</span>
                  <strong>{getWeatherIcon(h.code, h.day)}</strong>
                  <span>{h.temp !== undefined ? `${Math.round(h.temp)}°` : "--"}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      <footer className="footer">atmos · adaptive weather intelligence</footer>
    </div>
  );
}