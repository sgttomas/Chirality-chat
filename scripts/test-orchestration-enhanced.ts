// Load environment variables from .env.local if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, that's fine
}

import { orchestrateProblem, runDoc } from '../src/chirality-core/orchestrate';
import { DocKind, Finals, Triple } from '../src/chirality-core/contracts';

// Example problem (piping weld procedure)
const problem = {
  title: 'Piping Weld Procedure & Parameters',
  statement: `Specify the weld procedure and all design, examination, testing, 
and welding parameters and any additional precautions that must be taken 
for replacing a pipe spool (NPS 6, Sch 80, A106-B, 500°F design temp, 
350 psig design pressure) in rich amine service.`,
  initialVector: [
    'role: expert in piping engineering and ASME/API codes and standards',
    'context: maintenance team replacing spool in rich amine service',
    'task: cut out old spool, weld in new one'
  ]
};

// Enhanced version with detailed progress tracking
type Version = 1 | 2 | 3;

function stepConstraints(kind: DocKind, v: Version, deps: Partial<Record<DocKind, any>>) {
  const label = { DS: 'Data Sheet', SP: 'Standard Procedure', X: 'Guidance Document', M: 'Solution Statements' }[kind];
  const depList = Object.keys(deps).length
    ? Object.keys(deps).map(k => `${k} V${v === 1 ? 1 : v - 1}`).join(', ')
    : 'none';
  return [
    `You are generating: ${label} V${v}.`,
    `Consider only these dependencies: ${depList}.`,
    `Do not regenerate other documents.`,
    `Emit strictly the Triple JSON for ${kind} (no extra fields, no prose).`
  ];
}

async function orchestrateProblemWithDetailedProgress(
  problem: { title: string; statement: string; initialVector: string[] }
): Promise<{ finals: Finals; history: Record<Version, Partial<Finals>>; U3: any }> {
  const history: Record<Version, Partial<Finals>> = { 1: {}, 2: {}, 3: {} };
  let finals: Finals = {};
  
  console.log('\x1b[36m━━━ Starting Iterative Orchestration ━━━\x1b[0m');
  console.log(`📋 Problem: ${problem.title}\n`);
  
  const startTime = Date.now();
  let stepCount = 0;
  const totalSteps = 12; // 4 docs * 3 rounds
  
  const call = async <T>(
    kind: DocKind, 
    v: Version, 
    deps: Partial<Record<DocKind, Triple<any>>>
  ): Promise<Triple<T>> => {
    stepCount++;
    const progress = Math.round((stepCount / totalSteps) * 100);
    const label = { DS: 'Data Sheet', SP: 'Standard Procedure', X: 'Solution', M: 'Guidance' }[kind];
    
    console.log(`\x1b[33m[${progress}%]\x1b[0m Round ${v}, Step ${stepCount}/${totalSteps}: Generating ${label} V${v}...`);
    
    const extraConstraints = stepConstraints(kind, v, deps);
    const stepStart = Date.now();
    
    try {
      const result = await runDoc(kind, problem, finals, {
        extraConstraints,
        upstreamOverride: deps
      }) as Triple<T>;
      
      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1);
      console.log(`  ✅ ${label} V${v} complete (${elapsed}s)`);
      
      return result;
    } catch (error) {
      console.log(`  ❌ ${label} V${v} failed: ${error}`);
      throw error;
    }
  };
  
  try {
    // ----- Round 1 -----
    console.log('\n\x1b[35m═══ Round 1: Initial Generation ═══\x1b[0m');
    history[1].DS = finals.DS = await call<any>('DS', 1, {});
    history[1].SP = finals.SP = await call<any>('SP', 1, { DS: finals.DS! });
    history[1].X  = finals.X  = await call<any>('X',  1, { DS: finals.DS!, SP: finals.SP! });
    history[1].M  = finals.M  = await call<any>('M',  1, { DS: finals.DS!, SP: finals.SP!, X: finals.X! });
    
    // ----- Round 2 -----
    console.log('\n\x1b[35m═══ Round 2: Cross-Document Refinement ═══\x1b[0m');
    history[2].DS = finals.DS = await call<any>('DS', 2, { SP: history[1].SP!, X: history[1].X!, M: history[1].M! });
    history[2].SP = finals.SP = await call<any>('SP', 2, { DS: finals.DS!, X: history[1].X!, M: history[1].M! });
    history[2].X  = finals.X  = await call<any>('X',  2, { DS: finals.DS!, SP: finals.SP!, M: history[1].M! });
    history[2].M  = finals.M  = await call<any>('M',  2, { DS: finals.DS!, SP: finals.SP!, X: finals.X! });
    
    // ----- Round 3 -----
    console.log('\n\x1b[35m═══ Round 3: Final Convergence ═══\x1b[0m');
    history[3].DS = finals.DS = await call<any>('DS', 3, { SP: history[2].SP!, X: history[2].X!, M: history[2].M! });
    history[3].SP = finals.SP = await call<any>('SP', 3, { DS: finals.DS!, X: history[2].X!, M: history[2].M! });
    history[3].X  = finals.X  = await call<any>('X',  3, { DS: finals.DS!, SP: finals.SP!, M: history[2].M! });
    history[3].M  = finals.M  = await call<any>('M',  3, { DS: finals.DS!, SP: finals.SP!, X: finals.X! });
    
    // Calculate U3
    const { synthesizeU } = await import('../src/chirality-core/orchestrate');
    const U3 = synthesizeU(3, finals);
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n\x1b[32m✨ Orchestration Complete in ${totalTime}s\x1b[0m`);
    
    return { finals, history, U3 };
  } catch (error) {
    console.error('\n\x1b[31m❌ Orchestration failed:\x1b[0m', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('\x1b[31m❌ Error: OPENAI_API_KEY environment variable is not set\x1b[0m');
      console.error('Please set it before running this script:');
      console.error('  export OPENAI_API_KEY=your-api-key');
      console.error('Or create a .env.local file with:');
      console.error('  OPENAI_API_KEY=your-api-key');
      process.exit(1);
    }
    
    const { finals, history, U3 } = await orchestrateProblemWithDetailedProgress(problem);
    
    // Display results
    console.log('\n\x1b[36m━━━ Orchestration Results ━━━\x1b[0m\n');
    
    // Convergence summary
    console.log('\x1b[35m📊 Convergence Summary (U3):\x1b[0m');
    console.log(`  Status: ${U3.convergence}`);
    console.log(`  Open Issues: ${U3.open_issues?.length || 0}`);
    if (U3.open_issues?.length) {
      U3.open_issues.forEach((issue: string, i: number) => {
        console.log(`    ${i + 1}. ${issue}`);
      });
    }
    
    // Show final documents (abbreviated)
    console.log('\n\x1b[35m📄 Final Documents (Round 3):\x1b[0m');
    
    if (finals.DS?.text) {
      const ds = finals.DS.text;
      console.log('\n\x1b[32mData Sheet:\x1b[0m');
      console.log(`  Field: ${ds.data_field}`);
      if (ds.type) console.log(`  Type: ${ds.type}`);
      if (ds.units) console.log(`  Units: ${ds.units}`);
    }
    
    if (finals.SP?.text) {
      const sp = finals.SP.text;
      console.log('\n\x1b[32mStandard Procedure:\x1b[0m');
      console.log(`  Step: ${sp.step}`);
      if (sp.purpose) console.log(`  Purpose: ${sp.purpose}`);
    }
    
    if (finals.X?.text) {
      const x = finals.X.text;
      console.log('\n\x1b[32mSolution:\x1b[0m');
      console.log(`  Heading: ${x.heading}`);
      console.log(`  Narrative: ${x.narrative.substring(0, 100)}...`);
    }
    
    if (finals.M?.text) {
      const m = finals.M.text;
      console.log('\n\x1b[32mGuidance:\x1b[0m');
      console.log(`  Statement: ${m.statement}`);
      if (m.residual_risk?.length) {
        console.log(`  Residual Risks: ${m.residual_risk.length} identified`);
      }
    }
    
    // Option to save full output
    console.log('\n\x1b[36m💾 Full output available. To save:\x1b[0m');
    console.log('  npx ts-node scripts/test-orchestration.ts > output.json');
    
  } catch (err) {
    console.error('\x1b[31m❌ Fatal error:\x1b[0m', err);
    process.exit(1);
  }
})();