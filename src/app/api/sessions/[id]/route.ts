import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await db.getWorkoutSession(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (body.action === 'end') {
      const session = await db.endWorkoutSession(params.id, body.notes);
      return NextResponse.json(session);
    }
    
    if (body.action === 'add_client') {
      await db.addClientToWorkoutSession(params.id, body.client_id);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.deleteWorkoutSession(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
