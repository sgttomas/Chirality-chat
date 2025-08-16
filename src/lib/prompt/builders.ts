// Glue code: building prompts from GraphQL pullCell results

import { DocKind, CellContext, UpstreamContext, BuiltPrompt } from './llmContracts'

export function buildFromPullCell(
  kind: DocKind,
  pull: any,                   // raw GraphQL result for this cell
  upstream: UpstreamContext
): BuiltPrompt {
  const ctx: CellContext = {
    valley: pull.valley || { name: 'Semantic Valley', version: '1.0' },
    station: pull.station || { name: 'Document Synthesis', index: 4 },
    matrix: pull.matrix || { name: kind },
    labels: pull.cell?.labels ?? { rowLabel: '', colLabel: '' },
    stage: pull.cell?.stage,
    traces: pull.cell?.traces,
    anchors: pull.cell?.anchors,
    ontologies: pull.ontologies,
  }
  // TODO: composeCellPrompt function not available - implement or import from correct location
  throw new Error('composeCellPrompt not implemented')
}

export { type DocKind, type CellContext, type UpstreamContext, type BuiltPrompt } from './llmContracts'