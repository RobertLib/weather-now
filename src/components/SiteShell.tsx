import { Analytics } from "@vercel/analytics/next";
import { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { themeBootstrapScript } from "@/hooks/useTheme";
import { websiteSchema } from "@/lib/schema";
import { geistSans, outfit } from "@/app/fonts";
import Navigation from "./Navigation";
import Footer from "./Footer";
import JsonLd from "./JsonLd";
import "@/app/globals.css";

/** The `<html>` frame shared by both language trees (each has its own root layout). */
export default function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = getDictionary(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      {/* This renders inside root layouts, where a plain <head> is correct;
          the rule targets the Pages Router and only fires because this file
          lives outside app/. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        {/* Applies the saved theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${geistSans.variable} ${outfit.variable} antialiased`}>
        <I18nProvider locale={locale}>
          <JsonLd data={websiteSchema(t.meta.siteName, t.meta.description, locale)} />
          <div className="flex min-h-screen flex-col font-sans">
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer locale={locale} />
          </div>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
