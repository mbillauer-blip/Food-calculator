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

## Ads (Google AdSense)

The site is wired up for AdSense but ships with no ads until you configure
it — `<AdSlot>` renders nothing when unconfigured, so nothing breaks in the
meantime.

1. Get the site live on GitHub Pages first (see above) — AdSense needs a
   real URL to review.
2. Sign up at [adsense.google.com](https://www.google.com/adsense/) and add
   `https://mbillauer-blip.github.io/Food-calculator/` as your site.
3. A privacy policy is already in place at `/privacy`
   (`src/pages/PrivacyPolicy.jsx`) — AdSense requires one before approving a
   site. Read it over and adjust if your setup changes (e.g. if you add
   analytics).
4. Once approved, Google gives you a publisher ID (`ca-pub-...`) and you
   create individual ad units in their dashboard, each with its own slot ID.
5. Fill both into `src/lib/adsConfig.js`, and uncomment the AdSense
   `<script>` tag in `index.html` (replace the placeholder client ID there
   too).
6. Commit and push — the two `<AdSlot>` placements (below the calculator
   results, below each blog post) will start serving ads.

Approval can take anywhere from a day to a few weeks, and AdSense generally
wants to see a live site with real content (the blog helps here) rather than
just a bare tool page.
