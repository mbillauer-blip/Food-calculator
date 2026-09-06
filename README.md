# Party Food Calculator

A single-page React app that calculates how much protein, sides, and carbs to
buy for a party based on guest count and menu. No backend — everything runs
client-side.

## Development

```bash
npm install
npm run dev
```

## Project structure

- `src/lib/foodMath.js` — all portion-sizing config and calculation logic.
  Baseline gram/unit/rib amounts and keyword lists live in the `CONFIG`
  object at the top, kept separate from the logic so they're easy to tune.
- `src/pages/CalculatorPage.jsx` — the calculator UI.
- `src/pages/BlogIndex.jsx`, `src/pages/BlogPost.jsx` — the blog.
- `src/content/posts/*.md` — blog posts. Each file needs a frontmatter block:

  ```md
  ---
  title: Post Title
  description: One-sentence summary, used as the meta description.
  date: 2026-01-15
  ---

  Markdown body here.
  ```

  Adding a new `.md` file here automatically adds it to the blog index, the
  `/blog/<filename-without-extension>` route, and `sitemap.xml`.

## Deploying to GitHub Pages

The repo is configured to deploy automatically via GitHub Actions
(`.github/workflows/deploy.yml`) on every push to the branch it's currently
tracking. One-time setup on GitHub:

1. Go to **Settings → Pages** on the repo.
2. Under **Build and deployment → Source**, select **GitHub Actions**.

After that, every push triggers a build and publishes `dist/` (including the
generated `sitemap.xml` and `robots.txt`) to
`https://mbillauer-blip.github.io/Food-calculator/`.

If the branch this workflow watches ever changes (e.g. after merging into
`main`), update the `branches:` list in `.github/workflows/deploy.yml` and the
`base` path in `vite.config.js` only needs to change if the repo itself is
renamed.

### Manual build

```bash
npm run build
```

Outputs to `dist/`, including a generated `sitemap.xml` (see
`scripts/generate-sitemap.mjs`).
