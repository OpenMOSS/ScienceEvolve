// Emit an apply_patch document; never write source/index files from this helper.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { structuredPatch } from "diff";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const sourceRoot = path.resolve(process.argv[2]);
const prefix = process.argv[3] ?? "native-codex-profile";
const indexPath = path.join(root, "resources/main-runtime/shared-fixes.json");
const original = await readFile(indexPath, "utf8");
const index = JSON.parse(original);
const previousCount = index.fixes.length;
const manifest = JSON.parse(await readFile(path.join(root, "resources/main-runtime/manifest.json"), "utf8"));
let count = 0;
for (const entry of manifest.files.filter((entry) => entry.source.startsWith("server/src/") && entry.source.endsWith(".ts"))) {
  const before = (await readFile(path.join(root, entry.target), "utf8")).replaceAll("\r\n", "\n");
  const after = (await readFile(path.join(sourceRoot, entry.source), "utf8")).replaceAll("\r\n", "\n");
  if (before === after) continue;
  const hunks = structuredPatch("before", "after", before, after, undefined, undefined, { context: 20 }).hunks;
  const replacements = hunks.map((hunk) => ({
    before: hunk.lines.filter((line) => line[0] === " " || line[0] === "-").map((line) => line.slice(1)).join("\n") + "\n",
    after: hunk.lines.filter((line) => line[0] === " " || line[0] === "+").map((line) => line.slice(1)).join("\n") + "\n"
  }));
  let verified = before;
  for (const replacement of replacements) {
    if (verified.split(replacement.before).length !== 2) throw new Error(`Non-unique diff context: ${entry.source}`);
    verified = verified.replace(replacement.before, () => replacement.after);
  }
  if (verified !== after) throw new Error(`Diff does not reproduce exact source: ${entry.source}`);
  index.fixes.push({ id: `${prefix}-${entry.source.slice(11, -3).replaceAll("/", "-")}`, source: entry.source, replacements });
  count++;
}
if (!count) throw new Error("No new shared changes");
const appended = index.fixes.slice(previousCount).map((fix) => "    " + JSON.stringify(fix, null, 2).replaceAll("\n", "\n    ")).join(",\n");
console.log("*** Begin Patch\n*** Update File: " + indexPath.replaceAll("\\", "/") + "\n@@\n" +
  "-    }\n-  ]\n-}\n+    },\n" + appended.split("\n").map((line) => "+" + line).join("\n") + "\n+  ]\n+}\n*** End Patch");
