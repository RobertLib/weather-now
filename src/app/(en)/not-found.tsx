import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import NotFoundView from "@/views/NotFoundView";

// Without this the tab shows the homepage title (the root layout's default).
export const metadata: Metadata = { title: getDictionary("en").errors.notFoundTitle };

export default function NotFound() {
  return <NotFoundView locale="en" />;
}
