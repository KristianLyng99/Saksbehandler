# CaseManagerDashboard

## Building for GitHub Pages

Use the client-only build when preparing a static Pages deployment. The build now also writes a `404.html` copy of the SPA entry
point so client-side routes keep working on GitHub Pages:

```bash
npm run build:client
```

If you want to host the generated assets from a `/docs` directory (for example when using GitHub Pages with the `docs/` folder option), mirror the `dist/public` output after the client build (including the `404.html` fallback):

```bash
npm run prepare:pages
```

This flow produces a static client-only bundle tailored for GitHub Pages while preserving the structure of the Vite-generated `dist/public` assets.

## Deploying to GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds the client and publishes the `dist/public` bundle to GitHub Pages.

To deploy the real app instead of the README:

1. Go to **Settings → Pages** in GitHub and choose **GitHub Actions** as the source.
2. Push to `main` (or click **Run workflow** on the `Deploy static client to GitHub Pages` workflow) so the action builds and uploads `dist/public`.
3. Wait for the **Deploy to GitHub Pages** job to finish; Pages will then serve the built SPA files (including the `404.html` fallback) instead of the repository markdown.

If you still see the README, it means the workflow artifact has not been published yet—rerun the workflow or check the Actions tab for failures.
