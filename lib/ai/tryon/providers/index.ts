import type { TryOnProvider } from "../types";
import { createMockProvider } from "./mock";
import { createRunPodProvider } from "./runpod";

let activeProvider: TryOnProvider | null = null;

/**
 * Get the active try-on provider.
 * Selected by `TRYON_PROVIDER` env: "runpod" when configured, "mock" otherwise.
 */
export function getTryOnProvider(): TryOnProvider {
  if (activeProvider) return activeProvider;

  const configured = process.env.TRYON_PROVIDER || "mock";
  activeProvider =
    configured === "runpod" ? createRunPodProvider() : createMockProvider();

  return activeProvider;
}

/** Override the active provider (used by tests). */
export function setTryOnProvider(provider: TryOnProvider): void {
  activeProvider = provider;
}
