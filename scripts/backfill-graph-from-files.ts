#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import cfg from "../config/selection.json";
import { selectForMirror, Doc, Section } from "../lib/graph/selector";
import { mirrorGraph, ensureConstraints, getDriver } from "../lib/graph/mirror";

const ROOT = process.argv.find(a => a.startsWith("--root="))?.split("=")[1] || "content";
const DRY = process.argv.includes("--dry-run");
const SINCE = process.argv.find(a => a.startsWith("--since="))?.split("=")[1];
const BATCH = Number(process.argv.find(a => a.startsWith("--batch="))?.split("=")[1] || 200);

async function loadDoc(p: string, kind: Doc["kind"]): Promise<Doc> {
  const raw = await fs.readFile(p, "utf-8");
  const slug = path.basename(p, ".md");
  const title = raw.split("\n")[0].replace(/^#\s*/, "").trim();
  const sections: Section[] = []; // selector can parse if empty
  return { id: `${kind}:${slug}`, kind, slug, title, sections, raw };
}

(async () => {
  const driver = getDriver();
  await ensureConstraints(driver);

  const files = await fs.readdir(ROOT); // e.g., DS/*.md, SP/*.md... adjust to your layout
  const docFiles = files.filter(f => f.endsWith(".md"));
  let scanned=0, upserted=0, removed=0, failed=0;

  const batch: any[] = [];

  for (const f of docFiles) {
    const kind = (f.startsWith("DS-") ? "DS" : f.startsWith("SP-") ? "SP" : f.startsWith("X-") ? "X" : "M") as Doc["kind"];
    const fp = path.join(ROOT, f);

    if (SINCE) {
      const st = await fs.stat(fp);
      if (st.mtime < new Date(SINCE)) continue;
    }

    const doc = await loadDoc(fp, kind);
    const bundle = { [kind]: doc } as any;
    const sel = selectForMirror(bundle, cfg as any);
    const payload = { selection_v: (cfg as any).selection_v, ...sel };

    scanned++;
    if (!DRY) {
      try { await mirrorGraph(payload); upserted += sel.components.length + sel.docs.length; }
      catch { failed++; }
    }
    if (scanned % BATCH === 0) console.log({ scanned, upserted, failed });
  }

  console.log({ scanned, upserted, removed, failed, since: SINCE || null, dryRun: DRY });
  await driver.close();
})().catch(e => { console.error(e); process.exit(1); });