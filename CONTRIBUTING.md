# Contributing to JSON for Humans

Thanks for your interest in contributing! This project aims to stay small, fast, private and
dependency-light.

## Ground rules

- **Privacy is non-negotiable.** No network calls with user JSON, no analytics, no storage of
  JSON content. PRs that violate this will be declined.
- **The core engine stays deterministic and framework-free.** Everything under `src/core/`
  must be plain JavaScript with no Vue imports and no AI/network dependencies.
- **JavaScript only** — no TypeScript syntax, no JSX.
- Vue 3 Composition API with `<script setup>` for all components.
- All JSON content is untrusted: never use `v-html`, always escape exported output.

## Development setup

```bash
npm install
npm run dev
```

Before opening a PR:

```bash
npm run lint
npm run format:check
npm run test
npm run build
```

All four must pass.

## Project layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). In short:

- `src/core/` — deterministic humanization engine (parser, detectors, formatters,
  transformer, comparator, schema, exporters). Pure functions, fully unit-tested.
- `src/stores/` — Pinia stores (json, settings, schema, comparison, ui).
- `src/composables/` — reusable Vue behavior; no transformation rules here.
- `src/components/` — small, focused SFCs grouped by feature.

## Adding features

1. Put transformation logic in `src/core/` with unit tests first.
2. Wire it to the UI through a store or composable.
3. Keep components presentational; they consume the normalized humanized tree.
4. Add tests (`src/tests/`) for every new formatter, detector or view behavior.

## Commit & PR guidelines

- Small, focused PRs are easier to review.
- Include tests and a short description of the user-facing behavior change.
- Update `CHANGELOG.md` under **Unreleased**.

## Reporting bugs

Use the bug report issue template. Include a minimal JSON sample that reproduces the issue
(remove any real data first!).
