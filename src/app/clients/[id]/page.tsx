'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen, LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Edit, Trash2, History, Dumbbell, Clock } from 'lucide-react';
import { getClient, deleteClient, getRecentWorkoutsForClient, getClientExerciseHistory } from '@/lib/api';
import type { Client, WorkoutSession, ClientExerciseMaxWeight } from '@/types/database';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<ClientExerciseMaxWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  async function loadClient() {
    try {
      const [clientData, workouts, history] = await Promise.all([
        getClient(clientId),
        getRecentWorkoutsForClient(clientId),
        getClientExerciseHistory(clientId),
      ]);
      setClient(clientData);
      setRecentWorkouts(workouts);
      setExerciseHistory(history);
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteClient(clientId);
      router.push('/clients');
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Client" showBack />
        <LoadingScreen />
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <PageHeader title="Client" showBack />
        <div className="page-content">
          <p className="text-center text-gray-500">Client not found.</p>
        </div>
      </div>
    );
  }

  const completedWorkouts = recentWorkouts.filter(w => w.ended_at).length;

  return (
    <div>
      <PageHeader 
        title={client.name} 
        showBack
        rightAction={
          <div className="flex items-center gap-2">
            <Link
              href={`/clients/${clientId}/edit`}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Edit size={20} />
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
            >
              <Trash2 size={20} />
            </button>
          </div>
        }
      />
      
      <div className="page-content">
        {/* Client Info */}
        <div className="card p-4 mb-6">
          <h2 className="text-xl font-bold mb-2">{client.name}</h2>
          {client.gym_time && (
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
              <Clock size={16} />
              <span className="font-medium">
                {new Date(`2000-01-01T${client.gym_time}`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
              <span className="text-sm text-gray-500">gym time</span>
            </div>
          )}
          {client.email && (
            <p className="text-gray-600 dark:text-gray-400 mb-1">{client.email}</p>
          )}
          {client.phone && (
            <p className="text-gray-600 dark:text-gray-400 mb-1">{client.phone}</p>
          )}
          {client.notes && (
            <p className="text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {client.notes}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{completedWorkouts}</div>
            <div className="text-sm text-gray-500">Workouts</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{exerciseHistory.length}</div>
            <div className="text-sm text-gray-500">Exercises Done</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <Link
            href={`/workout/new?client=${clientId}`}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Dumbbell size={20} />
            <span>Start Workout</span>
          </Link>
        </div>

        {/* Recent Workouts */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Recent Workouts
          </h3>
          
          {recentWorkouts.length === 0 ? (
            <div className="card p-4 text-center text-gray-500">
              No workouts yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.slice(0, 5).map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workout/${workout.id}`}
                  className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <History className="text-primary-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {new Date(workout.started_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {workout.ended_at 
                        ? `Completed at ${new Date(workout.ended_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                        : 'In progress'
                      }
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete ${client.name}? This will also delete all their workout history.`}
        confirmText="Delete"
        isDangerous
      />
    </div>
  );
}
