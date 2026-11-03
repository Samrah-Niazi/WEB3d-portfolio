// Entry point for the hosted build (Vercel): the Express app, with the saved vector index bundled in.
import indexJson from "../data/index.json" with { type: "json" };
import app from "./app.js";

(globalThis as { __RAG_INDEX__?: unknown }).__RAG_INDEX__ = indexJson;

export default app;
