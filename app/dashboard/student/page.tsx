'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, getAuthToken } from '@/lib/utils';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (!storedUser || storedUser.role !== 'student') {
      router.push('/');
      return;
    }
    setUser(storedUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = getAuthToken();
      const [attendanceRes, marksRes] = await Promise.all([
        fetch('/api/student/attendance', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/student/marks', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const attendanceData = await attendanceRes.json();
      const marksData = await marksRes.json();

      if (attendanceRes.ok) {
        setAttendance(attendanceData.attendance || []);
      }
      if (marksRes.ok) {
        setMarks(marksData.marks || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const totalDays = attendance.length;
  const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Days</h3>
            <p className="text-3xl font-bold text-gray-900">{totalDays}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Present Days</h3>
            <p className="text-3xl font-bold text-green-600">{presentDays}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Attendance %</h3>
            <p className="text-3xl font-bold text-blue-600">{attendancePercentage}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Attendance History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-4 text-center text-gray-500">No attendance records</td>
                    </tr>
                  ) : (
                    attendance.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Marks</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">External</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No marks uploaded yet</td>
                    </tr>
                  ) : (
                    marks.map((mark) => {
                      const total = (mark.internal_marks || 0) + (mark.external_marks || 0);
                      return (
                        <tr key={mark.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{mark.subject}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{mark.internal_marks || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{mark.external_marks || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{total}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

