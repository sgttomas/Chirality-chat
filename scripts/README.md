# Orchestration Test Scripts

Test scripts for verifying the new iterative orchestration system implemented in `orchestrate.ts`.

## Scripts

### `test-orchestration.ts`
Basic orchestration test that runs the full 3-round document generation and displays results.

### `test-orchestration-enhanced.ts` 
Enhanced version with detailed progress tracking, colored output, and step-by-step progress indicators.

## How to Run

### Prerequisites
1. Ensure you have an OpenAI API key set up:
   ```bash
   export OPENAI_API_KEY=your-api-key
   ```
   Or create a `.env.local` file in the project root:
   ```
   OPENAI_API_KEY=your-api-key
   OPENAI_MODEL=gpt-4.1-nano
   ```

### Running the Scripts

**Option 1: Using tsx (recommended - faster)**
```bash
npx tsx scripts/test-orchestration.ts
# or
npx tsx scripts/test-orchestration-enhanced.ts
```

**Option 2: Using ts-node**
```bash
npx ts-node scripts/test-orchestration.ts
# or  
npx ts-node scripts/test-orchestration-enhanced.ts
```

**Option 3: Save output to file**
```bash
npx tsx scripts/test-orchestration.ts > orchestration-output.json
```

## What the Scripts Test

The scripts exercise the complete iterative orchestration flow:

1. **Round 1**: Initial document generation (DS → SP → X → M)
2. **Round 2**: Cross-document refinement with V1 dependencies
3. **Round 3**: Final convergence with V2 dependencies

Each round generates 4 documents:
- **DS**: Data Sheet (technical parameters)
- **SP**: Standard Procedure (step-by-step process)
- **X**: Solution Document (guidance and narrative)
- **M**: Guidance Document (statements and risk assessment)

## Expected Output

The scripts will show:
- Progress indicators for each generation step
- Per-round document outputs (JSON format)
- Final convergence summary (U3)
- Latest documents from Round 3
- Summary statistics

## Test Problem

The scripts use a piping engineering example:
- **Problem**: Replacing a pipe spool in rich amine service
- **Specs**: NPS 6, Sch 80, A106-B, 500°F, 350 psig
- **Context**: ASME/API codes compliance, maintenance procedures

## Troubleshooting

### "OPENAI_API_KEY not set"
- Set the environment variable or add it to `.env.local`
- Make sure you have API credits available

### "ts-node not found" 
- Install globally: `npm install -g ts-node`
- Or use tsx: `npx tsx` (recommended)

### TypeScript compilation errors
- Ensure all dependencies are installed: `npm install`
- Check that the orchestrate.ts changes have been applied correctly

### Generation failures
- Check your OpenAI API key has access to `gpt-4.1-nano`
- Verify network connectivity
- Check OpenAI service status

## Performance Notes

- Full orchestration generates 12 documents (4 docs × 3 rounds)
- Typical runtime: 30-60 seconds depending on API response times
- Each document generation involves 2-pass LLM calls (draft + final)
- Progress indicators help track which step is currently running