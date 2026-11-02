import { readdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chunkMarkdown, type Chunk } from "./chunk.js";
import { embed, EMBED_MODEL } from "./embeddings.js";

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");
const INDEX_FILE = path.join(DATA_DIR, "index.json");

export type IndexedChunk = Chunk & { embedding: number[] };
type Index = { model: string; chunks: IndexedChunk[] };

let index: Index | null = null;

export async function buildIndex(): Promise<Index> {
  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".md"));
  const chunks: Chunk[] = [];
  for (const f of files) chunks.push(...chunkMarkdown(await readFile(path.join(DATA_DIR, f), "utf8"), f));

  const vectors: number[][] = [];
  for (let i = 0; i < chunks.length; i += 16) {
    vectors.push(...(await embed(chunks.slice(i, i + 16).map((c) => c.text))));
  }
  const built: Index = { model: EMBED_MODEL, chunks: chunks.map((c, i) => ({ ...c, embedding: vectors[i] })) };
  await writeFile(INDEX_FILE, JSON.stringify(built));
  return built;
}

// Load the saved index, or build it when missing or made with a different embedding model.
export async function loadIndex(): Promise<Index> {
  if (index) return index;
  try {
    await access(INDEX_FILE);
    const saved = JSON.parse(await readFile(INDEX_FILE, "utf8")) as Index;
    if (saved.model === EMBED_MODEL) return (index = saved);
  } catch {}
  return (index = await buildIndex());
}

export type Hit = { chunk: IndexedChunk; score: number };

export async function search(query: string, k = 4): Promise<Hit[]> {
  const { chunks } = await loadIndex();
  const [q] = await embed([query]);
  return chunks
    .map((chunk) => ({ chunk, score: chunk.embedding.reduce((s, v, i) => s + v * q[i], 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
