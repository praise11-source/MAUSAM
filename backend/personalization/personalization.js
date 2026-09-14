function getPersonalizedInsights(persona, weather) {

  const insights = [];

  const current = weather.current || {};
  const hourly = weather.hourly || {};
  const daily = weather.daily || {};

  const temperature =
    Number(current.temperature_2m ?? 0);

  const humidity =
    Number(current.relative_humidity_2m ?? 0);

  const precipitation =
    Number(current.precipitation ?? 0);

  const wind =
    Number(current.wind_speed_10m ?? 0);

  const uv =
    Number(current.uv_index ?? 0);

  const rainProbability =
    Number(
      hourly.precipitation_probability?.[0] ?? 0
    );

  const soilMoisture =
    hourly.soil_moisture_0_to_7cm?.[0] ?? null;

  const soilTemperature =
    hourly.soil_temperature_0cm?.[0] ?? null;

  const dailyRain =
    Number(
      daily.precipitation_probability_max?.[0] ?? 0
    );


  // ==========================================
  // AGRICULTURE
  // ==========================================

  if (persona === "agriculture") {

    // RAIN CURRENTLY
    if (precipitation > 0) {

      insights.push({
        type: "rain",
        priority: "high",
        title: "Rain detected",
        message:
          "Rain is occurring now. Consider reviewing your irrigation schedule and avoiding unnecessary watering."
      });

    }

    // RAIN EXPECTED
    else if (
      rainProbability >= 60 ||
      dailyRain >= 60
    ) {

      const probability =
        Math.max(
          rainProbability,
          dailyRain
        );

      insights.push({
        type: "rain",
        priority: "high",
        title: "Rain expected",
        message:
          `There is around a ${probability}% chance of rain. Consider delaying irrigation if your soil is already moist.`
      });

    }

    // LOW SOIL MOISTURE
    if (
      soilMoisture !== null &&
      Number(soilMoisture) < 0.20
    ) {

      insights.push({
        type: "irrigation",
        priority: "high",
        title: "Low soil moisture",
        message:
          "Soil moisture appears low. Check your plants and consider irrigation if the soil feels dry."
      });

    }

    // GOOD SOIL MOISTURE
    else if (
      soilMoisture !== null &&
      Number(soilMoisture) >= 0.20 &&
      Number(soilMoisture) <= 0.40
    ) {

      insights.push({
        type: "irrigation",
        priority: "low",
        title: "Soil moisture looks balanced",
        message:
          "Current soil moisture is in a moderate range. Avoid overwatering unless your crops need additional water."
      });

    }

    // HIGH SOIL MOISTURE
    else if (
      soilMoisture !== null &&
      Number(soilMoisture) > 0.40
    ) {

      insights.push({
        type: "irrigation",
        priority: "medium",
        title: "Soil is well hydrated",
        message:
          "Soil moisture is relatively high. Avoid unnecessary watering and allow the soil to drain naturally."
      });

    }

    // HIGH TEMPERATURE
    if (temperature >= 35) {

      insights.push({
        type: "heat",
        priority: "high",
        title: "Heat stress possible",
        message:
          "High temperatures may stress plants. Monitor soil moisture closely and provide appropriate irrigation."
      });

    }

    // MODERATELY HIGH TEMPERATURE
    else if (temperature >= 32) {

      insights.push({
        type: "heat",
        priority: "medium",
        title: "Warm conditions",
        message:
          "Warm weather may increase water loss from the soil. Keep an eye on your plants during the day."
      });

    }

    // STRONG WIND
    if (wind >= 30) {

      insights.push({
        type: "wind",
        priority: "medium",
        title: "Strong winds",
        message:
          "Strong winds may affect plants and young crops. Check supports and exposed areas."
      });

    }

    // HIGH UV
    if (uv >= 8) {

      insights.push({
        type: "uv",
        priority: "medium",
        title: "High UV levels",
        message:
          "Strong sunlight is expected. Monitor plants for heat and sun stress, especially during peak afternoon hours."
      });

    }

    // HIGH HUMIDITY
    if (humidity >= 80) {

      insights.push({
        type: "humidity",
        priority: "medium",
        title: "High humidity",
        message:
          "High humidity can keep leaves wet for longer. Good airflow around plants can help reduce fungal disease risk."
      });

    }

    // SOIL TEMPERATURE
    if (
      soilTemperature !== null &&
      Number(soilTemperature) >= 30
    ) {

      insights.push({
        type: "heat",
        priority: "medium",
        title: "Warm soil",
        message:
          "Soil temperatures are relatively high. Monitor moisture levels and plant stress during warmer periods."
      });

    }

    // GENERAL GOOD CONDITION
    if (insights.length === 0) {

      insights.push({
        type: "good",
        priority: "low",
        title: "Favorable conditions",
        message:
          "Current weather conditions look relatively favorable for your garden and crops."
      });

    }

  }


  // ==========================================
  // COMMUTER
  // ==========================================

  else if (persona === "commuter") {

    // RAIN
    if (
      precipitation > 0 ||
      rainProbability >= 60
    ) {

      insights.push({
        type: "rain",
        priority: "high",
        title: "Rain may affect your commute",
        message:
          "Rain is occurring or likely soon. Consider carrying rain protection and allowing extra travel time."
      });

    }

    // WIND
    if (wind >= 30) {

      insights.push({
        type: "wind",
        priority: "medium",
        title: "Strong winds",
        message:
          "Strong winds may make your commute more difficult. Travel carefully, especially on two-wheelers."
      });

    }

    // HEAT
    if (temperature >= 35) {

      insights.push({
        type: "heat",
        priority: "medium",
        title: "Hot conditions",
        message:
          "High temperatures are expected. Stay hydrated and avoid unnecessary exposure to direct sunlight."
      });

    }

    // HUMIDITY
    if (humidity >= 80) {

      insights.push({
        type: "humidity",
        priority: "medium",
        title: "High humidity",
        message:
          "High humidity may make the journey feel warmer and less comfortable. Keep water with you."
      });

    }

    // NORMAL
    if (insights.length === 0) {

      insights.push({
        type: "good",
        priority: "low",
        title: "Good travel conditions",
        message:
          "Current weather conditions look favorable for your commute."
      });

    }

  }


  // ==========================================
  // TRAVELLER
  // ==========================================

  else if (persona === "traveller") {

    // RAIN
    if (
      precipitation > 0 ||
      rainProbability >= 60
    ) {

      insights.push({
        type: "rain",
        priority: "high",
        title: "Rain may affect your plans",
        message:
          "Rain is occurring or likely soon. Consider carrying an umbrella and planning indoor alternatives."
      });

    }

    // HIGH HEAT
    if (temperature >= 35) {

      insights.push({
        type: "heat",
        priority: "medium",
        title: "Hot weather",
        message:
          "High temperatures are expected. Carry water and plan outdoor activities around cooler periods."
      });

    }

    // MODERATE HEAT
    else if (temperature >= 32) {

      insights.push({
        type: "heat",
        priority: "low",
        title: "Warm weather",
        message:
          "It may feel warm outdoors. Carry water and take breaks if you are spending a long time outside."
      });

    }

    // WIND
    if (wind >= 30) {

      insights.push({
        type: "wind",
        priority: "medium",
        title: "Windy conditions",
        message:
          "Strong winds may affect outdoor activities and travel plans. Check conditions before heading out."
      });

    }

    // UV
    if (uv >= 8) {

      insights.push({
        type: "uv",
        priority: "medium",
        title: "High UV levels",
        message:
          "Strong sunlight is expected. Consider planning outdoor activities outside peak sunlight hours."
      });

    }

    // HUMIDITY
    if (humidity >= 80) {

      insights.push({
        type: "humidity",
        priority: "low",
        title: "Humid conditions",
        message:
          "High humidity may make outdoor activities feel less comfortable. Keep water with you."
      });

    }

    // GOOD
    if (insights.length === 0) {

      insights.push({
        type: "good",
        priority: "low",
        title: "Good conditions for travel",
        message:
          "The current weather looks relatively favorable for your travel plans."
      });

    }

  }


  // ==========================================
  // FALLBACK
  // ==========================================

  else {

    insights.push({
      type: "good",
      priority: "low",
      title: "Weather information available",
      message:
        "Current weather conditions are being monitored for your location."
    });

  }


  // ==========================================
  // LIMIT INSIGHTS
  // ==========================================

  return insights.slice(0, 5);
}


module.exports = getPersonalizedInsights;