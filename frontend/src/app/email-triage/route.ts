import { readFileSync } from "node:fs";
import path from "node:path";

export function GET() {
  const html = readFileSync(
    path.join(process.cwd(), "public", "email-triage", "index.html"),
    "utf8"
  );
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
