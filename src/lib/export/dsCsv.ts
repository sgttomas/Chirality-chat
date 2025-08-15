import type { LlmTriple } from '@/lib/prompt/llmContracts';
import type { DS } from '@/lib/parseCellValue';

type Delim = ',' | ';' | '\t';

export interface DsCsvOptions {
  delimiter?: Delim;           // default: ','
  includeTerms?: boolean;      // default: false
  includeWarnings?: boolean;   // default: false
  includeHeader?: boolean;     // default: true
}

const joinArr = (a?: string[], sep = ' | ') => (a?.length ? a.join(sep) : '');

function csvEscape(s: string, delimiter: Delim): string {
  // quote if contains delimiter, quote, or newline
  const needsQuote = s.includes(delimiter) || s.includes('"') || /[\r\n]/.test(s);
  let out = s.replace(/"/g, '""');
  return needsQuote ? `"${out}"` : out;
}

/**
 * Convert an array of DS triples into a single CSV string.
 * Columns: Data Field, Units, Type, Sources, Notes (+ optional: Terms, Warnings)
 */
export function dsTriplesToCsv(
  triples: Array<LlmTriple<DS> | null | undefined>,
  opts: DsCsvOptions = {}
): string {
  const delimiter: Delim = opts.delimiter ?? ',';
  const includeTerms = !!opts.includeTerms;
  const includeWarnings = !!opts.includeWarnings;
  const includeHeader = opts.includeHeader !== false;

  const baseHeaders = ['Data Field', 'Units', 'Type', 'Sources', 'Notes'];
  const extraHeaders = [
    ...(includeTerms ? ['Terms Used'] : []),
    ...(includeWarnings ? ['Warnings'] : []),
  ];
  const headers = [...baseHeaders, ...extraHeaders];

  const lines: string[] = [];
  if (includeHeader) {
    lines.push(headers.map(h => csvEscape(h, delimiter)).join(delimiter));
  }

  for (const triple of triples) {
    if (!triple || !triple.text) continue;
    const t = triple.text;

    const row = [
      t.data_field ?? '',
      t.units ?? '',
      t.type ?? '',
      joinArr(t.source_refs, '; '),
      joinArr(t.notes, ' • '),
      ...(includeTerms ? [joinArr(triple.terms_used, '; ')] : []),
      ...(includeWarnings ? [joinArr(triple.warnings, ' | ')] : []),
    ].map(v => csvEscape(String(v ?? ''), delimiter));

    lines.push(row.join(delimiter));
  }

  return lines.join('\n');
}

/** Small helper to trigger a download in the browser */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}