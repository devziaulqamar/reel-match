# Reelmatch — Keyword Video Finder

Paste a list of keywords, get a matching portrait stock video for each one via the [Pexels API](https://www.pexels.com/api/), preview it, pick a resolution, and download.

## Local development

```bash
npm install
```

Create `.env` (see `.env.example`):

```
PEXELS_API_KEY=your_key_here
```

```bash
npm run dev
```

The frontend calls `/api/videos`, which holds the Pexels key server-side so it never reaches the browser. In production this runs as a Vercel serverless function ([api/videos.js](api/videos.js)); in local dev, [vite.config.js](vite.config.js) runs that same function inside a Vite middleware, so `npm run dev` alone is enough — no Vercel CLI needed.

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel (framework preset "Vite" is auto-detected), or run `npx vercel` from the project root.
2. In the Vercel project's **Settings → Environment Variables**, add `PEXELS_API_KEY` with your real key. Do not prefix it with `VITE_` — that would bundle it into the client-side JS.
3. Deploy. Vercel builds the Vite app (`dist/`) and picks up `api/videos.js` as a serverless function automatically.

## Project structure

```
api/videos.js             Serverless proxy — holds the Pexels key, forwards search requests
src/ReelMatch.jsx         Main screen: keyword input, results grid, theme toggle
src/components/VideoCard.jsx   Per-keyword video preview + download card
src/utils/video.js        Quality/duration formatting, default-file selection
public/sw-download.js     Service worker that streams downloads under the keyword filename
```

## Scripts

- `npm run dev` — Vite dev server, including the `/api/videos` proxy
- `npm run build` — production build to `dist/`
- `npm run lint` — ESLint
- `npm run preview` — preview the production build locally
