'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Edit, Trash2 } from 'lucide-react';
import { getExercise, deleteExercise } from '@/lib/api';
import type { Exercise } from '@/types/database';
import { getMuscleGroupLabel, getMuscleGroupEmoji } from '@/types/database';

export default function ExerciseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  async function loadExercise() {
    try {
      const data = await getExercise(exerciseId);
      setExercise(data);
    } catch (error) {
      console.error('Failed to load exercise:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteExercise(exerciseId);
      router.push('/exercises');
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Exercise" showBack />
        <LoadingScreen />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div>
        <PageHeader title="Exercise" showBack />
        <div className="page-content">
          <p className="text-center text-gray-500">Exercise not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title={exercise.name} 
        showBack
        rightAction={
          <div className="flex items-center gap-2">
            <Link
              href={`/exercises/${exerciseId}/edit`}
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
        <div className="card p-4">
          <h2 className="text-xl font-bold mb-4">{exercise.name}</h2>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Muscle Group</span>
              <p className="font-medium">
                {getMuscleGroupEmoji(exercise.muscle_group)} {getMuscleGroupLabel(exercise.muscle_group)}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
              <p className="font-medium">
                {exercise.is_bodyweight ? 'Bodyweight' : 'Weighted'}
              </p>
            </div>

            {exercise.description && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Description</span>
                <p className="font-medium">{exercise.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${exercise.name}"?`}
        confirmText="Delete"
        isDangerous
      />
    </div>
  );
}
