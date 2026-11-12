import { PrivacyView, staticMetadata } from "@/views/StaticPages";

export const metadata = staticMetadata("en", "privacy");

export default function Page() {
  return <PrivacyView locale="en" />;
}
