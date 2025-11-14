'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | 'admin' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Attendance & Class Management System
          </h1>
          <p className="text-gray-600">Select your role to continue</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/login/teacher')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow transform hover:scale-105"
          >
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Teacher</h2>
            <p className="text-gray-600">Manage attendance and marks</p>
          </button>

          <button
            onClick={() => router.push('/login/student')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow transform hover:scale-105"
          >
            <div className="text-4xl mb-4">👨‍🎓</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Student</h2>
            <p className="text-gray-600">View your attendance and marks</p>
          </button>

          <button
            onClick={() => router.push('/login/admin')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow transform hover:scale-105"
          >
            <div className="text-4xl mb-4">👨‍💼</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Admin</h2>
            <p className="text-gray-600">Manage classes and users</p>
          </button>
        </div>
      </div>
    </div>
  );
}

