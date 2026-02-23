import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const muscleGroup = searchParams.get('muscle_group');
    
    const exercises = muscleGroup 
      ? await db.getExercisesByMuscleGroup(muscleGroup as any)
      : await db.getExercises();
    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Failed to get exercises:', error);
    return NextResponse.json({ error: 'Failed to get exercises' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const exercise = await db.createExercise(body);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Failed to create exercise:', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
