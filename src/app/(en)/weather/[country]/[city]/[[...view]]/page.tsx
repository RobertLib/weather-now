import { CityPage, CityParams, cityMetadata } from "@/views/city/CityPage";

export const revalidate = 3600;

// Rendered on first request, then cached and refreshed hourly (ISR).
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<CityParams> };

export async function generateMetadata({ params }: Props) {
  return cityMetadata("en", await params);
}

export default async function Page({ params }: Props) {
  return <CityPage locale="en" params={await params} />;
}
