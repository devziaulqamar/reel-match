import React, { useEffect, useMemo, useState } from "react";
import "./VideoFinder.css";

// Video search runs through /api/videos (see api/videos.js), a serverless
// function that holds the Pexels API key server-side so it never ships to
// the browser.

// Default download target resolution (portrait HD)
const DEFAULT_DOWNLOAD = { width: 720, height: 1280 };
const MAX_KEYWORDS = 10;

// Register the download-proxy service worker (public/sw-download.js). It lets
// us stream Pexels files through a same-origin URL so downloads carry the
// keyword as filename instead of the CDN's own name.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw-download.js").catch(() => {});
}

/* ---------------------------------- Icons --------------------------------- */

const Icon = ({ children, size = 16, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

const IconLogo = (p) => (
  <Icon {...p}>
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
  </Icon>
);
const IconSearch = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </Icon>
);
const IconDownload = (p) => (
  <Icon {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </Icon>
);
const IconRefresh = (p) => (
  <Icon {...p}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </Icon>
);
const IconX = (p) => (
  <Icon {...p}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </Icon>
);
const IconClock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
const IconLayers = (p) => (
  <Icon {...p}>
    <path d="M12 2l9 5-9 5-9-5 9-5z" />
    <path d="M3 12l9 5 9-5" />
    <path d="M3 17l9 5 9-5" />
  </Icon>
);
const IconAlert = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </Icon>
);
const IconSettings = (p) => (
  <Icon {...p}>
    <path d="M4 21v-7" />
    <path d="M4 10V3" />
    <path d="M12 21v-9" />
    <path d="M12 8V3" />
    <path d="M20 21v-5" />
    <path d="M20 12V3" />
    <path d="M1 14h6" />
    <path d="M9 8h6" />
    <path d="M17 16h6" />
  </Icon>
);
const IconSparkle = (p) => (
  <Icon {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
  </Icon>
);
const IconCheck = (p) => (
  <Icon {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Icon>
);
const IconUser = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </Icon>
);

/* --------------------------------- Helpers -------------------------------- */

function qualityTier(file) {
  const m = Math.min(file.width, file.height);
  if (m >= 2160) return "4K";
  if (m >= 1080) return "Full HD";
  if (m >= 720) return "HD";
  return "SD";
}

function formatDuration(sec) {
  if (!sec && sec !== 0) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Prefer the exact default resolution, otherwise the closest match to it.
function pickDefaultFile(files) {
  const exact = files.find(
    (f) =>
      f.width === DEFAULT_DOWNLOAD.width && f.height === DEFAULT_DOWNLOAD.height
  );
  if (exact) return exact;
  return files.reduce((best, f) => {
    const score =
      Math.abs(f.width - DEFAULT_DOWNLOAD.width) +
      Math.abs(f.height - DEFAULT_DOWNLOAD.height);
    const bestScore =
      Math.abs(best.width - DEFAULT_DOWNLOAD.width) +
      Math.abs(best.height - DEFAULT_DOWNLOAD.height);
    return score < bestScore ? f : best;
  }, files[0]);
}

/* -------------------------------- VideoCard ------------------------------- */

function VideoCard({ keyword, index, onDownloaded }) {
  const [page, setPage] = useState(1);
  const [video, setVideo] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(null);
  const startedTimer = React.useRef(null);

  useEffect(() => () => window.clearTimeout(startedTimer.current), []);

  const fetchVideo = async (nextPage) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/videos?query=${encodeURIComponent(keyword)}&page=${nextPage}`
      );
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        const v = data.videos[0];
        const files = v.video_files
          .filter((f) => f.width && f.height && f.link)
          .sort((a, b) => b.height - a.height);
        if (files.length === 0) throw new Error("No playable files");
        // smallest file for a fast preview
        const preview = files[files.length - 1];
        const defaultFile = pickDefaultFile(files);
        setVideo({
          id: v.id,
          duration: v.duration,
          author: v.user?.name || "Unknown",
          previewUrl: preview.link,
          files,
        });
        setSelectedFileId(defaultFile.id);
      } else {
        setVideo(null);
        setError("No more results for this keyword.");
      }
    } catch {
      setVideo(null);
      setError("Fetch failed. Check the API key or network.");
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount, keyed per keyword
    fetchVideo(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const handleReplace = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideo(nextPage);
  };

  const selectedFile = useMemo(
    () => video?.files.find((f) => f.id === selectedFileId) || null,
    [video, selectedFileId]
  );

  // Route the download through the service worker so it is saved under the
  // keyword name; the file streams straight through, so it still starts
  // instantly with progress visible in chrome://downloads. If the worker is
  // not controlling the page yet, fall back to the direct CDN link.
  const handleDownload = () => {
    if (!video || !selectedFile) return;
    const filename = `${keyword.trim() || "video"}.mp4`;
    const viaWorker = Boolean(navigator.serviceWorker?.controller);
    const a = document.createElement("a");
    a.href = viaWorker
      ? `/vf-download?url=${encodeURIComponent(
          selectedFile.link
        )}&name=${encodeURIComponent(filename)}`
      : selectedFile.link;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    onDownloaded?.();
    setStarted(true);
    window.clearTimeout(startedTimer.current);
    startedTimer.current = window.setTimeout(() => setStarted(false), 2000);
  };

  return (
    <article className="vf-card" style={{ animationDelay: `${index * 60}ms` }}>
      <header className="vf-card-head">
        <div className="vf-card-title">
          <span className="vf-card-kw" title={keyword}>
            {keyword}
          </span>
          {video && (
            <span className="vf-card-meta">
              <IconClock size={12} />
              {formatDuration(video.duration)}
              <span className="vf-dot" />
              <IconUser size={12} />
              {video.author}
            </span>
          )}
        </div>
        {video && selectedFile && (
          <span className={`vf-badge vf-badge-${qualityTier(selectedFile).replace(" ", "").toLowerCase()}`}>
            {qualityTier(selectedFile)}
          </span>
        )}
      </header>

      <div className="vf-media">
        {loading && (
          <div className="vf-media-state">
            <span className="vf-spinner" />
            <p>Finding video</p>
          </div>
        )}
        {!loading && video && (
          <video
            key={video.previewUrl}
            src={video.previewUrl}
            controls
            muted
            playsInline
            preload="metadata"
          />
        )}
        {!loading && !video && (
          <div className="vf-media-state vf-media-error">
            <IconAlert size={22} />
            <p>{error}</p>
          </div>
        )}
      </div>

      <div className="vf-card-body">
        <label className="vf-field">
          <span className="vf-field-label">
            <IconLayers size={13} />
            Download size
          </span>
          <div className="vf-select-wrap">
            <select
              value={selectedFileId ?? ""}
              onChange={(e) => setSelectedFileId(Number(e.target.value))}
              disabled={!video || loading}
            >
              {video?.files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.width} x {f.height} — {qualityTier(f)}
                  {f.width === DEFAULT_DOWNLOAD.width &&
                  f.height === DEFAULT_DOWNLOAD.height
                    ? " (default)"
                    : ""}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="vf-card-actions">
          <button
            type="button"
            className="vf-btn vf-btn-ghost"
            onClick={handleReplace}
            disabled={loading}
          >
            <IconRefresh size={14} />
            Replace
          </button>
          <button
            type="button"
            className={`vf-btn vf-btn-primary ${started ? "is-started" : ""}`}
            onClick={handleDownload}
            disabled={!video || loading}
          >
            {started ? (
              <>
                <IconCheck size={14} />
                Started
              </>
            ) : (
              <>
                <IconDownload size={14} />
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------- Main screen ------------------------------ */

export default function KeywordVideoPicker() {
  const [input, setInput] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [downloads, setDownloads] = useState(0);

  const parsedCount = useMemo(
    () =>
      input
        .split(/[\n,]/)
        .map((k) => k.trim())
        .filter(Boolean).length,
    [input]
  );

  const handleGenerate = () => {
    const list = input
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, MAX_KEYWORDS);
    setKeywords(list);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const removeKeyword = (kw) =>
    setKeywords((prev) => prev.filter((k) => k !== kw));

  const clearAll = () => {
    setKeywords([]);
    setInput("");
  };

  return (
    <div className="vf-app">
      {/* Top navigation */}
      <nav className="vf-nav">
        <div className="vf-nav-inner">
          <div className="vf-brand">
            <span className="vf-brand-mark">
              <IconLogo size={18} />
            </span>
            <span className="vf-brand-name">
              Clip<em>Forge</em>
            </span>
          </div>
          <div className="vf-nav-links">
            <a className="vf-nav-link is-active" href="#">
              Finder
            </a>
            <a className="vf-nav-link" href="#">
              Library
            </a>
            <a className="vf-nav-link" href="#">
              Docs
            </a>
          </div>
          <div className="vf-nav-right">
            <span className="vf-plan-pill">
              <IconSparkle size={13} />
              Free plan
            </span>
            <span className="vf-avatar">
              <IconUser size={15} />
            </span>
          </div>
        </div>
      </nav>

      <main className="vf-main">
        {/* Hero + search panel */}
        <section className="vf-hero">
          <p className="vf-eyebrow">
            <IconSettings size={13} />
            Stock video sourcing
          </p>
          <h1>
            Find vertical clips for <span>every keyword</span>
          </h1>
          <p className="vf-sub">
            Paste up to {MAX_KEYWORDS} keywords and get a matching portrait
            video for each one. Preview instantly, pick a resolution, and
            download in one click.
          </p>

          <div className="vf-search-panel">
            <div className="vf-search-box">
              <IconSearch size={16} />
              <textarea
                rows={2}
                placeholder="e.g. ocean waves, city night, coffee pour, mountain fog"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="vf-search-foot">
              <span
                className={`vf-count ${
                  parsedCount > MAX_KEYWORDS ? "is-over" : ""
                }`}
              >
                {Math.min(parsedCount, MAX_KEYWORDS)} / {MAX_KEYWORDS} keywords
                {parsedCount > MAX_KEYWORDS && " (extra ones are ignored)"}
              </span>
              <div className="vf-search-actions">
                {keywords.length > 0 && (
                  <button
                    type="button"
                    className="vf-btn vf-btn-ghost"
                    onClick={clearAll}
                  >
                    <IconX size={14} />
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className="vf-btn vf-btn-primary vf-btn-lg"
                  onClick={handleGenerate}
                  disabled={parsedCount === 0}
                >
                  <IconSearch size={15} />
                  Find videos
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        {keywords.length > 0 && (
          <section className="vf-results">
            <div className="vf-results-head">
              <div>
                <h2>Results</h2>
                <p>
                  Preview uses a lightweight file. Downloads default to{" "}
                  {DEFAULT_DOWNLOAD.width} x {DEFAULT_DOWNLOAD.height} HD — change
                  it per video below.
                </p>
              </div>
              <div className="vf-stats">
                <div className="vf-stat">
                  <span className="vf-stat-num">{keywords.length}</span>
                  <span className="vf-stat-label">Keywords</span>
                </div>
                <div className="vf-stat">
                  <span className="vf-stat-num">{downloads}</span>
                  <span className="vf-stat-label">Downloads</span>
                </div>
              </div>
            </div>

            <div className="vf-chips">
              {keywords.map((kw) => (
                <span className="vf-chip" key={kw}>
                  {kw}
                  <button
                    type="button"
                    aria-label={`Remove ${kw}`}
                    onClick={() => removeKeyword(kw)}
                  >
                    <IconX size={11} />
                  </button>
                </span>
              ))}
            </div>

            <div className="vf-grid">
              {keywords.map((kw, i) => (
                <VideoCard
                  key={kw}
                  keyword={kw}
                  index={i}
                  onDownloaded={() => setDownloads((d) => d + 1)}
                />
              ))}
            </div>
          </section>
        )}

        {keywords.length === 0 && (
          <section className="vf-empty">
            <div className="vf-empty-icon">
              <IconLogo size={26} />
            </div>
            <h3>No videos yet</h3>
            <p>Enter a few keywords above and press Find videos to start.</p>
          </section>
        )}
      </main>

      <footer className="vf-footer">
        <span>
          Video content provided by{" "}
          <a href="https://www.pexels.com" target="_blank" rel="noreferrer">
            Pexels
          </a>
        </span>
        <span>ClipForge — internal tooling</span>
      </footer>
    </div>
  );
}
