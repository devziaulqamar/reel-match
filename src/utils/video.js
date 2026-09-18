// Default download target resolution per orientation (HD)
export const DOWNLOAD_TARGETS = {
  portrait: { width: 720, height: 1280 },
  landscape: { width: 1280, height: 720 },
};
export const DEFAULT_DOWNLOAD = DOWNLOAD_TARGETS.portrait;
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

// Prefer the exact target resolution, otherwise the closest match to it.
export function pickDefaultFile(files, target = DEFAULT_DOWNLOAD) {
  const exact = files.find(
    (f) => f.width === target.width && f.height === target.height
  );
  if (exact) return exact;

  return files.reduce((best, f) => {
    const score = Math.abs(f.width - target.width) + Math.abs(f.height - target.height);
    const bestScore =
      Math.abs(best.width - target.width) + Math.abs(best.height - target.height);
    return score < bestScore ? f : best;
  }, files[0]);
}
