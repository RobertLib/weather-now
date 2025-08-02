import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.weather-now.app",
  },
};

export default function Home() {
  return <HomeClient />;
}
