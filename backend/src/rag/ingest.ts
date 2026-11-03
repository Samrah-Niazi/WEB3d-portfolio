import "dotenv/config";
import { buildIndex } from "./store.js";

const built = await buildIndex();
console.log(`Indexed ${built.chunks.length} chunks with ${built.model}`);
