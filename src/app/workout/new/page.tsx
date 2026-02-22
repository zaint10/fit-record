'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen, LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { Users, Check } from 'lucide-react';
import { getClients, createWorkoutSession } from '@/lib/api';
import type { Client } from '@/types/database';

export default function NewWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get('client');

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (preselectedClient && !selectedClients.includes(preselectedClient)) {
      setSelectedClients([preselectedClient]);
    }
  }, [preselectedClient]);

  async function loadClients() {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleClient(clientId: string) {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  }

  async function handleStartWorkout() {
    if (selectedClients.length === 0) return;

    setCreating(true);
    try {
      const session = await createWorkoutSession(selectedClients);
      router.push(`/workout/${session.id}`);
    } catch (error) {
      console.error('Failed to create workout:', error);
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Start Workout" showBack />
        <LoadingScreen />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div>
        <PageHeader title="Start Workout" showBack />
        <div className="page-content">
          <EmptyState
            icon={<Users size={48} />}
            title="No clients yet"
            description="Add clients first before starting a workout."
            action={
              <button
                onClick={() => router.push('/clients/new')}
                className="btn btn-primary"
              >
                Add Client
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Start Workout" showBack />
      
      <div className="page-content">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Select Clients</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Choose one or more clients for this workout session.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {clients.map((client) => {
            const isSelected = selectedClients.includes(client.id);
            return (
              <button
                key={client.id}
                onClick={() => toggleClient(client.id)}
                className={`card p-4 w-full text-left flex items-center gap-4 transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {isSelected && <Check size={16} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{client.name}</div>
                  {client.email && (
                    <div className="text-sm text-gray-500">{client.email}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleStartWorkout}
          disabled={selectedClients.length === 0 || creating}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          {creating && <LoadingSpinner size={20} />}
          <span>
            {creating
              ? 'Starting...'
              : `Start Workout ${selectedClients.length > 0 ? `(${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''})` : ''}`}
          </span>
        </button>
      </div>
    </div>
  );
}
