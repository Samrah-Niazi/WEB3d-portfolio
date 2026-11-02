export type Chunk = { id: string; title: string; section: string; text: string };

const MAX_CHARS = 700;
const OVERLAP = 100;

// Split a long body into pieces of at most MAX_CHARS, breaking on sentence/line boundaries.
function splitBody(body: string): string[] {
  if (body.length <= MAX_CHARS) return [body];
  const pieces: string[] = [];
  let start = 0;
  while (start < body.length) {
    let end = Math.min(start + MAX_CHARS, body.length);
    if (end < body.length) {
      const cut = Math.max(body.lastIndexOf(". ", end), body.lastIndexOf("\n", end));
      if (cut > start + MAX_CHARS / 2) end = cut + 1;
    }
    pieces.push(body.slice(start, end).trim());
    if (end >= body.length) break;
    start = Math.max(end - OVERLAP, start + 1);
  }
  return pieces;
}

// Each "## Title" block is one topic; "@section x" names the portfolio section it links to.
export function chunkMarkdown(md: string, file: string): Chunk[] {
  const blocks = md.split(/^## /m).slice(1);
  const chunks: Chunk[] = [];
  blocks.forEach((block, bi) => {
    const [titleLine, ...rest] = block.split("\n");
    const title = titleLine.trim();
    let section = "about";
    const body = rest
      .filter((l) => {
        const m = l.match(/^@section\s+(\w+)/);
        if (m) section = m[1];
        return !m;
      })
      .join("\n")
      .trim();
    splitBody(body).forEach((piece, pi) => {
      chunks.push({ id: `${file}#${bi}.${pi}`, title, section, text: `${title}\n${piece}` });
    });
  });
  return chunks;
}
