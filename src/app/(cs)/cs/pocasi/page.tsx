import { WorldView, worldMetadata } from "@/views/PlacesViews";

export const metadata = worldMetadata("cs");

export default function Page() {
  return <WorldView locale="cs" />;
}
