# Roadmap

## Near term (0.2.x)

- Web Worker offloading for parsing and comparison of very large documents (> 5 MB)
- Virtualized rendering (windowing) for arrays with tens of thousands of entries
- Tree diff visualization in comparison mode (side-by-side highlighting inside the tree view)
- Per-section copy buttons in Document and Cards views
- Keyboard shortcuts (format, switch views, open search)
- Shareable settings/schema via URL fragment (never the JSON itself)

## Mid term

- Visual schema editor (form-based, generated from the current document)
- Named saved schemas (opt-in local storage)
- More export targets: PDF (via print stylesheet), DOCX-friendly HTML
- Localization of the UI itself (labels are already locale-aware)
- Installable PWA with offline caching manifest

## Long term / exploratory

- Standalone `@json-for-humans/engine` npm package extracted from `src/core`
- Optional, strictly opt-in AI assist behind the existing `ExplanationProvider` interface:
  plain-language summaries, API error explanations, important-field detection.
  The deterministic engine remains the default and the app must keep working fully without
  any AI configuration.

## Explicit non-goals

- Accounts, authentication, cloud sync or any backend
- Analytics or telemetry of any kind
- Uploading user JSON anywhere
