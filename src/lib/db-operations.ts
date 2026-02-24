import { db, generateId, now, ensureInitialized } from './db';
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

// Helper to convert SQLite row to typed object with boolean conversion
function toClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    gym_time: (row.gym_time as string | null) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function toExercise(row: Record<string, unknown>): Exercise {
  return {
    id: row.id as string,
    name: row.name as string,
    muscle_group: row.muscle_group as MuscleGroup,
    is_bodyweight: Boolean(row.is_bodyweight),
    description: (row.description as string | null) ?? undefined,
    default_rest_seconds: (row.default_rest_seconds as number | null) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function toWorkoutSession(row: Record<string, unknown>): WorkoutSession {
  return {
    id: row.id as string,
    started_at: row.started_at as string,
    ended_at: (row.ended_at as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function toExerciseSet(row: Record<string, unknown>): ExerciseSet {
  return {
    id: row.id as string,
    workout_exercise_id: row.workout_exercise_id as string,
    set_number: row.set_number as number,
    reps: (row.reps as number | null) ?? undefined,
    weight_kg: (row.weight_kg as number | null) ?? undefined,
    is_completed: Boolean(row.is_completed),
    notes: (row.notes as string | null) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function toWorkoutExercise(row: Record<string, unknown>): WorkoutExercise {
  return {
    id: row.id as string,
    workout_session_id: row.workout_session_id as string,
    client_id: row.client_id as string,
    exercise_id: row.exercise_id as string,
    order_index: row.order_index as number,
    notes: (row.notes as string | null) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ============== CLIENTS ==============

export async function getClients(): Promise<Client[]> {
  await ensureInitialized();
  const result = await db.execute('SELECT * FROM clients ORDER BY name');
  return result.rows.map(row => toClient(row as Record<string, unknown>));
}

export async function getClient(id: string): Promise<Client | null> {
  await ensureInitialized();
  const result = await db.execute({
    sql: 'SELECT * FROM clients WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return toClient(result.rows[0] as Record<string, unknown>);
}

export async function createClient(client: ClientFormData): Promise<Client> {
  await ensureInitialized();
  const id = generateId();
  const timestamp = now();
  
  await db.execute({
    sql: `INSERT INTO clients (id, name, email, phone, notes, gym_time, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, client.name, client.email || null, client.phone || null, client.notes || null, client.gym_time || null, timestamp, timestamp],
  });
  
  return getClient(id) as Promise<Client>;
}

export async function updateClient(id: string, client: ClientFormData): Promise<Client> {
  await ensureInitialized();
  const timestamp = now();
  
  await db.execute({
    sql: `UPDATE clients SET name = ?, email = ?, phone = ?, notes = ?, gym_time = ?, updated_at = ? WHERE id = ?`,
    args: [client.name, client.email || null, client.phone || null, client.notes || null, client.gym_time || null, timestamp, id],
  });
  
  return getClient(id) as Promise<Client>;
}

export async function deleteClient(id: string): Promise<void> {
  await ensureInitialized();
  await db.execute({
    sql: 'DELETE FROM clients WHERE id = ?',
    args: [id],
  });
}

// ============== EXERCISES ==============

export async function getExercises(): Promise<Exercise[]> {
  await ensureInitialized();
  const result = await db.execute('SELECT * FROM exercises ORDER BY muscle_group, name');
  return result.rows.map(row => toExercise(row as Record<string, unknown>));
}

export async function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
  await ensureInitialized();
  const result = await db.execute({
    sql: 'SELECT * FROM exercises WHERE muscle_group = ? ORDER BY name',
    args: [muscleGroup],
  });
  return result.rows.map(row => toExercise(row as Record<string, unknown>));
}

export async function getExercise(id: string): Promise<Exercise | null> {
  await ensureInitialized();
  const result = await db.execute({
    sql: 'SELECT * FROM exercises WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return toExercise(result.rows[0] as Record<string, unknown>);
}

export async function createExercise(exercise: ExerciseFormData): Promise<Exercise> {
  await ensureInitialized();
  const id = generateId();
  const timestamp = now();
  
  await db.execute({
    sql: `INSERT INTO exercises (id, name, muscle_group, is_bodyweight, description, default_rest_seconds, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, exercise.name, exercise.muscle_group, exercise.is_bodyweight ? 1 : 0, exercise.description || null, exercise.default_rest_seconds || null, timestamp, timestamp],
  });
  
  return getExercise(id) as Promise<Exercise>;
}

export async function updateExercise(id: string, exercise: ExerciseFormData): Promise<Exercise> {
  await ensureInitialized();
  const timestamp = now();
  
  await db.execute({
    sql: `UPDATE exercises SET name = ?, muscle_group = ?, is_bodyweight = ?, description = ?, default_rest_seconds = ?, updated_at = ? WHERE id = ?`,
    args: [exercise.name, exercise.muscle_group, exercise.is_bodyweight ? 1 : 0, exercise.description || null, exercise.default_rest_seconds || null, timestamp, id],
  });
  
  return getExercise(id) as Promise<Exercise>;
}

export async function deleteExercise(id: string): Promise<void> {
  await ensureInitialized();
  await db.execute({
    sql: 'DELETE FROM exercises WHERE id = ?',
    args: [id],
  });
}

// ============== WORKOUT SESSIONS ==============

export async function getActiveWorkoutSession(clientId?: string): Promise<WorkoutSession | null> {
  await ensureInitialized();
  
  let result;
  if (clientId) {
    result = await db.execute({
      sql: `SELECT ws.* FROM workout_sessions ws
            INNER JOIN workout_session_clients wsc ON ws.id = wsc.workout_session_id
            WHERE ws.is_active = 1 AND wsc.client_id = ?
            ORDER BY ws.started_at DESC LIMIT 1`,
      args: [clientId],
    });
  } else {
    result = await db.execute(
      'SELECT * FROM workout_sessions WHERE is_active = 1 ORDER BY started_at DESC LIMIT 1'
    );
  }
  
  if (result.rows.length === 0) return null;
  return toWorkoutSession(result.rows[0] as Record<string, unknown>);
}

export async function addClientToWorkoutSession(sessionId: string, clientId: string): Promise<void> {
  await ensureInitialized();
  const id = generateId();
  const timestamp = now();
  
  await db.execute({
    sql: 'INSERT INTO workout_session_clients (id, workout_session_id, client_id, created_at) VALUES (?, ?, ?, ?)',
    args: [id, sessionId, clientId, timestamp],
  });
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession | null> {
  await ensureInitialized();
  const result = await db.execute({
    sql: 'SELECT * FROM workout_sessions WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return toWorkoutSession(result.rows[0] as Record<string, unknown>);
}

export async function getWorkoutSessions(limit = 20): Promise<WorkoutSession[]> {
  await ensureInitialized();
  const result = await db.execute({
    sql: 'SELECT * FROM workout_sessions ORDER BY started_at DESC LIMIT ?',
    args: [limit],
  });
  return result.rows.map(row => toWorkoutSession(row as Record<string, unknown>));
}

export async function createWorkoutSession(clientIds: string[]): Promise<WorkoutSession> {
  await ensureInitialized();
  const sessionId = generateId();
  const timestamp = now();
  
  // Create the workout session
  await db.execute({
    sql: `INSERT INTO workout_sessions (id, started_at, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)`,
    args: [sessionId, timestamp, timestamp, timestamp],
  });
  
  // Add clients to the session
  for (const clientId of clientIds) {
    const linkId = generateId();
    await db.execute({
      sql: 'INSERT INTO workout_session_clients (id, workout_session_id, client_id, created_at) VALUES (?, ?, ?, ?)',
      args: [linkId, sessionId, clientId, timestamp],
    });
  }
  
  return getWorkoutSession(sessionId) as Promise<WorkoutSession>;
}

export async function updateWorkoutSessionStartTime(id: string, startedAt: string): Promise<WorkoutSession> {
  await ensureInitialized();
  const timestamp = now();
  
  await db.execute({
    sql: `UPDATE workout_sessions SET started_at = ?, updated_at = ? WHERE id = ?`,
    args: [startedAt, timestamp, id],
  });
  
  return getWorkoutSession(id) as Promise<WorkoutSession>;
}

export async function endWorkoutSession(id: string, notes?: string, customEndTime?: string): Promise<WorkoutSession> {
  await ensureInitialized();
  const timestamp = now();
  const endedAt = customEndTime || timestamp;
  
  // Auto-complete all sets that have weight or reps entered
  await db.execute({
    sql: `UPDATE exercise_sets 
          SET is_completed = 1, updated_at = ?
          WHERE workout_exercise_id IN (
            SELECT we.id FROM workout_exercises we WHERE we.workout_session_id = ?
          )
          AND (weight_kg IS NOT NULL OR reps IS NOT NULL)
          AND is_completed = 0`,
    args: [timestamp, id],
  });
  
  await db.execute({
    sql: `UPDATE workout_sessions SET ended_at = ?, is_active = 0, notes = ?, updated_at = ? WHERE id = ?`,
    args: [endedAt, notes || null, timestamp, id],
  });
  
  return getWorkoutSession(id) as Promise<WorkoutSession>;
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  await ensureInitialized();
  await db.execute({
    sql: 'DELETE FROM workout_sessions WHERE id = ?',
    args: [id],
  });
}

export async function getWorkoutSessionClients(sessionId: string): Promise<Client[]> {
  await ensureInitialized();
  const result = await db.execute({
    sql: `SELECT c.* FROM clients c
          INNER JOIN workout_session_clients wsc ON c.id = wsc.client_id
          WHERE wsc.workout_session_id = ?`,
    args: [sessionId],
  });
  return result.rows.map(row => toClient(row as Record<string, unknown>));
}

// ============== WORKOUT EXERCISES ==============

export async function getWorkoutExercises(sessionId: string, clientId: string): Promise<WorkoutExercise[]> {
  await ensureInitialized();
  
  // Single query with JOINs to get all data at once
  const result = await db.execute({
    sql: `SELECT 
            we.id as we_id,
            we.workout_session_id,
            we.client_id,
            we.exercise_id,
            we.order_index,
            we.notes as we_notes,
            we.created_at as we_created_at,
            we.updated_at as we_updated_at,
            e.id as e_id,
            e.name as e_name,
            e.muscle_group as e_muscle_group,
            e.is_bodyweight as e_is_bodyweight,
            e.description as e_description,
            e.default_rest_seconds as e_default_rest_seconds,
            e.created_at as e_created_at,
            e.updated_at as e_updated_at,
            es.id as es_id,
            es.workout_exercise_id as es_workout_exercise_id,
            es.set_number as es_set_number,
            es.reps as es_reps,
            es.weight_kg as es_weight_kg,
            es.is_completed as es_is_completed,
            es.notes as es_notes,
            es.created_at as es_created_at,
            es.updated_at as es_updated_at
          FROM workout_exercises we
          LEFT JOIN exercises e ON we.exercise_id = e.id
          LEFT JOIN exercise_sets es ON we.id = es.workout_exercise_id
          WHERE we.workout_session_id = ? AND we.client_id = ?
          ORDER BY we.order_index, es.set_number`,
    args: [sessionId, clientId],
  });
  
  // Group results by workout exercise
  const workoutExercisesMap = new Map<string, WorkoutExercise>();
  
  for (const row of result.rows) {
    const r = row as Record<string, unknown>;
    const weId = r.we_id as string;
    
    if (!workoutExercisesMap.has(weId)) {
      // Create workout exercise entry
      const we: WorkoutExercise = {
        id: weId,
        workout_session_id: r.workout_session_id as string,
        client_id: r.client_id as string,
        exercise_id: r.exercise_id as string,
        order_index: r.order_index as number,
        notes: (r.we_notes as string | null) ?? undefined,
        created_at: r.we_created_at as string,
        updated_at: r.we_updated_at as string,
        sets: [],
      };
      
      // Add exercise details if available
      if (r.e_id) {
        we.exercise = {
          id: r.e_id as string,
          name: r.e_name as string,
          muscle_group: r.e_muscle_group as MuscleGroup,
          is_bodyweight: Boolean(r.e_is_bodyweight),
          description: (r.e_description as string | null) ?? undefined,
          default_rest_seconds: (r.e_default_rest_seconds as number | null) ?? undefined,
          created_at: r.e_created_at as string,
          updated_at: r.e_updated_at as string,
        };
      }
      
      workoutExercisesMap.set(weId, we);
    }
    
    // Add set if exists
    if (r.es_id) {
      const set: ExerciseSet = {
        id: r.es_id as string,
        workout_exercise_id: r.es_workout_exercise_id as string,
        set_number: r.es_set_number as number,
        reps: (r.es_reps as number | null) ?? undefined,
        weight_kg: (r.es_weight_kg as number | null) ?? undefined,
        is_completed: Boolean(r.es_is_completed),
        notes: (r.es_notes as string | null) ?? undefined,
        created_at: r.es_created_at as string,
        updated_at: r.es_updated_at as string,
      };
      workoutExercisesMap.get(weId)!.sets!.push(set);
    }
  }
  
  return Array.from(workoutExercisesMap.values());
}

export async function addWorkoutExercise(
  sessionId: string,
  clientId: string,
  exerciseId: string,
  orderIndex: number
): Promise<WorkoutExercise> {
  await ensureInitialized();
  const id = generateId();
  const timestamp = now();
  
  await db.execute({
    sql: `INSERT INTO workout_exercises (id, workout_session_id, client_id, exercise_id, order_index, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, sessionId, clientId, exerciseId, orderIndex, timestamp, timestamp],
  });
  
  // Single query with JOIN to get workout exercise + exercise details
  const result = await db.execute({
    sql: `SELECT 
            we.id, we.workout_session_id, we.client_id, we.exercise_id, 
            we.order_index, we.notes, we.created_at, we.updated_at,
            e.id as e_id, e.name as e_name, e.muscle_group as e_muscle_group,
            e.is_bodyweight as e_is_bodyweight, e.description as e_description,
            e.default_rest_seconds as e_default_rest_seconds,
            e.created_at as e_created_at, e.updated_at as e_updated_at
          FROM workout_exercises we
          LEFT JOIN exercises e ON we.exercise_id = e.id
          WHERE we.id = ?`,
    args: [id],
  });
  
  const r = result.rows[0] as Record<string, unknown>;
  
  const we: WorkoutExercise = {
    id: r.id as string,
    workout_session_id: r.workout_session_id as string,
    client_id: r.client_id as string,
    exercise_id: r.exercise_id as string,
    order_index: r.order_index as number,
    notes: (r.notes as string | null) ?? undefined,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    sets: [],
  };
  
  if (r.e_id) {
    we.exercise = {
      id: r.e_id as string,
      name: r.e_name as string,
      muscle_group: r.e_muscle_group as MuscleGroup,
      is_bodyweight: Boolean(r.e_is_bodyweight),
      description: (r.e_description as string | null) ?? undefined,
      default_rest_seconds: (r.e_default_rest_seconds as number | null) ?? undefined,
      created_at: r.e_created_at as string,
      updated_at: r.e_updated_at as string,
    };
  }
  
  return we;
}

export async function deleteWorkoutExercise(id: string): Promise<void> {
  await ensureInitialized();
  await db.execute({
    sql: 'DELETE FROM workout_exercises WHERE id = ?',
    args: [id],
  });
}

// ============== EXERCISE SETS ==============

export async function addExerciseSet(
  workoutExerciseId: string,
  setNumber: number,
  reps?: number,
  weightKg?: number
): Promise<ExerciseSet> {
  await ensureInitialized();
  const id = generateId();
  const timestamp = now();
  
  await db.execute({
    sql: `INSERT INTO exercise_sets (id, workout_exercise_id, set_number, reps, weight_kg, is_completed, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    args: [id, workoutExerciseId, setNumber, reps ?? null, weightKg ?? null, timestamp, timestamp],
  });
  
  const result = await db.execute({
    sql: 'SELECT * FROM exercise_sets WHERE id = ?',
    args: [id],
  });
  
  return toExerciseSet(result.rows[0] as Record<string, unknown>);
}

export async function updateExerciseSet(
  id: string,
  updates: Partial<ExerciseSet>
): Promise<ExerciseSet> {
  await ensureInitialized();
  const timestamp = now();
  
  // Build dynamic update query
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (updates.reps !== undefined) {
    fields.push('reps = ?');
    values.push(updates.reps ?? null);
  }
  if (updates.weight_kg !== undefined) {
    fields.push('weight_kg = ?');
    values.push(updates.weight_kg ?? null);
  }
  if (updates.is_completed !== undefined) {
    fields.push('is_completed = ?');
    values.push(updates.is_completed ? 1 : 0);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes ?? null);
  }
  
  fields.push('updated_at = ?');
  values.push(timestamp);
  values.push(id);
  
  await db.execute({
    sql: `UPDATE exercise_sets SET ${fields.join(', ')} WHERE id = ?`,
    args: values,
  });
  
  const result = await db.execute({
    sql: 'SELECT * FROM exercise_sets WHERE id = ?',
    args: [id],
  });
  
  return toExerciseSet(result.rows[0] as Record<string, unknown>);
}

export async function deleteExerciseSet(id: string): Promise<void> {
  await ensureInitialized();
  await db.execute({
    sql: 'DELETE FROM exercise_sets WHERE id = ?',
    args: [id],
  });
}

export async function completeSet(id: string): Promise<ExerciseSet> {
  return updateExerciseSet(id, { is_completed: true });
}

// ============== CLIENT HISTORY ==============

export async function getClientMaxWeight(
  clientId: string,
  exerciseId: string
): Promise<number | null> {
  await ensureInitialized();
  
  // Replaces the client_exercise_max_weight view with a query
  const result = await db.execute({
    sql: `SELECT MAX(es.weight_kg) as max_weight_kg
          FROM workout_exercises we
          JOIN exercise_sets es ON we.id = es.workout_exercise_id
          JOIN workout_sessions ws ON we.workout_session_id = ws.id
          WHERE ws.ended_at IS NOT NULL 
            AND es.is_completed = 1
            AND we.client_id = ?
            AND we.exercise_id = ?`,
    args: [clientId, exerciseId],
  });
  
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as Record<string, unknown>;
  return row.max_weight_kg as number | null;
}

export async function getClientExerciseHistory(clientId: string): Promise<ClientExerciseMaxWeight[]> {
  await ensureInitialized();
  
  const result = await db.execute({
    sql: `SELECT 
            we.client_id,
            we.exercise_id,
            MAX(es.weight_kg) as max_weight_kg,
            MAX(ws.ended_at) as last_performed_at
          FROM workout_exercises we
          JOIN exercise_sets es ON we.id = es.workout_exercise_id
          JOIN workout_sessions ws ON we.workout_session_id = ws.id
          WHERE ws.ended_at IS NOT NULL AND es.is_completed = 1 AND we.client_id = ?
          GROUP BY we.client_id, we.exercise_id`,
    args: [clientId],
  });
  
  return result.rows.map(row => {
    const r = row as Record<string, unknown>;
    return {
      client_id: r.client_id as string,
      exercise_id: r.exercise_id as string,
      max_weight_kg: r.max_weight_kg as number,
      last_performed_at: r.last_performed_at as string,
    };
  });
}

export async function getClientLastWorkoutExercises(
  clientId: string
): Promise<WorkoutExercise[]> {
  await ensureInitialized();
  
  // Get the client's last completed workout session (replaces client_last_workout view)
  const lastWorkoutResult = await db.execute({
    sql: `SELECT ws.id as workout_session_id
          FROM workout_session_clients wsc
          JOIN workout_sessions ws ON wsc.workout_session_id = ws.id
          WHERE wsc.client_id = ? AND ws.ended_at IS NOT NULL
          ORDER BY ws.ended_at DESC
          LIMIT 1`,
    args: [clientId],
  });
  
  if (lastWorkoutResult.rows.length === 0) return [];
  
  const row = lastWorkoutResult.rows[0] as Record<string, unknown>;
  const sessionId = row.workout_session_id as string;
  
  // Get exercises from that workout
  return getWorkoutExercises(sessionId, clientId);
}

export async function getRecentWorkoutsForClient(
  clientId: string,
  limit = 10
): Promise<WorkoutSession[]> {
  await ensureInitialized();
  
  const result = await db.execute({
    sql: `SELECT ws.* FROM workout_sessions ws
          INNER JOIN workout_session_clients wsc ON ws.id = wsc.workout_session_id
          WHERE wsc.client_id = ?
          ORDER BY ws.started_at DESC
          LIMIT ?`,
    args: [clientId, limit],
  });
  
  return result.rows.map(row => toWorkoutSession(row as Record<string, unknown>));
}
