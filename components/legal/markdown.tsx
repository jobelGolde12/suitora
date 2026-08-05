import type { ReactNode } from "react";

/**
 * Minimal, strictly-typed Markdown renderer for the app's legal documents.
 *
 * Parses only the constructs used in the policy Markdown (single source of
 * truth) — ATX headings, paragraphs with soft line breaks, bullet lists,
 * horizontal rules, **bold**, *italic*, and inline code. Unknown syntax is
 * rendered as plain text rather than being guessed at. The legal documents
 * are trusted, first-party files, so no HTML is ever injected.
 */

type InlineNode =
  | { kind: "text"; value: string }
  | { kind: "strong"; children: InlineNode[] }
  | { kind: "em"; children: InlineNode[] }
  | { kind: "code"; value: string };

type BlockNode =
  | { kind: "heading"; level: 1 | 2 | 3; children: InlineNode[] }
  | { kind: "paragraph"; children: InlineNode[] }
  | { kind: "list"; items: InlineNode[][] }
  | { kind: "hr" };

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buffer = "";

  const flush = () => {
    if (buffer) {
      nodes.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);

    const strongEnd = rest.indexOf("**", 2);
    if (rest.startsWith("**") && strongEnd !== -1) {
      flush();
      nodes.push({ kind: "strong", children: parseInline(rest.slice(2, strongEnd)) });
      i += strongEnd + 2;
      continue;
    }

    const codeEnd = rest.indexOf("`", 1);
    if (rest.startsWith("`") && codeEnd !== -1) {
      flush();
      nodes.push({ kind: "code", value: rest.slice(1, codeEnd) });
      i += codeEnd + 1;
      continue;
    }

    const emEnd = rest.indexOf("*", 1);
    if (rest.startsWith("*") && emEnd !== -1) {
      flush();
      nodes.push({ kind: "em", children: parseInline(rest.slice(1, emEnd)) });
      i += emEnd + 1;
      continue;
    }

    buffer += text[i];
    i += 1;
  }

  flush();
  return nodes;
}

function parseBlocks(markdown: string): BlockNode[] {
  const lines = markdown.split("\n");
  const blocks: BlockNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3,
        children: parseInline(heading[2]),
      });
      i += 1;
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      blocks.push({ kind: "hr" });
      i += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: InlineNode[][] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\s*[-*+]\s+/, "").trimEnd()));
        i += 1;
      }
      blocks.push({ kind: "list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      paragraphLines.push(lines[i]);
      i += 1;
    }

    const children: InlineNode[] = [];
    for (let j = 0; j < paragraphLines.length; j += 1) {
      if (j > 0) {
        // Trailing double-space is a hard line break; otherwise join lines.
        children.push({
          kind: "text",
          value: paragraphLines[j - 1].endsWith("  ") ? "\n" : " ",
        });
      }
      children.push(...parseInline(paragraphLines[j].trimEnd()));
    }

    blocks.push({ kind: "paragraph", children });
  }

  return blocks;
}

function renderInline(nodes: InlineNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.kind) {
      case "text":
        return node.value === "\n" ? <br key={key} /> : node.value;
      case "strong":
        return (
          <strong key={key} className="font-medium text-foreground">
            {renderInline(node.children, key)}
          </strong>
        );
      case "em":
        return (
          <em key={key} className="italic">
            {renderInline(node.children, key)}
          </em>
        );
      case "code":
        return (
          <code
            key={key}
            className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[0.85em]"
          >
            {node.value}
          </code>
        );
    }
  });
}

function renderBlock(block: BlockNode, key: string): ReactNode {
  switch (block.kind) {
    case "hr":
      return (
        <hr key={key} className="my-10 border-border/60" />
      );
    case "heading":
      // The loader strips the document title (h1), which is owned by
      // LegalPage, so body headings map faithfully to h2/h3/h4.
      switch (block.level) {
        case 1:
          return (
            <h2 key={key} className="mt-14 mb-5 font-heading text-3xl font-light tracking-tight text-balance">
              {renderInline(block.children, key)}
            </h2>
          );
        case 2:
          return (
            <h2 key={key} className="mt-14 mb-4 font-heading text-2xl font-light tracking-tight text-balance">
              {renderInline(block.children, key)}
            </h2>
          );
        case 3:
          return (
            <h3 key={key} className="mt-9 mb-3 font-heading text-xl font-light tracking-tight">
              {renderInline(block.children, key)}
            </h3>
          );
      }
      break;
    case "paragraph":
      return (
        <p key={key} className="mb-5 text-[0.95rem] leading-relaxed font-light text-foreground/90">
          {renderInline(block.children, key)}
        </p>
      );
    case "list":
      return (
        <ul key={key} className="mb-5 space-y-3">
          {block.items.map((item, index) => (
            <li
              key={`${key}-item-${index}`}
              className="flex items-start gap-3 text-[0.95rem] leading-relaxed font-light text-foreground/90"
            >
              <span
                aria-hidden="true"
                className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70"
              />
              <span className="flex-1">{renderInline(item, `${key}-${index}`)}</span>
            </li>
          ))}
        </ul>
      );
  }
}

export function LegalMarkdown({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown);
  return <div>{blocks.map((block, index) => renderBlock(block, String(index)))}</div>;
}
