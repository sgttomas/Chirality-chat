import { DocKind, Finals, Triple, DS, SP, X, M, W, U, Round } from './contracts';
import { buildSystem } from './systemPrompt';
import { buildUser } from './userPrompt';
import { retrieveSummary } from './rag/retrieve';
import { callJSON } from './vendor/llm';
import { guard } from './validators';
import { compactDS, compactSP, compactX } from './compactor';

export async function runDoc(
  kind: DocKind,
  problem: { title: string; statement: string; initialVector: string[] },
  finals: Finals
): Promise<Triple<DS | SP | X | M>> {
  const upstream = {
    DS: finals.DS ? compactDS(finals.DS.text) : undefined,
    SP: finals.SP ? compactSP(finals.SP.text) : undefined,
    X: finals.X ? compactX(finals.X.text) : undefined,
  };
  
  const retrieved = await retrieveSummary(problem.statement, 12);
  const system = buildSystem(problem.title, finals);
  const user = buildUser(kind, {
    problemStatement: problem.statement,
    initialVector: problem.initialVector,
    upstream, 
    retrieved,
    constraints: [
      'Prefer cited evidence when available.',
      'Populate source_refs/refs/trace_back with citation IDs (CIT:src#p).',
      'No filler; keep payload fields crisp and specific.',
    ],
  });

  try {
    // Two-pass generation: propose then finalize
    const draft = await callJSON(system, user, { temperature: 0.7 });
    const final = await callJSON(system, user, { temperature: 0.5, prior: draft });

    // Handle extra wrapper layer that LLM sometimes adds
    let processedFinal = final;
    
    // Case 1: Wrapped in text.KIND format
    if (final?.text && typeof final.text === 'object' && final.text[kind]) {
      console.log(`Unwrapping extra ${kind} layer from text wrapper`);
      processedFinal = {
        ...final,
        text: final.text[kind]
      };
    } 
    // Case 2: Direct KIND wrapper without text layer
    else if (final && final[kind] && !final.text) {
      console.log(`Unwrapping direct ${kind} wrapper`);
      processedFinal = {
        text: final[kind],
        terms_used: final.terms_used || [],
        warnings: final.warnings || []
      };
    }

    if (!guard.triple(processedFinal)) {
      console.log('Triple validation failed for:', JSON.stringify(processedFinal, null, 2));
      throw new Error('Triple shape invalid');
    }
    
    return processedFinal as Triple<any>;
  } catch (error) {
    console.error(`Error generating ${kind}:`, error);
    // Return a minimal valid structure on error
    return {
      text: kind === 'DS' ? { data_field: 'Error generating document' } as any :
            kind === 'SP' ? { step: 'Error generating document' } as any :
            kind === 'X' ? { heading: 'Error', narrative: 'Error generating document' } as any :
            { statement: 'Error generating document' } as any,
      terms_used: [],
      warnings: [`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

export function diffW<T extends object>(prev: T, next: T): W {
  const changed: string[] = [];
  const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  for (const k of keys) {
    if (JSON.stringify((prev as any)[k]) !== JSON.stringify((next as any)[k])) {
      changed.push(k);
    }
  }
  return { 
    changed_keys: changed, 
    reason: 'Auto-diff', 
    evidence: [] 
  };
}

export function synthesizeU(round: Round, finals: Finals): U {
  const risks = (finals.M?.text.residual_risk || []).length;
  const convergence = risks ? (round === 3 ? 'Partial' : 'Open') : 'Closed';
  const summary = `Round ${round}: ${convergence}.`;
  return { 
    round, 
    convergence, 
    open_issues: risks ? finals.M?.text.residual_risk : [], 
    summary 
  };
}