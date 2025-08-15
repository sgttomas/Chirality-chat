// User prompt builders per document type

import { BuiltPrompt, CellContext, DocKind, OntologyEntity, UpstreamContext } from './llmContracts'
import { buildSystemPromptBracketedValley } from './system'

const DOC_KEY_HELP: Record<DocKind, string> = {
  DS: `- DS: {data_field, units, type, source_refs, notes}`,
  SP: `- SP: {step, purpose, inputs, outputs, preconditions, postconditions, refs}`,
  X : `- X:  {heading, narrative, precedents, successors, context_notes, refs}`,
  M : `- M:  {statement, justification, trace_back, assumptions, residual_risk}`,
  Z : `- Z:  {item, rationale, acceptance_criteria, evidence, severity, refs}`,
}

function fmtOnts(ents?: OntologyEntity[]) {
  if (!ents?.length) return '(none)'
  return ents.map(e => e.curie).slice(0, 16).join(', ')
}

function section(label: string, body?: string | string[]) {
  if (!body || (Array.isArray(body) && !body.length)) return ''
  const str = Array.isArray(body) ? body.map(s => `• ${s}`).join(' ') : body
  return `${label}:\n${str}\n`
}

export function buildUserPromptForDoc(kind: DocKind, ctx: CellContext, up: UpstreamContext): string {
  const parts: string[] = []

  parts.push(section('Problem Statement', up.problemStatement))
  parts.push(section('Initial Vector', up.initialVector?.map(t => `• ${t}`).join(' ')))

  parts.push(
    [
      `You are generating: Document Synthesis / ${kind}`,
      `Cell: (${ctx.labels.rowLabel} × ${ctx.labels.colLabel})`,
      `Ontologies: ${fmtOnts(ctx.ontologies?.entities)}`
    ].join('\n')
  )

  // Upstream context per doc kind
  const upstream: string[] = []
  if (kind === 'DS') {
    if (up.cRowSummary) upstream.push(`- C row summary: ${up.cRowSummary}`)
  }
  if (kind === 'SP') {
    if (up.dsCore) upstream.push(`- DS core: ${up.dsCore}`)
    if (up.dSummary) upstream.push(`- D summary: ${up.dSummary}`)
  }
  if (kind === 'X') {
    if (up.dsCore) upstream.push(`- DS core: ${up.dsCore}`)
    if (up.spCore) upstream.push(`- SP core: ${up.spCore}`)
  }
  if (kind === 'M') {
    if (up.dsCore) upstream.push(`- DS core: ${up.dsCore}`)
    if (up.spCore) upstream.push(`- SP core: ${up.spCore}`)
    if (up.xCore) upstream.push(`- X core: ${up.xCore}`)
  }
  if (up.anchors?.length) upstream.push(`- Anchors: ${up.anchors.join(' | ')}`)
  if (upstream.length) parts.push(`Upstream context:\n${upstream.join('\n')}`)

  parts.push(
    [
      `Output JSON shape:`,
      `{text: <doc-specific object>, terms_used: string[], warnings: string[]}`,
      `Doc-specific object keys for:`,
      DOC_KEY_HELP[kind],
    ].join('\n')
  )

  return parts.filter(Boolean).join('\n\n')
}

export function composeCellPrompt(
  kind: DocKind,
  ctx: CellContext,
  upstream: UpstreamContext
): BuiltPrompt {
  return {
    system: buildSystemPromptBracketedValley(ctx.valley, ctx.station),
    user: buildUserPromptForDoc(kind, ctx, upstream),
  }
}