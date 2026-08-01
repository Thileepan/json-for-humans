# Deployment

JSON for Humans builds to a fully static site. Any static file host works.

## Build

```bash
npm ci
npm run build
```

Output lands in `dist/`. The build uses relative asset paths (`base: './'`), so it works from
a domain root **or** a subpath without configuration.

The build produces two pages: `index.html` (the marketing landing page) and `app.html` (the
application). Both are static; no rewrites are needed.

## Hosting options

### GitHub Pages

```bash
npm run build
# push dist/ to the gh-pages branch, or use actions/deploy-pages
```

Example GitHub Actions workflow:

```yaml
name: Deploy
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - uses: actions/deploy-pages@v4
```

### Netlify / Cloudflare Pages / Vercel

- Build command: `npm run build`
- Output directory: `dist`
- No environment variables needed.

### Any web server (nginx, S3, …)

Copy `dist/` to the web root. No rewrites are required (the app is a single page with no
router paths).

## Recommended headers

Because the app needs no external resources at runtime, you can ship a strict CSP:

```text
Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'
```
