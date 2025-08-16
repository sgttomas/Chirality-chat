import { DS, SP, X, M, LlmTriple } from './llmContracts';

// --- helpers ---
const mdEscape = (s: string) =>
  s.replace(/\|/g, '\\|').replace(/\*/g, '\\*').replace(/_/g, '\\_').replace(/`/g, '\\`');
const joinArr = (a?: string[], sep = ', ') => (a?.length ? a.join(sep) : '');
const clean = (s?: string) => (s ? s.trim() : '');

// --- DS as Markdown TABLE (pretty for PDFs) ---
export function formatDSTableMarkdown(triple: LlmTriple<DS>): string {
  const t = triple.text;
  const rows: [string, string][] = [
    ['Data Field', String(clean(t.data_field))] as [string, string],
    ['Units', String(clean(t.units))] as [string, string],
    ['Type', String(clean(t.type))] as [string, string],
    ['Sources', String(joinArr(t.source_refs))] as [string, string],
    ['Notes', String(joinArr(t.notes, ' • '))] as [string, string],
  ].filter(([, v]) => !!v && v.length > 0);

  // two-column table
  const header = `| Field | Value |\n|---|---|`;
  const body = rows
    .map(([k, v]) => `| ${mdEscape(k)} | ${mdEscape(v)} |`)
    .join('\n');

  // optional "terms_used / warnings" footers (collapsed details)
  const terms = triple.terms_used?.length
    ? `\n\n<details><summary>Terms used</summary>\n\n${mdEscape(triple.terms_used.join(', '))}\n\n</details>`
    : '';
  const warns = triple.warnings?.length
    ? `\n\n> **Warnings:** ${mdEscape(triple.warnings.join(' • '))}`
    : '';

  return [header, body].join('\n') + terms + warns;
}

// --- DS as simple HTML table (if your PDF renderer prefers HTML) ---
export function formatDSTableHTML(triple: LlmTriple<DS>): string {
  const t = triple.text;
  const rows: [string, string][] = [
    ['Data Field', String(clean(t.data_field))] as [string, string],
    ['Units', String(clean(t.units))] as [string, string],
    ['Type', String(clean(t.type))] as [string, string],
    ['Sources', String(joinArr(t.source_refs))] as [string, string],
    ['Notes', String(joinArr(t.notes, ' • '))] as [string, string],
  ].filter(([, v]) => !!v && v.length > 0);

  const cells = rows
    .map(([k, v]) => `<tr><th style="text-align:left;white-space:nowrap;">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join('');

  const terms = triple.terms_used?.length
    ? `<details><summary>Terms used</summary><div>${escapeHtml(triple.terms_used.join(', '))}</div></details>`
    : '';
  const warns = triple.warnings?.length
    ? `<div><strong>Warnings:</strong> ${escapeHtml(triple.warnings.join(' • '))}</div>`
    : '';

  return `<table>${cells}</table>${terms}${warns}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Optional: stitch DS/SP/X/M into one Markdown export ---
export function formatBundleMarkdown(args: {
  ds?: LlmTriple<DS> | null;
  sp?: LlmTriple<SP> | null;
  x?:  LlmTriple<X>  | null;
  m?:  LlmTriple<M>  | null;
  // allow callers to provide existing simple formatters
  formatSP?: (t: LlmTriple<SP>) => string;
  formatX?:  (t: LlmTriple<X>)  => string;
  formatM?:  (t: LlmTriple<M>)  => string;
}): string {
  const sections: string[] = [];
  if (args.ds) sections.push(`## Data Sheet\n\n${formatDSTableMarkdown(args.ds)}`);
  if (args.sp && args.formatSP) sections.push(`\n\n## Standard Procedure\n\n${args.formatSP(args.sp)}`);
  if (args.x && args.formatX)   sections.push(`\n\n## Guidance\n\n${args.formatX(args.x)}`);
  if (args.m && args.formatM)   sections.push(`\n\n## Solution Statement\n\n${args.formatM(args.m)}`);
  return sections.join('\n');
}