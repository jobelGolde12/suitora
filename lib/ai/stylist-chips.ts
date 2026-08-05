/**
 * Client-safe helpers for stylist follow-up / action chips.
 * Kept separate from `lib/ai/stylist.ts` so the chat UI can import without
 * pulling OpenAI fetch code into the client bundle.
 */

/** Infer 2–3 follow-up chip labels from the latest assistant reply. */
export function inferFollowUpChips(reply: string): string[] {
  const lower = reply.toLowerCase();
  const chips: string[] = [];

  if (lower.includes("color") || lower.includes("palette") || lower.includes("shade")) {
    chips.push("Show me my best colors");
  }
  if (lower.includes("outfit") || lower.includes("wear") || lower.includes("occasion")) {
    chips.push("Build a full outfit");
  }
  if (lower.includes("wardrobe") || lower.includes("closet")) {
    chips.push("What can I build from my wardrobe?");
  }
  if (lower.includes("fit") || lower.includes("size") || lower.includes("silhouette")) {
    chips.push("How should this fit my body?");
  }
  if (lower.includes("season")) {
    chips.push("What should I wear this season?");
  }

  const canned = [
    "Suggest a weekend outfit",
    "What colors suit me?",
    "How do I dress for my body shape?",
  ];

  for (const c of canned) {
    if (chips.length >= 3) break;
    if (!chips.includes(c)) chips.push(c);
  }

  return chips.slice(0, 3);
}

/** Detect actionable deep-link intents in a stylist reply. */
export function detectActionChips(
  reply: string
): Array<{ label: string; href: string }> {
  const lower = reply.toLowerCase();
  const actions: Array<{ label: string; href: string }> = [];

  if (
    lower.includes("try on") ||
    lower.includes("upload") ||
    lower.includes("analyze")
  ) {
    actions.push({ label: "Try it on", href: "/upload" });
  }
  if (lower.includes("compare") || lower.includes("side by side")) {
    actions.push({ label: "Compare looks", href: "/compare" });
  }
  if (
    lower.includes("palette") ||
    lower.includes("color") ||
    lower.includes("undertone")
  ) {
    actions.push({ label: "See color tips", href: "/stylist" });
  }

  return actions.slice(0, 2);
}
