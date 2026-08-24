#!/usr/bin/env node
/**
 * Launch the standalone production server produced by `next build`
 * (output: "standalone" in next.config.ts).
 *
 * `next start` is not compatible with standalone output, so this script
 * assembles the self-contained server (static assets + public files) and
 * boots it. Configuration comes from the environment (HOSTNAME, PORT),
 * matching the official Next.js standalone deployment pattern.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(join(standaloneDir, "server.js"))) {
  console.error(
    "Standalone build not found. Run `npm run build` first (or use `npm run start:prod`)."
  );
  process.exit(1);
}

// The standalone bundle needs the build's client assets and public files
// copied in; Next.js does not include them automatically.
mkdirSync(join(standaloneDir, ".next"), { recursive: true });
cpSync(join(root, ".next", "static"), join(standaloneDir, ".next", "static"), {
  recursive: true,
});
const publicDir = join(root, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, join(standaloneDir, "public"), { recursive: true });
}

console.log(
  `Starting standalone server on ${process.env.HOSTNAME || "localhost"}:${process.env.PORT || 3000}`
);
const child = spawn(process.execPath, [join(standaloneDir, "server.js")], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 0));
