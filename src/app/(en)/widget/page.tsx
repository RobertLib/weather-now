import { WidgetView, widgetMetadata } from "@/views/WidgetView";

export const metadata = widgetMetadata("en");

export default function Page() {
  return <WidgetView locale="en" />;
}
