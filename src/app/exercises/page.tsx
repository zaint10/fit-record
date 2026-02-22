'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Dumbbell, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { getExercises, deleteExercise } from '@/lib/api';
import type { Exercise, MuscleGroup } from '@/types/database';
import { MUSCLE_GROUPS, getMuscleGroupLabel, getMuscleGroupEmoji } from '@/types/database';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Exercise | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      const data = await getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(exercise: Exercise) {
    try {
      await deleteExercise(exercise.id);
      setExercises(exercises.filter(e => e.id !== exercise.id));
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
  }

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle === 'all' || exercise.muscle_group === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  // Group exercises by muscle group
  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const group = exercise.muscle_group;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(exercise);
    return acc;
  }, {} as Record<MuscleGroup, Exercise[]>);

  if (loading) {
    return (
      <div>
        <PageHeader title="Exercises" />
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Exercises" 
        rightAction={
          <Link
            href="/exercises/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add</span>
          </Link>
        }
      />
      
      <div className="page-content">
        {/* Search */}
        {exercises.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        )}

        {/* Muscle Group Filter */}
        {exercises.length > 0 && (
          <div className="mb-6 overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedMuscle('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedMuscle === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group.value}
                  onClick={() => setSelectedMuscle(group.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedMuscle === group.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {group.emoji} {group.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {exercises.length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={48} />}
            title="No exercises yet"
            description="Add exercises to your library to use in workouts."
            action={
              <Link href="/exercises/new" className="btn btn-primary">
                Add Exercise
              </Link>
            }
          />
        ) : filteredExercises.length === 0 ? (
          <EmptyState
            icon={<Search size={48} />}
            title="No results"
            description="No exercises match your filters."
          />
        ) : selectedMuscle === 'all' ? (
          // Grouped view
          <div className="space-y-6">
            {(Object.keys(groupedExercises) as MuscleGroup[]).map((muscleGroup) => (
              <div key={muscleGroup}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  {getMuscleGroupEmoji(muscleGroup)} {getMuscleGroupLabel(muscleGroup)}
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {groupedExercises[muscleGroup].length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {groupedExercises[muscleGroup].map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      menuOpen={menuOpen}
                      setMenuOpen={setMenuOpen}
                      onDelete={() => setDeleteConfirm(exercise)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat view for filtered
          <div className="space-y-2">
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                onDelete={() => setDeleteConfirm(exercise)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"?`}
        confirmText="Delete"
        isDangerous
      />
    </div>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  onDelete: () => void;
}

function ExerciseCard({ exercise, menuOpen, setMenuOpen, onDelete }: ExerciseCardProps) {
  return (
    <div className="card p-4 relative">
      <div className="flex items-start justify-between">
        <Link href={`/exercises/${exercise.id}`} className="flex-1">
          <h4 className="font-medium">{exercise.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {getMuscleGroupEmoji(exercise.muscle_group)} {getMuscleGroupLabel(exercise.muscle_group)}
            </span>
            {exercise.is_bodyweight && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                Bodyweight
              </span>
            )}
          </div>
        </Link>
        
        <div className="relative">
          <button
            onClick={() => setMenuOpen(menuOpen === exercise.id ? null : exercise.id)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical size={20} />
          </button>
          
          {menuOpen === exercise.id && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(null)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-[150px]">
                <Link
                  href={`/exercises/${exercise.id}/edit`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setMenuOpen(null)}
                >
                  <Edit size={18} />
                  <span>Edit</span>
                </Link>
                <button
                  onClick={() => {
                    onDelete();
                    setMenuOpen(null);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 w-full"
                >
                  <Trash2 size={18} />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
