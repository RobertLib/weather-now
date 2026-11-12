import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Crumb, breadcrumbSchema } from "@/lib/schema";
import JsonLd from "./JsonLd";

/** Visible trail plus matching BreadcrumbList markup. The last crumb is the current page. */
export default function Breadcrumbs({ crumbs, label }: { crumbs: Crumb[]; label: string }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <nav aria-label={label} className="mb-3 text-xs text-white/75">
        <ol className="flex flex-wrap items-center gap-1">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="font-medium text-white">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.path} className="hover:text-white hover:underline">
                    {crumb.name}
                  </Link>
                )}
                {!last && <ChevronRight className="h-3 w-3 opacity-60" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
