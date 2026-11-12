import { TermsView, staticMetadata } from "@/views/StaticPages";

export const metadata = staticMetadata("cs", "terms");

export default function Page() {
  return <TermsView locale="cs" />;
}
