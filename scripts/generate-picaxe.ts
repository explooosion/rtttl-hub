import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

interface PicaxeEntry {
  name: string;
  artist?: string;
  sourceCategory: string;
  tracks: string[];
}

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../public");
const TEMP_DIR = path.resolve(import.meta.dirname, "../public/.rtttl-temp");
const OUTPUT_FILE = path.resolve(import.meta.dirname, "../public/picaxe.json");

/** Fixed zip sources — file names do not change */
const ZIP_SOURCES = [
  { file: "rtttl.zip", category: "Mixed 1" },
  { file: "rtttl2.zip", category: "Mixed 2" },
  { file: "rtttl3.zip", category: "Mixed 3" },
  { file: "rtttl_tv.zip", category: "TV Themes" },
  { file: "rtttl_xmas.zip", category: "Christmas" },
] as const;

function parseFileName(baseName: string): { artist: string; title: string } {
  const name = baseName.replace(/\.(txt|bas)$/i, "").trim();
  const dashIndex = name.indexOf(" - ");
  if (dashIndex !== -1) {
    return {
      artist: name.slice(0, dashIndex).trim(),
      title: name.slice(dashIndex + 3).trim(),
    };
  }
  return { artist: "", title: name };
}

function isValidRtttl(code: string): boolean {
  return (code.match(/:/g) ?? []).length >= 2;
}

/**
 * Process a .txt file — standard RTTTL format: `name:d=N,o=N,b=N:notes`
 * The RTTTL name embedded in the code is used as title fallback for files
 * without an "Artist - Title" filename pattern (e.g. rtttl.zip short names).
 */
function processTxt(fileName: string, content: string, category: string): PicaxeEntry | null {
  const code = content.trim();
  if (!code || !isValidRtttl(code)) {
    return null;
  }

  const { artist, title: fileTitle } = parseFileName(fileName);
  const rtttlName = code.split(":")[0].trim();
  // When there is no artist prefix the filename is typically a short code
  // (e.g. "0071.txt"). Prefer the RTTTL inline name in that case.
  const name = artist ? fileTitle : rtttlName || fileTitle;

  const entry: PicaxeEntry = { name, sourceCategory: category, tracks: [code] };
  if (artist) {
    entry.artist = artist;
  }
  return entry;
}

/**
 * Process a .bas file — PICAXE BASIC format using proprietary `tune` hex bytes.
 * This encoding is not directly convertible to RTTTL, so these entries are skipped.
 */
function processBas(..._args: [string, string, string]): PicaxeEntry | null {
  return null;
}

async function main(): Promise<void> {
  // Clean up any leftover temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const allEntries: PicaxeEntry[] = [];

  try {
    for (const source of ZIP_SOURCES) {
      const zipPath = path.join(PUBLIC_DIR, source.file);

      if (!fs.existsSync(zipPath)) {
        console.warn(`  [skip] ${source.file} — file not found`);
        continue;
      }

      console.log(`[${source.category}] Extracting ${source.file}...`);

      // Extract zip to an isolated temp subdirectory
      const extractDir = path.join(TEMP_DIR, source.file.replace(".zip", ""));
      fs.mkdirSync(extractDir, { recursive: true });

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractDir, /* overwrite */ true);

      // Process each extracted file
      const files = fs.readdirSync(extractDir).sort();
      let added = 0;
      let skipped = 0;

      for (const file of files) {
        const filePath = path.join(extractDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          continue;
        }

        const content = fs.readFileSync(filePath, "latin1");
        const ext = path.extname(file).toLowerCase();

        let entry: PicaxeEntry | null = null;

        if (ext === ".txt") {
          entry = processTxt(file, content, source.category);
        } else if (ext === ".bas") {
          entry = processBas(file, content, source.category);
        }

        if (entry !== null) {
          allEntries.push(entry);
          added++;
        } else {
          skipped++;
        }
      }

      console.log(`  added: ${added}  skipped: ${skipped}`);
    }
  } finally {
    // Always remove extracted files, even if an error occurs
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true });
      console.log("\n[cleanup] Removed temp directory");
    }
  }

  // Write index with readable formatting
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEntries, null, 2), "utf-8");

  const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
  const relPath = path.relative(process.cwd(), OUTPUT_FILE);
  console.log(`\n[done] ${relPath} — ${allEntries.length} entries (${sizeMB} MB)`);
}

main().catch((err: unknown) => {
  console.error("[error]", err);
  process.exit(1);
});
