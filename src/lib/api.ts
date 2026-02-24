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

const API_BASE = '/api';

// ============== CLIENTS ==============

export async function getClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/clients`);
  if (!res.ok) throw new Error('Failed to fetch clients');
  return res.json();
}

export async function getClient(id: string): Promise<Client | null> {
  const res = await fetch(`${API_BASE}/clients/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch client');
  return res.json();
}

export async function createClient(client: ClientFormData): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
  if (!res.ok) throw new Error('Failed to create client');
  return res.json();
}

export async function updateClient(id: string, client: ClientFormData): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
  if (!res.ok) throw new Error('Failed to update client');
  return res.json();
}

export async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete client');
}

// ============== EXERCISES ==============

export async function getExercises(): Promise<Exercise[]> {
  const res = await fetch(`${API_BASE}/exercises`);
  if (!res.ok) throw new Error('Failed to fetch exercises');
  return res.json();
}

export async function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
  const res = await fetch(`${API_BASE}/exercises?muscle_group=${muscleGroup}`);
  if (!res.ok) throw new Error('Failed to fetch exercises');
  return res.json();
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const res = await fetch(`${API_BASE}/exercises/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch exercise');
  return res.json();
}

export async function createExercise(exercise: ExerciseFormData): Promise<Exercise> {
  const res = await fetch(`${API_BASE}/exercises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exercise),
  });
  if (!res.ok) throw new Error('Failed to create exercise');
  return res.json();
}

export async function updateExercise(id: string, exercise: ExerciseFormData): Promise<Exercise> {
  const res = await fetch(`${API_BASE}/exercises/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exercise),
  });
  if (!res.ok) throw new Error('Failed to update exercise');
  return res.json();
}

export async function deleteExercise(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/exercises/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete exercise');
}

// ============== WORKOUT SESSIONS ==============

export async function getActiveWorkoutSession(clientId?: string): Promise<WorkoutSession | null> {
  const params = new URLSearchParams({ active: 'true' });
  if (clientId) params.set('client_id', clientId);
  
  const res = await fetch(`${API_BASE}/sessions?${params}`);
  if (!res.ok) throw new Error('Failed to fetch active session');
  return res.json();
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession | null> {
  const res = await fetch(`${API_BASE}/sessions/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
}

export async function getWorkoutSessions(limit = 20): Promise<WorkoutSession[]> {
  const res = await fetch(`${API_BASE}/sessions?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function createWorkoutSession(clientIds: string[]): Promise<WorkoutSession> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_ids: clientIds }),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function endWorkoutSession(id: string, notes?: string, customEndTime?: string): Promise<WorkoutSession> {
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'end', notes, custom_end_time: customEndTime }),
  });
  if (!res.ok) throw new Error('Failed to end session');
  return res.json();
}

export async function updateWorkoutSessionStartTime(id: string, startedAt: string): Promise<WorkoutSession> {
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_start_time', started_at: startedAt }),
  });
  if (!res.ok) throw new Error('Failed to update session start time');
  return res.json();
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete session');
}

export async function addClientToWorkoutSession(sessionId: string, clientId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_client', client_id: clientId }),
  });
  if (!res.ok) throw new Error('Failed to add client to session');
}

export async function getWorkoutSessionClients(sessionId: string): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/clients`);
  if (!res.ok) throw new Error('Failed to fetch session clients');
  return res.json();
}

// ============== WORKOUT EXERCISES ==============

export async function getWorkoutExercises(sessionId: string, clientId: string): Promise<WorkoutExercise[]> {
  const params = new URLSearchParams({ session_id: sessionId, client_id: clientId });
  const res = await fetch(`${API_BASE}/workout-exercises?${params}`);
  if (!res.ok) throw new Error('Failed to fetch workout exercises');
  return res.json();
}

export async function addWorkoutExercise(
  sessionId: string,
  clientId: string,
  exerciseId: string,
  orderIndex: number
): Promise<WorkoutExercise> {
  const res = await fetch(`${API_BASE}/workout-exercises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      client_id: clientId,
      exercise_id: exerciseId,
      order_index: orderIndex,
    }),
  });
  if (!res.ok) throw new Error('Failed to add workout exercise');
  return res.json();
}

export async function deleteWorkoutExercise(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/workout-exercises/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete workout exercise');
}

// ============== EXERCISE SETS ==============

export async function addExerciseSet(
  workoutExerciseId: string,
  setNumber: number,
  reps?: number,
  weightKg?: number
): Promise<ExerciseSet> {
  const res = await fetch(`${API_BASE}/sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workout_exercise_id: workoutExerciseId,
      set_number: setNumber,
      reps,
      weight_kg: weightKg,
    }),
  });
  if (!res.ok) throw new Error('Failed to add set');
  return res.json();
}

export async function updateExerciseSet(
  id: string,
  updates: Partial<ExerciseSet>
): Promise<ExerciseSet> {
  const res = await fetch(`${API_BASE}/sets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update set');
  return res.json();
}

export async function deleteExerciseSet(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete set');
}

export async function completeSet(id: string): Promise<ExerciseSet> {
  const res = await fetch(`${API_BASE}/sets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'complete' }),
  });
  if (!res.ok) throw new Error('Failed to complete set');
  return res.json();
}

// ============== CLIENT HISTORY ==============

export async function getClientMaxWeight(
  clientId: string,
  exerciseId: string
): Promise<number | null> {
  const params = new URLSearchParams({
    client_id: clientId,
    exercise_id: exerciseId,
    type: 'max_weight',
  });
  const res = await fetch(`${API_BASE}/history?${params}`);
  if (!res.ok) throw new Error('Failed to fetch max weight');
  const data = await res.json();
  return data.max_weight_kg;
}

export async function getClientExerciseHistory(clientId: string): Promise<ClientExerciseMaxWeight[]> {
  const params = new URLSearchParams({
    client_id: clientId,
    type: 'exercise_history',
  });
  const res = await fetch(`${API_BASE}/history?${params}`);
  if (!res.ok) throw new Error('Failed to fetch exercise history');
  return res.json();
}

export async function getClientLastWorkoutExercises(
  clientId: string
): Promise<WorkoutExercise[]> {
  const params = new URLSearchParams({
    client_id: clientId,
    type: 'last_workout',
  });
  const res = await fetch(`${API_BASE}/history?${params}`);
  if (!res.ok) throw new Error('Failed to fetch last workout');
  return res.json();
}

export async function getRecentWorkoutsForClient(
  clientId: string,
  limit = 10
): Promise<WorkoutSession[]> {
  const params = new URLSearchParams({
    client_id: clientId,
    type: 'recent_workouts',
    limit: limit.toString(),
  });
  const res = await fetch(`${API_BASE}/history?${params}`);
  if (!res.ok) throw new Error('Failed to fetch recent workouts');
  return res.json();
}
