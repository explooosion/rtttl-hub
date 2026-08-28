---
name: theme-design
description: Defines typography rules for the theme design guideline in this repository. Apply whenever writing, reviewing, or refactoring any TSX/CSS that sets font size — enforces a minimum readable text size across the site and restricts `text-xs` to icons and special markers only.
license: MIT
metadata:
  author: explooosion
  version: "1.0.0"
---

# Theme Design Guideline — Typography

Mandatory minimum font-size rule for all user-facing text in this repository.

## When to Apply

Apply **whenever writing or editing any TSX/JSX markup or CSS** that sets a Tailwind
text-size utility class, including:

- Labels, descriptions, hints, and helper text
- Buttons and link text
- Dialog/modal content
- Form field labels and captions

## Rule — No `text-xs` for Body Text

`text-xs` is **forbidden** for any readable text description (labels, descriptions,
hints, button text, captions, messages, etc.). The minimum allowed size for body
text is `text-sm`.

### Allowed Exceptions

`text-xs` (or smaller, e.g. `text-[9px]`, `text-[11px]`) may only be used for:

- Sizing containers around **icons** that hold no readable text (e.g. a checkbox
  mark container wrapping a `<FaCheck />` icon)
- **Special markers** such as compact badges/tags that are purely decorative and
  not primary reading content

### Anti-patterns (Forbidden)

```tsx
// WRONG — real text description using text-xs
<label className="block text-xs font-medium text-gray-500">
  {t("form.fieldLabel")}
</label>

// WRONG — button text using text-xs
<button className="text-xs font-medium text-indigo-600">
  {t("common.changeFile")}
</button>
```

### Correct Pattern

```tsx
// ✅ Body text uses text-sm at minimum
<label className="block text-sm font-medium text-gray-500">
  {t("form.fieldLabel")}
</label>

// ✅ text-xs kept only for an icon container (no readable text inside)
<div className="flex h-5 w-5 items-center justify-center rounded border text-xs">
  {selected && <FaCheck size={10} />}
</div>
```

## Validation Checklist

Before marking any UI-related task complete, verify:

- [ ] No `text-xs` class is applied to an element containing readable text
- [ ] Any remaining `text-xs` usage wraps an icon-only element or a decorative
      special marker, not a label/description/button/message
- [ ] No TypeScript or ESLint errors introduced (`npm run lint`)
