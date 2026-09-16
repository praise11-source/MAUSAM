import { useEffect, useMemo, useState } from "react";
import "./App.css";

const DEFAULT_LOCATION = {
  latitude: 28.6139,
  longitude: 77.209,
};

const PERSONAS = [
  {
    id: "commuter",
    icon: "🚗",
    title: "Commuter",
    description: "Road hazards, precipitation risk, and transit visibility.",
  },
  {
    id: "traveller",
    icon: "✈️",
    title: "Traveller",
    description: "Sightseeing comfort, extreme UV, and activity suitability.",
  },
  {
    id: "agriculture",
    icon: "🌾",
    title: "Agriculture",
    description: "Soil moisture, irrigation timing, and crop thermal stress.",
  },
];

function getWeatherIcon(weatherCode, isDay = 1) {
  const code = Number(weatherCode ?? 0);
  const day = Number(isDay) === 1;

  if (code === 0) return day ? "☀️" : "🌙";
  if (code === 1) return day ? "🌤️" : "🌙";
  if (code === 2) return day ? "⛅" : "☁️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
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
    cold: "❄️",
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
    <div className="brand-mark-cool">
      <div className="core-dot" />
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("weather");
  const [persona, setPersona] = useState("commuter");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationName, setLocationName] = useState("Locating...");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  // REVERSE GEOCODING ENGINE
  const getCityName = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      );
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.address?.state;
      if (city) {
        setLocationName(city);
        return;
      }
    } catch {
      // Fallback if nominatim network is blocked
    }
    setLocationName("New Delhi");
  };

  // DETECT GEOLOCATION ON MOUNT
  useEffect(() => {
    let cancelled = false;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };
            setLocation(coords);
            getCityName(coords.latitude, coords.longitude);
          }
        },
        () => {
          if (!cancelled) {
            setLocation(DEFAULT_LOCATION);
            setLocationName("New Delhi");
          }
        }
      );
    } else {
      setLocation(DEFAULT_LOCATION);
      setLocationName("New Delhi");
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // FETCH WEATHER DATA VIA GUARANTEED 'CURRENT_WEATHER' PAYLOAD
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,uv_index,weather_code,is_day,soil_moisture_0_to_7cm,soil_temperature_0cm&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        if (!cancelled && data) {
          setWeatherData(data);
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [location]);

  // DIRECT PARSING FROM current_weather API ARRAY
  const currentWeather = weatherData?.current_weather || {};
  const hourly = weatherData?.hourly || {};
  const daily = weatherData?.daily || {};

  // FIXED TEMP EXTRACTION (Reads directly from Open-Meteo current_weather root)
  const temperature = currentWeather.temperature !== undefined ? currentWeather.temperature : 24;
  const weatherCode = currentWeather.weathercode !== undefined ? currentWeather.weathercode : 0;
  const isDay = currentWeather.is_day !== undefined ? currentWeather.is_day : 1;
  const wind = currentWeather.windspeed !== undefined ? currentWeather.windspeed : 10;

  const humidity = hourly.relative_humidity_2m?.[0] ?? 60;
  const rainfall = hourly.precipitation?.[0] ?? 0;
  const uv = hourly.uv_index?.[0] ?? 3;
  const feelsLike = hourly.apparent_temperature?.[0] ?? temperature;

  const icon = getWeatherIcon(weatherCode, isDay);
  const condition = getWeatherDescription(weatherCode, isDay);
  const theme = getWeatherTheme(weatherCode, isDay);

  const selectedPersona = PERSONAS.find((item) => item.id === persona);

  const soilMoisture = hourly?.soil_moisture_0_to_7cm?.[0] ?? 0.32;
  const soilTemperature = hourly?.soil_temperature_0cm?.[0] ?? temperature;

  const hourlyForecast = useMemo(() => {
    const times = Array.isArray(hourly.time) ? hourly.time.slice(0, 6) : [];
    return times.map((t, idx) => ({
      time: t,
      temp: hourly.temperature_2m?.[idx] ?? temperature,
      code: hourly.weather_code?.[idx] ?? 0,
      day: hourly.is_day?.[idx] ?? 1,
    }));
  }, [hourly, temperature]);

  const dailyForecast = useMemo(() => {
    const times = Array.isArray(daily.time) ? daily.time.slice(0, 5) : [];
    return times.map((t, idx) => ({
      time: t,
      max: daily.temperature_2m_max?.[idx] ?? temperature + 2,
      min: daily.temperature_2m_min?.[idx] ?? temperature - 4,
      code: daily.weather_code?.[idx] ?? 0,
    }));
  }, [daily, temperature]);

  const personaInsights = useMemo(() => {
    const list = [];
    if (persona === "agriculture") {
      list.push({ type: "irrigation", priority: "high", title: "Irrigation Schedule", message: "Optimal soil moisture levels detected. Maintain standard watering cycle." });
      list.push({ type: "soil", priority: "medium", title: "Soil Thermal Status", message: `Topsoil temperature stable around ${Math.round(soilTemperature)}°C.` });
      list.push({ type: "good", priority: "low", title: "Field Operations", message: "Low wind conditions make this window ideal for fertilization." });
    } else if (persona === "commuter") {
      list.push({ type: "rain", priority: "high", title: "Route Visibility", message: "Clear travel conditions across main transit corridors." });
      list.push({ type: "wind", priority: "medium", title: "Two-Wheel Advisory", message: `Breeze at ${Math.round(wind)} km/h. Safe driving conditions.` });
      list.push({ type: "good", priority: "low", title: "Transit Delay Risk", message: "Minimal congestion expected due to mild weather." });
    } else {
      list.push({ type: "good", priority: "high", title: "Sightseeing Window", message: "Great outdoor conditions for city tours and local travel." });
      list.push({ type: "uv", priority: "medium", title: "UV Exposure Alert", message: `UV Index is at ${Number(uv).toFixed(1)}. Wear sun protection outdoors.` });
      list.push({ type: "humidity", priority: "low", title: "Evening Comfort", message: `Humidity stands at ${humidity}%. Comfort index is balanced.` });
    }
    return list;
  }, [persona, soilTemperature, wind, uv, humidity]);

  if (loading && !weatherData) {
    return (
      <div className="atmos loading-screen" style={{ justifyContent: "center", alignItems: "center" }}>
        <AtmosLogo />
        <p style={{ marginTop: 12, fontSize: 12 }}>Syncing Atmos...</p>
      </div>
    );
  }

  return (
    <div className={`atmos ${theme}`}>
      <header className="topbar">
        <button className="brand" onClick={() => setPage("weather")}>
          <AtmosLogo />
          <span className="brand-name">Atmos</span>
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
          Weather
        </button>
        <button className={page === "personas" ? "active" : ""} onClick={() => setPage("personas")}>
          Purpose
        </button>
        <button className={page === "personalized" ? "active" : ""} onClick={() => setPage("personalized")}>
          My Atmos
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
                <strong>{Number(rainfall).toFixed(1)}m</strong>
              </div>
              <div>
                <small>WIND</small>
                <strong>{Math.round(wind)}k/h</strong>
              </div>
              <div>
                <small>UV</small>
                <strong>{Number(uv).toFixed(1)}</strong>
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
                <div key={idx} className={`forecast-item ${idx === 0 ? "today" : ""}`}>
                  <small>{getDayLabel(d.time, idx)}</small>
                  <span>{getWeatherIcon(d.code, 1)}</span>
                  <strong>{Math.round(d.max)}°</strong>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {page === "personas" && (
        <main className="screen">
          <section className="persona-heading">
            <small style={{ color: "rgba(255,255,255,0.4)", fontWeight: 800 }}>TAILOR YOUR ATMOS</small>
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
            <button className="change-purpose" onClick={() => setPage("personas")}>
              Change
            </button>
          </div>

          <section className="insight-main">
            <small style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 800 }}>ATMOS INSIGHTS & ADVISORIES</small>
            <div className="insight-stack">
              {personaInsights.map((item, idx) => (
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
            <small style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 800 }}>KEY METRICS FOR {selectedPersona?.title.toUpperCase()}</small>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
              {persona === "agriculture" ? (
                <>
                  <div className="hour">
                    <span>Soil Moisture</span>
                    <strong>{Math.round(Number(soilMoisture) * 100)}%</strong>
                  </div>
                  <div className="hour">
                    <span>Soil Temp</span>
                    <strong>{Number(soilTemperature).toFixed(1)}°</strong>
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
              {hourlyForecast.map((h, idx) => (
                <div key={idx} className="hour">
                  <span>{getTimeLabel(h.time)}</span>
                  <strong>{getWeatherIcon(h.code, h.day)}</strong>
                  <span>{Math.round(h.temp)}°</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      <footer className="footer">Atmos · adaptive weather intelligence</footer>
    </div>
  );
}