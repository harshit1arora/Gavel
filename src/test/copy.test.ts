import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, extname } from "path";

/**
 * House style: no em-dashes in product copy, code comments or docs.
 *
 * This test exists so the rule survives future edits instead of being a
 * one-off cleanup. It walks the source tree and fails with the offending
 * file and line.
 */

const ROOT = join(__dirname, "..");
const SCAN_DIRS = ["src", "public", "e2e", "engine-py"];
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", "__pycache__", ".pytest_cache"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".cjs", ".mjs", ".py", ".css", ".html", ".json", ".md", ".txt"]);
const EM_DASH = "\u2014";

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (EXTS.has(extname(entry))) out.push(full);
  }
  return out;
}

describe("copy", () => {
  it("contains no em-dashes anywhere in the product", () => {
    const offenders: string[] = [];

    for (const dir of SCAN_DIRS) {
      for (const file of walk(join(ROOT, dir))) {
        const lines = readFileSync(file, "utf-8").split("\n");
        lines.forEach((line, i) => {
          if (line.includes(EM_DASH)) {
            offenders.push(`${file.replace(ROOT + "/", "")}:${i + 1}`);
          }
        });
      }
    }

    expect(offenders, `em-dash found in:\n${offenders.join("\n")}`).toHaveLength(0);
  });
});
