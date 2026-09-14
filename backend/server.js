const express = require("express");
const cors = require("cors");

const getPersonalizedInsights = require("./personalization/personalization");

const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------
// HOME
// ------------------------------------

app.get("/", (req, res) => {
  res.json({
    message: "Atmos weather backend is running!",
  });
});

// ------------------------------------
// WEATHER API
// ------------------------------------

app.get("/api/weather", async (req, res) => {
  try {
    const latitude = Number(req.query.lat ?? 28.6139);
    const longitude = Number(req.query.lon ?? 77.209);

    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=` +
      `temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,uv_index,weather_code,apparent_temperature` +
      `&hourly=` +
      `temperature_2m,precipitation_probability,weather_code` +
      `&daily=` +
      `temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset` +
      `&timezone=auto` +
      `&forecast_days=7`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Weather API request failed");
    }

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Weather API error:", error);

    res.status(500).json({
      error: "Unable to fetch weather data",
    });
  }
});

// ------------------------------------
// PERSONALIZED WEATHER API
// ------------------------------------

app.get("/api/personalized", async (req, res) => {
  try {
    const persona = req.query.persona || "commuter";

    const latitude = Number(req.query.lat ?? 28.6139);
    const longitude = Number(req.query.lon ?? 77.209);

    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=` +
      `temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,uv_index,weather_code,apparent_temperature` +
      `&hourly=` +
      `temperature_2m,precipitation_probability,weather_code,soil_moisture_0_to_7cm,soil_temperature_0cm` +
      `&daily=` +
      `temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset` +
      `&timezone=auto` +
      `&forecast_days=7`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Weather API request failed");
    }

    const weather = await response.json();

    const insights = getPersonalizedInsights(
      persona,
      weather
    );

    res.json({
      persona,
      weather: weather.current,
      hourly: weather.hourly,
      daily: weather.daily,
      insights,
    });
  } catch (error) {
    console.error("Personalized weather error:", error);

    res.status(500).json({
      error: "Unable to generate personalized weather information",
    });
  }
});

// ------------------------------------
// START SERVER
// ------------------------------------

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Atmos backend running on http://localhost:${PORT}`);
});
