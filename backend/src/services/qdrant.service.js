import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../config.js";

let client;
export function getQdrant() {
  if (!client) {
    client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
  }
  return client;
}

/** Drop & recreate the collection (used by the ingest script). */
export async function recreateCollection() {
  const qdrant = getQdrant();
  const { collection } = config.qdrant;
  const existing = await qdrant.getCollections();
  if (existing.collections.some((c) => c.name === collection)) {
    await qdrant.deleteCollection(collection);
  }
  await qdrant.createCollection(collection, {
    vectors: { size: config.gemini.embeddingDim, distance: "Cosine" },
  });
}

/** Upsert points: [{ id, vector, payload: { text, source } }] */
export async function upsertPoints(points) {
  const qdrant = getQdrant();
  await qdrant.upsert(config.qdrant.collection, { wait: true, points });
}

/** Search for the most relevant chunks for a query vector. */
export async function searchSimilar(vector, topK = config.rag.topK) {
  const qdrant = getQdrant();
  const result = await qdrant.search(config.qdrant.collection, {
    vector,
    limit: topK,
    with_payload: true,
  });
  return result
    .filter((r) => r.score >= config.rag.minScore)
    .map((r) => ({ text: r.payload.text, source: r.payload.source, score: r.score }));
}
