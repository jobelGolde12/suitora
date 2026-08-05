import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Reads the app's legal Markdown documents from the canonical source files.
 * Node runtime only — never import from client components.
 */

export interface LegalDocument {
  slug: string;
  title: string;
  content: string;
  effectiveDate: string | null;
  lastUpdated: string | null;
}

const LEGAL_ROOT = path.join(process.cwd(), "privacy_policy");

const DOCUMENTS: Record<string, { file: string; title: string }> = {
  "privacy-policy": {
    file: "PRIVACY_POLICY.md",
    title: "Privacy Policy",
  },
};

export async function readLegalMarkdown(slug: string): Promise<LegalDocument> {
  const doc = DOCUMENTS[slug];
  if (!doc) {
    throw new Error(`Unknown legal document: ${slug}`);
  }

  const filePath = path.join(LEGAL_ROOT, doc.file);
  const raw = await fs.readFile(filePath, "utf-8");

  return parseLegalDocument(raw, slug, doc.title);
}

/**
 * Parse a raw legal Markdown document into its renderable form.
 *
 * The document title (leading h1) and the "Effective Date"/"Last Updated"
 * metadata lines are surfaced by the page header and banner, so they are
 * stripped from the body to avoid duplicating the text.
 */
export function parseLegalDocument(
  raw: string,
  slug: string,
  title: string
): LegalDocument {
  const lines = raw.split("\n");

  const effectiveDate = extractDate(lines, "effectiveDate");
  const lastUpdated = extractDate(lines, "lastUpdated");

  const body = lines.filter((line, index) => {
    if (index === 0 && /^#\s+/.test(line)) return false;
    if (/^\*\*Effective Date:\*\*\s*/.test(line)) return false;
    if (/^\*\*Last Updated:\*\*\s*/.test(line)) return false;
    return true;
  });

  return {
    slug,
    title,
    effectiveDate,
    lastUpdated,
    content: body.join("\n").trim(),
  };
}

function extractDate(
  lines: string[],
  key: "effectiveDate" | "lastUpdated"
): string | null {
  const pattern = key === "effectiveDate" ? /^\*\*Effective Date:\*\*\s*(.+?)\s*$/ : /^\*\*Last Updated:\*\*\s*(.+?)\s*$/;
  const line = lines.find((candidate) => pattern.test(candidate));
  const match = line?.match(pattern);
  return match?.[1] ?? null;
}
