'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Users, Dumbbell, Database, FileText, Settings } from 'lucide-react';

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="Admin Hub" />
      
      <div className="page-content">
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Manage your clients, exercises, and app settings.
          </p>
        </div>

        <div className="space-y-4">
          {/* Data Management */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Data Management
            </h3>
            
            <div className="space-y-3">
              <Link
                href="/clients"
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Users className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Clients</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Add, edit, or remove clients
                  </div>
                </div>
              </Link>

              <Link
                href="/exercises"
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Dumbbell className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Exercises</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Manage exercise library by muscle group
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Workout History */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              History
            </h3>
            
            <div className="space-y-3">
              <Link
                href="/workout/history"
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <FileText className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Workout History</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    View past workout sessions
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* App Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              App Info
            </h3>
            
            <div className="card p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <Settings className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
                <div>
                  <div className="font-semibold">FitRecord</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Version 1.0.0
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                <p>
                  A simple workout tracking app for personal trainers.
                </p>
                <p>
                  Built with Next.js, TypeScript, and Supabase.
                </p>
              </div>
            </div>
          </div>

          {/* Database Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Database
            </h3>
            
            <div className="card p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Database className="text-orange-600 dark:text-orange-400" size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Supabase</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Connected to your Supabase database
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
