/**
 * Ingestion script: builds the RAG knowledge base from
 *   1. ../frontend/src/data/*.json  (the same files that render the website)
 *   2. ./knowledge/*.md             (extra free-text knowledge)
 *
 * Run after every content change:  npm run ingest
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { assertConfig } from "../src/config.js";
import { embedTexts } from "../src/services/gemini.service.js";
import { recreateCollection, upsertPoints } from "../src/services/qdrant.service.js";
import { chunkText } from "../src/utils/chunker.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../frontend/src/data");
const KNOWLEDGE_DIR = resolve(__dirname, "../knowledge");

function loadJson(name) {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
}

/** Convert structured site data into natural-language documents. */
function buildDocuments() {
  const docs = [];
  const site = loadJson("site.json");
  const profile = loadJson("profile.json");
  const skills = loadJson("skills.json");
  const experience = loadJson("experience.json");
  const projects = loadJson("projects.json");

  docs.push({
    source: "profile",
    text: `${site.name} (${site.title}) is based in ${site.location}. Contact: ${site.email}, ${site.phone}, LinkedIn: ${site.linkedin}. ${site.tagline} ${profile.summary.join(" ")}`,
  });

  docs.push({
    source: "ai-expertise",
    text: `${site.name}'s AI specialisation: ${profile.aiFocus.description} Capabilities: ${profile.aiFocus.capabilities.join("; ")}.`,
  });

  for (const group of skills.groups) {
    docs.push({
      source: "skills",
      text: `${site.name}'s ${group.name} skills: ${group.skills.join(", ")}.`,
    });
  }

  for (const job of experience.items) {
    docs.push({
      source: `experience: ${job.company}`,
      text: `${job.role} at ${job.company} (${job.location}, ${job.period}). ${job.description} Technologies: ${job.tags.join(", ")}.`,
    });
  }
  docs.push({
    source: "education",
    text: `Education: ${experience.education.degree} from ${experience.education.institution}, ${experience.education.year}, ${experience.education.detail}.`,
  });

  for (const p of [...projects.featured, ...projects.more]) {
    docs.push({
      source: `project: ${p.name}`,
      text: `Project "${p.name}" (${p.org}). ${p.description} Tools: ${p.tools.join(", ")}.${p.url && !p.url.startsWith("#") ? ` URL: ${p.url}` : ""}`,
    });
  }

  // extra markdown knowledge
  if (existsSync(KNOWLEDGE_DIR)) {
    for (const file of readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"))) {
      const text = readFileSync(join(KNOWLEDGE_DIR, file), "utf8");
      docs.push({ source: `knowledge: ${file}`, text });
    }
  }

  return docs;
}

async function main() {
  assertConfig();
  console.log("→ Building documents from site data + knowledge/ …");
  const docs = buildDocuments();

  const chunks = docs.flatMap((d) =>
    chunkText(d.text).map((text) => ({ text, source: d.source }))
  );
  console.log(`→ ${docs.length} documents → ${chunks.length} chunks`);

  console.log("→ Recreating Qdrant collection …");
  await recreateCollection();

  const BATCH = 50;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const vectors = await embedTexts(batch.map((c) => c.text));
    await upsertPoints(
      batch.map((c, j) => ({
        id: randomUUID(),
        vector: vectors[j],
        payload: { text: c.text, source: c.source },
      }))
    );
    console.log(`  embedded ${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
  }

  console.log("✓ Ingestion complete. The chatbot now knows your latest content.");
}

main().catch((err) => {
  console.error("✗ Ingestion failed:", err.message);
  process.exit(1);
});
