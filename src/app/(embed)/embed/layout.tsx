import type { Metadata } from "next";
import { geistSans, outfit } from "@/app/fonts";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.weather-now.app"),
  robots: { index: false, follow: true },
};

/** `?theme=light|dark|auto` is read in the browser so the page stays cacheable. */
const themeScript = `(function(){try{var t=new URLSearchParams(location.search).get("theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${outfit.variable} bg-transparent font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
