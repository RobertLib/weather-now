import type { Metadata } from "next";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { SITE_URL } from "@/lib/routes";
import { geistSans, outfit } from "@/app/fonts";
import WeatherIconDefs from "@/components/WeatherIconDefs";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: true },
};

/** `?theme=light|dark|auto` is read in the browser so the page stays cacheable. */
const themeScript = `(function(){try{var t=new URLSearchParams(location.search).get("theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

/** Root layout of the widget; it sits under `[lang]` so `<html lang>` matches the widget. */
export default async function EmbedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <html lang={isLocale(lang) ? lang : DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${outfit.variable} bg-transparent font-sans antialiased`}>
        <WeatherIconDefs />
        {children}
      </body>
    </html>
  );
}
