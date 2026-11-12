import { TermsView, staticMetadata } from "@/views/StaticPages";

export const metadata = staticMetadata("en", "terms");

export default function Page() {
  return <TermsView locale="en" />;
}
