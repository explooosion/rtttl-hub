/**
 * Brand Image Generation Script
 *
 * Generates all favicon, PWA icons, and OG banner from source images:
 *
 * Logo (square 1:1) → favicon series + PWA icons (12 files)
 * Banner (1.91:1 ratio) → OG social sharing image (1 file)
 *
 * Source images should be placed in scripts/sources/:
 *   - logo.png   (recommended 1024×1024, minimum 512×512)
 *   - banner.png (recommended 1200×630, Facebook official 1.91:1 ratio)
 *
 * Usage:
 *   npx tsx scripts/generate-logos.ts             # Generate all
 *   npx tsx scripts/generate-logos.ts --logo-only  # Only generate logo series
 *   npx tsx scripts/generate-logos.ts --banner-only # Only generate banner
 *   npx tsx scripts/generate-logos.ts --no-clean   # Don't clean old files
 */

import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const PUBLIC_DIR = join(ROOT_DIR, "public");
const SOURCES_DIR = join(__dirname, "sources");

// Source image paths
const LOGO_SOURCE = join(SOURCES_DIR, "logo.png");
const BANNER_SOURCE = join(SOURCES_DIR, "banner.png");

// Maskable icon background color (cosmos-dark)
const COSMOS_DARK: sharp.Color = { r: 15, g: 10, b: 30, alpha: 1 };

// OG Banner target size (Facebook official recommendation 1.91:1)
const OG_BANNER_WIDTH = 1200;
const OG_BANNER_HEIGHT = 630;

// ─── Output Configuration ────────────────────────────────────────────

interface OutputConfig {
  name: string;
  size: number;
  maskable?: boolean;
}

/** Favicon series (from logo source) */
const FAVICON_OUTPUTS: OutputConfig[] = [
  { name: "icons/favicon-16x16.png", size: 16 },
  { name: "icons/favicon-32x32.png", size: 32 },
  { name: "icons/favicon-48x48.png", size: 48 },
  { name: "icons/apple-touch-icon.png", size: 180 },
  { name: "icons/favicon-192x192.png", size: 192 },
  { name: "icons/favicon-512x512.png", size: 512 },
];

/** PWA Icons series (from logo source) */
const PWA_OUTPUTS: OutputConfig[] = [
  { name: "icons/pwa-64x64.png", size: 64 },
  { name: "icons/pwa-192x192.png", size: 192 },
  { name: "icons/pwa-512x512.png", size: 512 },
  { name: "icons/maskable-icon-512x512.png", size: 512, maskable: true },
];

/** Legacy files to clean up */
const LEGACY_FILES: string[] = [
  "public/assets/banners/banner-og.jpg",
  "public/assets/banners/banner-og.png",
  "public/assets/banners/banner_fb-og.jpg",
  "public/assets/banners/banner_fb.png",
  "public/assets/banners/banner.png",
  "public/assets/images/Gemini_Generated_Image_8vllyx8vllyx8vll.png",
  "public/apple-touch-icon.png",
];

// ─── Utility Functions ────────────────────────────────────────

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generate PNG icon of specified size
 */
async function generatePNG(inputPath: string, outputPath: string, size: number): Promise<void> {
  ensureDir(outputPath);
  await sharp(inputPath)
    .resize(size, size, { fit: "cover", position: "center" })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

/**
 * Generate Maskable Icon (80% safe zone + cosmos-dark background)
 */
async function generateMaskableIcon(
  inputPath: string,
  outputPath: string,
  size: number,
): Promise<void> {
  ensureDir(outputPath);
  const resizedSize = Math.floor(size * 0.8);
  const padding = Math.floor((size - resizedSize) / 2);

  await sharp(inputPath)
    .resize(resizedSize, resizedSize, { fit: "cover", position: "center" })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: COSMOS_DARK,
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

/**
 * Generate favicon.png (32×32 main icon copy)
 */
function generateFaviconCopy(): void {
  const src = join(PUBLIC_DIR, "icons", "favicon-32x32.png");
  const dest = join(PUBLIC_DIR, "icons", "favicon.png");
  const buffer = readFileSync(src);
  writeFileSync(dest, buffer);
}

/**
 * Generate SVG favicon (embedded base64 PNG)
 */
function generateFaviconSVG(): void {
  const src = join(PUBLIC_DIR, "icons", "favicon-32x32.png");
  const dest = join(PUBLIC_DIR, "icons", "favicon.svg");
  const base64 = readFileSync(src).toString("base64");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32">
  <image width="32" height="32" xlink:href="data:image/png;base64,${base64}"/>
</svg>`;

  writeFileSync(dest, svg);
}

/**
 * Generate OG Banner (1200×630, 1.91:1)
 */
async function generateOGBanner(inputPath: string, outputPath: string): Promise<void> {
  ensureDir(outputPath);
  await sharp(inputPath)
    .resize(OG_BANNER_WIDTH, OG_BANNER_HEIGHT, {
      fit: "cover",
      position: "center",
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

/**
 * Clean up old legacy files
 */
function cleanLegacyFiles(): number {
  let cleaned = 0;
  for (const relPath of LEGACY_FILES) {
    const absPath = join(ROOT_DIR, relPath);
    if (existsSync(absPath)) {
      unlinkSync(absPath);
      console.log(`  🗑️  Deleted: ${relPath}`);
      cleaned++;
    }
  }
  return cleaned;
}

interface ImageMeta {
  width: number;
  height: number;
}

/**
 * Validate source image dimensions
 */
async function validateSource(
  path: string,
  label: string,
  minSize: number,
): Promise<ImageMeta | null> {
  if (!existsSync(path)) {
    return null;
  }
  const metadata = await sharp(path).metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    console.warn(`⚠️  ${label} Unable to read dimensions`);
    return null;
  }

  if (width < minSize || height < minSize) {
    console.warn(
      `⚠️  ${label} size ${width}×${height} is below recommended minimum ${minSize}px, output quality may be affected`,
    );
  }

  return { width, height };
}

// ─── Main Execution Flow ────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const logoOnly = args.includes("--logo-only");
  const bannerOnly = args.includes("--banner-only");
  const noClean = args.includes("--no-clean");

  const processLogo = !bannerOnly;
  const processBanner = !logoOnly;

  console.log("🎨 Brand Image Generation Tool");
  console.log("=".repeat(60));
  console.log();

  // ── Validate source images ──

  if (processLogo) {
    if (!existsSync(LOGO_SOURCE)) {
      console.error("❌ Logo source image not found: scripts/sources/logo.png");
      console.log("   Please place a square PNG (recommended 1024×1024, minimum 512×512)");
      console.log("   or run 'npx tsx scripts/generate-placeholder.ts' to generate placeholder");
      process.exit(1);
    }
    const logoMeta = await validateSource(LOGO_SOURCE, "Logo", 512);
    if (logoMeta) {
      console.log(`📦 Logo source: logo.png (${logoMeta.width}×${logoMeta.height})`);
    }
  }

  if (processBanner) {
    if (!existsSync(BANNER_SOURCE)) {
      console.error("❌ Banner source image not found: scripts/sources/banner.png");
      console.log("   Please place a banner PNG (recommended 1200×630, 1.91:1 ratio)");
      console.log("   or run 'npx tsx scripts/generate-placeholder.ts' to generate placeholder");
      process.exit(1);
    }
    const bannerMeta = await validateSource(BANNER_SOURCE, "Banner", 630);
    if (bannerMeta) {
      console.log(`📦 Banner source: banner.png (${bannerMeta.width}×${bannerMeta.height})`);
    }
  }

  console.log();

  let totalSuccess = 0;
  let totalFailed = 0;

  // ── Generate Logo series ──

  if (processLogo) {
    console.log("🖼️  Generating Favicon series...");
    for (const config of FAVICON_OUTPUTS) {
      try {
        const outputPath = join(PUBLIC_DIR, config.name);
        await generatePNG(LOGO_SOURCE, outputPath, config.size);
        console.log(`  ✅ ${config.name} (${config.size}×${config.size})`);
        totalSuccess++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`  ❌ ${config.name}: ${msg}`);
        totalFailed++;
      }
    }

    // favicon.png (32×32 copy)
    try {
      generateFaviconCopy();
      console.log("  ✅ icons/favicon.png (32×32 main icon)");
      totalSuccess++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ icons/favicon.png: ${msg}`);
      totalFailed++;
    }

    // favicon.svg
    try {
      generateFaviconSVG();
      console.log("  ✅ icons/favicon.svg (embedded base64 PNG)");
      totalSuccess++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ icons/favicon.svg: ${msg}`);
      totalFailed++;
    }

    console.log();
    console.log("🖼️  Generating PWA Icons series...");
    for (const config of PWA_OUTPUTS) {
      try {
        const outputPath = join(PUBLIC_DIR, config.name);
        if (config.maskable) {
          await generateMaskableIcon(LOGO_SOURCE, outputPath, config.size);
          console.log(`  ✅ ${config.name} (${config.size}×${config.size}, maskable 80%)`);
        } else {
          await generatePNG(LOGO_SOURCE, outputPath, config.size);
          console.log(`  ✅ ${config.name} (${config.size}×${config.size})`);
        }
        totalSuccess++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`  ❌ ${config.name}: ${msg}`);
        totalFailed++;
      }
    }
    console.log();
  }

  // ── Generate Banner ──

  if (processBanner) {
    console.log("🖼️  Generating OG Banner...");
    try {
      const outputPath = join(PUBLIC_DIR, "assets", "banners", "banner_fb-og.png");
      await generateOGBanner(BANNER_SOURCE, outputPath);
      console.log(`  ✅ assets/banners/banner_fb-og.png (${OG_BANNER_WIDTH}×${OG_BANNER_HEIGHT})`);
      totalSuccess++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ assets/banners/banner_fb-og.png: ${msg}`);
      totalFailed++;
    }
    console.log();
  }

  // ── Clean legacy files ──

  if (!noClean) {
    console.log("🧹 Cleaning legacy files...");
    const cleaned = cleanLegacyFiles();
    if (cleaned === 0) {
      console.log("  ℹ️  No legacy files to clean");
    }
    console.log();
  }

  // ── Summary ──

  console.log("=".repeat(60));
  if (totalFailed === 0) {
    console.log(`✅ Done! Successfully generated ${totalSuccess} files`);
  } else {
    console.log(`⚠️  Done: ${totalSuccess} succeeded, ${totalFailed} failed`);
  }
  console.log();
  console.log("📝 Output summary:");
  if (processLogo) {
    console.log("   Favicon: favicon.svg, favicon.png, 16/32/48/180/192/512px");
    console.log("   PWA:     pwa-64/192/512, maskable-512");
  }
  if (processBanner) {
    console.log(`   Banner:  banner_fb-og.png (${OG_BANNER_WIDTH}×${OG_BANNER_HEIGHT})`);
  }
  console.log();
  console.log("💡 Tip: Run 'npm run build' to verify build works correctly");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main();
