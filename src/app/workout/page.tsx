'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { PlayCircle, Calendar, Clock, Users, ChevronRight } from 'lucide-react';
import { getActiveWorkoutSession, getWorkoutSessions, getWorkoutSessionClients } from '@/lib/api';
import type { WorkoutSession, Client } from '@/types/database';

interface WorkoutWithClients extends WorkoutSession {
  clients: Client[];
}

export default function WorkoutPage() {
  const router = useRouter();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutWithClients[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    try {
      const [active, recent] = await Promise.all([
        getActiveWorkoutSession(),
        getWorkoutSessions(10),
      ]);

      setActiveWorkout(active);

      // Load clients for each workout
      const workoutsWithClients = await Promise.all(
        recent.map(async (workout) => {
          const clients = await getWorkoutSessionClients(workout.id);
          return { ...workout, clients };
        })
      );

      setRecentWorkouts(workoutsWithClients);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Workouts" />
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Workouts" />
      
      <div className="page-content">
        {/* Active Workout Banner */}
        {activeWorkout && (
          <Link
            href={`/workout/${activeWorkout.id}`}
            className="card p-4 mb-6 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-primary-700 dark:text-primary-300">
                  🏋️ Active Workout
                </div>
                <div className="text-sm text-primary-600 dark:text-primary-400">
                  Started at {new Date(activeWorkout.started_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <ChevronRight className="text-primary-600" />
            </div>
          </Link>
        )}

        {/* Start New Workout */}
        <Link
          href="/workout/new"
          className="card p-6 mb-6 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <PlayCircle className="text-primary-600" size={28} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-lg">Start New Workout</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Begin a workout session for your clients
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>

        {/* Recent Workouts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Recent Workouts
            </h3>
            <Link
              href="/workout/history"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>

          {recentWorkouts.filter(w => w.ended_at).length === 0 ? (
            <EmptyState
              icon={<Calendar size={48} />}
              title="No workouts yet"
              description="Start your first workout to see it here."
            />
          ) : (
            <div className="space-y-3">
              {recentWorkouts
                .filter(w => w.ended_at)
                .slice(0, 5)
                .map((workout) => (
                  <Link
                    key={workout.id}
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
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(workout.started_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {workout.clients.map(c => c.name).join(', ')}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400" />
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
