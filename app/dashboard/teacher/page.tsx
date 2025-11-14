'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, getAuthToken } from '@/lib/utils';
import TeacherAnalyticsDashboard from '@/components/TeacherAnalyticsDashboard';
import NotificationsPanel from '@/components/NotificationsPanel';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'marks' | 'analytics'>('attendance');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [marks, setMarks] = useState({ studentId: '', subject: '', internal: '', external: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (!storedUser || storedUser.role !== 'teacher') {
      router.push('/');
      return;
    }
    setUser(storedUser);
    loadStudents();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  const loadStudents = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/teacher/students', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    const today = new Date();
    const selected = new Date(date);
    const diffDays = (today.getTime() - selected.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays > 3) {
      setMessage('You can only mark attendance for the last 3 days');
      return;
    }
    
    setSelectedDate(date);
    setMessage('');
    loadAttendanceForDate(date);
  };

  const loadAttendanceForDate = async (date: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/teacher/attendance?date=${date}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const attendanceMap: Record<string, string> = {};
        data.attendance.forEach((a: any) => {
          attendanceMap[a.student_id] = a.status;
        });
        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          attendance: Object.entries(attendance).map(([studentId, status]) => ({
            studentId: parseInt(studentId),
            status,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Attendance marked successfully!');
      } else {
        setMessage(data.error || 'Failed to mark attendance');
      }
    } catch (error) {
      setMessage('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMarksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      const response = await fetch('/api/teacher/marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(marks),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Marks uploaded successfully!');
        setMarks({ studentId: '', subject: '', internal: '', external: '' });
      } else {
        setMessage(data.error || 'Failed to upload marks');
      }
    } catch (error) {
      setMessage('Failed to upload marks');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Teacher Dashboard</h1>
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
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'attendance'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mark Attendance
              </button>
              <button
                onClick={() => setActiveTab('marks')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'marks'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload Marks
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Analytics & Reports
              </button>
            </nav>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date (Last 3 days only)
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <form onSubmit={handleAttendanceSubmit}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={attendance[student.id] || 'present'}
                            onChange={(e) => setAttendance({ ...attendance, [student.id]: e.target.value })}
                            className="px-3 py-1 border border-gray-300 rounded-lg"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Marks</h2>
            <form onSubmit={handleMarksSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={marks.studentId}
                  onChange={(e) => setMarks({ ...marks, studentId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.student_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={marks.subject}
                  onChange={(e) => setMarks({ ...marks, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal Marks</label>
                  <input
                    type="number"
                    value={marks.internal}
                    onChange={(e) => setMarks({ ...marks, internal: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">External Marks</label>
                  <input
                    type="number"
                    value={marks.external}
                    onChange={(e) => setMarks({ ...marks, external: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload Marks'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'analytics' && (
          <TeacherAnalyticsDashboard />
        )}
      </div>
    </div>
  );
}

