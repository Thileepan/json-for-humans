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

Search conditions are `{ field, op, value, value2, negate, caseSensitive }`; a query is
`{ conditions, combinator }`. `field` accepts a key, a label or a path. Text operators read
the formatted and raw values; comparison operators read the raw value, so `amount>500`
compares against `1200`, not against "1,200".

The search box and the condition builder edit the same query: the typed text is the single
source of truth, `parseQuery` turns it into conditions, and every builder action serializes
straight back with `serializeQuery`, so the two can never drift apart. Text syntax:

```
term        field:value    field=value    field!=value    field>500   field:100..900
field~regex has:field      empty:field    is:empty        is:date     -exclude    OR
field[op]:value   (long form, for operators with no shorthand)
```

Several ANDed conditions describe a record rather than a field, so `useHumanizedJson` turns on
`filterTree`'s `rowScope`: it keeps the innermost containers whose subtree satisfies every
condition, whole. A single condition, or an OR, keeps the narrower field-level view. Where a
container satisfies the query but no record inside it does — conditions met by fields scattered
across the document — only the matching fields are kept, never the container wholesale.

Every shorthand `serializeQuery` writes is checked by re-parsing it (`roundTrips`); anything
ambiguous falls back to the unambiguous long form `field[op]:value`. Without that check an
unfinished range serializes to `age:..`, which reads back as a plain term, and choosing "between"
in the builder would appear to reset itself to "contains".

Arrays of similar objects are always filtered by row, in either scope — pruning a row to its one
matching cell would leave the Table view rendering a line of dashes. Within those rows the display
filters are applied _before_ matching, so a row is never kept because of a field the user chose to
hide. `countRows` feeds the "n rows" half of the match counter.

`highlight` returns match offsets rather than markup; `HighlightedText.vue` turns them into plain
text nodes and `<mark>` elements, so untrusted JSON is never interpolated as HTML. The active query
reaches the deep render tree through `provideSearchHighlight`, once per panel, rather than each of
the thousands of rendered values resolving it for itself.

Filtering cost is kept down in two places: the search box commits on a 150 ms debounce (builder
edits commit immediately), and `matchCondition` caches each node's lower-cased text in a `WeakMap`
keyed by the node, which survives keystrokes because the tree is rebuilt only when the JSON or the
formatting options change.

## Layers

### `src/core/` — the engine (no Vue imports)

| Module         | Responsibility                                                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parser/`      | `parseJson` (friendly errors with line/column, size limits), `validateJson` (duplicate-key scan, trailing-comma repair, error-position scanner)                                                                              |
| `detector/`    | `detectDate` (ISO + range/name-gated Unix), `detectLink` (URL/email/phone + `safeHref` allowlist), `detectColor`, `detectFieldType` (name hints)                                                                             |
| `formatter/`   | `formatKey` (acronym-aware), `formatValue` (the primitive dispatcher), `formatNumber`, `formatDate`, `formatBoolean`                                                                                                         |
| `transformer/` | `humanizeJson` + `transformObject`/`transformArray` (tree building), `filterTree` (search/filters)                                                                                                                           |
| `search/`      | `matchCondition` (one condition vs. one node), `compileQuery`/`compileRowQuery` (structured multi-condition queries), `parseQuery`/`serializeQuery` (the text syntax), `fields` (field scoping), `highlight` (match offsets) |
| `comparator/`  | `compareJson` (flat change list) and `describeChanges` (readable sentences)                                                                                                                                                  |
| `schema/`      | `validateSchema`, `applySchema` (path + bare-name lookup)                                                                                                                                                                    |
| `exporter/`    | `toPlainText`, `toMarkdown`, `toHtml` (escaped, script-free), `toCsv` (injection-safe)                                                                                                                                       |
| `ai/`          | `ExplanationProvider` — an unimplemented interface reserved for optional future AI. The deterministic engine never depends on it.                                                                                            |

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
`useSearch` (parses the query text into conditions and serializes builder edits back),
`useSearchHighlight` (provide/inject of the active query for match marking),
`useClipboard`, `useFileUpload`, `useTheme`, `useExport`.

### `src/components/`

Small SFCs grouped by feature (`editor/`, `human-view/`, `comparison/`, `schema/`,
`settings/`, `export/`, `common/`). Recursive renderers (`DocNode`, `CardNode`, `TreeNode`)
paginate long child lists.

`common/AppTooltip.vue` is the only tooltip in the app — native `title` attributes are not used,
because they cannot be styled, ignore dark mode and appear after an uncontrollable delay. It is
positioned by `@floating-ui/vue` (headless: flip, shift and arrow middleware) and styled here with
Tailwind, so it follows the app's palette rather than shipping a theme of its own. The bubble is
teleported to the body to escape clipping ancestors, opens on hover after a delay and immediately
on keyboard focus, and closes on blur or Escape. Its text is a description wired with
`aria-describedby`, so a trigger still needs its own accessible name; `focusable` gives a
non-interactive trigger a tab stop. The component must keep a single root element — a second root
(even a comment) would make it a fragment, and then a passed `class` has nowhere to land and the
listeners stop reaching the trigger.

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
