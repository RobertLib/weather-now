import { HomeView, homeMetadata } from "@/views/HomeView";

export const revalidate = 3600;
export const metadata = homeMetadata("cs");

export default function Page() {
  return <HomeView locale="cs" />;
}
