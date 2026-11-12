import { AboutView, staticMetadata } from "@/views/StaticPages";

export const metadata = staticMetadata("cs", "about");

export default function Page() {
  return <AboutView locale="cs" />;
}
