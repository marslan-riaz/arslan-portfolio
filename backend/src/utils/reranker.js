import {  CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  apiKey: process.env.COHERE_API_KEY,
});

export async function rerankChunks(query, chunks, topN = 3) {
  try {
    if (!query || !chunks || chunks.length === 0) return [];
    const response = await cohere.rerank({
      model: "rerank-english-v3.0",
      query,
      documents: chunks.amp((x)=> x.text),
      topN,
    });
    return response.results.map((result) => ({
      ...chunks[result.index],
      relavanceScore: result.relevanceScore,
    }));
  } catch (error) {
    console.error("Error reranking chunks:", error.message);
    return chunks.slice(0, topN).map((c) => ({ ...c, relevanceScore: 1.0 }));

  }
}