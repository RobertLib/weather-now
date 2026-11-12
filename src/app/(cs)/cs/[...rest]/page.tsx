import { notFound } from "next/navigation";

/**
 * Unknown URLs under /cs would otherwise fall through to the global (English)
 * 404. Matching them here renders the Czech not-found page in the Czech layout.
 * More specific routes always win over this catch-all.
 */
export default function CzechCatchAll(): never {
  notFound();
}
