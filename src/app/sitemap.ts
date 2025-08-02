import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.weather-now.app",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1,
    },
    {
      url: "http://www.weather-now.app",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: "https://weather-now.app",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: "https://www.weather-now.app/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.weather-now.app/privacy",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://www.weather-now.app/terms",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://www.weather-now.app/favicon.ico",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.1,
    },
  ];
}
