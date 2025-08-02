"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav
      className="bg-white shadow-sm border-b border-gray-200"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-xl font-bold text-blue-600 hover:text-blue-800 transition-colors"
            aria-label="WeatherNow Home"
          >
            WeatherNow
          </Link>

          <ul className="flex space-x-6">
            <li>
              <Link
                href="/"
                className={`transition-colors ${
                  isActive("/")
                    ? "text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                aria-label="Weather Forecast"
                aria-current={isActive("/") ? "page" : undefined}
              >
                Weather
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={`transition-colors ${
                  isActive("/about")
                    ? "text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                aria-current={isActive("/about") ? "page" : undefined}
              >
                About
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
