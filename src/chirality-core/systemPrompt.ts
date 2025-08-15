import { Finals } from './contracts';
import { compactDS, compactSP, compactX, compactM } from './compactor';

export function buildSystem(problemTitle: string, finals?: Finals) {
  const pinned: string[] = [];
  if (finals?.DS) pinned.push(`Pinned DS: ${compactDS(finals.DS.text)}`);
  if (finals?.SP) pinned.push(`Pinned SP: ${compactSP(finals.SP.text)}`);
  if (finals?.X)  pinned.push(`Pinned X: ${compactX(finals.X.text)}`);
  if (finals?.M)  pinned.push(`Pinned M: ${compactM(finals.M.text)}`);

  return [
    `You are the Chirality Prompt Engine running a four-document pipeline: DS → SP → X → M.`,
    `Do two passes: propose (temp=0.7) then finalize (temp=0.5).`,
    `STRICT JSON ONLY: {"text":<payload>,"terms_used":string[],"warnings":string[]}. No prose outside JSON.`,
    `Doc payload keys:`,
    `- DS:{data_field,units,type,source_refs,notes}`,
    `- SP:{step,purpose,inputs,outputs,preconditions,postconditions,refs}`,
    `- X:{heading,narrative,precedents,successors,context_notes,refs}`,
    `- M:{statement,justification,trace_back,assumptions,residual_risk}`,
    `Citations: include evidence IDs (e.g., "CIT:src#p") inside source_refs/refs/trace_back when used.`,
    pinned.length ? `---\nContinuity (most recent Finals):\n${pinned.join('\n')}\n---` : '',
    `If new inputs conflict with pinned Finals, explain in "warnings" and prefer the latest Final unless the evidence is stronger.`,
  ].filter(Boolean).join('\n');
}