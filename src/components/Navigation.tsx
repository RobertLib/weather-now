"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Weather" },
  { href: "/about", label: "About" },
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <nav
      className="sticky top-0 z-40 border-b border-white/15 bg-white/8 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-4">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-xl px-1 py-1 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          aria-label="WeatherNow home"
        >
          <span className="relative grid h-8 w-8 place-items-center">
            <span className="absolute inset-0 rounded-full bg-linear-to-br from-amber-300 to-orange-500 opacity-90 transition-transform group-hover:scale-110" />
            <svg
              viewBox="0 0 24 24"
              className="relative h-5 w-5 text-white"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M6 18a4.2 4.2 0 0 1 .6-8.36A5.6 5.6 0 0 1 17.1 11a3.7 3.7 0 0 1-.7 7z"
              />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Weather
            <span className="bg-linear-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
              Now
            </span>
          </span>
        </Link>

        <ul className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  isActive(href)
                    ? "bg-white/25 text-white shadow-sm"
                    : "text-white/75 hover:bg-white/15 hover:text-white"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
