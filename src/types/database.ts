// Database types for FitRecord

export type MuscleGroup = 
  | 'chest'
  | 'shoulders'
  | 'triceps'
  | 'back'
  | 'biceps'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'full_body';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  is_bodyweight: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  started_at: string;
  ended_at?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSessionClient {
  id: string;
  workout_session_id: string;
  client_id: string;
  created_at: string;
  client?: Client;
}

export interface WorkoutExercise {
  id: string;
  workout_session_id: string;
  client_id: string;
  exercise_id: string;
  order_index: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  exercise?: Exercise;
  sets?: ExerciseSet[];
}

export interface ExerciseSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps?: number;
  weight_kg?: number;
  is_completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientExerciseMaxWeight {
  client_id: string;
  exercise_id: string;
  max_weight_kg: number;
  last_performed_at: string;
}

export interface ClientLastWorkout {
  client_id: string;
  workout_session_id: string;
  started_at: string;
  ended_at: string;
}

// Form types
export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface ExerciseFormData {
  name: string;
  muscle_group: MuscleGroup;
  is_bodyweight: boolean;
  description?: string;
}

export interface SetFormData {
  reps?: number;
  weight_kg?: number;
}

// Workout session with full details
export interface WorkoutSessionWithDetails extends WorkoutSession {
  clients: Client[];
  exercises: WorkoutExerciseWithDetails[];
}

export interface WorkoutExerciseWithDetails extends WorkoutExercise {
  exercise: Exercise;
  sets: ExerciseSet[];
  max_weight?: number;
}

// Muscle group display info
export const MUSCLE_GROUPS: { value: MuscleGroup; label: string; emoji: string }[] = [
  { value: 'chest', label: 'Chest', emoji: '💪' },
  { value: 'shoulders', label: 'Shoulders', emoji: '🏋️' },
  { value: 'triceps', label: 'Triceps', emoji: '💪' },
  { value: 'back', label: 'Back', emoji: '🔙' },
  { value: 'biceps', label: 'Biceps', emoji: '💪' },
  { value: 'legs', label: 'Legs', emoji: '🦵' },
  { value: 'core', label: 'Core', emoji: '🎯' },
  { value: 'cardio', label: 'Cardio', emoji: '❤️' },
  { value: 'full_body', label: 'Full Body', emoji: '🏃' },
];

export const getMuscleGroupLabel = (group: MuscleGroup): string => {
  const found = MUSCLE_GROUPS.find(mg => mg.value === group);
  return found ? found.label : group;
};

export const getMuscleGroupEmoji = (group: MuscleGroup): string => {
  const found = MUSCLE_GROUPS.find(mg => mg.value === group);
  return found ? found.emoji : '💪';
};
