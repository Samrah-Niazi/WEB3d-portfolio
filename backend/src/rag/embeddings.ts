export const EMBED_MODEL = process.env.EMBED_MODEL ?? "Xenova/all-MiniLM-L6-v2";

// The same MiniLM weights, served by Hugging Face's free Inference API, for hosts too small to run the model themselves.
const REMOTE_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

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

const normalise = (v: number[]) => {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
};

async function embedRemote(texts: string[]): Promise<number[][]> {
  const res = await fetch(REMOTE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.HF_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  });
  if (!res.ok) throw new Error(`Embedding service responded ${res.status}`);
  return ((await res.json()) as number[][]).map(normalise);
}

// Returns L2-normalised vectors, so cosine similarity is a plain dot product.
export async function embed(texts: string[]): Promise<number[][]> {
  if (process.env.HF_TOKEN) return embedRemote(texts);
  const ex = await load();
  const out = await ex(texts, { pooling: "mean", normalize: true });
  return out.tolist();
}

export const warmUp = () => (process.env.HF_TOKEN ? Promise.resolve() : load().then(() => undefined));
