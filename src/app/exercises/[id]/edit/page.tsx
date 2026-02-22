'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen, LoadingSpinner } from '@/components/LoadingSpinner';
import { getExercise, updateExercise } from '@/lib/api';
import type { Exercise, ExerciseFormData, MuscleGroup } from '@/types/database';
import { MUSCLE_GROUPS } from '@/types/database';

export default function EditExercisePage() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    muscle_group: 'chest',
    is_bodyweight: false,
    description: '',
  });

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  async function loadExercise() {
    try {
      const data = await getExercise(exerciseId);
      if (data) {
        setExercise(data);
        setFormData({
          name: data.name,
          muscle_group: data.muscle_group,
          is_bodyweight: data.is_bodyweight,
          description: data.description || '',
        });
      }
    } catch (error) {
      console.error('Failed to load exercise:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      await updateExercise(exerciseId, {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      });
      router.push('/exercises');
    } catch (error) {
      console.error('Failed to update exercise:', error);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Exercise" showBack />
        <LoadingScreen />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div>
        <PageHeader title="Edit Exercise" showBack />
        <div className="page-content">
          <p className="text-center text-gray-500">Exercise not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Exercise" showBack />
      
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
              disabled={!formData.name.trim() || saving}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size={20} />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
