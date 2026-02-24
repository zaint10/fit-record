'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { Calendar, Clock, Users, ChevronRight, History, Trash2, Filter, X } from 'lucide-react';
import { deleteWorkoutSession, getClients } from '@/lib/api';
import { getWorkoutSessions, getWorkoutSessionClients } from '@/lib/api';
import type { WorkoutSession, Client } from '@/types/database';

interface WorkoutWithClients extends WorkoutSession {
  clients: Client[];
}

// Time period filter options
const TIME_PERIODS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 days' },
  { value: '2weeks', label: 'Last 2 weeks' },
  { value: '1month', label: 'Last month' },
  { value: '3months', label: 'Last 3 months' },
  { value: 'custom', label: 'Custom' },
];

export default function WorkoutHistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutWithClients[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    loadWorkouts();
    getClients().then(setAllClients);
  }, []);

  // Calculate date range from time period
  function getDateRange(period: string): { start: Date | null; end: Date | null } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return { start: today, end: null };
      case '7days':
        return { start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), end: null };
      case '2weeks':
        return { start: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), end: null };
      case '1month':
        return { start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), end: null };
      case '3months':
        return { start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), end: null };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : null,
          end: customEndDate ? new Date(customEndDate + 'T23:59:59') : null,
        };
      default:
        return { start: null, end: null };
    }
  }

  // Filter workouts
  const filteredWorkouts = useMemo(() => {
    return workouts.filter(workout => {
      // Client filter
      if (selectedClientIds.length > 0) {
        const workoutClientIds = workout.clients.map(c => c.id);
        const hasMatchingClient = selectedClientIds.some(id => workoutClientIds.includes(id));
        if (!hasMatchingClient) return false;
      }
      
      // Time period filter
      const { start, end } = getDateRange(timePeriod);
      const workoutDate = new Date(workout.started_at);
      
      if (start && workoutDate < start) return false;
      if (end && workoutDate > end) return false;
      
      return true;
    });
  }, [workouts, selectedClientIds, timePeriod, customStartDate, customEndDate]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedClientIds.length > 0) count++;
    if (timePeriod !== 'all') count++;
    return count;
  }, [selectedClientIds, timePeriod]);

  // Clear all filters
  function clearFilters() {
    setSelectedClientIds([]);
    setTimePeriod('all');
    setCustomStartDate('');
    setCustomEndDate('');
  }

  // Toggle client selection
  function toggleClient(clientId: string) {
    setSelectedClientIds(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  }

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
  const groupedWorkouts = filteredWorkouts.reduce((acc, workout) => {
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
        {/* Filter Toggle */}
        {workouts.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn flex items-center gap-2 ${
                  activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <Filter size={18} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="btn btn-outline flex items-center gap-1"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>
            
            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-3 card p-4 space-y-4">
                {/* Time Period Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Time Period
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {TIME_PERIODS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setTimePeriod(value)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                          timePeriod === value
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Date Range */}
                  {timePeriod === 'custom' && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">From</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="input py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">To</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="input py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Client Filter */}
                {allClients.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Clients
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {allClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => toggleClient(client.id)}
                          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                            selectedClientIds.includes(client.id)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {client.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Results count */}
        {workouts.length > 0 && activeFilterCount > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Showing {filteredWorkouts.length} of {workouts.length} workouts
          </p>
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
        ) : filteredWorkouts.length === 0 ? (
          <EmptyState
            icon={<Filter size={48} />}
            title="No matching workouts"
            description="Try adjusting your filters to see more results."
            action={
              <button onClick={clearFilters} className="btn btn-primary">
                Clear Filters
              </button>
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
