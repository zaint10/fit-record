import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const exerciseId = searchParams.get('exercise_id');
    const type = searchParams.get('type');
    
    if (!clientId) {
      return NextResponse.json({ error: 'client_id required' }, { status: 400 });
    }
    
    // Get max weight for specific exercise
    if (type === 'max_weight' && exerciseId) {
      const maxWeight = await db.getClientMaxWeight(clientId, exerciseId);
      return NextResponse.json({ max_weight_kg: maxWeight });
    }
    
    // Get exercise history (all PRs)
    if (type === 'exercise_history') {
      const history = await db.getClientExerciseHistory(clientId);
      return NextResponse.json(history);
    }
    
    // Get last workout exercises
    if (type === 'last_workout') {
      const exercises = await db.getClientLastWorkoutExercises(clientId);
      return NextResponse.json(exercises);
    }
    
    // Get recent workouts
    if (type === 'recent_workouts') {
      const limit = searchParams.get('limit');
      const workouts = await db.getRecentWorkoutsForClient(clientId, limit ? parseInt(limit) : 10);
      return NextResponse.json(workouts);
    }
    
    return NextResponse.json({ error: 'type parameter required' }, { status: 400 });
  } catch (error) {
    console.error('Failed to get history:', error);
    return NextResponse.json({ error: 'Failed to get history' }, { status: 500 });
  }
}
