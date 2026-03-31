# Spark Arena Tech Blog

This directory contains markdown posts and a static site generator for a Spark Arena-themed tech blog.

## Structure

- `index.md`: landing content for the blog home page
- `*/**.md`: post content files
- `scripts/build.mjs`: markdown -> static HTML builder
- `dist/`: generated static site output (deploy this)
- `worker.js`: Cloudflare Worker entrypoint
- `wrangler.toml`: Worker + assets config

## Build Static HTML

From repo root:

```bash
npm run blog:build
```

This generates:

- `blog/dist/index.html`
- `blog/dist/posts/<slug>/index.html`

## Deploy to Cloudflare Worker

From `blog/`:

```bash
npx wrangler deploy
```

`wrangler.toml` is configured to serve static assets from `./dist` via the `ASSETS` binding.

## Notes

- Theme styling is aligned with Spark Arena visual direction (dark + NVIDIA green accents).
- Links in markdown render as external links by default.
