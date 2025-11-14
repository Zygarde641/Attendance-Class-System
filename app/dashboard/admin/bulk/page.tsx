'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, getAuthToken } from '@/lib/utils';
import { useEffect } from 'react';

export default function BulkOperationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'marks'>('students');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (!storedUser || storedUser.role !== 'admin') {
      router.push('/');
      return;
    }
    setUser(storedUser);
  }, []);

  const handleBulkStudentImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const students = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const student: any = {};
          headers.forEach((header, index) => {
            student[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
          });
          return {
            name: student.name || student.student_name,
            student_id: student.student_id || student.id,
            username: student.username || student.student_id?.toLowerCase(),
            password: student.password || 'student123',
            class_id: student.class_id || null,
          };
        });

        setLoading(true);
        const token = getAuthToken();
        const response = await fetch('/api/bulk/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ students }),
        });

        const data = await response.json();
        if (response.ok) {
          setMessage(`Successfully imported ${students.length} students!`);
        } else {
          setMessage(data.error || 'Import failed');
        }
      } catch (error) {
        setMessage('Failed to import students');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Bulk Operations</h1>
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {['students', 'attendance', 'marks'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Bulk {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Bulk Student Import</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload a CSV file with columns: name, student_id, username (optional), password (optional), class_id (optional)
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkStudentImport}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {loading && <p className="mt-4 text-gray-600">Importing students...</p>}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Bulk Attendance Marking</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Use the attendance marking interface in the main dashboard for bulk operations.
            </p>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Bulk Marks Upload</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Teachers can upload marks in bulk through the teacher dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

