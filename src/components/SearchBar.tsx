"use client";

import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (city: string) => void;
  onLocationSearch: () => void;
  isLoading: boolean;
}

export default function SearchBar({
  onSearch,
  onLocationSearch,
  isLoading,
}: SearchBarProps) {
  const [city, setCity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      onSearch(city.trim());
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3"
        role="search"
        aria-label="Weather search"
      >
        <div className="flex-1 relative">
          <label htmlFor="city-search" className="sr-only">
            Search for a city to get weather information
          </label>
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5"
            aria-hidden="true"
          />
          <input
            id="city-search"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
            disabled={isLoading}
            autoComplete="off"
            aria-describedby="search-help"
          />
          <span id="search-help" className="sr-only">
            Enter the name of any city worldwide to get current weather
            conditions and forecasts
          </span>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !city.trim()}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base"
            aria-label="Search for weather information"
          >
            {isLoading ? (
              <Loader2
                className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto"
                aria-hidden="true"
              />
            ) : (
              "Search"
            )}
          </button>
          <button
            type="button"
            onClick={onLocationSearch}
            disabled={isLoading}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label="Use my current location for weather information"
            title="Use my location"
          >
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
