import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const clientId = searchParams.get('client_id');
    
    if (!sessionId || !clientId) {
      return NextResponse.json({ error: 'session_id and client_id required' }, { status: 400 });
    }
    
    const exercises = await db.getWorkoutExercises(sessionId, clientId);
    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Failed to get workout exercises:', error);
    return NextResponse.json({ error: 'Failed to get workout exercises' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, client_id, exercise_id, order_index } = body;
    
    const exercise = await db.addWorkoutExercise(session_id, client_id, exercise_id, order_index);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Failed to add workout exercise:', error);
    return NextResponse.json({ error: 'Failed to add workout exercise' }, { status: 500 });
  }
}
