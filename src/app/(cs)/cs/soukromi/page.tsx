import { PrivacyView, staticMetadata } from "@/views/StaticPages";

export const metadata = staticMetadata("cs", "privacy");

export default function Page() {
  return <PrivacyView locale="cs" />;
}
