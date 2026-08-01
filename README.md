# JSON for Humans

**Turn ugly JSON into something anyone can understand.**

_Private, fast and completely browser-based._

JSON for Humans converts technical JSON into a clean, readable view — for developers explaining
API responses, support teams reading technical data, product managers inspecting payloads, and
anyone who needs to share JSON without exposing raw complexity.

> 🔒 **Your JSON stays in your browser and is never uploaded.**
> There is no backend, no analytics, no cloud storage. The app works offline once loaded.

![Screenshot placeholder — main workspace](docs/screenshots/workspace.png)
![Screenshot placeholder — comparison mode](docs/screenshots/comparison.png)

## What it does

Paste this:

```json
{
  "order_id": 123,
  "customer_name": "Ravi Kumar",
  "payment_status": "PAYMENT_PENDING",
  "is_deleted": false,
  "created_at": "2026-08-01T09:30:00Z"
}
```

Get this:

```text
Order #123

Customer Name
Ravi Kumar

Payment Status
Payment Pending

Deleted
No

Created At
August 1, 2026 at 3:00 PM
```

## Features

- **Five display modes** — Document (report style), Cards, Table (sortable, pageable, CSV
  export), Tree (expand/collapse with breadcrumbs) and Raw (highlighted JSON)
- **Smart humanization engine** (fully deterministic, no AI):
  - `customer_name` / `customerName` / `CUSTOMER-NAME` → `Customer Name`, preserving
    acronyms (ID, URL, API, UUID, OTP, HTTP, GST, PAN, …)
  - Booleans → Yes/No (or True/False, Enabled/Disabled, Active/Inactive)
  - `PAYMENT_PENDING` → `Payment Pending`
  - null / empty values → friendly, customizable labels
  - Locale-aware numbers, percentages (`completion_rate: 0.85` → `85%`)
  - ISO dates and (name-hinted) Unix timestamps → readable local/UTC/relative dates
  - Safe clickable links for URLs, emails and phone numbers
  - Color previews for hex/rgb/hsl values
  - Monospace identifiers with one-click copy
- **CodeMirror 6 editor** with line numbers, syntax highlighting, inline validation with line
  and column, trailing-comma repair suggestions and duplicate-key warnings
- **Custom schema** — override labels, types, enum mappings and currencies per field, with
  nested (`customer.address.city`) and array (`orders[].amount`) paths
- **Comparison mode** — readable change sentences ("Payment Status changed from Pending to
  Completed."), change list, counts, copy/export
- **Search & filters** — search names and values across nesting; hide nulls, empties and
  technical identifiers
- **Exports** — plain text, Markdown, standalone HTML (script-free, fully escaped), formatted
  JSON, CSV and print
- **Settings** — date/timezone/locale formats, boolean and empty-value labels, density, default
  view, theme (light/dark/system). Persisted only when you opt in.

## Pages

The site ships as two static pages:

- `index.html` — a self-contained marketing landing page (custom hand-written CSS, no
  framework, dark-mode aware)
- `app.html` — the Vue application itself

## Getting started

Requires Node.js 18+.

```bash
git clone https://github.com/Thileepan/json-for-humans.git
cd json-for-humans
npm install
npm run dev        # start dev server: / is the landing page, /app.html is the app
```

### Commands

| Command           | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Start the Vite dev server                              |
| `npm run test`    | Run the unit/component/integration test suite (Vitest) |
| `npm run lint`    | Lint with ESLint                                       |
| `npm run format`  | Format with Prettier                                   |
| `npm run build`   | Production build to `dist/`                            |
| `npm run preview` | Preview the production build                           |

### Deployment

The build output in `dist/` is fully static — deploy it to any static host (GitHub Pages,
Netlify, Cloudflare Pages, S3, nginx). No server-side code, environment variables or API keys
are required. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Privacy](docs/PRIVACY.md)
- [Roadmap](docs/ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE)
