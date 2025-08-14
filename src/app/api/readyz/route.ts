import { NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const driver = getNeo4jDriver();
    await driver.verifyConnectivity();
    return NextResponse.json({ ready: true });
  } catch (err: any) {
    return NextResponse.json(
      { ready: false, error: err?.message ?? 'Connectivity check failed' },
      { status: 500 }
    );
  }
}
