import app from "./app.js";
import { loadIndex } from "./rag/store.js";
import { warmUp } from "./rag/embeddings.js";

const PORT = Number(process.env.PORT ?? 5000);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  // Load the embedding model and vector index now so the first visitor doesn't wait.
  warmUp()
    .then(loadIndex)
    .then((i) => console.log(`RAG index ready (${i.chunks.length} chunks)`))
    .catch((e) => console.error("RAG warm-up failed:", e));
});
