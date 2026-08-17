import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { COLLECTIONS } from "../src/constants/collections";

interface PackageJson {
  homepage?: string;
}

interface CollectionLike {
  slug: string;
  externalOnly?: boolean;
  group: "my-creations" | "public-libraries" | "external-links";
}

interface UrlEntry {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
}

const repoRoot = process.cwd();
const publicDir = resolve(repoRoot, "public");

async function readSiteUrl() {
  const packageJsonPath = resolve(repoRoot, "package.json");
  const packageJsonText = await readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonText) as PackageJson;
  const homepage = packageJson.homepage;

  if (!homepage) {
    throw new Error("package.json homepage is required for sitemap generation");
  }

  return homepage.replace(/\/$/, "");
}

async function readCollections() {
  return COLLECTIONS as CollectionLike[];
}

function buildUrlEntries(collections: CollectionLike[]) {
  const staticEntries: UrlEntry[] = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/collections", changefreq: "daily", priority: "0.9" },
    { path: "/collections/public", changefreq: "weekly", priority: "0.8" },
    { path: "/about", changefreq: "monthly", priority: "0.6" },
    { path: "/contribute", changefreq: "monthly", priority: "0.7" },
    { path: "/terms", changefreq: "yearly", priority: "0.3" },
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
    { path: "/cookies", changefreq: "yearly", priority: "0.3" },
  ];

  const collectionEntries: UrlEntry[] = collections
    .filter((item) => {
      if (item.externalOnly) {
        return false;
      }
      if (item.group === "my-creations") {
        return false;
      }
      return true;
    })
    .map((item) => ({
      path: `/collections/${item.slug}`,
      changefreq: "weekly",
      priority: item.slug === "community" ? "0.8" : "0.7",
    }));

  const deduped = new Map<string, UrlEntry>();
  for (const entry of [...staticEntries, ...collectionEntries]) {
    deduped.set(entry.path, entry);
  }

  return Array.from(deduped.values());
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderSitemap(siteUrl: string, entries: UrlEntry[]) {
  const urls = entries
    .map((entry) => {
      const loc = `${siteUrl}${entry.path}`;
      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

function renderRobots(siteUrl: string) {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /account",
    "Disallow: /login",
    "Disallow: /register",
    "Disallow: /create",
    "Disallow: /collections/my-creations",
    "Disallow: /collections/favorites",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

async function main() {
  const siteUrl = await readSiteUrl();
  const collections = await readCollections();
  const entries = buildUrlEntries(collections);

  const sitemapXml = renderSitemap(siteUrl, entries);
  const robotsTxt = renderRobots(siteUrl);

  await writeFile(resolve(publicDir, "sitemap.xml"), sitemapXml, "utf8");
  await writeFile(resolve(publicDir, "robots.txt"), robotsTxt, "utf8");

  console.log(`Generated sitemap.xml with ${entries.length} URLs`);
  console.log("Generated robots.txt");
}

void main();