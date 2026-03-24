# Synchronized Browser Preview (GitHub Pages)

If localhost is not possible, use this hosted preview workflow.

## What it gives you

- A stable browser URL always showing latest `main`
- Auto-deploy on each push to `main`
- No local runtime required

## One-time setup

1. Push this repository to GitHub (main branch).
2. Open repository **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open **Actions** tab and run workflow **Deploy UI Preview to GitHub Pages** once.

## URL

After first successful run, your page URL will be:

`https://<your-username>.github.io/<repo-name>/`

For this repo likely:

`https://mo89agent.github.io/business1_assetcompass/`

## What is hosted

- `/` → standalone preview (`UI_PREVIEW_STANDALONE.html`)
- `/prototype/` → browser prototype
- `/testdata/sample_portfolio.csv` → test upload file

## Notes

- This hosts static UI only (frontend preview).
- Backend APIs (`localhost:9000`) are not hosted by this workflow.
- For full backend-online demo, deploy backend separately (e.g., Render/Railway/Fly).
