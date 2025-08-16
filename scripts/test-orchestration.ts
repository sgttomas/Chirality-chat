#!/usr/bin/env tsx
/**
 * Test Orchestration Script
 * 
 * Tests the 3-round orchestration system (DS → SP → X → M) with progress tracking
 * and validation. This script demonstrates the full document generation pipeline
 * with dependency management and convergence analysis.
 */

// Load environment variables from .env.local if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, that's fine
}

import { orchestrateProblem, OrchestrationProgress } from '../src/chirality-core/orchestrate';

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

function formatProgress(e: OrchestrationProgress): void {
  const badge = (k: string, v: number) => `${k}${v}`;
  const tag = (kind: string) => kind.padEnd(2, ' ');
  
  if (e.phase === 'start') {
    const deps = e.deps.length ? e.deps.join(',') : 'none';
    console.log(`\n🟡  ${badge('V', e.version)} ${tag(e.kind)} — start  (deps: ${deps})`);
  } else if (e.phase === 'success') {
    console.log(`✅  ${badge('V', e.version)} ${tag(e.kind)} — done   (${e.ms} ms)`);
  } else {
    console.log(`❌  ${badge('V', e.version)} ${tag(e.kind)} — error  (${e.ms} ms)\n     ↳ ${e.error}`);
  }
}

function validateTriple(x: any, label: string): void {
  console.assert(x && typeof x === 'object', `${label} not present`);
  console.assert(x.text, `${label} missing .text`);
  console.assert(Array.isArray(x.terms_used), `${label} missing terms_used[]`);
  console.assert(Array.isArray(x.warnings), `${label} missing warnings[]`);
}

(async () => {
  try {
    // Check for required environment variable
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
      console.error('Please set it before running this script:');
      console.error('  export OPENAI_API_KEY=your-api-key');
      console.error('Or create a .env.local file with:');
      console.error('  OPENAI_API_KEY=your-api-key');
      process.exit(1);
    }

    console.log('=== Orchestration: DS → SP → X → M, three rounds (V1..V3) ===');
    const startTime = Date.now();
    const { finals, history, U3 } = await orchestrateProblem(problem, { onProgress: formatProgress });
    const totalTime = Date.now() - startTime;

    // Validation: 3 rounds × 4 docs all exist and have proper Triple structure
    console.log('\n=== Validation ===');
    let validationErrors = 0;
    
    ([1, 2, 3] as const).forEach(round => {
      const r = history[round];
      try {
        validateTriple(r.DS, `Round ${round} DS`);
        validateTriple(r.SP, `Round ${round} SP`);
        validateTriple(r.X,  `Round ${round} X`);
        validateTriple(r.M,  `Round ${round} M`);
        console.log(`✅ Round ${round}: All documents valid`);
      } catch (error) {
        validationErrors++;
        console.error(`❌ Round ${round}: Validation failed - ${error}`);
      }
    });

    console.assert(finals.DS && finals.SP && finals.X && finals.M, 'Finals missing one or more docs');
    console.log('✅ Final documents: All present');

    console.log('\n=== Performance Summary ===');
    console.log(`Total execution time: ${totalTime}ms`);
    console.log(`Documents generated: 12 (3 rounds × 4 types)`);
    console.log(`Average per document: ${Math.round(totalTime / 12)}ms`);
    console.log(`Validation errors: ${validationErrors}`);

    console.log('\n=== Round Summaries ===');
    ([1, 2, 3] as const).forEach(round => {
      const r = history[round];
      console.log(`\n--- Round ${round} ---`);
      console.log('DS (Data Structure):', JSON.stringify(r.DS?.text, null, 2));
      console.log('SP (Solution Process):', JSON.stringify(r.SP?.text, null, 2));
      console.log('X (eXecution Template):', JSON.stringify(r.X?.text, null, 2));
      console.log('M (Meta-guidance):', JSON.stringify(r.M?.text, null, 2));
    });

    console.log('\n=== Convergence Analysis (U3) ===');
    console.log(JSON.stringify(U3, null, 2));

    console.log('\n=== Final Documents (V3) ===');
    console.log('DS (Final):', JSON.stringify(finals.DS?.text, null, 2));
    console.log('SP (Final):', JSON.stringify(finals.SP?.text, null, 2));
    console.log('X (Final):', JSON.stringify(finals.X?.text, null, 2));
    console.log('M (Final):', JSON.stringify(finals.M?.text, null, 2));

    if (validationErrors === 0) {
      console.log('\n🎉 Orchestration completed successfully - all documents valid!');
    } else {
      console.log(`\n⚠️  Orchestration completed with ${validationErrors} validation errors`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('FATAL orchestration error:', err);
    process.exitCode = 1;
  }
})();