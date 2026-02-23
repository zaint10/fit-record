import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const exercise = await db.getExercise(params.id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Failed to get exercise:', error);
    return NextResponse.json({ error: 'Failed to get exercise' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const exercise = await db.updateExercise(params.id, body);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Failed to update exercise:', error);
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.deleteExercise(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete exercise:', error);
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
  }
}
