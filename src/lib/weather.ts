import { CurrentWeather, ForecastData, DailyForecast } from "@/types/weather";

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

if (!API_KEY) {
  throw new Error(
    "NEXT_PUBLIC_OPENWEATHER_API_KEY is not defined in environment variables"
  );
}

export async function getCurrentWeather(city: string): Promise<CurrentWeather> {
  const response = await fetch(
    `${BASE_URL}/weather?q=${encodeURIComponent(
      city
    )}&appid=${API_KEY}&units=metric&lang=en`
  );

  if (!response.ok) {
    throw new Error(`Error loading weather: ${response.statusText}`);
  }

  return response.json();
}

export async function getCurrentWeatherByCoords(
  lat: number,
  lon: number
): Promise<CurrentWeather> {
  const response = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`
  );

  if (!response.ok) {
    throw new Error(`Error loading weather: ${response.statusText}`);
  }

  return response.json();
}

export async function getForecast(city: string): Promise<ForecastData> {
  const response = await fetch(
    `${BASE_URL}/forecast?q=${encodeURIComponent(
      city
    )}&appid=${API_KEY}&units=metric&lang=en`
  );

  if (!response.ok) {
    throw new Error(`Error loading forecast: ${response.statusText}`);
  }

  return response.json();
}

export async function getForecastByCoords(
  lat: number,
  lon: number
): Promise<ForecastData> {
  const response = await fetch(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`
  );

  if (!response.ok) {
    throw new Error(`Error loading forecast: ${response.statusText}`);
  }

  return response.json();
}

export function processDailyForecast(
  forecastData: ForecastData
): DailyForecast[] {
  const dailyMap = new Map<
    string,
    {
      date: string;
      temp_min: number;
      temp_max: number;
      weather: { id: number; main: string; description: string; icon: string };
      humidity: number;
      wind_speed: number;
      pop: number;
      temps: number[];
    }
  >();

  forecastData.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toISOString().split("T")[0];

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
        weather: item.weather[0],
        humidity: item.main.humidity,
        wind_speed: item.wind.speed,
        pop: item.pop,
        temps: [item.main.temp],
      });
    } else {
      const day = dailyMap.get(date);
      if (day) {
        day.temp_min = Math.min(day.temp_min, item.main.temp_min);
        day.temp_max = Math.max(day.temp_max, item.main.temp_max);
        day.temps.push(item.main.temp);
        day.humidity = Math.round((day.humidity + item.main.humidity) / 2);
        day.pop = Math.max(day.pop, item.pop);
      }
    }
  });

  return Array.from(dailyMap.values()).slice(0, 7);
}

export function getWeatherIcon(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
