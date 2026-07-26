/**
 * AI Provider initialization.
 * Sets up the active vision provider based on environment configuration.
 */

import { setVisionProvider } from "../vision";
import { createOpenAIProvider } from "./openai-vision";

let initialized = false;

export function initializeProviders() {
  if (initialized) return;

  // Configure OpenAI Vision if API key is available
  if (process.env.OPENAI_API_KEY) {
    setVisionProvider(createOpenAIProvider());
    console.log("[AI] OpenAI Vision provider initialized");
  } else {
    console.log("[AI] No vision provider configured — using mock analysis");
  }

  initialized = true;
}

// Auto-initialize on import (server-side only)
if (typeof window === "undefined") {
  initializeProviders();
}
