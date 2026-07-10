// Default download target resolution (portrait HD)
export const DEFAULT_DOWNLOAD = { width: 720, height: 1280 };
export const MAX_KEYWORDS = 10;

export function qualityTier(file) {
  const shortSide = Math.min(file.width, file.height);
  if (shortSide >= 2160) return "4K";
  if (shortSide >= 1080) return "Full HD";
  if (shortSide >= 720) return "HD";
  return "SD";
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

// Prefer the exact default resolution, otherwise the closest match to it.
export function pickDefaultFile(files) {
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
