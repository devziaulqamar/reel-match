import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleAlert,
  Check,
  Clock,
  Download,
  Layers,
  RefreshCw,
  User,
} from "lucide-react";
import {
  DEFAULT_DOWNLOAD,
  formatDuration,
  pickDefaultFile,
  qualityTier,
} from "../utils/video.js";

export default function VideoCard({ keyword, index, onDownloaded }) {
  const [page, setPage] = useState(1);
  const [video, setVideo] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(null);
  const startedTimer = useRef(null);

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
      ? `/rm-download?url=${encodeURIComponent(
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
    <article className="rm-card" style={{ animationDelay: `${index * 60}ms` }}>
      <header className="rm-card-head">
        <div className="rm-card-title">
          <span className="rm-card-kw" title={keyword}>
            {keyword}
          </span>
          {video && (
            <span className="rm-card-meta">
              <Clock size={12} />
              {formatDuration(video.duration)}
              <span className="rm-dot" />
              <User size={12} />
              {video.author}
            </span>
          )}
        </div>
        {video && selectedFile && (
          <span className={`rm-badge rm-badge-${qualityTier(selectedFile).replace(" ", "").toLowerCase()}`}>
            {qualityTier(selectedFile)}
          </span>
        )}
      </header>

      <div className="rm-media">
        {loading && (
          <div className="rm-media-state">
            <span className="rm-spinner" />
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
          <div className="rm-media-state rm-media-error">
            <CircleAlert size={22} />
            <p>{error}</p>
          </div>
        )}
      </div>

      <div className="rm-card-body">
        <label className="rm-field">
          <span className="rm-field-label">
            <Layers size={13} />
            Download size
          </span>
          <div className="rm-select-wrap">
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

        <div className="rm-card-actions">
          <button
            type="button"
            className="rm-btn rm-btn-ghost"
            onClick={handleReplace}
            disabled={loading}
          >
            <RefreshCw size={14} />
            Replace
          </button>
          <button
            type="button"
            className={`rm-btn rm-btn-primary ${started ? "is-started" : ""}`}
            onClick={handleDownload}
            disabled={!video || loading}
          >
            {started ? (
              <>
                <Check size={14} />
                Started
              </>
            ) : (
              <>
                <Download size={14} />
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
