// Basic formatters for SP/X/M documents (simple markdown format)
import { SP, X, M, LlmTriple } from './llmContracts';

const clean = (s?: string) => (s ? s.trim() : '');
const joinArr = (a?: string[], sep = ', ') => (a?.length ? a.join(sep) : '');

export function formatSPMarkdown(triple: LlmTriple<SP>): string {
  const sp = triple.text;
  let md = `**Step:** ${clean(sp.step)}\n\n`;
  
  if (sp.purpose) md += `**Purpose:** ${clean(sp.purpose)}\n\n`;
  if (sp.inputs?.length) md += `**Inputs:** ${joinArr(sp.inputs, ', ')}\n\n`;
  if (sp.outputs?.length) md += `**Outputs:** ${joinArr(sp.outputs, ', ')}\n\n`;
  if (sp.preconditions?.length) md += `**Preconditions:** ${joinArr(sp.preconditions, '; ')}\n\n`;
  if (sp.postconditions?.length) md += `**Postconditions:** ${joinArr(sp.postconditions, '; ')}\n\n`;
  if (sp.refs?.length) md += `**References:** ${joinArr(sp.refs)}\n\n`;
  
  if (triple.warnings?.length) {
    md += `> **Warnings:** ${triple.warnings.join(' • ')}\n\n`;
  }
  
  return md;
}

export function formatXMarkdown(triple: LlmTriple<X>): string {
  const x = triple.text;
  let md = `**${clean(x.heading)}**\n\n${clean(x.narrative)}\n\n`;
  
  if (x.precedents?.length) md += `**Precedents:** ${joinArr(x.precedents)}\n\n`;
  if (x.successors?.length) md += `**Successors:** ${joinArr(x.successors)}\n\n`;
  if (x.context_notes?.length) md += `**Context Notes:** ${joinArr(x.context_notes, '; ')}\n\n`;
  if (x.refs?.length) md += `**References:** ${joinArr(x.refs)}\n\n`;
  
  if (triple.warnings?.length) {
    md += `> **Warnings:** ${triple.warnings.join(' • ')}\n\n`;
  }
  
  return md;
}

export function formatMMarkdown(triple: LlmTriple<M>): string {
  const m = triple.text;
  let md = `**Statement:** ${clean(m.statement)}\n\n`;
  
  if (m.justification) md += `**Justification:** ${clean(m.justification)}\n\n`;
  if (m.trace_back?.length) md += `**Trace Back:** ${joinArr(m.trace_back, '; ')}\n\n`;
  if (m.assumptions?.length) md += `**Assumptions:** ${joinArr(m.assumptions, '; ')}\n\n`;
  if (m.residual_risk?.length) md += `**Residual Risk:** ${joinArr(m.residual_risk, '; ')}\n\n`;
  
  if (triple.warnings?.length) {
    md += `> **Warnings:** ${triple.warnings.join(' • ')}\n\n`;
  }
  
  return md;
}