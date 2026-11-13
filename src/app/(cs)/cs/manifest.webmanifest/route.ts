import { buildManifest } from "@/lib/manifest";

export const dynamic = "force-static";

/** Czech web app manifest, linked from the Czech root layout (see `rootMetadata`). */
export function GET() {
  return new Response(JSON.stringify(buildManifest("cs")), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
