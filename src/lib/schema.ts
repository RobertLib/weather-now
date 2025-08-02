export function generateWeatherSchema(
  location?: string,
  temperature?: number,
  condition?: string
) {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "WeatherNow",
    description:
      "Real-time weather forecasts and current conditions for any location worldwide",
    url: "https://www.weather-now.app",
    applicationCategory: "Weather",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Person",
      name: "Robert Libsansky",
      url: "https://www.weather-now.app",
    },
    featureList: [
      "Real-time weather data",
      "7-day weather forecast",
      "Hourly weather predictions",
      "Weather alerts and notifications",
      "Location-based weather search",
    ],
  };

  if (location && temperature !== undefined && condition) {
    return {
      ...baseSchema,
      mainEntity: {
        "@type": "WeatherForecast",
        about: {
          "@type": "Place",
          name: location,
        },
        weatherCondition: condition,
        temperature: {
          "@type": "QuantitativeValue",
          value: temperature,
          unitCode: "CEL",
        },
        validThrough: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  return baseSchema;
}

export function generateBreadcrumbSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.weather-now.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Weather Forecast",
        item: "https://www.weather-now.app",
      },
    ],
  };
}
