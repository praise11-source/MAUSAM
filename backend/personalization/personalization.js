function getPersonalizedInsights(persona, weather) {
  const insights = [];

  const current = weather.current || {};
  const hourly = weather.hourly || {};
  const daily = weather.daily || {};

  const temperature = Number(
    current.temperature_2m ?? 0
  );

  const humidity = Number(
    current.relative_humidity_2m ?? 0
  );

  const precipitation = Number(
    current.precipitation ?? 0
  );

  const wind = Number(
    current.wind_speed_10m ?? 0
  );

  const uv = Number(
    current.uv_index ?? 0
  );

  const rainProbability = Number(
    hourly.precipitation_probability?.[0] ?? 0
  );

  const soilMoisture =
    hourly.soil_moisture_0_to_7cm?.[0] ?? null;

  const soilTemperature =
    hourly.soil_temperature_0cm?.[0] ?? null;

  const dailyRain = Number(
    daily.precipitation_probability_max?.[0] ?? 0
  );

  // ------------------------------------
  // AGRICULTURE
  // ------------------------------------

  if (persona === "agriculture") {
    if (precipitation > 0) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Rain is falling",
        message:
          "Natural rainfall is occurring right now. Consider pausing irrigation and allowing the soil to absorb the available moisture.",
      });
    } else if (
      rainProbability >= 60 ||
      dailyRain >= 60
    ) {
      const probability = Math.max(
        rainProbability,
        dailyRain
      );

      insights.push({
        type: "rain",
        priority: "high",
        title: "Rain likely today",
        message:
          `There is around a ${probability}% chance of rain. Consider delaying irrigation if the soil is already sufficiently moist.`,
      });
    } else {
      insights.push({
        type: "rain",
        priority: "low",
        title: "Low rain chance",
        message:
          "Significant rainfall is not currently expected. Check soil moisture before deciding whether irrigation is needed.",
      });
    }

    if (
      soilMoisture !== null &&
      Number(soilMoisture) < 0.2
    ) {
      insights.push({
        type: "irrigation",
        priority: "high",
        title: "Soil may need water",
        message:
          "Soil moisture is relatively low. Check the soil around your plants and consider irrigation if it feels dry.",
      });
    } else if (
      soilMoisture !== null &&
      Number(soilMoisture) <= 0.4
    ) {
      insights.push({
        type: "irrigation",
        priority: "low",
        title: "Soil moisture is balanced",
        message:
          "Current soil moisture is in a moderate range. Avoid unnecessary watering unless your crops show signs of stress.",
      });
    } else if (
      soilMoisture !== null &&
      Number(soilMoisture) > 0.4
    ) {
      insights.push({
        type: "irrigation",
        priority: "medium",
        title: "Soil is well hydrated",
        message:
          "Soil moisture is relatively high. Hold off on additional watering and allow excess moisture to drain naturally.",
      });
    }

    if (temperature >= 35) {
      insights.push({
        type: "heat",
        priority: "high",
        title: "Heat stress possible",
        message:
          "High temperatures may increase water loss from soil and place stress on plants. Monitor crops and moisture levels closely.",
      });
    } else if (temperature >= 32) {
      insights.push({
        type: "heat",
        priority: "medium",
        title: "Warm growing conditions",
        message:
          "Warm conditions may increase evaporation. Check plants and soil more frequently during the warmer part of the day.",
      });
    }

    if (wind >= 30) {
      insights.push({
        type: "wind",
        priority: "medium",
        title: "Protect exposed crops",
        message:
          "Strong winds may affect young or exposed plants. Check supports, seedlings and other vulnerable areas.",
      });
    }

    if (uv >= 8) {
      insights.push({
        type: "uv",
        priority: "medium",
        title: "Strong sunlight",
        message:
          "UV levels are high. Monitor plants for heat or sun stress, particularly during peak afternoon hours.",
      });
    }

    if (humidity >= 80) {
      insights.push({
        type: "humidity",
        priority: "medium",
        title: "Fungal disease risk",
        message:
          "High humidity can keep leaves damp for longer. Good spacing and airflow can help reduce fungal disease risk.",
      });
    }

    if (
      soilTemperature !== null &&
      Number(soilTemperature) >= 30
    ) {
      insights.push({
        type: "heat",
        priority: "medium",
        title: "Warm soil conditions",
        message:
          "Soil temperatures are relatively high. Monitor moisture carefully because warm soil can increase water loss.",
      });
    }

  // ------------------------------------
  // COMMUTER
  // ------------------------------------

  } else if (persona === "commuter") {
    if (
      precipitation > 0 ||
      rainProbability >= 60
    ) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Rain may slow your commute",
        message:
          "Rain is occurring or likely soon. Carry rain protection and allow some extra travel time.",
      });
    } else {
      insights.push({
        type: "good",
        priority: "low",
        title: "Low rain risk",
        message:
          "There is currently no major rain signal for your commute.",
      });
    }

    if (wind >= 30) {
      insights.push({
        type: "wind",
        priority: "medium",
        title: "Windy commute",
        message:
          "Strong winds may make travelling more difficult, particularly on two-wheelers. Travel carefully.",
      });
    }

    if (temperature >= 35) {
      insights.push({
        type: "heat",
        priority: "high",
        title: "Hot commute",
        message:
          "Temperatures are high. Stay hydrated and minimize unnecessary exposure to direct sunlight.",
      });
    } else if (temperature >= 32) {
      insights.push({
        type: "heat",
        priority: "medium",
        title: "Warm commute",
        message:
          "The weather may feel warm during your journey. Keep water with you, especially for longer trips.",
      });
    }

    if (humidity >= 80) {
      insights.push({
        type: "humidity",
        priority: "medium",
        title: "Humid conditions",
        message:
          "High humidity can make the journey feel warmer and less comfortable than the temperature suggests.",
      });
    }

    if (uv >= 8) {
      insights.push({
        type: "uv",
        priority: "medium",
        title: "Strong afternoon sun",
        message:
          "UV levels are high. If possible, avoid prolonged exposure to direct sunlight during peak hours.",
      });
    }

  // ------------------------------------
  // TRAVELLER
  // ------------------------------------

  } else if (persona === "traveller") {
    if (
      precipitation > 0 ||
      rainProbability >= 60
    ) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Rain may affect your plans",
        message:
          "Rain is occurring or likely soon. Carry an umbrella and consider keeping an indoor alternative in your plans.",
      });
    } else {
      insights.push({
        type: "good",
        priority: "low",
        title: "Good conditions for exploring",
        message:
          "There is currently no major rain signal, making outdoor activities more favorable.",
      });
    }

    if (temperature >= 35) {
      insights.push({
        type: "heat",
        priority: "high",
        title: "Very warm outdoors",
        message:
          "High temperatures are expected. Carry water and plan outdoor activities around cooler periods.",
      });
    } else if (temperature >= 32) {
      insights.push({
        type: "heat",
        priority: "medium",
        title: "Warm outdoor conditions",
        message:
          "It may feel warm outdoors. Take breaks and stay hydrated during longer activities.",
      });
    }

    if (wind >= 30) {
      insights.push({
        type: "wind",
        priority: "medium",
        title: "Windy conditions",
        message:
          "Strong winds may affect outdoor activities. Check local conditions before planning exposed activities.",
      });
    }

    if (uv >= 8) {
      insights.push({
        type: "uv",
        priority: "medium",
        title: "High UV exposure",
        message:
          "Sunlight is strong. Consider scheduling outdoor activities outside the strongest afternoon sunlight.",
      });
    }

    if (humidity >= 80) {
      insights.push({
        type: "humidity",
        priority: "low",
        title: "Humid outdoors",
        message:
          "High humidity may make outdoor activities feel less comfortable. Keep water with you.",
      });
    }

  } else {
    insights.push({
      type: "good",
      priority: "low",
      title: "Weather monitored",
      message:
        "Atmos is monitoring current conditions for your location.",
    });
  }

  const priority = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return insights
    .sort(
      (a, b) =>
        (priority[b.priority] || 0) -
        (priority[a.priority] || 0)
    )
    .slice(0, 5);
}

module.exports = getPersonalizedInsights;
