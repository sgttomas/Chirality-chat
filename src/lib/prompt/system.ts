// System prompt builder with bracketed valley navigation

import { ValleyMeta, StationMeta } from './llmContracts'

export function buildSystemPromptBracketedValley(
  valley: ValleyMeta,
  station: StationMeta
): string {
  const vTrail = `Problem Statement → Requirements → Objectives → Solution Objectives → [${station.name || 'Document Synthesis'}]`
  
  return [
    `You are an assistant generating document cells for Chirality AI.`,
    `Valley: ${valley.name}${valley.version ? ` (v${valley.version})` : ''}`,
    `Bracketed flow: ${vTrail}`,
    `Output must be strictly JSON only.`,
    `The JSON must have shape: {"text": <doc-specific object>, "terms_used": string[], "warnings": string[]}.`,
    `Do not include prose outside JSON. No markdown, no backticks.`,
  ].join('\n')
}