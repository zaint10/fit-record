import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (body.action === 'complete') {
      const set = await db.completeSet(params.id);
      return NextResponse.json(set);
    }
    
    const set = await db.updateExerciseSet(params.id, body);
    return NextResponse.json(set);
  } catch (error) {
    console.error('Failed to update set:', error);
    return NextResponse.json({ error: 'Failed to update set' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.deleteExerciseSet(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete set:', error);
    return NextResponse.json({ error: 'Failed to delete set' }, { status: 500 });
  }
}
