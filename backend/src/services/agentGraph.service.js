import { StateGraph, START, END } from "@langchain/langgraph"
import { embedQuery, generateAnswer } from "./gemini.service"
import { searchSimilar } from "./qdrant.service";
import { rerankChunks } from "./retrieval.service";
// const {embedQuery}

const retrieveNode = async(state) => {
  try {
    const queryVector = await embedQuery(state.query);
    const rawChunks = await searchSimilar(queryVector);
    const rerankedChunks = await rerankChunks(state.query, rawChunks);
    const sources = [...new Set(rerankedChunks.map(chunk => chunk.source))];
    return {
      rawChunks,
      rerankedChunks,
      sources,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to retrieve chunks");
  }
}

const evaluateNode = async(state) => {
  try {
    const isSufficient = await evaluteContextRelevance(state.query, state.rerankedChunks);
    return {
      isContextSufficient: isSufficient,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to evaluate content");
  }
}

const rewriteNode = async(state) => {
  try {
    const broaderQuery = `${state.userQuery} Arslan software engineer background experience`;
    const currentRetries = state.retryCount || 0;
    return {
      userQuery: broaderQuery,
      retryCount: currentRetries + 1,
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to rewrite query");
  }
}

const generateNode = async(state) => {
  try {
    const answer = generateAnswer(state.userQuery, state.rerankChunks, state.isContextSufficient)
    return {
      finalAnswer: answer,
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate response");
  }
}

const routeAfterEvaluation = async(state) => {
  try {
    if(state.isContextSufficient) {
      return "generate_answer";
    }
    if((state.retryCount || 0) < 1) {
      return "generate_answer"
    }
    return "rewrite_query"
  } catch (error) {
    console.error(error);
    throw new Error("Failed to route after evaluation");
  }
}

const graphState = {
  sessionId: { value: (x, y) => (y ? y : x), default: () => "" },
  userQuery: { value: (x, y) => (y ? y : x), default: () => "" },
  rawChunks: { value: (x, y) => (y ? y : x), default: () => [] },
  rerankedChunks: { value: (x, y) => (y ? y : x), default: () => [] },
  isContextSufficient: { value: (x, y) => (y !== undefined ? y : x), default: () => true },
  retryCount: { value: (x, y) => (y !== undefined ? y : x), default: () => 0 },
  finalAnswer: { value: (x, y) => (y ? y : x), default: () => "" },
  sources: { value: (x, y) => (y ? y : x), default: () => [] },
};

const workflow = new StateGraph({ channels: graphState })
  .addNode("retrieve_and_rerank", retrieveNode)
  .addNode("evaluate_context", evaluateNode)
  .addNode("rewrite_query", rewriteNode)
  .addNode("generate_answer", generateNode)

  // Wire Edges
  .addEdge(START, "retrieve_and_rerank")
  .addEdge("retrieve_and_rerank", "evaluate_context")
  .addConditionalEdges("evaluate_context", routeAfterEvaluation, {
    generate_answer: "generate_answer",
    rewrite_query: "rewrite_query",
  })
  .addEdge("rewrite_query", "retrieve_and_rerank")
  .addEdge("generate_answer", END);

const agentApp = workflow.compile();

module.exports = { agentApp };