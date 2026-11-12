import { AboutView, staticMetadata } from "@/views/StaticPages";

export const metadata = staticMetadata("en", "about");

export default function Page() {
  return <AboutView locale="en" />;
}
