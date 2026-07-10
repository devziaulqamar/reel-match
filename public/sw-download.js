/* Download proxy service worker.
   Streams a Pexels video through a same-origin URL so the browser accepts
   our filename (cross-origin downloads always use the server's name).
   The response body is piped straight through, so the download starts
   instantly and shows normal progress in the browser's download manager. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const ALLOWED_HOSTS = new Set(["videos.pexels.com", "images.pexels.com"]);

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname !== "/vf-download") {
    return; // not ours — let the network handle it
  }

  event.respondWith(
    (async () => {
      const target = url.searchParams.get("url");
      const name = (url.searchParams.get("name") || "video.mp4").replace(/["\\]/g, "");

      let targetUrl;
      try {
        targetUrl = new URL(target);
      } catch {
        return new Response("Bad target URL", { status: 400 });
      }
      if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
        return new Response("Host not allowed", { status: 403 });
      }

      const upstream = await fetch(targetUrl.href);
      if (!upstream.ok || !upstream.body) {
        return new Response("Upstream fetch failed", { status: 502 });
      }

      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "video/mp4");
      headers.set(
        "Content-Disposition",
        `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`
      );
      const length = upstream.headers.get("Content-Length");
      if (length) headers.set("Content-Length", length); // enables % progress

      return new Response(upstream.body, { status: 200, headers });
    })()
  );
});
