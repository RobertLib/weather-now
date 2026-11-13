"use client";

import { Locale } from "@/i18n/config";
import { homePath } from "@/lib/routes";

/**
 * Link to the same page in the other language. The rendered href is the other
 * homepage (all a server-rendered layout knows); the page's own hreflang tag
 * knows the real translation, so the href is swapped for it as soon as the
 * link is hovered, focused or pressed. The browser then handles every way of
 * opening it — click, Cmd/Ctrl-click, middle click, "open in new tab".
 *
 * Only the path of the hreflang URL is used: it carries the production origin,
 * which would send local and preview deployments to the live site. The query
 * string stays, so the homepage keeps the chosen place.
 */
export default function LanguageLink({
  to,
  className,
  title,
  children,
}: {
  to: Locale;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const sync = (event: React.SyntheticEvent<HTMLAnchorElement>) => {
    const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${to}"]`);
    const path = alt?.href ? new URL(alt.href).pathname : homePath(to);
    event.currentTarget.href = path + window.location.search;
  };

  return (
    <a
      href={homePath(to)}
      hrefLang={to}
      lang={to}
      title={title}
      className={className}
      onMouseEnter={sync}
      onFocus={sync}
      onPointerDown={sync}
      onKeyDown={sync}
    >
      {children}
    </a>
  );
}
