// Add this function at the end of the file
export async function deleteWorkoutSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}import { supabase } from './supabase';
import type {
  Client,
  ClientFormData,
  Exercise,
  ExerciseFormData,
  WorkoutSession,
  WorkoutExercise,
  ExerciseSet,
  ClientExerciseMaxWeight,
  MuscleGroup,
} from '@/types/database';

// ============== CLIENTS ==============

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createClient(client: ClientFormData): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateClient(id: string, client: ClientFormData): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(client)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============== EXERCISES ==============

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('muscle_group')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('muscle_group', muscleGroup)
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createExercise(exercise: ExerciseFormData): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateExercise(id: string, exercise: ExerciseFormData): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update(exercise)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============== WORKOUT SESSIONS ==============

// Optionally filter by clientId: only return the most recent active session for that client
export async function getActiveWorkoutSession(clientId?: string): Promise<WorkoutSession | null> {
  let query = supabase
    .from('workout_sessions')
    .select('*, workout_session_clients!inner(client_id)')
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1);

  if (clientId) {
    query = query.contains('workout_session_clients', [{ client_id: clientId }]);
  }

  const { data, error } = await query;
  if (error && error.code !== 'PGRST116') throw error;
  return data && data.length > 0 ? data[0] : null;
}

// Add a client to an existing workout session
export async function addClientToWorkoutSession(sessionId: string, clientId: string): Promise<void> {
  const { error } = await supabase
    .from('workout_session_clients')
    .insert({ workout_session_id: sessionId, client_id: clientId });
  if (error) throw error;
}
export async function getWorkoutSession(id: string): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getWorkoutSessions(limit = 20): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

export async function createWorkoutSession(clientIds: string[]): Promise<WorkoutSession> {
  // First create the workout session
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({ is_active: true })
    .select()
    .single();
  
  if (sessionError) throw sessionError;
  
  // Then add clients to the session
  const clientInserts = clientIds.map(clientId => ({
    workout_session_id: session.id,
    client_id: clientId,
  }));
  
  const { error: clientsError } = await supabase
    .from('workout_session_clients')
    .insert(clientInserts);
  
  if (clientsError) throw clientsError;
  
  return session;
}

export async function endWorkoutSession(id: string, notes?: string): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({ 
      ended_at: new Date().toISOString(), 
      is_active: false,
      notes 
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getWorkoutSessionClients(sessionId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('workout_session_clients')
    .select('client:clients(*)')
    .eq('workout_session_id', sessionId);
  
  if (error) throw error;
  return data?.map(d => d.client as unknown as Client) || [];
}

// ============== WORKOUT EXERCISES ==============

export async function getWorkoutExercises(sessionId: string, clientId: string): Promise<WorkoutExercise[]> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      exercise:exercises(*),
      sets:exercise_sets(*)
    `)
    .eq('workout_session_id', sessionId)
    .eq('client_id', clientId)
    .order('order_index');
  
  if (error) throw error;
  return data || [];
}

export async function addWorkoutExercise(
  sessionId: string,
  clientId: string,
  exerciseId: string,
  orderIndex: number
): Promise<WorkoutExercise> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      workout_session_id: sessionId,
      client_id: clientId,
      exercise_id: exerciseId,
      order_index: orderIndex,
    })
    .select(`
      *,
      exercise:exercises(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteWorkoutExercise(id: string): Promise<void> {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============== EXERCISE SETS ==============

export async function addExerciseSet(
  workoutExerciseId: string,
  setNumber: number,
  reps?: number,
  weightKg?: number
): Promise<ExerciseSet> {
  const { data, error } = await supabase
    .from('exercise_sets')
    .insert({
      workout_exercise_id: workoutExerciseId,
      set_number: setNumber,
      reps,
      weight_kg: weightKg,
      is_completed: false,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateExerciseSet(
  id: string,
  updates: Partial<ExerciseSet>
): Promise<ExerciseSet> {
  const { data, error } = await supabase
    .from('exercise_sets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteExerciseSet(id: string): Promise<void> {
  const { error } = await supabase
    .from('exercise_sets')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function completeSet(id: string): Promise<ExerciseSet> {
  return updateExerciseSet(id, { is_completed: true });
}

// ============== CLIENT HISTORY ==============

export async function getClientMaxWeight(
  clientId: string,
  exerciseId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('client_exercise_max_weight')
    .select('max_weight_kg')
    .eq('client_id', clientId)
    .eq('exercise_id', exerciseId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data?.max_weight_kg || null;
}

export async function getClientExerciseHistory(clientId: string): Promise<ClientExerciseMaxWeight[]> {
  const { data, error } = await supabase
    .from('client_exercise_max_weight')
    .select('*')
    .eq('client_id', clientId);
  
  if (error) throw error;
  return data || [];
}

export async function getClientLastWorkoutExercises(
  clientId: string
): Promise<WorkoutExercise[]> {
  // Get the client's last completed workout session
  const { data: lastWorkout, error: lastWorkoutError } = await supabase
    .from('client_last_workout')
    .select('workout_session_id')
    .eq('client_id', clientId)
    .single();
  
  if (lastWorkoutError && lastWorkoutError.code !== 'PGRST116') throw lastWorkoutError;
  if (!lastWorkout) return [];
  
  // Get exercises from that workout
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      exercise:exercises(*),
      sets:exercise_sets(*)
    `)
    .eq('workout_session_id', lastWorkout.workout_session_id)
    .eq('client_id', clientId)
    .order('order_index');
  
  if (error) throw error;
  return data || [];
}

export async function getRecentWorkoutsForClient(
  clientId: string,
  limit = 10
): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_session_clients')
    .select(`
      workout_session:workout_sessions(*)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data?.map(d => d.workout_session as unknown as WorkoutSession).filter(Boolean) || [];
}
