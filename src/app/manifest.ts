import type { MetadataRoute } from "next";
import { buildManifest } from "@/lib/manifest";

/** English manifest; the Czech one lives at /cs/manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return buildManifest("en");
}
