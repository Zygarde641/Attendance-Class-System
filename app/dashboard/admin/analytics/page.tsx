'use client';

import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { useRouter } from 'next/navigation';
import { getUserFromStorage } from '@/lib/utils';
import { useEffect, useState } from 'react';
import NotificationsPanel from '@/components/NotificationsPanel';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (!storedUser || storedUser.role !== 'admin') {
      router.push('/');
      return;
    }
    setUser(storedUser);
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Analytics & Reports</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <NotificationsPanel />
              </div>
              <DarkModeToggle />
              <span className="text-gray-700 dark:text-gray-300">Welcome, {user.name}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}

