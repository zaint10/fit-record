import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.deleteWorkoutExercise(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete workout exercise:', error);
    return NextResponse.json({ error: 'Failed to delete workout exercise' }, { status: 500 });
  }
}
