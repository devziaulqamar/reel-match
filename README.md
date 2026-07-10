# ClipForge — Keyword Video Finder

Paste a list of keywords, get a matching portrait stock video for each one via the [Pexels API](https://www.pexels.com/api/), preview it, pick a resolution, and download.

## Local development

```bash
npm install
```

Create `.env` (see `.env.example`):

```
PEXELS_API_KEY=your_key_here
```

The frontend calls `/api/videos`, a serverless function ([api/videos.js](api/videos.js)) that holds the Pexels key server-side — it never reaches the browser. Because of that, `npm run dev` alone won't serve `/api/*`. To run the full app locally, use the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npx vercel dev
```

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel (framework preset "Vite" is auto-detected), or run `npx vercel` from the project root.
2. In the Vercel project's **Settings → Environment Variables**, add `PEXELS_API_KEY` with your real key. Do not prefix it with `VITE_` — that would bundle it into the client-side JS.
3. Deploy. Vercel builds the Vite app (`dist/`) and picks up `api/videos.js` as a serverless function automatically.

## Scripts

- `npm run dev` — Vite dev server (frontend only, see note above)
- `npm run build` — production build to `dist/`
- `npm run lint` — ESLint
- `npm run preview` — preview the production build locally
