"use client";

import { useEffect } from "react";
import "@/app/globals.css";

/**
 * Last-resort page when a root layout itself fails. It replaces the whole
 * document and can't tell which language tree failed, so it speaks both.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-[#0b1220] p-6 text-center font-sans text-white antialiased">
        <title>Something went wrong — WeatherNow</title>
        <main className="max-w-md space-y-3">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-white/80">This page couldn&apos;t be displayed. Please try again in a moment.</p>
          <p lang="cs" className="text-sm text-white/80">
            Něco se pokazilo a stránku se nepodařilo zobrazit. Zkuste to prosím za chvíli znovu.
          </p>
          <p className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => retry()}
              className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold hover:bg-sky-500"
            >
              Try again · Zkusit znovu
            </button>
            {/* A full page load on purpose: the client router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-2xl border border-white/25 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
              WeatherNow
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
