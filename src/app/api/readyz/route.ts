import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  // Simple readiness check - just verify the app is running
  return NextResponse.json({ ready: true });
}