# Architecture

## Overview

JSON for Humans is a frontend-only Vue 3 application. Its heart is a **deterministic,
framework-free humanization engine** in `src/core/` that turns parsed JSON into a normalized
tree. Every display mode renders that same tree — components never interpret raw JSON
themselves.

```text
raw text ──parseJson──▶ parsed value ──humanizeJson(options, schema)──▶ normalized tree
                                                                     │
                    Document / Cards / Table / Tree / Raw views ◀────┘
                    exporters (text / markdown / html / csv) ◀───────┘
```

## The normalized tree

`humanizeJson(input, options, schema)` returns nodes of three kinds:

```javascript
// field (primitive leaf)
{
  kind: 'field',
  key: 'customer_name',
  label: 'Customer Name',
  path: 'customer.customer_name',
  rawValue: 'Ravi Kumar',
  displayValue: 'Ravi Kumar',
  detectedType: 'text',            // null|boolean|number|percentage|currency|date|datetime|
                                   // enum|id|url|email|phone|color|empty|text
  meta: { href, color, monospace, isId, hidden }
}

// object — { kind: 'object', label, path, children, entryCount, isEmpty }
// array  — { kind: 'array', label, path, children, itemCount, isEmpty,
//            isPrimitiveList, itemsAreObjects, tableRecommended, columns }
```

Paths use `a.b[2].c` syntax; schema lookups use normalized paths (`a.b[].c`).

## Layers

### `src/core/` — the engine (no Vue imports)

| Module         | Responsibility                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `parser/`      | `parseJson` (friendly errors with line/column, size limits), `validateJson` (duplicate-key scan, trailing-comma repair, error-position scanner)  |
| `detector/`    | `detectDate` (ISO + range/name-gated Unix), `detectLink` (URL/email/phone + `safeHref` allowlist), `detectColor`, `detectFieldType` (name hints) |
| `formatter/`   | `formatKey` (acronym-aware), `formatValue` (the primitive dispatcher), `formatNumber`, `formatDate`, `formatBoolean`                             |
| `transformer/` | `humanizeJson` + `transformObject`/`transformArray` (tree building), `filterTree` (search/filters)                                               |
| `comparator/`  | `compareJson` (flat change list) and `describeChanges` (readable sentences)                                                                      |
| `schema/`      | `validateSchema`, `applySchema` (path + bare-name lookup)                                                                                        |
| `exporter/`    | `toPlainText`, `toMarkdown`, `toHtml` (escaped, script-free), `toCsv` (injection-safe)                                                           |
| `ai/`          | `ExplanationProvider` — an unimplemented interface reserved for optional future AI. The deterministic engine never depends on it.                |

The engine is deliberately packageable: it accepts plain values + options and could be
extracted to a standalone npm package.

### `src/stores/` — Pinia (setup stores)

- `jsonStore` — raw text, debounced parse results (kept in `shallowRef` to avoid deep
  reactivity over large documents), file metadata, sample selection.
- `settingsStore` — formatting options, theme, view preferences; persisted to localStorage
  only when the user enables "Remember settings", loaded through a strict whitelist.
- `schemaStore` — schema text, validation state, active schema.
- `comparisonStore` — left/right documents and computed comparison results.
- `uiStore` — transient state (view mode, search, filters, modal visibility).

### `src/composables/`

Vue-side glue only; no transformation rules: `useHumanizedJson` (computed tree from stores),
`useClipboard`, `useFileUpload`, `useTheme`, `useExport`, `useSearch`.

### `src/components/`

Small SFCs grouped by feature (`editor/`, `human-view/`, `comparison/`, `schema/`,
`settings/`, `export/`, `common/`). Recursive renderers (`DocNode`, `CardNode`, `TreeNode`)
paginate long child lists.

## Performance notes

- Parsing is debounced (250 ms) while typing; explicit actions parse immediately.
- Parsed values and trees live in `shallowRef`/`computed` — no deep watchers over large JSON.
- Long arrays paginate in every view (Table pages of 25; other views incremental "Show
  more").
- Raw-view highlighting falls back to plain text beyond 400 k characters.
- Inputs are hard-capped at 20 MB with a soft warning at 5 MB.
- Web Workers are not used yet; see the roadmap.

## Testing

- Engine unit tests per module (`src/tests/core/`).
- Component tests with Vue Test Utils (`src/tests/components/`).
- An integration test that walks paste → parse → transform → display → export
  (`src/tests/integration/workflow.test.js`).
