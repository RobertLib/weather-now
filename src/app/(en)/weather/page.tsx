import { WorldView, worldMetadata } from "@/views/PlacesViews";

export const metadata = worldMetadata("en");

export default function Page() {
  return <WorldView locale="en" />;
}
