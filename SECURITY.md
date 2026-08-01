# Security Policy

## Supported versions

The latest release on the default branch is supported with security fixes.

## Reporting a vulnerability

Please **do not** open public issues for security vulnerabilities. Instead, use GitHub's
private vulnerability reporting ("Report a vulnerability" under the Security tab) on this
repository. You can expect an acknowledgement within a few days.

## Security model

JSON for Humans treats **all JSON content as untrusted input**:

- No user JSON ever leaves the browser — there is no backend, no telemetry, no third-party
  requests at runtime.
- `v-html` is never used for user-provided content; all values render as text nodes.
- Exported HTML contains no scripts and all content is escaped.
- Links are only rendered for an allowlist of protocols (`https:`, `http:`, `mailto:`,
  `tel:`); anything else is displayed as plain text.
- CSV export neutralizes spreadsheet formula injection (`=`, `+`, `-`, `@` prefixes).
- Dangerous keys (`__proto__`, `constructor`, `prototype`) are never recursed into or merged,
  protecting against prototype pollution.
- Parsed JSON is never merged into application settings; stored settings are whitelisted
  field-by-field on load.

If you find a gap in any of the above, we want to hear about it.
