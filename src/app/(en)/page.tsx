import { HomeView, homeMetadata } from "@/views/HomeView";

export const revalidate = 3600;
export const metadata = homeMetadata("en");

export default function Page() {
  return <HomeView locale="en" />;
}
