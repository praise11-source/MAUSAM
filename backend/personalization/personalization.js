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
     COMMON ATMOSPHERIC INSIGHTS
  ------------------------------- */
  if (rainProbability >= 60 || precipitation > 0) {
    insights.push({
      type: "rain",
      priority: "high",
      title: "Rain Expected Soon",
      message: "High chance of precipitation in upcoming hours. Carry rain gear.",
    });
  }

  if (temperature >= 35) {
    insights.push({
      type: "heat",
      priority: "high",
      title: "Extreme Heat Warning",
      message: "High thermal exposure today. Limit direct sunlight and hydration loss.",
    });
  } else if (temperature <= 10 && temperature > 0) {
    insights.push({
      type: "cold",
      priority: "medium",
      title: "Chilly Conditions",
      message: "Temperatures are low. Wear appropriate insulated clothing.",
    });
  }

  if (wind >= 30) {
    insights.push({
      type: "wind",
      priority: "medium",
      title: "Strong Wind Gusts",
      message: "Elevated wind speeds detected. Drive carefully and secure loose items.",
    });
  }

  if (uv >= 7) {
    insights.push({
      type: "uv",
      priority: "medium",
      title: "High UV Index",
      message: "Sun intensity is peak. Apply SPF 30+ sunscreen if spending time outdoors.",
    });
  }

  if (humidity >= 80) {
    insights.push({
      type: "humidity",
      priority: "low",
      title: "High Muggy Air",
      message: "High relative humidity will make ambient temperature feel warmer.",
    });
  }

  /* -------------------------------
     AGRICULTURE PERSONA
  ------------------------------- */
  if (persona === "agriculture") {
    if (rainProbability < 30 && soilMoisture < 0.25) {
      insights.push({
        type: "irrigation",
        priority: "high",
        title: "Irrigation Advised",
        message: "Soil moisture is low with minimal rain forecast. Recommended watering window today.",
      });
    } else if (soilMoisture >= 0.45) {
      insights.push({
        type: "soil",
        priority: "medium",
        title: "Saturated Soil Alert",
        message: "High moisture level detected. Avoid heavy field operations to prevent soil compaction.",
      });
    }

    if (soilTemperature >= 30) {
      insights.push({
        type: "soil",
        priority: "medium",
        title: "Elevated Soil Temp",
        message: "Root zones are warm. Consider mulching or shade nets for sensitive crops.",
      });
    }

    insights.push({
      type: "good",
      priority: "low",
      title: "Spray Window Status",
      message: wind < 15 ? "Wind speeds are optimal for pesticide or fertilizer application." : "Hold off spraying; wind speeds exceed optimal spraying thresholds.",
    });
  }

  /* -------------------------------
     COMMUTER PERSONA
  ------------------------------- */
  if (persona === "commuter") {
    if (rainProbability >= 50) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Expect Traffic Delays",
        message: "Wet roads likely during rush hours. Leave 15 minutes earlier for safety.",
      });
    }
    
    if (wind >= 25) {
      insights.push({
        type: "wind",
        priority: "medium",
        title: "Two-Wheel Advisory",
        message: "Crosswinds may impact stability for bikes and scooters.",
      });
    }

    if (temperature > 32) {
      insights.push({
        type: "heat",
        priority: "low",
        title: "Cabin Overheating",
        message: "Park in shaded areas; vehicle interior temperatures will rise rapidly today.",
      });
    } else if (rainProbability < 20 && wind < 20) {
      insights.push({
        type: "good",
        priority: "low",
        title: "Smooth Transit Window",
        message: "Weather conditions are fully clear for uninhibited daily travel.",
      });
    }
  }

  /* -------------------------------
     TRAVELLER PERSONA
  ------------------------------- */
  if (persona === "traveller") {
    if (rainProbability >= 50) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Indoor Plan Backup",
        message: "Rain forecast may disrupt outdoor sightseeing. Schedule indoor visits today.",
      });
    } else if (temperature < 33 && rainProbability < 30 && wind < 25) {
      insights.push({
        type: "good",
        priority: "high",
        title: "Ideal Sightseeing Weather",
        message: "Mild temperatures and clear conditions are prime for photography and walking tours.",
      });
    }

    if (uv >= 6) {
      insights.push({
        type: "uv",
        priority: "medium",
        title: "Outdoor Travel Gear",
        message: "Pack sunglasses, hats, and hydration bottles for afternoon outings.",
      });
    }

    insights.push({
      type: "good",
      priority: "low",
      title: "Evening Comfort",
      message: "Nighttime conditions look calm for outdoor dining or strolls.",
    });
  }

  /* -------------------------------
     FALLBACK
  ------------------------------- */
  if (insights.length === 0) {
    insights.push({
      type: "good",
      priority: "low",
      title: "Balanced Conditions",
      message: "Atmos has not detected severe weather anomalies for your active persona.",
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 4);
}

module.exports = { getPersonalizedInsights };