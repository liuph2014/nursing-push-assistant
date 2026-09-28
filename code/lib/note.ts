export function noteImages(mediaType: string, mediaUrl: string): string[] {
  if (mediaType === "audio" || mediaType === "video") return [];
  const raw = (mediaUrl || "").trim();
  if (!raw) return [];
  // 纯文字笔记不应带图；若误存了 URL 也忽略
  if (mediaType === "text" && !raw.startsWith("[") && !raw.startsWith("data:") && !raw.startsWith("/covers/")) {
    return [];
  }
  if (raw.startsWith("[")) {
    try {
      const arr = JSON.parse(raw) as unknown;
      return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string" && Boolean(u)) : [];
    } catch {
      return [];
    }
  }
  if (raw.startsWith("http") || raw.startsWith("/") || raw.startsWith("data:")) return [raw];
  return [];
}

export function isImageNote(mediaType: string, mediaUrl: string) {
  return noteImages(mediaType, mediaUrl).length > 0;
}

export function encodeNoteImages(urls: string[]) {
  if (urls.length <= 1) return urls[0] ?? "";
  return JSON.stringify(urls);
}
