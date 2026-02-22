'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Users, Dumbbell, PlayCircle, History, TrendingUp, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getClients, getExercises, getActiveWorkoutSession, getWorkoutSessions } from '@/lib/api';

export default function HomePage() {
  const [stats, setStats] = useState({
    clientCount: 0,
    exerciseCount: 0,
    recentWorkouts: 0,
    hasActiveWorkout: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [clients, exercises, activeWorkout, recentWorkouts] = await Promise.all([
          getClients(),
          getExercises(),
          getActiveWorkoutSession(),
          getWorkoutSessions(30),
        ]);

        setStats({
          clientCount: clients.length,
          exerciseCount: exercises.length,
          recentWorkouts: recentWorkouts.filter(w => w.ended_at).length,
          hasActiveWorkout: !!activeWorkout,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div>
      <PageHeader title="FitRecord" />
      
      <div className="page-content">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome back! 💪</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ready to track some workouts?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/workout/new"
              className="card p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-3">
                <PlayCircle className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <span className="font-medium">Start Workout</span>
            </Link>

            {stats.hasActiveWorkout && (
              <Link
                href="/workout"
                className="card p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow border-2 border-primary-500"
              >
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-3">
                  <TrendingUp className="text-yellow-600 dark:text-yellow-400" size={24} />
                </div>
                <span className="font-medium">Continue Workout</span>
              </Link>
            )}

            <Link
              href="/clients/new"
              className="card p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <span className="font-medium">Add Client</span>
            </Link>

            <Link
              href="/workout/history"
              className="card p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
                <History className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <span className="font-medium">History</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Overview
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {loading ? '-' : stats.clientCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Clients</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? '-' : stats.exerciseCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Exercises</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {loading ? '-' : stats.recentWorkouts}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Workouts</div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Manage
          </h3>
          <div className="space-y-3">
            <Link
              href="/clients"
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium">Clients</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your client list
                </div>
              </div>
            </Link>

            <Link
              href="/exercises"
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Dumbbell className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium">Exercises</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Browse and manage exercises
                </div>
              </div>
            </Link>

            <Link
              href="/admin"
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Calendar className="text-gray-600 dark:text-gray-400" size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium">Admin Hub</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Settings and configuration
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
