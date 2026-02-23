'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { Calendar, Clock, Users, ChevronRight, History, Trash2 } from 'lucide-react';
import { deleteWorkoutSession } from '@/lib/api';
import { getWorkoutSessions, getWorkoutSessionClients } from '@/lib/api';
import type { WorkoutSession, Client } from '@/types/database';

interface WorkoutWithClients extends WorkoutSession {
  clients: Client[];
}

export default function WorkoutHistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutWithClients[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function handleDeleteWorkout(id: string) {
    if (!confirm('Delete this workout log? This cannot be undone.')) return;
    try {
      await deleteWorkoutSession(id);
      setWorkouts(w => w.filter(wk => wk.id !== id));
    } catch (e) {
      alert('Failed to delete workout');
    }
  }

  async function handleDeleteOldWorkouts() {
    if (!confirm('Delete all workout logs older than 2 weeks? This cannot be undone.')) return;
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const oldIds = workouts.filter(w => new Date(w.started_at) < twoWeeksAgo).map(w => w.id);
    try {
      for (const id of oldIds) {
        await deleteWorkoutSession(id);
      }
      setWorkouts(w => w.filter(wk => new Date(wk.started_at) >= twoWeeksAgo));
    } catch (e) {
      alert('Failed to delete old workouts');
    }
  }

  async function loadWorkouts() {
    try {
      const sessions = await getWorkoutSessions(50);
      // Load clients for each workout
      const workoutsWithClients = await Promise.all(
        sessions.map(async (workout: WorkoutSession) => {
          const clients = await getWorkoutSessionClients(workout.id);
          return { ...workout, clients };
        })
      );
      setWorkouts(workoutsWithClients.filter(w => w.ended_at));
    } catch (error) {
      console.error('Failed to load workouts:', error);
    } finally {
      setLoading(false);
    }
  }

  // Group workouts by month
  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const date = new Date(workout.started_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[key]) {
      acc[key] = { label, workouts: [] };
    }
    acc[key].workouts.push(workout);
    return acc;
  }, {} as Record<string, { label: string; workouts: WorkoutWithClients[] }>);

  if (loading) {
    return (
      <div>
        <PageHeader title="Workout History" showBack />
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Workout History" showBack />
      
      <div className="page-content">
        {workouts.length > 0 && (
          <button
            className="btn btn-danger mb-4"
            onClick={handleDeleteOldWorkouts}
          >
            <Trash2 size={18} className="inline mr-1" /> Delete All Older Than 2 Weeks
          </button>
        )}
        {workouts.length === 0 ? (
          <EmptyState
            icon={<History size={48} />}
            title="No workout history"
            description="Your completed workouts will appear here."
            action={
              <Link href="/workout/new" className="btn btn-primary">
                Start Workout
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedWorkouts).map(([key, { label, workouts: monthWorkouts }]) => (
              <div key={key}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  {label}
                </h3>
                <div className="space-y-3">
                  {monthWorkouts.map((workout) => (
                    <div key={workout.id} className="relative group">
                      <Link
                        href={`/workout/${workout.id}`}
                        className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                      >
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                          <Calendar className="text-gray-600 dark:text-gray-400" size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {new Date(workout.started_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {new Date(workout.started_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {workout.clients.length > 2 
                                ? `${workout.clients.slice(0, 2).map(c => c.name).join(', ')} +${workout.clients.length - 2}`
                                : workout.clients.map(c => c.name).join(', ')
                              }
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="text-gray-400 flex-shrink-0" />
                      </Link>
                      <button
                        className="absolute top-2 right-2 p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete workout"
                        onClick={() => handleDeleteWorkout(workout.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
