import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workout_exercise_id, set_number, reps, weight_kg } = body;
    
    const set = await db.addExerciseSet(workout_exercise_id, set_number, reps, weight_kg);
    return NextResponse.json(set);
  } catch (error) {
    console.error('Failed to add set:', error);
    return NextResponse.json({ error: 'Failed to add set' }, { status: 500 });
  }
}
