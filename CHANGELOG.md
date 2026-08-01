# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Marketing landing page at `index.html` (self-contained, dark-mode aware, no framework);
  the application now lives at `app.html` and the app logo links back to the landing page.

## [0.1.0] - 2026-08-01

### Added

- Deterministic humanization engine: key formatting with acronym preservation, boolean/null/
  empty labels, enum formatting, locale-aware numbers and percentages, ISO and Unix date
  detection, safe link detection (URL/email/phone), color detection, identifier handling.
- CodeMirror 6 JSON editor with validation, line/column errors, trailing-comma repair
  suggestions and duplicate-key warnings.
- Five display modes: Document, Cards, Table (sorting, pagination, column hiding, CSV
  export), Tree (expand/collapse, breadcrumbs) and Raw.
- Custom schema configuration with nested and array field paths, import/export and
  validation.
- Deterministic comparison mode with readable change sentences.
- Search and filtering across nested data.
- Exports: plain text, Markdown, script-free escaped HTML, formatted JSON, CSV, print.
- Settings drawer with opt-in local persistence; light/dark/system themes.
- Ten bundled sample datasets.
- Unit, component and integration tests (Vitest + Vue Test Utils).
