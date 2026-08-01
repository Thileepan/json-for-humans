# Privacy

**Your JSON stays in your browser and is never uploaded.**

JSON for Humans is designed so that trusting it requires reading, not believing:

- **No backend.** The app is a static bundle of HTML/CSS/JS. There is no server component.
- **No network calls with your data.** The code contains no `fetch`/XHR of user content —
  parsing, humanizing, comparing and exporting all run locally in your browser.
- **No analytics, no tracking, no cookies.**
- **No storage of JSON.** Your JSON lives only in page memory and is gone when you close the
  tab. It is never written to localStorage.
- **Opt-in settings persistence only.** Display preferences (theme, labels, locale …) are
  saved to localStorage _only_ if you enable "Remember settings". Disabling it deletes them.
  Stored settings are re-loaded through a strict whitelist, never merged blindly.
- **Offline capable.** After the static assets load, the app works without a connection.
- **No AI, no API keys.** The transformation engine is fully deterministic. A provider
  interface exists for possible future opt-in AI features, but nothing is implemented,
  no SDK is installed and no keys are requested.

## Verifying these claims

1. Open your browser's developer tools → Network tab.
2. Load the app, then paste any JSON.
3. Observe: no requests are made after the initial static asset load.

If you find any behavior that contradicts this document, please report it as a security
vulnerability (see [SECURITY.md](../SECURITY.md)).
