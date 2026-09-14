function getPersonalizedInsights(
  persona,
  weather
) {
  const insights = [];

  const current = weather?.current || {};
  const hourly = weather?.hourly || {};

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
    hourly?.precipitation_probability?.[0] ??
      0
  );

  const soilMoisture = Number(
    hourly?.soil_moisture_0_to_7cm?.[0] ??
      0
  );

  const soilTemperature = Number(
    hourly?.soil_temperature_0cm?.[0] ??
      0
  );

  /* -------------------------------
     COMMON CONDITIONS
  ------------------------------- */

  if (
    rainProbability >= 60 ||
    precipitation > 0
  ) {
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
        "Conditions are hot. Stay hydrated and limit prolonged exposure during peak heat.",
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
        "UV exposure may be significant. Use shade, sunscreen and protective clothing outdoors.",
    });
  }

  if (humidity >= 80) {
    insights.push({
      type: "humidity",
      priority: "medium",
      title: "High humidity",
      message:
        "Humidity is high, which can make conditions feel warmer and less comfortable.",
    });
  }

  /* -------------------------------
     AGRICULTURE
  ------------------------------- */

  if (persona === "agriculture") {
    if (
      rainProbability < 30 &&
      soilMoisture < 0.25
    ) {
      insights.push({
        type: "irrigation",
        priority: "high",
        title: "Irrigation may help",
        message:
          "Rain chances are limited and near-surface soil moisture is relatively low.",
      });
    }

    if (
      soilTemperature >= 30
    ) {
      insights.push({
        type: "soil",
        priority: "medium",
        title: "Warm soil",
        message:
          "Near-surface soil temperatures are elevated. Monitor crop and irrigation needs closely.",
      });
    }

    if (
      rainProbability < 30 &&
      soilMoisture >= 0.25
    ) {
      insights.push({
        type: "soil",
        priority: "low",
        title: "Monitor soil moisture",
        message:
          "Current soil moisture is not especially low, but conditions should be monitored as rain chances remain limited.",
      });
    }
  }

  /* -------------------------------
     COMMUTER
  ------------------------------- */

  if (persona === "commuter") {
    if (
      rainProbability >= 50
    ) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Allow extra commute time",
        message:
          "Rain may affect road conditions and visibility. Consider leaving earlier.",
      });
    }

    if (
      wind < 25 &&
      rainProbability < 30
    ) {
      insights.push({
        type: "good",
        priority: "low",
        title: "Favourable commute",
        message:
          "Current weather indicators suggest relatively comfortable travel conditions.",
      });
    }
  }

  /* -------------------------------
     TRAVELLER
  ------------------------------- */

  if (persona === "traveller") {
    if (
      rainProbability >= 50
    ) {
      insights.push({
        type: "rain",
        priority: "high",
        title: "Outdoor plans may be affected",
        message:
          "Rain is possible. Keep outdoor activities flexible and carry suitable protection.",
      });
    }

    if (
      temperature >= 35
    ) {
      insights.push({
        type: "heat",
        priority: "high",
        title: "Hot outdoor conditions",
        message:
          "Outdoor activities may feel uncomfortable during peak afternoon heat.",
      });
    }

    if (
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

  /* -------------------------------
     FALLBACK
  ------------------------------- */

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

module.exports = {
  getPersonalizedInsights,
};
