import { useEffect, useMemo, useState } from "react";
import "./ReelMatch.css";
import VideoCard from "./components/VideoCard.jsx";
import {
  Moon,
  RectangleHorizontal,
  RectangleVertical,
  Search,
  SlidersVertical,
  SquarePlay,
  Sun,
  X,
} from "lucide-react";
import { MAX_KEYWORDS, DOWNLOAD_TARGETS } from "./utils/video.js";

function getInitialTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

// Register the download-proxy service worker (public/sw-download.js). It lets
// us stream Pexels files through a same-origin URL so downloads carry the
// keyword as filename instead of the CDN's own name.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw-download.js").catch(() => {});
}

export default function ReelMatch() {
  const [input, setInput] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [downloads, setDownloads] = useState(0);
  const [theme, setTheme] = useState(getInitialTheme);
  const [orientation, setOrientation] = useState("portrait");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("rm-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

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
    <div className="rm-app">
      {/* Top navigation */}
      <nav className="rm-nav">
        <div className="rm-nav-inner">
          <div className="rm-brand">
            <span className="rm-brand-mark">
              <SquarePlay size={18} />
            </span>
            <span className="rm-brand-name">
              Reel<em>match</em>
            </span>
          </div>
          <div className="rm-nav-right">
            <button
              type="button"
              className="rm-theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="rm-main">
        {/* Hero + search panel */}
        <section className="rm-hero">
          <p className="rm-eyebrow">
            <SlidersVertical size={13} />
            Stock video sourcing
          </p>
          <h1>
            Find vertical clips for <span>every keyword</span>
          </h1>
          <p className="rm-sub">
            Paste up to {MAX_KEYWORDS} keywords and get a matching{" "}
            {orientation} video for each one. Preview instantly, pick a
            resolution, and download in one click.
          </p>

          <div className="rm-search-panel">
            <div className="rm-search-box">
              <Search size={16} />
              <textarea
                rows={2}
                placeholder="e.g. ocean waves, city night, coffee pour, mountain fog"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="rm-orientation-toggle" role="group" aria-label="Video orientation">
              <button
                type="button"
                className={`rm-orientation-btn ${
                  orientation === "portrait" ? "is-active" : ""
                }`}
                onClick={() => setOrientation("portrait")}
              >
                <RectangleVertical size={14} />
                Portrait
              </button>
              <button
                type="button"
                className={`rm-orientation-btn ${
                  orientation === "landscape" ? "is-active" : ""
                }`}
                onClick={() => setOrientation("landscape")}
              >
                <RectangleHorizontal size={14} />
                Landscape
              </button>
            </div>
            <div className="rm-search-foot">
              <span
                className={`rm-count ${
                  parsedCount > MAX_KEYWORDS ? "is-over" : ""
                }`}
              >
                {Math.min(parsedCount, MAX_KEYWORDS)} / {MAX_KEYWORDS} keywords
                {parsedCount > MAX_KEYWORDS && " (extra ones are ignored)"}
              </span>
              <div className="rm-search-actions">
                {keywords.length > 0 && (
                  <button
                    type="button"
                    className="rm-btn rm-btn-ghost"
                    onClick={clearAll}
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className="rm-btn rm-btn-primary rm-btn-lg"
                  onClick={handleGenerate}
                  disabled={parsedCount === 0}
                >
                  <Search size={15} />
                  Find videos
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        {keywords.length > 0 && (
          <section className="rm-results">
            <div className="rm-results-head">
              <div>
                <h2>Results</h2>
                <p>
                  Preview uses a lightweight file. Downloads default to{" "}
                  {DOWNLOAD_TARGETS[orientation].width} x{" "}
                  {DOWNLOAD_TARGETS[orientation].height} HD — change it per
                  video below.
                </p>
              </div>
              <div className="rm-stats">
                <div className="rm-stat">
                  <span className="rm-stat-num">{keywords.length}</span>
                  <span className="rm-stat-label">Keywords</span>
                </div>
                <div className="rm-stat">
                  <span className="rm-stat-num">{downloads}</span>
                  <span className="rm-stat-label">Downloads</span>
                </div>
              </div>
            </div>

            <div className="rm-chips">
              {keywords.map((kw) => (
                <span className="rm-chip" key={kw}>
                  {kw}
                  <button
                    type="button"
                    aria-label={`Remove ${kw}`}
                    onClick={() => removeKeyword(kw)}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>

            <div className="rm-grid">
              {keywords.map((kw, i) => (
                <VideoCard
                  key={kw}
                  keyword={kw}
                  index={i}
                  orientation={orientation}
                  onDownloaded={() => setDownloads((d) => d + 1)}
                />
              ))}
            </div>
          </section>
        )}

        {keywords.length === 0 && (
          <section className="rm-empty">
            <div className="rm-empty-icon">
              <SquarePlay size={26} />
            </div>
            <h3>No videos yet</h3>
            <p>Enter a few keywords above and press Find videos to start.</p>
          </section>
        )}
      </main>

      <footer className="rm-footer">
        <span>
          Video content provided by{" "}
          <a href="https://www.pexels.com" target="_blank" rel="noreferrer">
            Pexels
          </a>
        </span>
        <span>Reelmatch</span>
      </footer>
    </div>
  );
}
