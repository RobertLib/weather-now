import { CountryView, countryMetadata } from "@/views/PlacesViews";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Props) {
  return countryMetadata("en", (await params).country);
}

export default async function Page({ params }: Props) {
  return <CountryView locale="en" slug={(await params).country} />;
}
