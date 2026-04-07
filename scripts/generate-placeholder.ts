/**
 * Placeholder 來源圖片生成腳本
 *
 * 使用 sharp 程式化產生品牌 placeholder 圖片：
 *   - scripts/sources/logo.png   (512×512)
 *   - scripts/sources/banner.png (1200×630)
 *
 * 後續可用設計稿替換這些 placeholder。
 *
 * 用法：npx tsx scripts/generate-placeholder.ts
 */

import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCES_DIR = join(__dirname, "sources");

if (!existsSync(SOURCES_DIR)) {
  mkdirSync(SOURCES_DIR, { recursive: true });
}

const LOGO_PATH = join(SOURCES_DIR, "logo.png");
const BANNER_PATH = join(SOURCES_DIR, "banner.png");

const BRAND_COLOR = "#6366f1"; // indigo-500
const BG_COLOR = "#0f0a1e"; // cosmos-dark

/**
 * 產生 SVG 文字圖片並轉為 PNG
 */
async function createTextImage(
  outputPath: string,
  width: number,
  height: number,
  lines: string[],
  fontSize: number,
): Promise<void> {
  const lineHeight = fontSize * 1.4;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;

  const textElements = lines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${startY + i * lineHeight}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${BRAND_COLOR}">${escapeXml(line)}</text>`,
    )
    .join("\n    ");

  // Music note icon (simple ♪ shape)
  const noteY = startY - lineHeight * 1.2;
  const noteSize = fontSize * 1.5;
  const noteIcon = `<text x="${width / 2}" y="${noteY}" text-anchor="middle" font-size="${noteSize}" fill="${BRAND_COLOR}">♪</text>`;

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${BG_COLOR}"/>
  <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="16" fill="none" stroke="${BRAND_COLOR}" stroke-width="2" opacity="0.3"/>
  ${noteIcon}
  ${textElements}
</svg>`;

  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outputPath);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main(): Promise<void> {
  console.log("🎨 Placeholder 來源圖片生成");
  console.log("=".repeat(50));
  console.log();

  // Logo: 512×512
  console.log("📦 生成 logo.png (512×512)...");
  await createTextImage(LOGO_PATH, 512, 512, ["RTTTL", "Hub"], 72);
  console.log(`  ✅ ${LOGO_PATH}`);

  // Banner: 1200×630
  console.log("📦 生成 banner.png (1200×630)...");
  await createTextImage(
    BANNER_PATH,
    1200,
    630,
    ["RTTTL Hub", "Browse, Play & Create", "Retro Ringtones"],
    48,
  );
  console.log(`  ✅ ${BANNER_PATH}`);

  console.log();
  console.log("✅ 完成！可執行 npm run generate-logos 產生完整品牌圖片系列。");
}

main();
