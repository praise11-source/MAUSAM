import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./App.css";

const BACKEND_URL =
  "https://mausam-eta9.onrender.com";


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
    rain: "☔",
    irrigation: "💧",
    heat: "🌡",
    wind: "≋",
    uv: "☀",
    humidity: "◌",
    good: "✓",
  };

  return icons[type] || "•";
}


function getWeatherCondition(weather) {
  const precipitation = Number(
    weather?.precipitation ?? 0
  );

  const humidity = Number(
    weather?.relative_humidity_2m ?? 0
  );

  const temperature = Number(
    weather?.temperature_2m ?? 0
  );

  const code = Number(
    weather?.weather_code ?? 0
  );

  if (
    precipitation > 0 ||
    [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)
  ) {
    return {
      label: "Rainy",
      sublabel: "Rain showers",
      icon: "🌧",
    };
  }

  if (
    [95, 96, 99].includes(code)
  ) {
    return {
      label: "Stormy",
      sublabel: "Thunderstorms",
      icon: "⛈",
    };
  }

  if (temperature >= 35) {
    return {
      label: "Hot",
      sublabel: "Clear skies",
      icon: "☀",
    };
  }

  if (humidity >= 80) {
    return {
      label: "Humid",
      sublabel: "Partly cloudy",
      icon: "🌤",
    };
  }

  if (temperature <= 15) {
    return {
      label: "Cool",
      sublabel: "Cloudy",
      icon: "☁",
    };
  }

  if (
    [1, 2].includes(code)
  ) {
    return {
      label: "Partly cloudy",
      sublabel: "Partly cloudy",
      icon: "🌤",
    };
  }

  if (code === 3) {
    return {
      label: "Cloudy",
      sublabel: "Overcast",
      icon: "☁",
    };
  }

  return {
    label: "Clear",
    sublabel: "Clear skies",
    icon: "☀",
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
    return index === 0
      ? "Today"
      : `Day ${index + 1}`;
  }

  const date =
    new Date(`${time}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return index === 0
      ? "Today"
      : `Day ${index + 1}`;
  }

  if (index === 0) {
    return "Today";
  }

  return date.toLocaleDateString([], {
    weekday: "short",
  });
}


function getForecastIcon(
  rainProbability,
  temperature,
  weatherCode
) {
  const rain = Number(
    rainProbability ?? 0
  );

  const temp = Number(
    temperature ?? 0
  );

  const code = Number(
    weatherCode ?? 0
  );

  if (
    [95, 96, 99].includes(code)
  ) {
    return "⛈";
  }

  if (
    rain >= 60 ||
    [61, 63, 65, 80, 81, 82].includes(code)
  ) {
    return "🌧";
  }

  if (
    rain >= 30 ||
    [1, 2].includes(code)
  ) {
    return "🌤";
  }

  if (temp >= 35) {
    return "☀";
  }

  if (
    temp <= 15 ||
    code === 3
  ) {
    return "☁";
  }

  return "☀";
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
  const [persona, setPersona] =
    useState("agriculture");

  const [location, setLocation] =
    useState(null);

  const [locationName, setLocationName] =
    useState("Detecting location...");

  const [weatherData, setWeatherData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ------------------------------------
  // LOCATION
  // ------------------------------------

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        latitude: 28.6139,
        longitude: 77.2090,
      });

      setLocationName("New Delhi");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setLocation({
          latitude,
          longitude,
        });

        try {
          const response =
            await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );

          if (!response.ok) {
            throw new Error(
              "Reverse geocoding failed"
            );
          }

          const data =
            await response.json();

          const city =
            data.city ||
            data.locality ||
            data.principalSubdivision ||
            "Your location";

          setLocationName(city);

        } catch {
          setLocationName(
            "Your location"
          );
        }
      },

      () => {
        setLocation({
          latitude: 28.6139,
          longitude: 77.2090,
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


  // ------------------------------------
  // WEATHER
  // ------------------------------------

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
          `&lat=${location.latitude}` +
          `&lon=${location.longitude}`;

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Weather server returned ${response.status}`
          );
        }

        const data =
          await response.json();

        if (cancelled) return;

        setWeatherData(data);

      } catch (err) {
        if (cancelled) return;

        console.error(
          "Weather fetch error:",
          err
        );

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


  const weather =
    weatherData?.weather || {};

  const hourly =
    weatherData?.hourly || {};

  const daily =
    weatherData?.daily || {};

  const insights =
    Array.isArray(weatherData?.insights)
      ? weatherData.insights
      : [];


  // ------------------------------------
  // CURRENT VALUES
  // ------------------------------------

  const currentTemperature =
    Number(
      weather?.temperature_2m ?? 0
    );

  const humidity =
    Number(
      weather?.relative_humidity_2m ?? 0
    );

  const precipitation =
    Number(
      weather?.precipitation ?? 0
    );

  const wind =
    Number(
      weather?.wind_speed_10m ?? 0
    );

  const uv =
    Number(
      weather?.uv_index ?? 0
    );


  const soilMoisture =
    hourly?.soil_moisture_0_to_7cm?.[0] ??
    null;

  const soilTemperature =
    hourly?.soil_temperature_0cm?.[0] ??
    null;


  const condition = useMemo(
    () =>
      getWeatherCondition(weather),
    [weather]
  );


  const selectedPersona =
    PERSONAS.find(
      (item) => item.id === persona
    );


  // ------------------------------------
  // FIND CURRENT HOURLY INDEX
  // ------------------------------------

  const currentHourlyIndex =
    useMemo(() => {
      const times =
        Array.isArray(hourly?.time)
          ? hourly.time
          : [];

      if (!times.length) {
        return 0;
      }

      const currentTime =
        weatherData?.weather?.time;

      if (!currentTime) {
        return 0;
      }

      const currentDate =
        new Date(currentTime).getTime();

      let closestIndex = 0;
      let smallestDifference =
        Infinity;

      times.forEach(
        (time, index) => {
          const difference =
            Math.abs(
              new Date(time).getTime() -
                currentDate
            );

          if (
            difference <
            smallestDifference
          ) {
            smallestDifference =
              difference;

            closestIndex = index;
          }
        }
      );

      return closestIndex;
    }, [hourly, weatherData]);


  // ------------------------------------
  // HOURLY FORECAST
  // ------------------------------------

  const hourlyForecast =
    useMemo(() => {
      const times =
        Array.isArray(hourly?.time)
          ? hourly.time
          : [];

      const temperatures =
        Array.isArray(
          hourly?.temperature_2m
        )
          ? hourly.temperature_2m
          : [];

      const rainProbabilities =
        Array.isArray(
          hourly?.precipitation_probability
        )
          ? hourly.precipitation_probability
          : [];

      const weatherCodes =
        Array.isArray(
          hourly?.weather_code
        )
          ? hourly.weather_code
          : [];

      return times
        .slice(
          currentHourlyIndex,
          currentHourlyIndex + 8
        )
        .map((time, offset) => {
          const index =
            currentHourlyIndex +
            offset;

          return {
            time,
            temperature:
              temperatures[index],
            rainProbability:
              rainProbabilities[index],
            weatherCode:
              weatherCodes[index],
          };
        });

    }, [
      hourly,
      currentHourlyIndex,
    ]);


  // ------------------------------------
  // DAILY FORECAST
  // ------------------------------------

  const dailyForecast =
    useMemo(() => {
      const times =
        Array.isArray(daily?.time)
          ? daily.time
          : [];

      const temperatures =
        Array.isArray(
          daily?.temperature_2m_max
        )
          ? daily.temperature_2m_max
          : [];

      const rainProbabilities =
        Array.isArray(
          daily?.precipitation_probability_max
        )
          ? daily.precipitation_probability_max
          : [];

      const weatherCodes =
        Array.isArray(
          daily?.weather_code
        )
          ? daily.weather_code
          : [];

      const lows =
        Array.isArray(
          daily?.temperature_2m_min
        )
          ? daily.temperature_2m_min
          : [];

      return times
        .slice(0, 7)
        .map((time, index) => ({
          time,
          temperature:
            temperatures[index],
          low:
            lows[index],
          rainProbability:
            rainProbabilities[index],
          weatherCode:
            weatherCodes[index],
        }));

    }, [daily]);


  const sunrise =
    daily?.sunrise?.[0];

  const sunset =
    daily?.sunset?.[0];


  // ------------------------------------
  // LOADING
  // ------------------------------------

  if (loading && !weatherData) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="loading-logo">
            M
          </div>

          <div className="loading-spinner" />

          <h2>
            Preparing your weather
          </h2>

          <p>
            MAUSAM is checking live
            conditions for your location.
          </p>
        </div>
      </div>
    );
  }


  // ------------------------------------
  // ERROR
  // ------------------------------------

  if (error && !weatherData) {
    return (
      <div className="error-screen">
        <div className="error-card">
          <div className="error-icon">
            !
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


  // ------------------------------------
  // UI
  // ------------------------------------

  return (
    <div className="dashboard">

      {/* --------------------------------
          SIDEBAR
      -------------------------------- */}

      <aside className="sidebar">

        <div className="sidebar-logo">
          M
        </div>

        <nav className="sidebar-nav">

          <button className="nav-button active">
            <span>⌂</span>
          </button>

          <button className="nav-button">
            <span>⌖</span>
          </button>

          <button className="nav-button">
            <span>◎</span>
          </button>

          <button className="nav-button">
            <span>▥</span>
          </button>

        </nav>

        <button className="nav-button settings">
          <span>⚙</span>
        </button>

      </aside>


      {/* --------------------------------
          MAIN
      -------------------------------- */}

      <div className="dashboard-main">

        {/* HEADER */}

        <header className="topbar">

          <div className="top-location">

            <div className="pin">
              ●
            </div>

            <div>
              <strong>
                {locationName}
              </strong>

              <span>
                {new Date().toLocaleDateString(
                  [],
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </span>
            </div>

          </div>


          <div className="top-actions">

            <button className="circle-button">
              ⌕
            </button>

            <button className="download-button">
              Download App
            </button>

          </div>

        </header>


        {/* ERROR NOTICE */}

        {error && (
          <div className="notice">
            <span>!</span>
            {error}
          </div>
        )}


        {/* HERO AREA */}

        <section className="hero-layout">

          <div className="weather-hero">

            <div className="hero-overlay" />

            <div className="hero-content">

              <div className="hero-heading">

                <div>
                  <span className="hero-label">
                    CURRENT CONDITIONS
                  </span>

                  <h1>
                    {Math.round(
                      currentTemperature
                    )}°
                  </h1>

                  <div className="hero-condition">
                    <span>
                      {condition.icon}
                    </span>

                    <div>
                      <strong>
                        {condition.label}
                      </strong>

                      <small>
                        {condition.sublabel}
                      </small>
                    </div>
                  </div>
                </div>

                <div className="hero-weather-symbol">
                  {condition.icon}
                </div>

              </div>


              <div className="hero-stats">

                <div>
                  <span>Humidity</span>
                  <strong>
                    {humidity}%
                  </strong>
                </div>

                <div>
                  <span>Rainfall</span>
                  <strong>
                    {precipitation} mm
                  </strong>
                </div>

                <div>
                  <span>Wind</span>
                  <strong>
                    {wind} km/h
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

          </div>


          {/* PERSONALIZATION */}

          <div className="personalization">

            <div className="personalization-header">

              <div>
                <span className="section-label">
                  PERSONALIZATION ENGINE
                </span>

                <h2>
                  What matters to you?
                </h2>
              </div>

              <span className="live-badge">
                LIVE
              </span>

            </div>


            <div className="persona-list">

              {PERSONAS.map((item) => (
                <button
                  key={item.id}
                  className={
                    `persona ${
                      persona === item.id
                        ? "selected"
                        : ""
                    }`
                  }
                  onClick={() =>
                    setPersona(item.id)
                  }
                >

                  <span className="persona-icon">
                    {item.icon}
                  </span>

                  <span className="persona-text">
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


            <div className="active-profile">

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


        {/* DAILY FORECAST */}

        <section className="forecast-section">

          <div className="section-title">

            <div>
              <span className="section-label">
                FORECAST
              </span>

              <h2>
                Next 7 days
              </h2>
            </div>

            <span>
              {locationName}
            </span>

          </div>


          <div className="daily-grid">

            {dailyForecast.map(
              (day, index) => (
                <div
                  className={
                    `daily-card ${
                      index === 0
                        ? "today"
                        : ""
                    }`
                  }
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
                      day.temperature,
                      day.weatherCode
                    )}
                  </span>

                  <strong>
                    {day.temperature !==
                    undefined
                      ? `${Math.round(
                          day.temperature
                        )}°`
                      : "--"}
                  </strong>

                  <small>
                    {day.low !== undefined
                      ? `${Math.round(
                          day.low
                        )}° low`
                      : "--"}
                  </small>

                  <em>
                    {day.rainProbability !==
                    undefined
                      ? `${day.rainProbability}%`
                      : "--"}
                  </em>

                </div>
              )
            )}

          </div>

        </section>


        {/* CONTENT */}

        <section className="content-layout">

          {/* LEFT */}

          <main className="main-content">

            <div className="section-title">

              <div>
                <span className="section-label">
                  ADVISORY
                </span>

                <h2>
                  {selectedPersona?.title} insights
                </h2>
              </div>

              <span>
                {insights.length} alerts
              </span>

            </div>


            <div className="insight-grid">

              {insights.length > 0 ? (
                insights.map(
                  (insight, index) => (
                    <article
                      className={
                        `insight-card ${
                          getInsightClass(
                            insight.priority
                          )
                        }`
                      }
                      key={`${insight.type}-${index}`}
                    >

                      <div className="insight-icon">
                        {getInsightIcon(
                          insight.type
                        )}
                      </div>

                      <div className="insight-body">

                        <div className="insight-heading">

                          <h3>
                            {insight.title}
                          </h3>

                          <span
                            className={
                              `priority ${insight.priority}`
                            }
                          >
                            {insight.priority}
                          </span>

                        </div>

                        <p>
                          {insight.message}
                        </p>

                      </div>

                    </article>
                  )
                )
              ) : (
                <div className="empty-insights">
                  <span>✓</span>
                  <h3>
                    Everything looks good
                  </h3>
                  <p>
                    No important weather
                    alerts for this profile.
                  </p>
                </div>
              )}

            </div>


            {/* HOURLY */}

            <div className="section-title hourly-title">

              <div>
                <span className="section-label">
                  HOURLY
                </span>

                <h2>
                  Coming up
                </h2>
              </div>

            </div>


            <div className="hourly-container">

              {hourlyForecast.map(
                (hour, index) => (
                  <div
                    className={
                      `hour-card ${
                        index === 0
                          ? "current-hour"
                          : ""
                      }`
                    }
                    key={hour.time}
                  >

                    <span>
                      {index === 0
                        ? "Now"
                        : getTimeLabel(
                            hour.time
                          )}
                    </span>

                    <strong>
                      {getForecastIcon(
                        hour.rainProbability,
                        hour.temperature,
                        hour.weatherCode
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
                      {hour.rainProbability !==
                      undefined
                        ? `${hour.rainProbability}%`
                        : "--"}
                    </small>

                  </div>
                )
              )}

            </div>

          </main>


          {/* RIGHT */}

          <aside className="right-column">

            {/* LIVE CONDITIONS */}

            <div className="glass-card live-conditions">

              <div className="card-title">

                <div>
                  <span className="section-label">
                    ATMOSPHERE
                  </span>

                  <h3>
                    Live Conditions
                  </h3>
                </div>

                <span className="arrow">
                  →
                </span>

              </div>


              <div className="condition-chart">

                <svg
                  viewBox="0 0 320 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,78 C45,78 62,69 95,60 S155,25 190,46 S235,85 270,65 S300,28 320,15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>

                <div className="chart-point" />

              </div>


              <div className="condition-metrics">

                <div>
                  <span>Humidity</span>
                  <strong>
                    {humidity}%
                  </strong>
                </div>

                <div>
                  <span>Wind</span>
                  <strong>
                    {wind} km/h
                  </strong>
                </div>

                <div>
                  <span>UV</span>
                  <strong>
                    {uv.toFixed(1)}
                  </strong>
                </div>

              </div>

            </div>


            {/* SUN */}

            <div className="glass-card">

              <div className="card-title">

                <div>
                  <span className="section-label">
                    SOLAR
                  </span>

                  <h3>
                    Sun today
                  </h3>
                </div>

                <span className="sun-symbol">
                  ☀
                </span>

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


            {/* SOIL */}

            {persona === "agriculture" && (
              <div className="glass-card">

                <div className="card-title">

                  <div>
                    <span className="section-label">
                      SOIL
                    </span>

                    <h3>
                      Growing conditions
                    </h3>
                  </div>

                  <span>
                    🌱
                  </span>

                </div>


                <div className="soil-grid">

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
                          ).toFixed(1)}°`
                        : "--"}
                    </strong>
                  </div>

                </div>

              </div>
            )}


            {/* SNAPSHOT */}

            <div className="glass-card">

              <div className="card-title">

                <div>
                  <span className="section-label">
                    SNAPSHOT
                  </span>

                  <h3>
                    Current weather
                  </h3>
                </div>

              </div>


              <div className="snapshot">

                <div>
                  <span>
                    Temperature
                  </span>

                  <strong>
                    {currentTemperature.toFixed(
                      1
                    )}°
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
                    {wind} km/h
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


        <footer className="footer">

          <strong>
            MAUSAM
          </strong>

          <span>
            Adaptive weather intelligence
          </span>

          <span>
            Live data • Personalized insights
          </span>

        </footer>

      </div>
    </div>
  );
}


export default App;
