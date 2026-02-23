'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { getClients as fetchAllClients, addClientToWorkoutSession } from '@/lib/api';
import { LoadingScreen, LoadingSpinner } from '@/components/LoadingSpinner';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { 
  Plus, 
  Trash2, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Trophy,
  Clock,
  Users,
  Timer
} from 'lucide-react';
import {
  getWorkoutSession,
  getWorkoutSessionClients,
  getWorkoutExercises,
  getExercises,
  addWorkoutExercise,
  deleteWorkoutExercise,
  addExerciseSet,
  updateExerciseSet,
  deleteExerciseSet,
  completeSet,
  endWorkoutSession,
  getClientMaxWeight,
  getClientLastWorkoutExercises,
} from '@/lib/api';
import { deleteWorkoutSession } from '@/lib/api';
import type { 
  WorkoutSession, 
  Client, 
  Exercise, 
  WorkoutExercise,
  ExerciseSet,
  MuscleGroup 
} from '@/types/database';
import { MUSCLE_GROUPS, getMuscleGroupLabel, getMuscleGroupEmoji } from '@/types/database';

// Rest timer state type
interface RestTimer {
  startedAt: number;
  duration: number; // in seconds
  exerciseId: string; // to get exercise-specific rest time
}

// Default rest time options
const REST_TIME_OPTIONS = [30, 45, 60, 90, 120];
const DEFAULT_REST_SECONDS = 60;

// Local input component to handle typing without lag
function SetInput({ 
  value, 
  onChange, 
  disabled, 
  placeholder,
  type = 'number'
}: { 
  value: number | null | undefined;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}) {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '');

  // Sync local value when external value changes (e.g., from server)
  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        const parsed = localValue ? parseFloat(localValue) : undefined;
        if (parsed !== value) {
          onChange(parsed);
        }
      }}
      className="input py-2 text-center"
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

export default function WorkoutSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [lastWorkoutExercises, setLastWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [maxWeights, setMaxWeights] = useState<Record<string, number>>({});
  // For exercise picker modal: max weights for all exercises for selected client
  const [pickerMaxWeights, setPickerMaxWeights] = useState<Record<string, number>>({});
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [addClientLoading, setAddClientLoading] = useState(false);
      // Load all clients for add-client modal
      useEffect(() => {
        if (showAddClientModal) {
          fetchAllClients().then(setAllClients);
        }
      }, [showAddClientModal]);
    // Load all max weights for the selected client (for exercise picker modal)
    useEffect(() => {
      async function loadPickerMaxWeights() {
        if (!selectedClientId || exercises.length === 0) {
          setPickerMaxWeights({});
          return;
        }
        const weights: Record<string, number> = {};
        await Promise.all(
          exercises.map(async (ex) => {
            if (ex.is_bodyweight) return;
            const max = await getClientMaxWeight(selectedClientId, ex.id);
            if (max) weights[ex.id] = max;
          })
        );
        setPickerMaxWeights(weights);
      }
      loadPickerMaxWeights();
    }, [selectedClientId, exercises]);
  const [loading, setLoading] = useState(true);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [addForAllClients, setAddForAllClients] = useState(true);
  
  // Rest timer state
  const [restTimers, setRestTimers] = useState<Record<string, RestTimer | null>>({});
  const [globalRestSeconds, setGlobalRestSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitrecord_rest_seconds');
      return saved ? parseInt(saved) : DEFAULT_REST_SECONDS;
    }
    return DEFAULT_REST_SECONDS;
  });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const alertedTimersRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on mount
  useEffect(() => {
    // Create a short beep sound using Web Audio API
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2ZiHdybHKAi5aYlImAdnFzeIKPmJmThXpwbXN+i5eZlYh8cW90foqXmZWIfHJvdH6Kl5mViHxycHR+ipeTkYZ6cXB0fouYl5OIe3FvdH+Ll5eUiXtxb3R/i5aWk4l7cXB0f4uWlpOJe3FwdH+LlpaTiXtxcHR/i5aWk4l7cXB0f4uWlpOJe3FwdH+LlpaTiXtxcHR/i5aWk4l7cXB0f4uWlpOJe3FwdH+LlZWSiXtycHV/i5WWkoV5cHF2gouYl5KHeXBxdoKLmJeSh3lwcXaCi5iXkod5cHF2gouYl5KHeXBxdoKLmJeSh3lwcXaCi5iXkod5cHF2gouYl5KHeXBxdoKLmJeSh3lwcXaCi5iXkod5cHF2gouYl5KHeXBxdoKLmJeSh3lwcXaCi5aXkod5cXF2gouWl5KHeXFxdoKKlpaRh3pxcXaDipaWkYd6cXF2g4qWlpGHenFxdoOKlpaRh3pxcXaDipaWkYd6cXF2g4qWlpGHenFxdoOKlpaRh3pxcXaDipaWkYd6cXF2g4qWlpGHenFxdoOKlpaRh3pxcXaDipaVkIZ6cnJ3g4qVlZCGenJyd4OKlZWQhnpycneDipWVkIZ6cnJ3g4qVlZCGenJyd4OKlZWQhnpycneDipWVkIZ6cnJ3g4qVlZCGenJyd4OKlZWQhnpycneDipSUj4V6c3N4g4mUlI+FenNzeIOJlJSPhXpzc3iDiZSUj4V6c3N4g4mUlI+FenNzeIOJlJSPhXpzc3iDiZSUj4V6c3N4g4mUlI+FenNzeIOJlJSPhXpzc3iDiZOTjoV7c3N4g4mTk46Fe3NzeIOJk5OOhXtzc3iDiZOTjoV7c3N4g4mTk46Fe3NzeIOJk5OOhXtzc3iDiZOTjoV7c3N4g4mTk46Fe3NzeIOJk5OOhXtzc3iDiZKSjYR7dHR5g4iSko2Ee3R0eYOIkpKNhHt0dHmDiJKSjYR7dHR5g4iSko2Ee3R0eYOIkpKNhHt0dHmDiJKSjYR7dHR5g4iSko2Ee3R0eYOIkpKNhHt0dHmDiJGRjIN8dHV5g4iRkYyDfHR1eYOIkZGMg3x0dXmDiJGRjIN8dHV5g4iRkYyDfHR1eYOIkZGMg3x0dXmDiJGRjIN8dHV5g4iRkYyDfHR1eYOIkZGMg3x0dXmDiJGRjIN8dHV5g4iQkIuCfHV1eoOHkJCLgnx1dXqDh5CQi4J8dXV6g4eQkIuCfHV1eoOHkJCLgnx1dXqDh5CQi4J8dXV6g4eQkIuCfHV1eoOHkJCLgnx1dXqDh5CQi4J8dXV6g4ePj4qBfHZ2eoKHj4+KgXx2dnqCh4+PioF8dnZ6goePj4qBfHZ2eoKHj4+KgXx2dnqCh4+PioF8dnZ6goePj4qBfHZ2eoKHj4+KgXx2dnqCh4+PioF8dnZ6goePj4qBfHZ2eoKHjo6JgH12d3qCho6OiYB9dnd6goaOjomAfXZ3eoKGjo6JgH12d3qCho6OiYB9dnd6goaOjomAfXZ3eoKGjo6JgH12d3qCho6OiYB9dnd6goaOjomAfXZ3eoKGjY2If313d3uBhY2NiH99d3d7gYWNjYh/fXd3e4GFjY2If313d3uBhY2NiH99d3d7gYWNjYh/fXd3e4GFjY2If313d3uBhY2NiH99d3d7gYWNjYh/fXd3e4GFjIyHfn54eHuBhYyMh35+eHh7gYWMjId+fnh4e4GFjIyHfn54eHuBhYyMh35+eHh7gYWMjId+fnh4e4GFjIyHfn54eHuBhYyMh35+eHh7gYWMjId+fnh4e4GFi4uGfX94eXyAhIuLhn1/eHl8gISLi4Z9f3h5fICEi4uGfX94eXyAhIuLhn1/eHl8gISLi4Z9f3h5fICEi4uGfX94eXyAhIuLhn1/eHl8gISLi4Z9f3h5fICEioqFfIB5enx/g4qKhXyAeXp8f4OKioV8gHl6fH+DioqFfIB5enx/g4qKhXyAeXp8f4OKioV8gHl6fH+DioqFfIB5enx/g4qKhXyAeXp8f4OKioV8gHl6fH+DiYmEe4B6e31/g4mJhHuAent9f4OJiYR7gHp7fX+DiYmEe4B6e31/g4mJhHuAent9f4OJiYR7gHp7fX+DiYmEe4B6e31/g4mJhHuAent9f4OJiYR7gHp7fX+DiYiDeoF7fH5+goiIg3qBe3x+foKIiIN6gXt8fn6CiIiDeoF7fH5+goiIg3qBe3x+foKIiIN6gXt8fn6CiIiDeoF7fH5+goiIg3qBe3x+foKIiIN6gXt8fn6Ch4eCeYF8fH5+goeHgnmBfHx+foKHh4J5gXx8fn6Ch4eCeYF8fH5+goeHgnmBfHx+foKHh4J5gXx8fn6Ch4eCeYF8fH5+goeHgnmBfHx+foKHh4J5gXx8fn6Ch4aCeIJ9fX9+gYaGgniCfX1/foGGhoJ4gn19f36BhoaCeIJ9fX9+gYaGgniCfX1/foGGhoJ4gn19f36BhoaCeIJ9fX1/foGGhoJ4gn19fX9+gYaGgniCfX19f36BhoaCeIJ9fX1/foGGhYF3gn5+f39/gYWFgXeCfn5/f3+BhYWBd4J+fn9/f4GFhYF3gn5+f39/gYWFgXeCfn5/f3+BhYWBd4J+fn9/f4GFhYF3gn5+f39/gYWFgXeCfn5/f3+BhYWBd4J+fn9/f4GFhYF3gn5+f39/gYWFgXeCfn5/f3+BhQ==');
    return () => {
      audioRef.current = null;
    };
  }, []);

  // Timer tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for timer completions and trigger alerts
  useEffect(() => {
    Object.entries(restTimers).forEach(([clientId, timer]) => {
      if (!timer) return;
      
      const elapsed = Math.floor((currentTime - timer.startedAt) / 1000);
      const remaining = timer.duration - elapsed;
      
      // Alert when timer just hits 0 (only once per timer)
      if (remaining <= 0 && !alertedTimersRef.current.has(clientId)) {
        alertedTimersRef.current.add(clientId);
        
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        
        // Play beep
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    });
  }, [currentTime, restTimers]);

  // Save global rest time to localStorage
  const updateGlobalRestTime = useCallback((seconds: number) => {
    setGlobalRestSeconds(seconds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fitrecord_rest_seconds', seconds.toString());
    }
  }, []);

  // Get rest time for an exercise (exercise-specific or global default)
  const getRestTimeForExercise = useCallback((exerciseId: string): number => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.default_rest_seconds ?? globalRestSeconds;
  }, [exercises, globalRestSeconds]);

  // Start rest timer for a client
  const startRestTimer = useCallback((clientId: string, exerciseId: string) => {
    const duration = getRestTimeForExercise(exerciseId);
    alertedTimersRef.current.delete(clientId); // Reset alert flag
    setRestTimers(prev => ({
      ...prev,
      [clientId]: {
        startedAt: Date.now(),
        duration,
        exerciseId,
      },
    }));
  }, [getRestTimeForExercise]);

  // Clear rest timer for a client
  const clearRestTimer = useCallback((clientId: string) => {
    alertedTimersRef.current.delete(clientId);
    setRestTimers(prev => ({
      ...prev,
      [clientId]: null,
    }));
  }, []);

  // Get timer display for a client
  const getTimerDisplay = useCallback((clientId: string): { text: string; isReady: boolean; isResting: boolean } | null => {
    const timer = restTimers[clientId];
    if (!timer) return null;
    
    const elapsed = Math.floor((currentTime - timer.startedAt) / 1000);
    const remaining = timer.duration - elapsed;
    
    if (remaining > 0) {
      return { text: `${remaining}s`, isReady: false, isResting: true };
    } else {
      const overtime = Math.abs(remaining);
      return { text: `+${overtime}s`, isReady: true, isResting: false };
    }
  }, [currentTime, restTimers]);

  async function handleCancelWorkout() {
    try {
      await deleteWorkoutSession(sessionId);
      router.push('/');
    } catch (error) {
      console.error('Failed to cancel workout:', error);
    }
  }

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (selectedClientId) {
      loadClientWorkout();
    }
  }, [selectedClientId]);

  async function loadSession() {
    try {
      const [sessionData, clientsData, exercisesData] = await Promise.all([
        getWorkoutSession(sessionId),
        getWorkoutSessionClients(sessionId),
        getExercises(),
      ]);

      setSession(sessionData);
      setClients(clientsData);
      setExercises(exercisesData);

      if (clientsData.length > 0) {
        setSelectedClientId(clientsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadClientWorkout() {
    if (!selectedClientId) return;

    try {
      const [workoutData, lastWorkout] = await Promise.all([
        getWorkoutExercises(sessionId, selectedClientId),
        getClientLastWorkoutExercises(selectedClientId),
      ]);

      setWorkoutExercises(workoutData);
      setLastWorkoutExercises(lastWorkout);

      // Expand all exercises by default
      setExpandedExercises(new Set(workoutData.map(we => we.id)));

      // Load max weights for each exercise
      const weights: Record<string, number> = {};
      for (const we of workoutData) {
        const maxWeight = await getClientMaxWeight(selectedClientId, we.exercise_id);
        if (maxWeight) {
          weights[we.exercise_id] = maxWeight;
        }
      }
      setMaxWeights(weights);
    } catch (error) {
      console.error('Failed to load workout:', error);
    }
  }

  async function handleAddExercise(exerciseId: string) {
    if (!selectedClientId) return;
    try {
      // Determine which clients to add the exercise for
      let clientsToAdd: Client[];
      
      if (addForAllClients && clients.length > 1) {
        // Add for all clients who don't already have this exercise
        clientsToAdd = clients.filter(client =>
          !workoutExercises.some(we => we.exercise_id === exerciseId && we.client_id === client.id)
        );
      } else {
        // Add only for the selected client if they don't already have it
        const alreadyHas = workoutExercises.some(
          we => we.exercise_id === exerciseId && we.client_id === selectedClientId
        );
        clientsToAdd = alreadyHas ? [] : [clients.find(c => c.id === selectedClientId)!];
      }
      
      if (clientsToAdd.length === 0) {
        setShowExerciseModal(false);
        return;
      }
      
      // Add the exercise for each client
      for (const client of clientsToAdd) {
        const orderIndex = workoutExercises.filter(we => we.client_id === client.id).length;
        const newExercise = await addWorkoutExercise(
          sessionId,
          client.id,
          exerciseId,
          orderIndex
        );
        // Add 3 default sets
        const sets: ExerciseSet[] = [];
        for (let i = 1; i <= 3; i++) {
          const set = await addExerciseSet(newExercise.id, i);
          sets.push(set);
        }
        // Get max weight for this exercise
        const maxWeight = await getClientMaxWeight(client.id, exerciseId);
        if (maxWeight) {
          setMaxWeights(prev => ({ ...prev, [exerciseId]: maxWeight }));
        }
        // If this is the selected client, add to UI immediately
        if (client.id === selectedClientId) {
          setWorkoutExercises(prev => [...prev, { ...newExercise, sets }]);
          setExpandedExercises(prev => {
            const next = new Set(prev);
            next.add(newExercise.id);
            return next;
          });
        }
      }
      setShowExerciseModal(false);
      // For other clients, reload session to update UI
      await loadClientWorkout();
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  }

  async function handleDeleteExercise(workoutExerciseId: string) {
    try {
      await deleteWorkoutExercise(workoutExerciseId);
      setWorkoutExercises(prev => prev.filter(we => we.id !== workoutExerciseId));
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
  }

  async function handleAddSet(workoutExerciseId: string) {
    try {
      const exercise = workoutExercises.find(we => we.id === workoutExerciseId);
      const setNumber = (exercise?.sets?.length || 0) + 1;
      const newSet = await addExerciseSet(workoutExerciseId, setNumber);

      setWorkoutExercises(prev =>
        prev.map(we =>
          we.id === workoutExerciseId
            ? { ...we, sets: [...(we.sets || []), newSet] }
            : we
        )
      );
    } catch (error) {
      console.error('Failed to add set:', error);
    }
  }

  async function handleUpdateSet(setId: string, updates: Partial<ExerciseSet>) {
    try {
      const updatedSet = await updateExerciseSet(setId, updates);

      setWorkoutExercises(prev =>
        prev.map(we => ({
          ...we,
          sets: we.sets?.map(s => (s.id === setId ? updatedSet : s)),
        }))
      );
    } catch (error) {
      console.error('Failed to update set:', error);
    }
  }

  async function handleCompleteSet(setId: string, exerciseId?: string) {
    try {
      const completedSet = await completeSet(setId);

      // Find the workout exercise to check if there are more sets remaining
      const workoutExercise = workoutExercises.find(we => 
        we.sets?.some(s => s.id === setId)
      );
      const sets = workoutExercise?.sets || [];
      // Count incomplete sets BEFORE this completion (excluding the one we just completed)
      const remainingIncompleteSets = sets.filter(s => !s.is_completed && s.id !== setId).length;

      setWorkoutExercises(prev =>
        prev.map(we => ({
          ...we,
          sets: we.sets?.map(s => (s.id === setId ? completedSet : s)),
        }))
      );

      if (selectedClientId && exerciseId) {
        if (remainingIncompleteSets > 0) {
          // More sets to do - start/restart the timer
          startRestTimer(selectedClientId, exerciseId);
        } else {
          // Last set of this exercise - clear the timer
          clearRestTimer(selectedClientId);
        }
      }
    } catch (error) {
      console.error('Failed to complete set:', error);
    }
  }

  async function handleDeleteSet(setId: string) {
    try {
      await deleteExerciseSet(setId);

      setWorkoutExercises(prev =>
        prev.map(we => ({
          ...we,
          sets: we.sets?.filter(s => s.id !== setId),
        }))
      );
    } catch (error) {
      console.error('Failed to delete set:', error);
    }
  }

  async function handleEndWorkout() {
    try {
      await endWorkoutSession(sessionId);
      router.push('/workout/history');
    } catch (error) {
      console.error('Failed to end workout:', error);
    }
  }

  function toggleExerciseExpand(exerciseId: string) {
    setExpandedExercises(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  }

  const filteredExercises = exercises.filter(e =>
    selectedMuscleGroup === 'all' || e.muscle_group === selectedMuscleGroup
  );

  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const group = exercise.muscle_group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(exercise);
    return acc;
  }, {} as Record<MuscleGroup, Exercise[]>);

  if (loading) {
    return (
      <div>
        <PageHeader title="Workout" showBack />
        <LoadingScreen />
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <PageHeader title="Workout" showBack />
        <div className="page-content">
          <p className="text-center text-gray-500">Session not found.</p>
        </div>
      </div>
    );
  }

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div>
      <PageHeader 
        title="Workout" 
        showBack
        rightAction={
          session.is_active && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEndConfirm(true)}
                className="btn btn-danger"
              >
                End
              </button>
            </div>
          )
        }
      />
      
      <div className="page-content">
        {/* Session Info */}
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Clock size={18} />
              <span className="text-sm">
                Started {new Date(session.started_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Users size={18} />
              <span className="text-sm">{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
              {session.is_active && (
                <button
                  className="btn btn-secondary ml-2"
                  onClick={() => setShowAddClientModal(true)}
                >
                  + Add Client
                </button>
              )}
            </div>
          </div>
          
          {/* Rest Time Selector */}
          {session.is_active && clients.length > 0 && (
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <Timer size={16} className="text-gray-500" />
              <span className="text-sm text-gray-500 mr-2">Default Rest:</span>
              <div className="flex gap-1 flex-wrap">
                {REST_TIME_OPTIONS.map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => updateGlobalRestTime(seconds)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      globalRestSeconds === seconds
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      {/* Add Client Modal */}
      <Modal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        title="Add Client to Workout"
      >
        <div className="space-y-2">
          {allClients
            .filter(c => !clients.some(cl => cl.id === c.id))
            .map(client => (
              <button
                key={client.id}
                className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                disabled={addClientLoading}
                onClick={async () => {
                  setAddClientLoading(true);
                  try {
                    await addClientToWorkoutSession(sessionId, client.id);
                    setShowAddClientModal(false);
                    await loadSession();
                  } catch (e) {
                    alert('Failed to add client');
                  } finally {
                    setAddClientLoading(false);
                  }
                }}
              >
                <span>{client.name}</span>
              </button>
            ))}
          {allClients.filter(c => !clients.some(cl => cl.id === c.id)).length === 0 && (
            <div className="text-gray-500 text-center">No clients available to add.</div>
          )}
        </div>
      </Modal>

        {/* Client Tabs */}
        {clients.length > 1 && (
          <div className="mb-4 overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {clients.map((client) => {
                const timerDisplay = getTimerDisplay(client.id);
                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      // Clicking on a ready client clears their timer
                      if (timerDisplay?.isReady) {
                        clearRestTimer(client.id);
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedClientId === client.id
                        ? 'bg-primary-600 text-white'
                        : timerDisplay?.isReady
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 animate-pulse-ready'
                          : timerDisplay?.isResting
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {client.name}
                    {timerDisplay && (
                      <span className="flex items-center gap-1">
                        <Timer size={14} />
                        {timerDisplay.text}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Client Header */}
        {selectedClient && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{selectedClient.name}</h2>
              {/* Show timer for single client workouts */}
              {clients.length === 1 && (() => {
                const timerDisplay = getTimerDisplay(selectedClient.id);
                if (!timerDisplay) return null;
                return (
                  <button
                    onClick={() => timerDisplay.isReady && clearRestTimer(selectedClient.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                      timerDisplay.isReady
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 animate-pulse-ready'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    <Timer size={14} />
                    {timerDisplay.text}
                  </button>
                );
              })()}
            </div>
            {session.is_active && (
              <button
                onClick={() => setShowExerciseModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                <span>Add Exercise</span>
              </button>
            )}
          </div>
        )}

        {/* Last Workout Preview */}
        {lastWorkoutExercises.length > 0 && workoutExercises.length === 0 && (
          <div className="card p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2">📋 Last Workout</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {lastWorkoutExercises.slice(0, 5).map((we, idx) => (
                <span key={we.id}>
                  {we.exercise?.name}
                  {idx < Math.min(lastWorkoutExercises.length - 1, 4) && ', '}
                </span>
              ))}
              {lastWorkoutExercises.length > 5 && ` +${lastWorkoutExercises.length - 5} more`}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tap &quot;Add Exercise&quot; to add exercises to today&apos;s workout
            </p>
          </div>
        )}

        {/* Exercises List */}
        {workoutExercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No exercises added yet. Tap &quot;Add Exercise&quot; to start.
          </div>
        ) : (
          <div className="space-y-4">
            {workoutExercises.map((workoutExercise) => {
              const exercise = workoutExercise.exercise;
              const isExpanded = expandedExercises.has(workoutExercise.id);
              const maxWeight = maxWeights[workoutExercise.exercise_id];
              const sets = workoutExercise.sets || [];
              const completedSets = sets.filter(s => s.is_completed).length;

              return (
                <div key={workoutExercise.id} className="card overflow-hidden">
                  {/* Exercise Header */}
                  <button
                    onClick={() => toggleExerciseExpand(workoutExercise.id)}
                    className="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getMuscleGroupEmoji(exercise?.muscle_group || 'chest')}
                      </span>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{exercise?.name}</span>
                          {exercise?.default_rest_seconds ? (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Timer size={10} />
                              {exercise.default_rest_seconds}s
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center gap-1">
                              <Timer size={10} />
                              {globalRestSeconds}s
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {completedSets}/{sets.length} sets
                          {maxWeight && !exercise?.is_bodyweight && (
                            <span className="ml-2">
                              <Trophy size={12} className="inline text-yellow-500 mr-1" />
                              PR: {maxWeight}kg
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {/* Sets */}
                  {isExpanded && (
                    <div className="p-4">
                      {/* Header Row */}
                      <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-gray-500 font-medium">
                        <div className="col-span-1">SET</div>
                        {!exercise?.is_bodyweight && (
                          <div className="col-span-4">WEIGHT (kg)</div>
                        )}
                        <div className={exercise?.is_bodyweight ? 'col-span-5' : 'col-span-3'}>REPS</div>
                        <div className="col-span-4 text-right">ACTIONS</div>
                      </div>

                      {/* Sets */}
                      {sets.map((set, idx) => (
                        <div
                          key={set.id}
                          className={`grid grid-cols-12 gap-2 items-center py-2 border-t border-gray-100 dark:border-gray-700 ${
                            set.is_completed ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="col-span-1 font-medium">{idx + 1}</div>
                          
                          {!exercise?.is_bodyweight && (
                            <div className="col-span-4">
                              <SetInput
                                value={set.weight_kg}
                                onChange={(val) => handleUpdateSet(set.id, { weight_kg: val })}
                                placeholder="0"
                                disabled={set.is_completed || !session.is_active}
                              />
                            </div>
                          )}
                          
                          <div className={exercise?.is_bodyweight ? 'col-span-5' : 'col-span-3'}>
                            <SetInput
                              value={set.reps}
                              onChange={(val) => handleUpdateSet(set.id, { reps: val ? Math.floor(val) : undefined })}
                              placeholder="0"
                              disabled={set.is_completed || !session.is_active}
                            />
                          </div>
                          
                          <div className="col-span-4 flex justify-end gap-1">
                            {!set.is_completed && session.is_active && (
                              <button
                                onClick={() => handleCompleteSet(set.id, workoutExercise.exercise_id)}
                                className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600"
                              >
                                <Check size={18} />
                              </button>
                            )}
                            {set.is_completed && (
                              <span className="p-2 text-primary-600">
                                <Check size={18} />
                              </span>
                            )}
                            {session.is_active && (
                              <button
                                onClick={() => handleDeleteSet(set.id)}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add Set Button */}
                      {session.is_active && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => handleAddSet(workoutExercise.id)}
                            className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                          >
                            <Plus size={18} />
                            <span>Add Set</span>
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(workoutExercise.id)}
                            className="btn btn-danger px-4"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title="Add Exercise"
      >
        {/* Add for all clients toggle - only show when multiple clients */}
        {clients.length > 1 && (
          <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium text-sm">Add for all clients</div>
              <div className="text-xs text-gray-500">
                {addForAllClients 
                  ? `Will add to: ${clients.map(c => c.name).join(', ')}`
                  : `Only for: ${selectedClient?.name}`
                }
              </div>
            </div>
            <button
              onClick={() => setAddForAllClients(!addForAllClients)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                addForAllClients ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                addForAllClients ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
        )}

        {/* Muscle Group Filter */}
        <div className="mb-4 overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedMuscleGroup('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedMuscleGroup === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group.value}
                onClick={() => setSelectedMuscleGroup(group.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedMuscleGroup === group.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {group.emoji} {group.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {selectedMuscleGroup === 'all' ? (
            // Grouped view
            Object.entries(groupedExercises).map(([muscleGroup, groupExercises]) => (
              <div key={muscleGroup}>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  {getMuscleGroupEmoji(muscleGroup as MuscleGroup)} {getMuscleGroupLabel(muscleGroup as MuscleGroup)}
                </h4>
                <div className="space-y-1">
                  {groupExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => handleAddExercise(exercise.id)}
                      className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span>{exercise.name}</span>
                        {!exercise.is_bodyweight && pickerMaxWeights[exercise.id] && (
                          <span className="ml-2 text-xs text-yellow-600 flex items-center gap-1">
                            <Trophy size={12} className="inline text-yellow-500" />
                            PR: {pickerMaxWeights[exercise.id]}kg
                          </span>
                        )}
                      </div>
                      {exercise.is_bodyweight && (
                        <span className="text-xs text-blue-600">Bodyweight</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Flat view for filtered
            <div className="space-y-1">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleAddExercise(exercise.id)}
                  className="w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <span>{exercise.name}</span>
                    {!exercise.is_bodyweight && pickerMaxWeights[exercise.id] && (
                      <span className="ml-2 text-xs text-yellow-600 flex items-center gap-1">
                        <Trophy size={12} className="inline text-yellow-500" />
                        PR: {pickerMaxWeights[exercise.id]}kg
                      </span>
                    )}
                  </div>
                  {exercise.is_bodyweight && (
                    <span className="text-xs text-blue-600">Bodyweight</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* End Workout Confirm */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={handleEndWorkout}
        title="End Workout"
        message="Are you sure you want to end this workout session? This will save all recorded exercises and sets."
        confirmText="End Workout"
      />
      {/* Cancel Workout Confirm */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelWorkout}
        title="Cancel Workout"
        message="Are you sure you want to cancel this workout session? All data for this session will be deleted."
        confirmText="Cancel Workout"
      />
    </div>
  );
}
