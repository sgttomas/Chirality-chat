import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import slugify from "slugify";
import crypto from "node:crypto";

export type Section = { heading: string; anchor: string; content: string; order: number };
export type Doc = { id: string; kind: "DS"|"SP"|"X"|"M"; slug: string; title: string; sections: Section[]; raw: string };
export type Bundle = { DS?: Doc; SP?: Doc; X?: Doc; M?: Doc };

export type SelCfg = {
  selection_v: string; threshold: number; topKPerDoc: number; maxNodesPerRun: number;
  keywords: string[]; largeSectionCharLimit: number;
};

export function stableComponentId(docId: string, anchor: string) {
  return crypto.createHash("sha1").update(`${docId}#${anchor}`).digest("hex");
}

export function extractDocRefs(text: string): string[] {
  const ids = new Set<string>();
  // [[DS:payments-auth]] or [[sp-deploy-runbook]]
  const wiki = /\[\[([A-Za-z]{1,2}:[\w-]+|[a-z0-9-]+)\]\]/g;
  // (…/docs/slug) or (slug)
  const md = /\]\((?:\/docs\/)?([a-z0-9-]+)\)/g;
  // inline DS:slug or SP:slug
  const inline = /\b([A-Za-z]{1,2}:[\w-]+)\b/g;
  for (const m of text.matchAll(wiki)) ids.add(m[1]);
  for (const m of text.matchAll(md)) ids.add(m[1]);
  for (const m of text.matchAll(inline)) ids.add(m[1]);
  return [...ids];
}

function scoreSection(d: Doc, s: Section, cfg: SelCfg): number {
  let score = 0;
  const refs = extractDocRefs(s.content).filter(r => r !== d.id);
  if (refs.length >= 2) score += 3;
  const kwRe = new RegExp(`^(${cfg.keywords.join("|")})`, "i");
  if (kwRe.test(s.heading)) score += 2;
  // pretend inbound links are counted later (optional +1)
  if (s.content.length > cfg.largeSectionCharLimit && refs.length < 3) score -= 2;
  return score;
}

function parseSections(md: string): Section[] {
  // light parser: split on headings
  const lines = md.split(/\r?\n/);
  const sections: Section[] = [];
  let current: Section | null = null;
  let order = 0;
  for (const line of lines) {
    const mh = /^(#{1,6})\s+(.+)$/.exec(line);
    if (mh) {
      if (current) sections.push(current);
      const heading = mh[2].replace(/\s*\[graph\]\s*$/i, "").trim();
      const anchor = slugify(heading, { lower: true, strict: true });
      current = { heading, anchor, content: "", order: order++ };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections;
}

export function selectForMirror(bundle: Bundle, cfg: SelCfg) {
  const out = {
    docs: [] as Array<{ id: string; props: any }>,
    components: [] as Array<{ id: string; props: any; docId: string }>,
    references: [] as Array<{ src: string; dst: string }>,
    derived: [] as Array<{ src: string; dst: string }>,
    keepByDoc: {} as Record<string, string[]>
  };

  const docs = [bundle.DS, bundle.SP, bundle.X, bundle.M].filter(Boolean) as Doc[];
  for (const d of docs) {
    out.docs.push({ id: d.id, props: {
      kind: d.kind, slug: d.slug, title: d.title,
      updatedAt: new Date().toISOString()
    }});

    // document-level references
    extractDocRefs(d.raw).filter(r => r !== d.id).forEach(dst => out.references.push({ src: d.id, dst }));

    // sections -> score & cap
    const secs = d.sections.length ? d.sections : parseSections(d.raw);
    const scored = secs
      .map(s => ({ s, score: scoreSection(d, s, cfg) }))
      .filter(x => x.score >= cfg.threshold)
      .sort((a,b) => b.score - a.score || a.s.anchor.localeCompare(b.s.anchor))
      .slice(0, cfg.topKPerDoc);

    const keepIds: string[] = [];
    for (const { s, score } of scored) {
      const id = stableComponentId(d.id, s.anchor);
      keepIds.push(id);
      out.components.push({ id, props: {
        type: s.heading.split(/\s+/)[0], title: s.heading, anchor: s.anchor, order: s.order, score
      }, docId: d.id });
    }
    out.keepByDoc[d.id] = keepIds;
  }

  // total cap
  const total = out.docs.length + out.components.length;
  if (total > cfg.maxNodesPerRun) {
    out.components.splice(cfg.maxNodesPerRun - out.docs.length);
  }

  // lineage
  if (bundle.X && bundle.DS) out.derived.push({ src: bundle.X.id, dst: bundle.DS.id });
  if (bundle.SP && bundle.DS) out.derived.push({ src: bundle.SP.id, dst: bundle.DS.id });

  return out;
}