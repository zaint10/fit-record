'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { createExercise } from '@/lib/api';
import type { ExerciseFormData, MuscleGroup } from '@/types/database';
import { MUSCLE_GROUPS } from '@/types/database';

export default function NewExercisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    muscle_group: 'chest',
    is_bodyweight: false,
    description: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await createExercise({
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      });
      router.push('/exercises');
    } catch (error) {
      console.error('Failed to create exercise:', error);
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="New Exercise" showBack />
      
      <div className="page-content">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Enter exercise name"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Muscle Group <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.muscle_group}
              onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value as MuscleGroup })}
              className="input"
            >
              {MUSCLE_GROUPS.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.emoji} {group.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_bodyweight}
                onChange={(e) => setFormData({ ...formData, is_bodyweight: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="font-medium">Bodyweight Exercise</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-8">
              Check if this exercise doesn&apos;t require tracking weight (e.g., push-ups, pull-ups)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px] resize-none"
              placeholder="Optional description or notes..."
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!formData.name.trim() || loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner size={20} />}
              <span>{loading ? 'Creating...' : 'Create Exercise'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
