#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const sourceRoots = ["app", "components", "features", "hooks", "lib"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

const forbidden = [
  ["nullish NGN fallback", /\?\?\s*["']NGN["']/g],
  ["boolean NGN fallback", /\|\|\s*["']NGN["']/g],
  ["NGN state default", /useState(?:<[^>]+>)?\(\s*["']NGN["']\s*\)/g],
  ["typed NGN currency default", /\bcurrency\s*:\s*string\s*=\s*["']NGN["']/g],
  ["hard-coded NGN money formatting", /format(?:Compact)?Money\([^,\n]+,\s*["']NGN["']/g],
  ["hard-coded NGN MoneyAmount prop", /<MoneyAmount[\s\S]{0,220}?currency=["']NGN["']/g],
];

function filesUnder(directory) {
  const files = [];
  const absolute = join(root, directory);
  for (const entry of readdirSync(absolute)) {
    const path = join(absolute, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...filesUnder(relative(root, path)));
    } else if (extensions.has(extname(path))) {
      files.push(path);
    }
  }
  return files;
}

const violations = [];

const moneySource = readFileSync(join(root, "lib/money.ts"), "utf8");
if (/currency\s*:\s*string\s*=\s*["']NGN["']/.test(moneySource)) {
  violations.push("lib/money.ts: generic formatter must not default currency to NGN");
}

const moneyAmountSource = readFileSync(
  join(root, "components/kivo/money-amount.tsx"),
  "utf8",
);
if (/currency\?:\s*string/.test(moneyAmountSource)) {
  violations.push(
    "components/kivo/money-amount.tsx: generic money components must require currency",
  );
}
if (/currency\s*=\s*["']NGN["']/.test(moneyAmountSource)) {
  violations.push(
    "components/kivo/money-amount.tsx: generic money components must not default to NGN",
  );
}

for (const sourceRoot of sourceRoots) {
  for (const file of filesUnder(sourceRoot)) {
    const content = readFileSync(file, "utf8");
    for (const [name, pattern] of forbidden) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const before = content.slice(0, match.index);
        const line = before.split("\n").length;
        violations.push(
          `${relative(root, file)}:${line}: ${name}: ${match[0].replace(/\s+/g, " ")}`,
        );
        if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
      }
    }
  }
}

if (violations.length) {
  console.error("FX-013G frontend conformance failed:");
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log(
  "FX-013G frontend conformance: no implicit NGN fallbacks in runtime source",
);
