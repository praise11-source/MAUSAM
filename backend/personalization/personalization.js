function getPersonalizedInsights(persona, weather) {
  const insights = [];

  const current = weather?.current || {};
  const hourly = weather?.hourly || {};

  const temperature = Number(current.temperature_2m ?? 0);
  const humidity = Number(current.relative_humidity_2m ?? 0);
  const precipitation = Number(current.precipitation ?? 0);
  const wind = Number(current.wind_speed_10m ?? 0);
  const uv = Number(current.uv_index ?? 0);

  const rainProbability = Number(hourly?.precipitation_probability?.[0] ?? 0);
  const soilMoisture = Number(hourly?.soil_moisture_0_to_7cm?.[0] ?? 0);
  const soilTemperature = Number(hourly?.soil_temperature_0cm?.[0] ?? 0);

  /* -------------------------------
     COMMON CONDITIONS
  ------------------------------- */
  if (rainProbability >= 60 || precipitation > 0) {
    insights.push({
      type: "rain",
      priority: "high",
      title: "Rain expected",
      message: "Rain is likely around current hours. Keep plans flexible and bring protection.",
    });
  }

  if (temperature >= 35) {
    insights.push({
      type: "heat",
      priority: "high",
      title: "High temperature",
      message: "Conditions are hot. Stay hydrated and avoid peak afternoon heat.",
    });
  }

  if (wind >= 30) {
    insights.push({
      type: "wind",
      priority: "medium",
      title: "Strong winds",
      message: "Wind speeds are elevated. Exercise caution while traveling.",
    });
  }

  if (uv >= 7) {
    insights.push({
      type: "uv",
      priority: "medium",
      title: "High UV Index",
      message: "Significant UV intensity. Sunscreen and shade are recommended.",
    });
  }

  if (humidity >= 80) {
    insights.push({
      type: "humidity",
      priority: "medium",
      title: "High humidity",
      message: "Elevated humidity levels may cause conditions to feel noticeably muggier.",
    });
  }

  /* -------------------------------
     AGRICULTURE
  ------------------------------- */
  if (persona === "agriculture") {
    if (rainProbability < 30 && soilMoisture < 0.25) {
      insights.push({
        type: "irrigation",
        priority: "high",
        title: "Irrigation Advised",
        message: "Soil moisture levels are low with low probability of rain ahead.",
      });
    } else if (soilTemperature >= 30) {
      insights.push({
        type: "soil",
        priority: "medium",
        title: "Warm soil detected",
        message: "Soil temperature is elevated. Monitor crop thermal stress.",
      });
    } else {
      insights.push({
        type: "soil",
        priority: "low",
        title: "Soil Moisture Stable",
        message: "Current moisture levels are balanced for typical field conditions.",
      });
    }
  }

  /* -------------------------------
     COMMUTER
  ------------------------------- */
  if (persona === "commuter") {
    if (rainProbability >= 50) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Expect Travel Delays",
        message: "Rain may cause road congestion and reduced visibility.",
      });
    } else if (wind < 25 && rainProbability < 30) {
      insights.push({
        type: "good",
        priority: "low",
        title: "Optimal Commute",
        message: "Weather parameters show optimal conditions for daily transit.",
      });
    }
  }

  /* -------------------------------
     TRAVELLER
  ------------------------------- */
  if (persona === "traveller") {
    if (rainProbability >= 50) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Outdoor Delay Likely",
        message: "Precipitation may disrupt sightseeing and open-air itineraries.",
      });
    } else if (temperature < 35 && rainProbability < 30 && wind < 25) {
      insights.push({
        type: "good",
        priority: "low",
        title: "Great Sightseeing Weather",
        message: "Mild temperatures and clear skies present ideal outdoor travel.",
      });
    }
  }

  /* -------------------------------
     FALLBACK
  ------------------------------- */
  if (insights.length === 0) {
    insights.push({
      type: "good",
      priority: "low",
      title: "Stable Conditions",
      message: "Atmos has not detected critical weather warnings for this profile.",
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 3);
}

module.exports = { getPersonalizedInsights };