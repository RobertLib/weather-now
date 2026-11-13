/**
 * Generates every brand asset from one vector definition.
 *
 *   node scripts/generate-icons.mjs
 *
 * Outputs:
 *   src/app/icon.svg              scalable favicon
 *   src/app/favicon.ico           legacy favicon (16/32/48)
 *   src/app/apple-icon.png        iOS home screen (180, full bleed)
 *   public/opengraph-image.png    social card (1200x630), referenced by lib/seo.ts
 *   public/icon-192.png           PWA icon, purpose "any"
 *   public/icon-512.png           PWA icon, purpose "any"
 *   public/icon-maskable-512.png  PWA icon, purpose "maskable"
 *   public/screenshot-wide.png    manifest screenshot (1280x720)
 *   public/screenshot-narrow.png  manifest screenshot (375x812)
 *
 * Requires sharp (a dev dependency) and ImageMagick (`magick`) for the .ico.
 * Text is rendered with system fonts: Avenir Next (macOS) where available,
 * otherwise a fallback, so the text-bearing images differ between machines.
 * Regenerate them on macOS to keep the published look.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/** Outputs are written relative to the repo, wherever the script is run from. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = (file) => join(ROOT, file);

/* ------------------------------------------------------------------ palette */

// Mirrors the "clear day" sky and the amber accent used across the UI.
const SKY = ["#075985", "#0ea5e9", "#7dd3fc"];
const SUN = ["#fef3c7", "#fbbf24", "#f97316"];
const CLOUD = ["#ffffff", "#dbe4ee"];

/* ------------------------------------------------------------------- artwork */

/**
 * Gradients are declared in user space so a shape built from several
 * overlapping primitives reads as one seamless object.
 */
function defs(size) {
  return `
    <linearGradient id="sky" gradientUnits="userSpaceOnUse"
        x1="0" y1="0" x2="${size * 0.42}" y2="${size}">
      <stop offset="0" stop-color="${SKY[0]}"/>
      <stop offset="0.55" stop-color="${SKY[1]}"/>
      <stop offset="1" stop-color="${SKY[2]}"/>
    </linearGradient>
    <linearGradient id="sun" gradientUnits="userSpaceOnUse"
        x1="270" y1="70" x2="430" y2="250">
      <stop offset="0" stop-color="${SUN[0]}"/>
      <stop offset="0.45" stop-color="${SUN[1]}"/>
      <stop offset="1" stop-color="${SUN[2]}"/>
    </linearGradient>
    <linearGradient id="cloud" gradientUnits="userSpaceOnUse"
        x1="120" y1="200" x2="260" y2="400">
      <stop offset="0" stop-color="${CLOUD[0]}"/>
      <stop offset="1" stop-color="${CLOUD[1]}"/>
    </linearGradient>
    <radialGradient id="glow" gradientUnits="userSpaceOnUse"
        cx="344" cy="160" r="190">
      <stop offset="0" stop-color="#fde68a" stop-opacity="0.75"/>
      <stop offset="0.6" stop-color="#fde68a" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#fde68a" stop-opacity="0"/>
    </radialGradient>`;
}

const SUN_CX = 344;
const SUN_CY = 180;
const SUN_R = 62;

/** Eight rays, drawn from a chunky stroke so they survive downscaling. */
function rays() {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    const inner = SUN_R + 22;
    const outer = SUN_R + 52;
    const x1 = (SUN_CX + Math.cos(a) * inner).toFixed(1);
    const y1 = (SUN_CY + Math.sin(a) * inner).toFixed(1);
    const x2 = (SUN_CX + Math.cos(a) * outer).toFixed(1);
    const y2 = (SUN_CY + Math.sin(a) * outer).toFixed(1);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join("");
}

/**
 * The mark: sun behind a cloud, on a 512 grid.
 *
 * `simplify` drops the rays and enlarges the sun, which keeps the glyph
 * readable at 16px where thin rays collapse into noise.
 */
function mark({ simplify = false } = {}) {
  const sunR = simplify ? SUN_R + 20 : SUN_R;
  return `
  <circle cx="${SUN_CX}" cy="${SUN_CY}" r="185" fill="url(#glow)"/>
  ${
    simplify
      ? ""
      : `<g stroke="url(#sun)" stroke-width="19" stroke-linecap="round">${rays()}</g>`
  }
  <circle cx="${SUN_CX}" cy="${SUN_CY}" r="${sunR}" fill="url(#sun)"/>
  <g fill="url(#cloud)">
    <circle cx="203" cy="292" r="90"/>
    <circle cx="316" cy="323" r="64"/>
    <circle cx="126" cy="335" r="60"/>
    <rect x="66" y="331" width="314" height="81" rx="40.5"/>
  </g>`;
}

/** Bounding box of the full mark, used to recentre the inset variants. */
const MARK_BOX = { x: 58, y: 66, w: 390, h: 346 };

/**
 * @param {object} options
 * @param {number} [options.radius] corner radius, 0 for full bleed
 * @param {number} [options.inset] 0-1 share of the canvas the mark may occupy
 * @param {boolean} [options.simplify] use the reduced-detail glyph
 */
function iconSvg({ radius = 112, inset = 1, simplify = false } = {}) {
  const size = 512;
  let art = mark({ simplify });

  if (inset < 1) {
    // Fit the mark inside a centred circle of `inset` diameter, which is what
    // Android's maskable safe zone and iOS's squircle both effectively demand.
    const cx = MARK_BOX.x + MARK_BOX.w / 2;
    const cy = MARK_BOX.y + MARK_BOX.h / 2;
    const half = Math.hypot(MARK_BOX.w, MARK_BOX.h) / 2;
    const scale = (size * inset) / 2 / half;
    const tx = size / 2 - cx * scale;
    const ty = size / 2 - cy * scale;
    art = `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(
      2
    )}) scale(${scale.toFixed(4)})">${art}</g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <title>WeatherNow</title>
  <defs>${defs(size)}
    <clipPath id="frame"><rect width="${size}" height="${size}" rx="${radius}"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${size}" height="${size}" fill="url(#sky)"/>
    ${art}
  </g>
</svg>`;
}

/* ------------------------------------------------------- social card (OG) */

const W = 1200;
const H = 630;
// Avenir Next is the closest geometric match to the UI's Outfit typeface.
const DISPLAY = "Avenir Next, Futura, Helvetica Neue, sans-serif";

/**
 * Decorative cloud bank. Each blob fades out through a radial gradient rather
 * than a flat opacity, otherwise the hard ellipse edges read as lens flare.
 */
const OG_BLOBS = [
  [150, 118, 230, 68, 0.22],
  [430, 62, 280, 58, 0.16],
  [1000, 165, 320, 78, 0.18],
  [790, 552, 360, 80, 0.14],
  [230, 592, 300, 66, 0.16],
];

function ogCloudDefs() {
  return OG_BLOBS.map(
    ([cx, cy, rx, ry, o], i) => `
    <radialGradient id="blob${i}" gradientUnits="userSpaceOnUse"
        cx="${cx}" cy="${cy}" r="${rx}" fx="${cx}" fy="${cy}"
        gradientTransform="translate(${cx} ${cy}) scale(1 ${(ry / rx).toFixed(
      3
    )}) translate(${-cx} ${-cy})">
      <stop offset="0" stop-color="#ffffff" stop-opacity="${o}"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="${(o * 0.6).toFixed(
        3
      )}"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>`
  ).join("");
}

function ogClouds() {
  return OG_BLOBS.map(
    ([cx, cy, rx], i) =>
      `<circle cx="${cx}" cy="${cy}" r="${rx}" fill="url(#blob${i})"/>`
  ).join("");
}

/** Catmull-Rom → cubic bezier, same easing the in-app chart uses. */
function smoothPath(pts) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    d += ` C ${p1[0] + (p2[0] - p0[0]) * t} ${p1[1] + (p2[1] - p0[1]) * t}, ${
      p2[0] - (p3[0] - p1[0]) * t
    } ${p2[1] - (p3[1] - p1[1]) * t}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/**
 * Temperature curve echoing the app's chart. Deliberately just a line — an
 * area fill under it needs a mask to avoid hard vertical edges, and reads as a
 * solid slab against the sky without one.
 */
function ogCurve() {
  const points = [
    [0, 76],
    [135, 40],
    [270, 54],
    [405, 16],
    [540, 34],
    [675, 4],
    [810, 26],
  ];
  const dots = points
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="9" fill="#ffffff" stroke="#fbbf24" stroke-width="3.5"/>`
    )
    .join("");

  return `<g transform="translate(300 448)">
    <path d="${smoothPath(points)}" fill="none" stroke="#fde68a" stroke-width="7"
      stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
  </g>`;
}

function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="ogsky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="420" y2="${H}">
      <stop offset="0" stop-color="#0c4a6e"/>
      <stop offset="0.5" stop-color="#0284c7"/>
      <stop offset="1" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="ognow" gradientUnits="userSpaceOnUse" x1="700" y1="250" x2="1000" y2="330">
      <stop offset="0" stop-color="#fde68a"/>
      <stop offset="1" stop-color="#fb923c"/>
    </linearGradient>
    <radialGradient id="ogglow" gradientUnits="userSpaceOnUse" cx="1035" cy="118" r="260">
      <stop offset="0" stop-color="#fde68a" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#fde68a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ogsun" gradientUnits="userSpaceOnUse" x1="985" y1="70" x2="1090" y2="175">
      <stop offset="0" stop-color="${SUN[0]}"/>
      <stop offset="0.45" stop-color="${SUN[1]}"/>
      <stop offset="1" stop-color="${SUN[2]}"/>
    </linearGradient>
    ${ogCloudDefs()}
    ${defs(512)}
  </defs>

  <rect width="${W}" height="${H}" fill="url(#ogsky)"/>
  ${ogClouds()}
  <circle cx="1035" cy="118" r="250" fill="url(#ogglow)"/>
  <circle cx="1035" cy="118" r="58" fill="url(#ogsun)"/>

  <!-- App mark, reusing the icon artwork -->
  <g transform="translate(92 128) scale(0.36)">
    <rect width="512" height="512" rx="112" fill="url(#sky)"/>
    ${mark()}
  </g>

  <text x="308" y="272" font-family="${DISPLAY}" font-size="116" font-weight="700"
    letter-spacing="-3" fill="#ffffff">Weather<tspan fill="url(#ognow)">Now</tspan></text>

  <text x="312" y="336" font-family="${DISPLAY}" font-size="36" font-weight="500"
    fill="#e0f2fe" opacity="0.94">Live conditions, hourly trends, 14-day outlook</text>

  ${ogCurve()}

  <text x="92" y="596" font-family="${DISPLAY}" font-size="27" font-weight="600"
    fill="#bae6fd" opacity="0.9">weather-now.app</text>
</svg>`;
}

/* ------------------------------------------------- PWA manifest screenshots */

/**
 * Branded cards for the manifest's `screenshots`, replacing the previous
 * placeholders in the same role. These are not captures of the running app —
 * real screenshots would serve the install prompt better.
 */
function brandCardSvg(w, h) {
  const unit = Math.min(w, h);
  const iconSize = unit * 0.23;
  const cx = w / 2;
  // Stack the block slightly above centre; it reads better in tall frames.
  const top = h * (h > w ? 0.3 : 0.24);
  const titleSize = unit * 0.125;
  const subSize = unit * (w < 500 ? 0.038 : 0.042);
  const tagline =
    w < 500
      ? "Live conditions · trends · 14 days"
      : "Live conditions · hourly trends · 14-day outlook";
  const curveW = Math.min(w * 0.74, unit * 1.9);

  const points = [
    [0, 46],
    [curveW * 0.17, 22],
    [curveW * 0.34, 32],
    [curveW * 0.5, 8],
    [curveW * 0.67, 20],
    [curveW * 0.84, 0],
    [curveW, 14],
  ];
  const dots = points
    .map(
      ([x, y]) =>
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(
          unit * 0.013
        ).toFixed(1)}" fill="#fff" stroke="#fbbf24" stroke-width="${(
          unit * 0.005
        ).toFixed(1)}"/>`
    )
    .join("");

  const blobs = [
    [w * 0.15, h * 0.12, unit * 0.5, 0.2],
    [w * 0.9, h * 0.08, unit * 0.55, 0.16],
    [w * 0.25, h * 0.95, unit * 0.6, 0.14],
    [w * 0.85, h * 0.8, unit * 0.5, 0.12],
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${(
      w * 0.4
    ).toFixed(0)}" y2="${h}">
      <stop offset="0" stop-color="#0c4a6e"/>
      <stop offset="0.5" stop-color="#0284c7"/>
      <stop offset="1" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0" stop-color="#fde68a"/>
      <stop offset="1" stop-color="#fb923c"/>
    </linearGradient>
    ${blobs
      .map(
        ([bx, by, r, o], i) => `
    <radialGradient id="sblob${i}" gradientUnits="userSpaceOnUse" cx="${bx.toFixed(
          0
        )}" cy="${by.toFixed(0)}" r="${r.toFixed(0)}">
      <stop offset="0" stop-color="#fff" stop-opacity="${o}"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>`
      )
      .join("")}
    ${defs(512)}
  </defs>

  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${blobs
    .map(
      ([bx, by, r], i) =>
        `<circle cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" r="${r.toFixed(
          0
        )}" fill="url(#sblob${i})"/>`
    )
    .join("")}

  <g transform="translate(${(cx - iconSize / 2).toFixed(1)} ${top.toFixed(
    1
  )}) scale(${(iconSize / 512).toFixed(4)})">
    <rect width="512" height="512" rx="112" fill="url(#sky)"/>
    ${mark()}
  </g>

  <text x="${cx}" y="${(top + iconSize + titleSize * 0.95).toFixed(1)}"
    text-anchor="middle" font-family="${DISPLAY}" font-size="${titleSize.toFixed(
    1
  )}"
    font-weight="700" letter-spacing="${(-titleSize * 0.03).toFixed(
      2
    )}" fill="#ffffff">Weather<tspan fill="url(#accent)">Now</tspan></text>

  <text x="${cx}" y="${(top + iconSize + titleSize * 2.05).toFixed(1)}"
    text-anchor="middle" font-family="${DISPLAY}" font-size="${subSize.toFixed(
    1
  )}"
    font-weight="500" fill="#e0f2fe" opacity="0.94">${tagline}</text>

  <g transform="translate(${(cx - curveW / 2).toFixed(1)} ${(
    top +
    iconSize +
    titleSize * 2.9
  ).toFixed(1)})">
    <path d="${smoothPath(points)}" fill="none" stroke="#fde68a"
      stroke-width="${(unit * 0.011).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
  </g>
</svg>`;
}

/* ------------------------------------------------------------------ pipeline */

const svgToPng = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

async function main() {
  const rounded = iconSvg({ radius: 112 });
  const maskable = iconSvg({ radius: 0, inset: 0.78 });
  const apple = iconSvg({ radius: 0, inset: 0.92 });
  const tmp = mkdtempSync(join(tmpdir(), "weathernow-icons-"));

  // Scalable favicon, checked into the app directory.
  writeFileSync(out("src/app/icon.svg"), rounded + "\n");

  const png = async (svg, size, file) => {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(out(file));
    console.log(`  ${file} (${size}x${size})`);
  };

  console.log("icons:");
  await png(rounded, 192, "public/icon-192.png");
  await png(rounded, 512, "public/icon-512.png");
  await png(maskable, 512, "public/icon-maskable-512.png");
  await png(apple, 180, "src/app/apple-icon.png");

  // Multi-resolution .ico. The 16px frame uses the reduced-detail glyph, where
  // the sun's rays would otherwise smear into a single blur.
  const simple = iconSvg({ radius: 112, simplify: true });
  const icoSizes = [16, 32, 48];
  const icoParts = [];
  for (const size of icoSizes) {
    const file = join(tmp, `ico-${size}.png`);
    writeFileSync(file, await svgToPng(size <= 16 ? simple : rounded, size));
    icoParts.push(file);
  }
  execFileSync("magick", [...icoParts, out("src/app/favicon.ico")]);
  console.log(`  src/app/favicon.ico (${icoSizes.join(", ")})`);

  console.log("social card:");
  await sharp(Buffer.from(ogSvg()), { density: 96 })
    .resize(W, H)
    .png({ compressionLevel: 9 })
    .toFile(out("public/opengraph-image.png"));
  console.log(`  public/opengraph-image.png (${W}x${H})`);

  console.log("manifest screenshots:");
  for (const [w, h, file] of [
    [1280, 720, "public/screenshot-wide.png"],
    [375, 812, "public/screenshot-narrow.png"],
  ]) {
    await sharp(Buffer.from(brandCardSvg(w, h)), { density: 96 })
      .resize(w, h)
      .png({ compressionLevel: 9 })
      .toFile(out(file));
    console.log(`  ${file} (${w}x${h})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
