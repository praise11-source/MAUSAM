import { useEffect, useState } from "react";
import "./App.css";

const BACKEND_URL = "http://localhost:5000"; // Replace with your backend URL

function App() {
  const [persona, setPersona] = useState("commuter");
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState("");

  // -----------------------------------------
  // GET USER LOCATION
  // -----------------------------------------

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Location services are not supported.");

      setLocation({
        lat: 28.6139,
        lon: 77.209,
      });

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        setLocationError(
          "Location permission denied. Using New Delhi."
        );

        setLocation({
          lat: 28.6139,
          lon: 77.209,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // -----------------------------------------
  // GET LOCATION NAME
  // -----------------------------------------

  useEffect(() => {
    if (!location) return;

    const getLocationName = async () => {
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lon}&localityLanguage=en`
        );

        if (!response.ok) {
          throw new Error("Location lookup failed");
        }

        const result = await response.json();

        const city =
          result.city ||
          result.locality ||
          result.principalSubdivision ||
          "Your location";

        const state = result.principalSubdivision || "";

        setLocationName(
          state && city !== state
            ? `${city}, ${state}`
            : city
        );
      } catch (error) {
        console.error(error);
        setLocationName("Your location");
      }
    };

    getLocationName();
  }, [location]);

  // -----------------------------------------
  // FETCH WEATHER
  // -----------------------------------------

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/personalized?persona=${persona}&lat=${location.lat}&lon=${location.lon}`
        );

        if (!response.ok) {
          throw new Error("Weather request failed");
        }

        const result = await response.json();

        setData(result);
      } catch (error) {
        console.error("Weather error:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [persona, location]);

  // -----------------------------------------
  // PERSONA TITLE
  // -----------------------------------------

  const getPersonaTitle = () => {
    if (persona === "commuter") return "Your commute";
    if (persona === "agriculture") return "Your garden & crops";
    if (persona === "traveller") return "Your travel";

    return "Your weather";
  };

  // -----------------------------------------
  // WEATHER CONDITION
  // -----------------------------------------

  const getWeatherCondition = () => {
    if (!data?.weather) {
      return {
        icon: "🌤️",
        label: "Weather",
      };
    }

    const rain =
      Number(data.weather.precipitation || 0);

    const rainProbability =
      Number(
        data.hourly?.precipitation_probability?.[0] || 0
      );

    const temperature =
      Number(data.weather.temperature_2m || 0);

    if (rain > 0.2) {
      return {
        icon: "🌧️",
        label: "Rainy",
      };
    }

    if (rainProbability >= 60) {
      return {
        icon: "🌦️",
        label: "Rain likely",
      };
    }

    if (temperature >= 35) {
      return {
        icon: "☀️",
        label: "Hot",
      };
    }

    return {
      icon: "☀️",
      label: "Clear",
    };
  };

  // -----------------------------------------
  // DAY / NIGHT
  // -----------------------------------------

  const isDaytime = () => {
    if (!data?.daily?.sunrise || !data?.daily?.sunset) {
      const hour = new Date().getHours();
      return hour >= 6 && hour < 18;
    }

    const now = new Date();

    const sunrise = new Date(
      data.daily.sunrise[0]
    );

    const sunset = new Date(
      data.daily.sunset[0]
    );

    return now >= sunrise && now <= sunset;
  };

  // -----------------------------------------
  // MAIN WEATHER ICON
  // -----------------------------------------

  const getMainWeatherIcon = () => {
    const condition = getWeatherCondition();

    if (condition.label === "Rainy") {
      return "🌧️";
    }

    if (condition.label === "Rain likely") {
      return isDaytime() ? "🌦️" : "🌧️";
    }

    if (!isDaytime()) {
      return "🌙";
    }

    return "☀️";
  };

  // -----------------------------------------
  // FIND CURRENT HOURLY INDEX
  // -----------------------------------------

  const getCurrentHourIndex = () => {
    if (!data?.hourly?.time) return 0;

    const currentTime =
      data.weather?.time;

    if (currentTime) {
      const exactIndex =
        data.hourly.time.indexOf(currentTime);

      if (exactIndex >= 0) {
        return exactIndex;
      }
    }

    const now = new Date();

    let closestIndex = 0;
    let smallestDifference = Infinity;

    data.hourly.time.forEach((time, index) => {
      const difference = Math.abs(
        new Date(time).getTime() - now.getTime()
      );

      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  // -----------------------------------------
  // HOURLY ICON
  // -----------------------------------------

  const getHourlyIcon = (rainProbability, time) => {
    const hour = new Date(time).getHours();

    const isDay =
      hour >= 6 && hour < 18;

    if (rainProbability >= 60) {
      return isDay ? "🌦️" : "🌧️";
    }

    if (rainProbability >= 30) {
      return isDay ? "🌤️" : "☁️";
    }

    return isDay ? "☀️" : "🌙";
  };

  // -----------------------------------------
  // FORMAT HOUR
  // -----------------------------------------

  const formatHour = (time) => {
    return new Date(time).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // -----------------------------------------
  // LOADING
  // -----------------------------------------

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-icon">🌦️</div>
          <h2>Loading your weather...</h2>
          <p>Personalizing your forecast</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      {/* -------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------- */}

      <header className="header">

        <div className="brand">

          <div className="brand-icon">
            🌦️
          </div>

          <div>
            <h1>MAUSAM</h1>
            <p>Adaptive Weather Intelligence</p>
          </div>

        </div>

        <div className="location">
          📍 {locationName || "Detecting location..."}
        </div>

      </header>

      {/* -------------------------------- */}
      {/* LOCATION NOTICE */}
      {/* -------------------------------- */}

      {locationError && (
        <div className="notice">
          <span>⚠️</span>
          <span>{locationError}</span>
        </div>
      )}

      {/* -------------------------------- */}
      {/* PERSONA */}
      {/* -------------------------------- */}

      <section className="persona-section">

        <div className="section-label">
          PERSONALIZE
        </div>

        <h2>What matters to you?</h2>

        <div className="persona-buttons">

          <button
            className={
              persona === "commuter"
                ? "active"
                : ""
            }
            onClick={() =>
              setPersona("commuter")
            }
          >
            <span className="persona-icon">
              🚗
            </span>

            <span>
              <strong>Commuter</strong>
              <small>Travel conditions</small>
            </span>
          </button>

          <button
            className={
              persona === "agriculture"
                ? "active"
                : ""
            }
            onClick={() =>
              setPersona("agriculture")
            }
          >
            <span className="persona-icon">
              🌱
            </span>

            <span>
              <strong>Agriculture</strong>
              <small>Garden & crops</small>
            </span>
          </button>

          <button
            className={
              persona === "traveller"
                ? "active"
                : ""
            }
            onClick={() =>
              setPersona("traveller")
            }
          >
            <span className="persona-icon">
              ✈️
            </span>

            <span>
              <strong>Traveller</strong>
              <small>Trip conditions</small>
            </span>
          </button>

        </div>

      </section>

      {/* -------------------------------- */}
      {/* WEATHER */}
      {/* -------------------------------- */}

      {data ? (
        <>

          <section className="weather-card">

            <div className="weather-main">

              <div className="weather-information">

                <div className="small-text">
                  CURRENT WEATHER
                </div>

                <div className="temperature">
                  {data.weather?.temperature_2m ?? "—"}
                  <span>°C</span>
                </div>

                <div className="weather-location">
                  📍 {locationName || "Your location"}
                </div>

                <div className="condition-text">
                  {getWeatherCondition().label}
                  {" • "}
                  {isDaytime()
                    ? "Daytime"
                    : "Nighttime"}
                </div>

              </div>

              <div className="main-weather-icon">
                {getMainWeatherIcon()}
              </div>

            </div>

            {/* WEATHER STATS */}

            <div className="weather-stats">

              <div className="stat-card">
                <span className="stat-icon">
                  💧
                </span>

                <div>
                  <p>Humidity</p>

                  <strong>
                    {data.weather?.relative_humidity_2m ?? "—"}%
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">
                  🌧️
                </span>

                <div>
                  <p>Rainfall</p>

                  <strong>
                    {data.weather?.precipitation ?? "—"} mm
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">
                  💨
                </span>

                <div>
                  <p>Wind</p>

                  <strong>
                    {data.weather?.wind_speed_10m ?? "—"} km/h
                  </strong>
                </div>
              </div>

              {/* AGRICULTURE */}

              {persona === "agriculture" && (
                <>

                  <div className="stat-card">
                    <span className="stat-icon">
                      ☀️
                    </span>

                    <div>
                      <p>UV Index</p>

                      <strong>
                        {data.weather?.uv_index ?? "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon">
                      🌱
                    </span>

                    <div>
                      <p>Soil Moisture</p>

                      <strong>
                        {data.currentSoilMoisture != null
                          ? `${Number(
                              data.currentSoilMoisture
                            ).toFixed(3)}`
                          : data.hourly?.soil_moisture_0_to_7cm?.[0] != null
                          ? `${Number(
                              data.hourly.soil_moisture_0_to_7cm[0]
                            ).toFixed(3)}`
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon">
                      🌡️
                    </span>

                    <div>
                      <p>Soil Temperature</p>

                      <strong>
                        {data.currentSoilTemperature != null
                          ? `${Number(
                              data.currentSoilTemperature
                            ).toFixed(1)}°C`
                          : data.hourly?.soil_temperature_0cm?.[0] != null
                          ? `${Number(
                              data.hourly.soil_temperature_0cm[0]
                            ).toFixed(1)}°C`
                          : "—"}
                      </strong>
                    </div>
                  </div>

                </>
              )}

            </div>

          </section>

          {/* -------------------------------- */}
          {/* PERSONALIZED INSIGHTS */}
          {/* -------------------------------- */}

          <section className="insights">

            <div className="section-heading">

              <div>
                <div className="section-label">
                  PERSONALIZED FOR YOU
                </div>

                <h2>
                  {getPersonaTitle()}
                </h2>

                <p className="section-description">
                  Weather information selected specifically
                  for your needs.
                </p>
              </div>

            </div>

            <div className="insight-grid">

              {data.insights &&
              data.insights.length > 0 ? (

                data.insights.map(
                  (insight, index) => (

                    <div
                      className={`insight-card ${
                        insight.priority || ""
                      }`}
                      key={index}
                    >

                      <div className="insight-icon">

                        {insight.type === "rain" &&
                          "🌧️"}

                        {insight.type === "wind" &&
                          "💨"}

                        {insight.type === "heat" &&
                          "🌡️"}

                        {insight.type === "humidity" &&
                          "💧"}

                        {insight.type === "irrigation" &&
                          "💦"}

                        {insight.type === "uv" &&
                          "☀️"}

                        {insight.type === "travel" &&
                          "✈️"}

                        {insight.type === "traffic" &&
                          "🚗"}

                        {insight.type === "good" &&
                          "✅"}

                        {insight.type === "normal" &&
                          "✅"}

                      </div>

                      <div className="insight-content">

                        <div className="insight-priority">
                          {insight.priority === "high"
                            ? "IMPORTANT"
                            : insight.priority === "medium"
                            ? "ADVISORY"
                            : "TIP"}
                        </div>

                        <h3>
                          {insight.title}
                        </h3>

                        <p>
                          {insight.message}
                        </p>

                      </div>

                    </div>

                  )
                )

              ) : (

                <div className="insight-card normal">

                  <div className="insight-icon">
                    ✅
                  </div>

                  <div>
                    <h3>
                      Weather looks good
                    </h3>

                    <p>
                      No major weather concerns
                      for your selected profile.
                    </p>
                  </div>

                </div>

              )}

            </div>

          </section>

          {/* -------------------------------- */}
          {/* HOURLY FORECAST */}
          {/* -------------------------------- */}

          <section className="hourly-section">

            <div className="section-heading">

              <div>
                <div className="section-label">
                  HOURLY FORECAST
                </div>

                <h2>
                  Next few hours
                </h2>
              </div>

            </div>

            <div className="hourly-container">

              {data.hourly?.time
                ?.slice(
                  getCurrentHourIndex(),
                  getCurrentHourIndex() + 12
                )
                .map((time, relativeIndex) => {

                  const actualIndex =
                    getCurrentHourIndex() +
                    relativeIndex;

                  const rainProbability =
                    data.hourly
                      ?.precipitation_probability
                      ?.[actualIndex] ?? 0;

                  return (
                    <div
                      className="hour-card"
                      key={time}
                    >

                      <strong>
                        {relativeIndex === 0
                          ? "Now"
                          : formatHour(time)}
                      </strong>

                      <div className="hour-icon">
                        {getHourlyIcon(
                          rainProbability,
                          time
                        )}
                      </div>

                      <span>
                        🌧️ {rainProbability}%
                      </span>

                    </div>
                  );
                })}

            </div>

          </section>

        </>
      ) : (

        <div className="error">

          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Unable to load weather data
          </h2>

          <p>
            Please try refreshing the page.
          </p>

        </div>

      )}

      {/* -------------------------------- */}
      {/* FOOTER */}
      {/* -------------------------------- */}

      <footer>
        <span>🌦️ MAUSAM</span>
        <span>Adaptive Weather Intelligence</span>
      </footer>

    </div>
  );
}

export default App;