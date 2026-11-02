import { pipeline } from "@huggingface/transformers";

export const EMBED_MODEL = process.env.EMBED_MODEL ?? "Xenova/all-MiniLM-L6-v2";

type Extractor = (
  input: string[],
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

let extractor: Promise<Extractor> | null = null;

function load(): Promise<Extractor> {
  extractor ??= pipeline("feature-extraction", EMBED_MODEL) as unknown as Promise<Extractor>;
  return extractor;
}

// Returns L2-normalised vectors, so cosine similarity is a plain dot product.
export async function embed(texts: string[]): Promise<number[][]> {
  const ex = await load();
  const out = await ex(texts, { pooling: "mean", normalize: true });
  return out.tolist();
}

export const warmUp = () => load().then(() => undefined);
