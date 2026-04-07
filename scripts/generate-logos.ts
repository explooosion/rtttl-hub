/**
 * 品牌圖片統一生成腳本
 *
 * 從來源圖片生成所有 favicon、PWA icon、OG banner：
 *
 * Logo（正方形 1:1）→ favicon 系列 + PWA icons（12 個檔案）
 * Banner（橫幅 1.91:1）→ OG 社群分享圖（1 個檔案）
 *
 * 來源圖片放置於 scripts/sources/：
 *   - logo.png   (建議 1024×1024，最小 512×512)
 *   - banner.png (建議 1200×630，Facebook 官方 1.91:1 比例)
 *
 * 用法：
 *   npx tsx scripts/generate-logos.ts             # 生成全部
 *   npx tsx scripts/generate-logos.ts --logo-only  # 只生成 Logo 系列
 *   npx tsx scripts/generate-logos.ts --banner-only # 只生成 Banner
 *   npx tsx scripts/generate-logos.ts --no-clean   # 不清理舊檔案
 */

import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const PUBLIC_DIR = join(ROOT_DIR, "public");
const SOURCES_DIR = join(__dirname, "sources");

// 來源圖片路徑
const LOGO_SOURCE = join(SOURCES_DIR, "logo.png");
const BANNER_SOURCE = join(SOURCES_DIR, "banner.png");

// Maskable icon 背景色（cosmos-dark）
const COSMOS_DARK: sharp.Color = { r: 15, g: 10, b: 30, alpha: 1 };

// OG Banner 目標尺寸（Facebook 官方建議 1.91:1）
const OG_BANNER_WIDTH = 1200;
const OG_BANNER_HEIGHT = 630;

// ─── 產出配置 ────────────────────────────────────────────

interface OutputConfig {
  name: string;
  size: number;
  maskable?: boolean;
}

/** Favicon 系列（從 Logo 來源） */
const FAVICON_OUTPUTS: OutputConfig[] = [
  { name: "icons/favicon-16x16.png", size: 16 },
  { name: "icons/favicon-32x32.png", size: 32 },
  { name: "icons/favicon-48x48.png", size: 48 },
  { name: "icons/apple-touch-icon.png", size: 180 },
  { name: "icons/favicon-192x192.png", size: 192 },
  { name: "icons/favicon-512x512.png", size: 512 },
];

/** PWA Icons 系列（從 Logo 來源） */
const PWA_OUTPUTS: OutputConfig[] = [
  { name: "icons/pwa-64x64.png", size: 64 },
  { name: "icons/pwa-192x192.png", size: 192 },
  { name: "icons/pwa-512x512.png", size: 512 },
  { name: "icons/maskable-icon-512x512.png", size: 512, maskable: true },
];

/** 需要清理的舊檔案 */
const LEGACY_FILES: string[] = [
  "public/assets/banners/banner-og.jpg",
  "public/assets/banners/banner-og.png",
  "public/assets/banners/banner_fb-og.jpg",
  "public/assets/banners/banner_fb.png",
  "public/assets/banners/banner.png",
  "public/assets/images/Gemini_Generated_Image_8vllyx8vllyx8vll.png",
  "public/apple-touch-icon.png",
];

// ─── 工具函數 ────────────────────────────────────────────

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * 生成指定尺寸的 PNG 圖標
 */
async function generatePNG(inputPath: string, outputPath: string, size: number): Promise<void> {
  ensureDir(outputPath);
  await sharp(inputPath)
    .resize(size, size, { fit: "cover", position: "center" })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

/**
 * 生成 Maskable Icon（80% safe zone + cosmos-dark 背景）
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
 * 生成 favicon.png（32×32 主圖標副本）
 */
function generateFaviconCopy(): void {
  const src = join(PUBLIC_DIR, "icons", "favicon-32x32.png");
  const dest = join(PUBLIC_DIR, "icons", "favicon.png");
  const buffer = readFileSync(src);
  writeFileSync(dest, buffer);
}

/**
 * 生成 SVG favicon（內嵌 base64 PNG）
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
 * 生成 OG Banner（1200×630，1.91:1）
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
 * 清理舊的不再使用的檔案
 */
function cleanLegacyFiles(): number {
  let cleaned = 0;
  for (const relPath of LEGACY_FILES) {
    const absPath = join(ROOT_DIR, relPath);
    if (existsSync(absPath)) {
      unlinkSync(absPath);
      console.log(`  🗑️  已刪除: ${relPath}`);
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
 * 驗證來源圖片尺寸
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
    console.warn(`⚠️  ${label} 無法讀取尺寸`);
    return null;
  }

  if (width < minSize || height < minSize) {
    console.warn(
      `⚠️  ${label} 尺寸 ${width}×${height} 小於建議最小值 ${minSize}px，產出品質可能受影響`,
    );
  }

  return { width, height };
}

// ─── 主執行流程 ──────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const logoOnly = args.includes("--logo-only");
  const bannerOnly = args.includes("--banner-only");
  const noClean = args.includes("--no-clean");

  const processLogo = !bannerOnly;
  const processBanner = !logoOnly;

  console.log("🎨 品牌圖片生成工具");
  console.log("=".repeat(60));
  console.log();

  // ── 驗證來源圖片 ──

  if (processLogo) {
    if (!existsSync(LOGO_SOURCE)) {
      console.error("❌ Logo 來源圖片不存在: scripts/sources/logo.png");
      console.log("   請放置一張正方形 PNG（建議 1024×1024，最小 512×512）");
      console.log("   或執行 npx tsx scripts/generate-placeholder.ts 產生 placeholder");
      process.exit(1);
    }
    const logoMeta = await validateSource(LOGO_SOURCE, "Logo", 512);
    if (logoMeta) {
      console.log(`📦 Logo 來源: logo.png (${logoMeta.width}×${logoMeta.height})`);
    }
  }

  if (processBanner) {
    if (!existsSync(BANNER_SOURCE)) {
      console.error("❌ Banner 來源圖片不存在: scripts/sources/banner.png");
      console.log("   請放置一張橫幅 PNG（建議 1200×630，1.91:1 比例）");
      console.log("   或執行 npx tsx scripts/generate-placeholder.ts 產生 placeholder");
      process.exit(1);
    }
    const bannerMeta = await validateSource(BANNER_SOURCE, "Banner", 630);
    if (bannerMeta) {
      console.log(`📦 Banner 來源: banner.png (${bannerMeta.width}×${bannerMeta.height})`);
    }
  }

  console.log();

  let totalSuccess = 0;
  let totalFailed = 0;

  // ── 生成 Logo 系列 ──

  if (processLogo) {
    console.log("🖼️  生成 Favicon 系列...");
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

    // favicon.png（32×32 副本）
    try {
      generateFaviconCopy();
      console.log("  ✅ icons/favicon.png (32×32 主圖標)");
      totalSuccess++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ icons/favicon.png: ${msg}`);
      totalFailed++;
    }

    // favicon.svg
    try {
      generateFaviconSVG();
      console.log("  ✅ icons/favicon.svg (內嵌 base64 PNG)");
      totalSuccess++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ icons/favicon.svg: ${msg}`);
      totalFailed++;
    }

    console.log();
    console.log("🖼️  生成 PWA Icons 系列...");
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

  // ── 生成 Banner ──

  if (processBanner) {
    console.log("🖼️  生成 OG Banner...");
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

  // ── 清理舊檔案 ──

  if (!noClean) {
    console.log("🧹 清理舊檔案...");
    const cleaned = cleanLegacyFiles();
    if (cleaned === 0) {
      console.log("  ℹ️  沒有需要清理的舊檔案");
    }
    console.log();
  }

  // ── 總結 ──

  console.log("=".repeat(60));
  if (totalFailed === 0) {
    console.log(`✅ 完成！成功生成 ${totalSuccess} 個檔案`);
  } else {
    console.log(`⚠️  完成：${totalSuccess} 個成功，${totalFailed} 個失敗`);
  }
  console.log();
  console.log("📝 產出摘要:");
  if (processLogo) {
    console.log("   Favicon: favicon.svg, favicon.png, 16/32/48/180/192/512px");
    console.log("   PWA:     pwa-64/192/512, maskable-512");
  }
  if (processBanner) {
    console.log(`   Banner:  banner_fb-og.png (${OG_BANNER_WIDTH}×${OG_BANNER_HEIGHT})`);
  }
  console.log();
  console.log("💡 提示: 執行 npm run build 確認建置無誤");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main();
