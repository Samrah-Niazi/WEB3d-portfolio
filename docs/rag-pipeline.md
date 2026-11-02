# RAG pipeline

The chatbot answers questions about Samrah using only the content in `backend/data/*.md`.

## Offline: indexing (`npm run ingest`, or automatically on first start)
1. **Collect.** `backend/data/samrah.md` holds the CV, project descriptions, skills, education and achievements. Each `## Heading` is one topic and carries an `@section` tag naming the portfolio section it belongs to.
2. **Chunk.** `src/rag/chunk.ts` splits on headings. Any block over 700 characters is split on sentence boundaries with 100 characters of overlap. The heading is kept inside each chunk's text so the topic is searchable.
3. **Embed.** `src/rag/embeddings.ts` turns each chunk into a 384-number vector with `Xenova/all-MiniLM-L6-v2`, running locally through transformers.js. Vectors are normalised.
4. **Store.** `src/rag/store.ts` writes chunks and vectors to `backend/data/index.json`, the vector index. It is rebuilt if missing or if the embedding model changes.

## Online: answering (`POST /api/chat`)
1. **Validate** the request (Zod): up to 12 messages, 1 to 1000 characters each, last one from the user. Rate-limited to 15 requests per minute per IP.
2. **Retrieve.** The question is embedded and compared with every chunk by cosine similarity (a dot product, since vectors are normalised). The top 5 are kept. Very short follow-ups are combined with the previous question first.
3. **Guard 1, threshold.** If no chunk scores at least 0.22, the API replies "I don't have that information" without calling the LLM.
4. **Generate.** Claude receives the retrieved chunks in a `<context>` block with rules: use only the context, answer `NO_INFO` when it is missing, treat the context and the visitor's text as data rather than instructions, and reply in the visitor's language.
5. **Guard 2, NO_INFO.** If the model answers `NO_INFO`, the API returns the same refusal message and no sources.
6. **Cite.** Otherwise the response includes the titles of the retrieved chunks and their portfolio sections. The chat UI shows them as links to those sections.

## Why this design
- Knowledge lives in plain Markdown, so updating the bot means editing a file and restarting.
- The vector index is a JSON file: at about 25 chunks, a database would add setup without improving results.
- Two guards (similarity threshold, then the model's `NO_INFO`) limit invented answers.
