# StreamWrapped

StreamWrapped is a privacy-first dashboard for collecting and exploring a user's streaming watch history across platforms.

The first version is a static prototype that shows the core product direction:

- consolidated watch history across streaming services
- total screen time, session patterns, and most-watched platforms
- searchable viewing history
- platform coverage roadmap
- import-first data model that avoids storing streaming passwords

## Product Approach

The safest long-term approach is to support every platform through the least invasive method available:

1. Official export/import when a provider exposes account data downloads.
2. OAuth or official APIs where available.
3. User-assisted browser extension capture for platforms without exports, with clear consent and local processing.
4. Manual CSV/JSON import as a fallback.

The app should not ask users for streaming account passwords directly. If login is needed, it should happen inside the provider's own page or through a browser extension flow where credentials are never collected by StreamWrapped.

## Netflix Connector

The first connector uses Netflix's own viewing activity export instead of collecting credentials.

Flow:

1. The user opens Netflix Viewing Activity in their own browser session.
2. The user downloads the full viewing activity CSV from Netflix.
3. StreamWrapped reads the CSV locally in the browser with the `File` API.
4. The app normalizes rows into the shared history shape and immediately updates the report.
5. Nothing is uploaded or saved automatically.
6. The user can optionally download a local JSON snapshot.
7. The user can clear imported data from the tab memory.

Important limitation: Netflix viewing activity CSV exposes titles and watch dates. It does not provide exact watch duration per session, so StreamWrapped marks imported Netflix time as estimated when estimation is enabled.

Netflix CSV entries are treated as date-only records. The UI must not invent a viewing hour for them; exact late-night analysis is only possible for sources that provide timestamps.

The Netflix analytics view keeps large histories manageable with:

- date filters for a single day or custom range
- a compact day-by-day activity calendar
- longest viewing days
- likely binge sessions based on repeated series entries in a day or across consecutive days
- likely abandoned series based on older unfinished-looking series activity
- repeat watches with dates and gaps between sessions
- threshold moments such as heavy days, late-night sessions when time data exists, and long inactive gaps
- a one-screen social/share infographic generated from the current statistics
- capped history rendering with sorting and "load more"

## Initial Platform Targets

- Netflix
- Amazon Prime Video
- Max / HBO Max
- Disney+
- Canal+
- SkyShowtime
- Apple TV+
- YouTube
- Player / TVN
- Polsat Box Go

## Run The Prototype

Open `index.html` in a browser, or run a local server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

The repository is configured for GitHub Pages through `.github/workflows/pages.yml`.

Every push to `main` publishes the static site automatically. The workflow can also be started manually from the GitHub Actions tab.

After the GitHub repository exists, set Pages source to **GitHub Actions** in repository settings if GitHub does not enable it automatically after the first successful deployment.

## Next Build Steps

1. Add a normalized watch-history schema.
2. Build import adapters for downloadable platform files.
3. Add local-first storage with explicit user consent.
4. Add authentication only through provider-owned flows or a browser extension.
5. Replace sample data with imported user data.
