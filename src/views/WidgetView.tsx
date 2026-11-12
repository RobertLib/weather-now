import type { Metadata } from "next";
import { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { pagePath } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import PageShell from "@/components/PageShell";
import WidgetBuilder from "./WidgetBuilder";

export function widgetMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return pageMetadata({
    locale,
    title: t.widget.title,
    description: t.widget.description,
    path: pagePath(locale, "widget"),
    alternates: { en: pagePath("en", "widget"), cs: pagePath("cs", "widget") },
  });
}

export function WidgetView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <PageShell title={t.widget.h1} lead={t.widget.lead}>
      <WidgetBuilder />
    </PageShell>
  );
}
