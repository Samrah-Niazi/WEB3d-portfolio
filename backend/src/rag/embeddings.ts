// Hosted builds (Vercel) embed through Google's Gemini API free tier; local development falls back to a MiniLM model run in-process.
const GEMINI_MODEL = "gemini-embedding-001";
export const EMBED_MODEL = process.env.GEMINI_API_KEY ? GEMINI_MODEL : (process.env.EMBED_MODEL ?? "Xenova/all-MiniLM-L6-v2");

type Extractor = (
  input: string[],
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

let extractor: Promise<Extractor> | null = null;

function load(): Promise<Extractor> {
  // Imported by a variable name so bundlers leave the large local model runtime out of the hosted build.
  const pkg = "@huggingface/transformers";
  extractor ??= import(pkg).then((m) => m.pipeline("feature-extraction", EMBED_MODEL) as unknown as Extractor);
  return extractor;
}

// "passage" is for the documents stored in the index, "query" for the visitor's question: Gemini embeds the two differently.
export type EmbedKind = "passage" | "query";

const normalise = (v: number[]) => {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
};

async function embedRemote(texts: string[], kind: EmbedKind): Promise<number[][]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:batchEmbedContents`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${GEMINI_MODEL}`,
        content: { parts: [{ text }] },
        taskType: kind === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
        outputDimensionality: 768,
      })),
    }),
  });
  if (!res.ok) throw new Error(`Embedding service responded ${res.status}`);
  const body = (await res.json()) as { embeddings: { values: number[] }[] };
  return body.embeddings.map((e) => normalise(e.values));
}

// Returns L2-normalised vectors, so cosine similarity is a plain dot product.
export async function embed(texts: string[], kind: EmbedKind = "passage"): Promise<number[][]> {
  if (process.env.GEMINI_API_KEY) return embedRemote(texts, kind);
  const ex = await load();
  const out = await ex(texts, { pooling: "mean", normalize: true });
  return out.tolist();
}

export const warmUp = () => (process.env.GEMINI_API_KEY ? Promise.resolve() : load().then(() => undefined));
