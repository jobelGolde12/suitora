/**
 * AI Provider initialization.
 * Sets up the active vision provider based on environment configuration.
 */

import { setVisionProvider } from "../vision";
import { createOpenAIProvider } from "./openai-vision";
import { getLogger } from "@/lib/logger";

let initialized = false;

export function initializeProviders() {
  if (initialized) return;

  // Configure OpenAI Vision if API key is available
  if (process.env.OPENAI_API_KEY) {
    setVisionProvider(createOpenAIProvider());
    getLogger().info("OpenAI Vision provider initialized");
  } else {
    getLogger().info("No vision provider configured — using mock analysis");
  }

  initialized = true;
}

// Auto-initialize on import (server-side only)
if (typeof window === "undefined") {
  initializeProviders();
}
