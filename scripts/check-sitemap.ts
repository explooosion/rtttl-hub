import { execSync } from "node:child_process";

function main() {
  const unstaged = execSync("git diff --name-only -- public/sitemap.xml public/robots.txt", {
    encoding: "utf8",
  }).trim();

  const untracked = execSync(
    "git ls-files --others --exclude-standard -- public/sitemap.xml public/robots.txt",
    {
      encoding: "utf8",
    },
  ).trim();

  if (unstaged.length > 0 || untracked.length > 0) {
    const details = [unstaged, untracked].filter((s) => s.length > 0).join("\n");
    console.error("Sitemap check failed: generated files are not up to date.");
    console.error("Run `npm run sitemap`, then stage updated files before commit.");
    console.error("Affected files:");
    console.error(details);
    process.exit(1);
  }

  const staged = execSync("git diff --cached --name-only -- public/sitemap.xml public/robots.txt", {
    encoding: "utf8",
  }).trim();

  if (staged.length > 0) {
    console.log("Sitemap check passed: generated files are staged and up to date.");
    return;
  }

  console.log("Sitemap check passed: generated files are up to date.");
}

main();
