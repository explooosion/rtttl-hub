---
name: i18n-translations
description: Defines translation rules for all UI text changes in this repository. Apply whenever any UI element, page, or workflow introduces, modifies, or removes displayable text. Enforces full coverage across all 13 supported locales and removal of unused keys.
license: MIT
metadata:
  author: explooosion
  version: "1.0.0"
---

# i18n Translation Rules

Mandatory translation workflow for all UI text changes in this repository.

## When to Apply

Apply **whenever any change adds, modifies, or removes displayable text**, including:

- Adding new UI components with user-visible strings
- Modifying existing labels, messages, placeholders, or headings
- Removing UI elements that previously had translation keys
- Refactoring pages or layouts that contain translated text
- Adding or updating error messages, toast notifications, or dialogs

---

## Supported Locales

All 13 locales must be kept in sync. Every key added or removed in one locale file must be reflected in all others.

| Locale Code | Language               | File                            |
| ----------- | ---------------------- | ------------------------------- |
| `en`        | English (default)      | `src/i18n/locales/en.json`      |
| `zh-TW`     | Traditional Chinese    | `src/i18n/locales/zh-TW.json`   |
| `zh-CN`     | Simplified Chinese     | `src/i18n/locales/zh-CN.json`   |
| `ja`        | Japanese               | `src/i18n/locales/ja.json`      |
| `ko`        | Korean                 | `src/i18n/locales/ko.json`      |
| `de`        | German                 | `src/i18n/locales/de.json`      |
| `fr`        | French                 | `src/i18n/locales/fr.json`      |
| `es`        | Spanish                | `src/i18n/locales/es.json`      |
| `it`        | Italian                | `src/i18n/locales/it.json`      |
| `cs`        | Czech                  | `src/i18n/locales/cs.json`      |
| `pl`        | Polish                 | `src/i18n/locales/pl.json`      |
| `ru`        | Russian                | `src/i18n/locales/ru.json`      |
| `uk`        | Ukrainian              | `src/i18n/locales/uk.json`      |

---

## Rule 1 — Full Coverage on Key Addition

When adding a new translation key, **all 13 locale files must be updated** in the same change.

### Steps

1. Add the key to `en.json` first with the English text (source of truth).
2. Add the same key to every other locale file with an accurate, natural translation.
3. Do **not** leave any locale with a missing key or an untranslated English fallback.

### Anti-patterns (Forbidden)

```jsonc
// ❌ Adding a key only in en.json and leaving others unchanged
// en.json
{ "settings": { "autoPlay": "Auto Play" } }

// zh-TW.json — key is missing entirely ← FORBIDDEN
```

```jsonc
// ❌ Copying English text as a placeholder in another locale
// ja.json
{ "settings": { "autoPlay": "Auto Play" } }  // ← FORBIDDEN, must be Japanese
```

### Correct Pattern

```jsonc
// ✅ en.json
{ "settings": { "autoPlay": "Auto Play" } }

// ✅ zh-TW.json
{ "settings": { "autoPlay": "自動播放" } }

// ✅ ja.json
{ "settings": { "autoPlay": "自動再生" } }

// ... (all 13 locales updated)
```

---

## Rule 2 — Key Removal on UI Deletion

When removing a UI element or text that uses a translation key, **remove the corresponding key from all 13 locale files**.

### Steps

1. Identify all `t("key.path")` or `i18nKey` references in the deleted/changed code.
2. Confirm the key is no longer used anywhere in the codebase (`grep_search` for the key string).
3. Remove the key from every locale file.

### Anti-patterns (Forbidden)

```jsonc
// ❌ Leaving orphaned keys after removing the UI element
// en.json still contains:
{ "oldPage": { "deprecatedTitle": "Old Title" } }  // ← FORBIDDEN if unused
```

---

## Rule 3 — Key Modification

When the meaning or structure of a key changes, update the translations in all locales accordingly.

- If a key is **renamed**, treat it as a removal of the old key and addition of the new key.
- If only the **value** changes (e.g., improved wording), update the value in all locale files.

---

## Rule 4 — Nested Structure Consistency

All locale files must share the **exact same JSON structure and key hierarchy**.

| Rule               | Requirement                                                          |
| ------------------ | -------------------------------------------------------------------- |
| Key paths          | Identical across all locales                                         |
| Nesting depth      | Identical across all locales                                         |
| Key order          | Match `en.json` order in every file                                  |
| No extra keys      | A locale must not contain keys absent from `en.json`                 |

---

## Rule 5 — Validation Checklist

Before marking any translation-related task complete, verify:

- [ ] The new/changed key exists in **all 13 locale files**
- [ ] No locale file contains keys that no longer exist in `en.json`
- [ ] All translated values are natural language (not copied English)
- [ ] JSON structure and key order match `en.json`
- [ ] No TypeScript or ESLint errors introduced (`npm run lint`)

---

## Workflow Summary

```
1. Identify affected t() keys from code changes
2. Add / modify / remove keys in en.json (source of truth)
3. Propagate the same change to all 12 remaining locale files
4. Verify no unused keys remain (grep for each key)
5. Run lint to confirm no errors
```
