/**
 * Split long text into overlapping chunks so retrieval stays precise.
 * Short texts pass through untouched.
 */
export function chunkText(text, { maxChars = 900, overlap = 150 } = {}) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return [clean];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + maxChars, clean.length);

    // try to break at a sentence boundary
    if (end < clean.length) {
      const lastPeriod = clean.lastIndexOf(". ", end);
      if (lastPeriod > start + maxChars * 0.5) end = lastPeriod + 1;
    }

    chunks.push(clean.slice(start, end).trim());

    if (end >= clean.length) break;          // ← fix: stop at the end
    start = Math.max(end - overlap, start + 1); // ← fix: always move forward
  }
  return chunks;
}