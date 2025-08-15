import { DocKind } from './contracts';

export function buildUser(kind: DocKind, args: {
  problemStatement: string;
  initialVector: string[];
  upstream?: { DS?: string; SP?: string; X?: string };
  retrieved?: { summary: string; citations: string[] };
  constraints?: string[];
  cell?: { rowLabel?: string; colLabel?: string };
}) {
  const L: string[] = [];
  L.push(`Problem Statement:\n${args.problemStatement}`);
  L.push(`Initial Vector:\n• ${args.initialVector.join(' • ')}`);
  L.push(`You are generating: ${kind}${args.cell?.rowLabel || args.cell?.colLabel ? 
    `\nCell: (${args.cell?.rowLabel ?? '-'} × ${args.cell?.colLabel ?? '-'})` : ''}`);

  const up: string[] = [];
  if (args.upstream?.DS) up.push(`- DS core: ${args.upstream.DS}`);
  if (args.upstream?.SP) up.push(`- SP core: ${args.upstream.SP}`);
  if (args.upstream?.X)  up.push(`- X core: ${args.upstream.X}`);
  if (up.length) L.push(`Upstream context:\n${up.join('\n')}`);

  if (args.retrieved?.summary) {
    L.push(`Retrieved evidence (summarized):\n${args.retrieved.summary}`);
    if (args.retrieved.citations?.length) {
      L.push(`Citations: ${args.retrieved.citations.join(', ')}`);
    }
  }

  L.push(`Output JSON shape:\n{text: <doc-object>, terms_used: string[], warnings: string[]}`);
  L.push(`Temperatures: propose=0.7, finalize=0.5`);
  if (args.constraints?.length) {
    L.push(`Constraints:\n- ${args.constraints.join('\n- ')}`);
  }
  return L.join('\n\n');
}