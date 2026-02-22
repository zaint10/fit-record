'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen, LoadingSpinner } from '@/components/LoadingSpinner';
import { getClient, updateClient } from '@/lib/api';
import type { Client, ClientFormData } from '@/types/database';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    loadClient();
  }, [clientId]);

  async function loadClient() {
    try {
      const data = await getClient(clientId);
      if (data) {
        setClient(data);
        setFormData({
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          notes: data.notes || '',
        });
      }
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      await updateClient(clientId, {
        ...formData,
        name: formData.name.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      });
      router.push(`/clients/${clientId}`);
    } catch (error) {
      console.error('Failed to update client:', error);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Client" showBack />
        <LoadingScreen />
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <PageHeader title="Edit Client" showBack />
        <div className="page-content">
          <p className="text-center text-gray-500">Client not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Client" showBack />
      
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
              placeholder="Enter client name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="client@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input min-h-[100px] resize-none"
              placeholder="Any notes about this client..."
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
