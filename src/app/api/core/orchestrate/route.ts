import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { orchestrateProblem } from '../../../../chirality-core/orchestrate';

const Body = z.object({
  title: z.string().min(1),
  statement: z.string().min(1),
  initialVector: z.array(z.string()).default([])
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const { title, statement, initialVector } = parsed.data;
    const { finals, history, U3 } = await orchestrateProblem({ title, statement, initialVector });

    return NextResponse.json({ finals, history, U3 }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}