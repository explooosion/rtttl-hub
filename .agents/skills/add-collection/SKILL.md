---
name: add-collection
description: >
  Step-by-step checklist for integrating a new RTTTL collection into this platform.
  Use whenever a developer proposes adding a new collection — covers information gathering,
  data pipeline decisions, file creation, i18n, README, and update strategy.
license: MIT
metadata:
  author: explooosion
  version: "1.0.0"
---

# Adding a New Collection

Apply this skill whenever a new collection is proposed. It covers everything from
initial requirements gathering to long-term update strategy.

---

## Phase 1 — Information Gathering (Ask First)

Before writing any code, collect all required information. If any answer is missing,
**ask the user directly** before proceeding.

| Question                                                                                         | Why it matters                                                   |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| What is the collection **name** and **slug** (URL-safe, kebab-case)?                             | Determines file names, route, i18n keys                          |
| What is the **upstream data source URL**?                                                        | Required for README and `source` field in `CollectionDef`        |
| What is the **raw data format**? (zip of txt files / JSON / CSV / API endpoint / scraped HTML)   | Determines if a generator script is needed                       |
| Does the upstream data contain valid RTTTL codes, or does it need parsing/conversion?            | Determines complexity of the pipeline                            |
| What **license** does the upstream data use?                                                     | Required for README attribution                                  |
| Who is the **author or maintainer**?                                                             | Required for attribution                                         |
| How **frequently** is the upstream data updated? (never / occasionally / monthly / daily)        | Determines update strategy — manual vs. automated                |
| What **categories** do the tones belong to?                                                      | Must map to existing categories in `src/constants/categories.ts` |
| Is this a **community** collection (user-submitted) or a **library** collection (curated/brand)? | Determines `group` field in `CollectionDef`                      |
| Is a **banner image** or **logo** available?                                                     | Needed for UI assets                                             |

---

## Phase 2 — Normalized Data Format

All collections must produce a JSON file at `public/{slug}.json` with this schema:

```ts
interface CollectionEntry {
  name: string; // display title of the tone
  artist?: string; // original artist / contributor (omit if unknown)
  category: string; // must match a key in src/constants/categories.ts
  tracks: string[]; // array of RTTTL code strings (usually one per entry)
}
```

Example:

```json
[
  {
    "name": "Bluejay Default",
    "artist": "Bluejay",
    "category": "alert",
    "tracks": ["bluejay:b=570,o=4,d=32:4b,p,4e5,p,4b,p,4f#5,2p,4e5,2b5,8b5"]
  }
]
```

---

## Phase 3 — Pipeline Decision

Choose ONE of the following approaches based on the upstream data format:

### A. Manual JSON curation (small dataset, infrequent updates)

- Author exports/copies the data, normalizes to the schema above
- Saves directly to `public/{slug}.json`
- No script required
- Update by editing the JSON file and committing
- **Use when**: ≤ a few hundred entries, updated less than once a month

### B. Generator script (large dataset or structured source)

- Create `scripts/generate-{slug}.ts`
- Add an npm script to `package.json`: `"generate-{slug}": "tsx scripts/generate-{slug}.ts"`
- Script reads source files (local downloads, zip files, or APIs) and writes `public/{slug}.json`
- **Use when**: 500+ entries, source has a machine-readable format, or updates are frequent
- After creating the script, document its inputs and usage in a script-level comment block

### C. Automated via GitHub Actions (upstream changes frequently)

- Build on top of Option B
- Add a scheduled workflow in `.github/workflows/update-{slug}.yml`
- The workflow: fetches upstream → runs generator script → commits changed JSON if diff exists
- **Use when**: upstream releases new entries regularly (monthly or more often), and the source
  has a stable, publicly accessible URL
- Requires `contents: write` permission on the workflow
- The workflow must commit with a message matching the commit-message skill format

---

## Phase 4 — Implementation Checklist

Work through each item in order:

### 4.1 Data file

- [ ] `public/{slug}.json` created and validated against the normalized schema
- [ ] All RTTTL codes pass the 2-colon validity check (each code must contain ≥ 2 colons)

### 4.2 Collection definition

- [ ] Entry added to `COLLECTIONS` array in `src/constants/collections.ts`:
  ```ts
  {
    slug: "{slug}",
    nameKey: "collections.{camelSlug}.name",
    descriptionKey: "collections.{camelSlug}.description",
    icon: FaXxx,                   // pick an appropriate react-icons/fa icon
    source: "https://...",         // upstream URL
    group: "library",              // or "community"
  }
  ```
- [ ] Icon imported at the top of `collections.ts`

### 4.3 i18n strings

- [ ] Keys added to ALL locale files under `src/i18n/locales/`:
  - `collections.{camelSlug}.name`
  - `collections.{camelSlug}.description`
  - Translate where possible; fall back to English for unknown languages

### 4.4 Assets

- [ ] `public/assets/banners/{slug}.png` — banner image (run `generate-placeholder` if unavailable)
- [ ] `public/icons/{slug}.svg` or `.png` — icon (run `generate-logos` if unavailable)
- [ ] `public/assets/banners/{slug}.png` referenced wherever other banners are used

### 4.5 Data loading

- [ ] Verify the app's collection loader handles the new slug (check `src/utils/rtttl-parser.ts`
      or wherever `CollectionSlug` union type is defined)
- [ ] If `CollectionSlug` is a union type literal, add `"{slug}"` to it

### 4.6 README.md

The **Data Sources** section in `README.md` is the canonical record of every collection integrated into the platform. Every new collection **must** be appended here — this section is intentionally kept up to date as the library grows.

- [ ] Add a bullet entry under **Data Sources** in `README.md`:
  ```md
  - **{Display Name}** — Sourced from [{Source Name}](url). {One sentence on license/usage.}
  ```

### 4.7 Generator script (if applicable)

- [ ] `scripts/generate-{slug}.ts` created
- [ ] npm script added to `package.json`
- [ ] Script documented with a comment block describing input format and usage
- [ ] Script tested locally and output validated

### 4.8 GitHub Actions (if applicable)

- [ ] `.github/workflows/update-{slug}.yml` created
- [ ] Scheduled trigger defined (`schedule.cron`)
- [ ] Workflow only commits when the JSON actually changes (diff check)
- [ ] Commit message follows commit-message skill format

---

## Phase 5 — Validation

After all changes, run:

```bash
npm run lint
npm run build
```

Both must exit 0 before the changes are considered complete. Follow the lint-after-edit skill.

---

## Decision Reference

| Scenario                                                         | Pipeline                                  | Action schedule        |
| ---------------------------------------------------------------- | ----------------------------------------- | ---------------------- |
| Small manually curated JSON (< 200 entries), rarely changes      | Manual JSON                               | Update by PR as needed |
| Medium dataset from downloadable archive, updated quarterly      | Generator script                          | Manual re-run + commit |
| Large dataset from a public API or GitHub repo, updated monthly+ | Generator script + GitHub Actions         | Scheduled cron         |
| Community-submitted (user-driven)                                | Auth system + existing community pipeline | N/A                    |
