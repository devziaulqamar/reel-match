// Vercel serverless function: proxies Pexels video search so the API key
// never reaches the browser. Deployed automatically from /api on Vercel.

export default async function handler(req, res) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfigured: missing PEXELS_API_KEY" });
    return;
  }

  const { query, page = "1", orientation = "portrait" } = req.query;
  if (!query || Array.isArray(query)) {
    res.status(400).json({ error: "Missing query parameter" });
    return;
  }
  const safeOrientation = ["portrait", "landscape", "square"].includes(orientation)
    ? orientation
    : "portrait";

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(
    query
  )}&orientation=${safeOrientation}&per_page=1&page=${encodeURIComponent(page)}`;

  try {
    const upstream = await fetch(url, { headers: { Authorization: apiKey } });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch {
    res.status(502).json({ error: "Upstream fetch failed" });
  }
}
