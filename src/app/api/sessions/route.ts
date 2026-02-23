import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const active = searchParams.get('active');
    const clientId = searchParams.get('client_id');
    
    if (active === 'true') {
      const session = await db.getActiveWorkoutSession(clientId || undefined);
      return NextResponse.json(session);
    }
    
    const sessions = await db.getWorkoutSessions(limit ? parseInt(limit) : 20);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await db.createWorkoutSession(body.client_ids);
    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
