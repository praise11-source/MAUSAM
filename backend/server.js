const express = require("express");
const cors = require("cors");
const { getPersonalizedInsights } = require("./personalization");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

async function getWeather(latitude, longitude) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,uv_index,weather_code,is_day" +
    "&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code,is_day,soil_moisture_0_to_7cm,soil_temperature_0cm" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max" +
    "&timezone=auto";

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo response failed with status ${response.status}`);
  }

  return await response.json();
}

app.get("/api/weather", async (req, res) => {
  try {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: "Valid latitude and longitude are required." });
    }

    const weather = await getWeather(latitude, longitude);
    res.json(weather);
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({ error: "Unable to fetch weather.", message: error.message });
  }
});

app.get("/api/personalized", async (req, res) => {
  try {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);
    const persona = String(req.query.persona || "commuter");

    const allowedPersonas = ["commuter", "traveller", "agriculture"];
    const selectedPersona = allowedPersonas.includes(persona) ? persona : "commuter";

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: "Valid latitude and longitude are required." });
    }

    const weather = await getWeather(latitude, longitude);
    const insights = getPersonalizedInsights(selectedPersona, weather);

    res.json({
      persona: selectedPersona,
      current: weather.current,
      hourly: weather.hourly,
      daily: weather.daily,
      timezone: weather.timezone,
      timezone_abbreviation: weather.timezone_abbreviation,
      latitude: weather.latitude,
      longitude: weather.longitude,
      insights,
    });
  } catch (error) {
    console.error("Personalized weather error:", error);
    res.status(500).json({ error: "Unable to generate personalized weather.", message: error.message });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "Atmos backend operational", service: "weather-api" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Atmos backend online on port ${PORT}`);
});