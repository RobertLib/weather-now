import { WidgetView, widgetMetadata } from "@/views/WidgetView";

export const metadata = widgetMetadata("cs");

export default function Page() {
  return <WidgetView locale="cs" />;
}
