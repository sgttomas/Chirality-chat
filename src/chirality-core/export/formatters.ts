import { Triple, DS, SP, X, M } from '../contracts';

export function formatDSTableMarkdown(triple: Triple<DS>): string {
  const ds = triple.text;
  const rows: string[] = [
    '| Field | Value |',
    '|-------|-------|',
    `| **Data Field** | ${ds.data_field} |`,
  ];
  
  if (ds.units) rows.push(`| Units | ${ds.units} |`);
  if (ds.type) rows.push(`| Type | ${ds.type} |`);
  if (ds.source_refs?.length) rows.push(`| Sources | ${ds.source_refs.join(', ')} |`);
  if (ds.notes?.length) rows.push(`| Notes | ${ds.notes.join('; ')} |`);
  if (triple.terms_used?.length) rows.push(`| Terms Used | ${triple.terms_used.join(', ')} |`);
  if (triple.warnings?.length) rows.push(`| ⚠️ Warnings | ${triple.warnings.join('; ')} |`);
  
  return rows.join('\n');
}

export function formatSPMarkdown(triple: Triple<SP>): string {
  const sp = triple.text;
  const lines: string[] = [`## ${sp.step}`];
  
  if (sp.purpose) lines.push(`\n**Purpose:** ${sp.purpose}`);
  if (sp.inputs?.length) lines.push(`\n**Inputs:** ${sp.inputs.join(', ')}`);
  if (sp.outputs?.length) lines.push(`\n**Outputs:** ${sp.outputs.join(', ')}`);
  if (sp.preconditions?.length) lines.push(`\n**Preconditions:**\n- ${sp.preconditions.join('\n- ')}`);
  if (sp.postconditions?.length) lines.push(`\n**Postconditions:**\n- ${sp.postconditions.join('\n- ')}`);
  if (sp.refs?.length) lines.push(`\n**References:** ${sp.refs.join(', ')}`);
  
  return lines.join('\n');
}

export function formatXMarkdown(triple: Triple<X>): string {
  const x = triple.text;
  const lines: string[] = [`## ${x.heading}`];
  
  lines.push(`\n${x.narrative}`);
  
  if (x.precedents?.length) lines.push(`\n**Precedents:** ${x.precedents.join(', ')}`);
  if (x.successors?.length) lines.push(`\n**Successors:** ${x.successors.join(', ')}`);
  if (x.context_notes?.length) lines.push(`\n**Context Notes:**\n- ${x.context_notes.join('\n- ')}`);
  if (x.refs?.length) lines.push(`\n**References:** ${x.refs.join(', ')}`);
  
  return lines.join('\n');
}

export function formatMMarkdown(triple: Triple<M>): string {
  const m = triple.text;
  const lines: string[] = [`## Solution Statement`];
  
  lines.push(`\n${m.statement}`);
  
  if (m.justification) lines.push(`\n**Justification:** ${m.justification}`);
  if (m.trace_back?.length) lines.push(`\n**Traceability:** ${m.trace_back.join(' → ')}`);
  if (m.assumptions?.length) lines.push(`\n**Assumptions:**\n- ${m.assumptions.join('\n- ')}`);
  if (m.residual_risk?.length) lines.push(`\n**Residual Risks:**\n- ${m.residual_risk.join('\n- ')}`);
  
  return lines.join('\n');
}

export function formatBundleMarkdown(args: {
  ds: Triple<DS> | null;
  sp: Triple<SP> | null;
  x: Triple<X> | null;
  m: Triple<M> | null;
}): string {
  const sections: string[] = ['# Chirality Framework Output Bundle\n'];
  
  if (args.ds) {
    sections.push('## Data Sheet (DS)\n');
    sections.push(formatDSTableMarkdown(args.ds));
    sections.push('');
  }
  
  if (args.sp) {
    sections.push('## Procedural Checklist (SP)\n');
    sections.push(formatSPMarkdown(args.sp));
    sections.push('');
  }
  
  if (args.x) {
    sections.push('## Guidance (X)\n');
    sections.push(formatXMarkdown(args.x));
    sections.push('');
  }
  
  if (args.m) {
    sections.push('## Solution Template (M)\n');
    sections.push(formatMMarkdown(args.m));
    sections.push('');
  }
  
  return sections.join('\n');
}

export function dsTriplesToCsv(
  triples: (Triple<DS> | null)[],
  opts = { includeTerms: true, includeWarnings: true }
): string {
  const headers = ['data_field', 'units', 'type', 'source_refs', 'notes'];
  if (opts.includeTerms) headers.push('terms_used');
  if (opts.includeWarnings) headers.push('warnings');
  
  const rows = [headers.join(',')];
  
  for (const triple of triples) {
    if (!triple) continue;
    const ds = triple.text;
    const cols = [
      `"${ds.data_field || ''}"`,
      `"${ds.units || ''}"`,
      `"${ds.type || ''}"`,
      `"${(ds.source_refs || []).join('; ')}"`,
      `"${(ds.notes || []).join('; ')}"`,
    ];
    if (opts.includeTerms) cols.push(`"${(triple.terms_used || []).join('; ')}"`);
    if (opts.includeWarnings) cols.push(`"${(triple.warnings || []).join('; ')}"`);
    rows.push(cols.join(','));
  }
  
  return rows.join('\n');
}

export function downloadCsv(filename: string, content: string) {
  if (typeof window === 'undefined') return;
  
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}