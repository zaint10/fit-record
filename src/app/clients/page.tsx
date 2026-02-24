'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LoadingScreen } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Users, Search, MoreVertical, Edit, Trash2, Clock } from 'lucide-react';
import { getClients, deleteClient } from '@/lib/api';
import type { Client } from '@/types/database';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

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

  async function handleDelete(client: Client) {
    try {
      await deleteClient(client.id);
      setClients(clients.filter(c => c.id !== client.id));
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase()) ||
    client.phone?.includes(search)
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Clients" />
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Clients" 
        rightAction={
          <Link
            href="/clients/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add</span>
          </Link>
        }
      />
      
      <div className="page-content">
        {clients.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        )}

        {clients.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No clients yet"
            description="Add your first client to start tracking their workouts."
            action={
              <Link href="/clients/new" className="btn btn-primary">
                Add Client
              </Link>
            }
          />
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={<Search size={48} />}
            title="No results"
            description="No clients match your search."
          />
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <div key={client.id} className="card p-4 relative">
                <div className="flex items-start justify-between">
                  <Link href={`/clients/${client.id}`} className="flex-1">
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {client.gym_time && (
                        <span className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(`2000-01-01T${client.gym_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      )}
                      {client.email && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {client.phone}
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === client.id ? null : client.id)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {menuOpen === client.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-[150px]">
                          <Link
                            href={`/clients/${client.id}/edit`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => setMenuOpen(null)}
                          >
                            <Edit size={18} />
                            <span>Edit</span>
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteConfirm(client);
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
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Client"
        message={`Are you sure you want to delete ${deleteConfirm?.name}? This will also delete all their workout history.`}
        confirmText="Delete"
        isDangerous
      />
    </div>
  );
}
