'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/classes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const [statsRes, trendRes, atRiskRes] = await Promise.all([
        fetch(`/api/analytics/attendance-stats?type=class&classId=${selectedClass}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`/api/analytics/attendance-stats?type=trend&classId=${selectedClass}&days=30`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`/api/analytics/attendance-stats?type=at-risk&threshold=75`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const trendData = await trendRes.json();
      const atRiskData = await atRiskRes.json();

      if (statsRes.ok) setStats(statsData.performance);
      if (trendRes.ok) setTrend(trendData.trend || []);
      if (atRiskRes.ok) setAtRisk(atRiskData.students || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedClass]);

  const exportData = async (type: string) => {
    try {
      const token = getAuthToken();
      const url = `/api/export?type=${type}&format=csv${selectedClass ? `&classId=${selectedClass}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${type}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics & Reports</h2>
        <div className="flex gap-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name} - {cls.section}
              </option>
            ))}
          </select>
          <button
            onClick={() => exportData('attendance')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export Attendance
          </button>
          <button
            onClick={() => exportData('marks')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export Marks
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-8">Loading analytics...</div>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Average Attendance</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.averageAttendance}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Average Marks</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.averageMarks.toFixed(1)}</p>
          </div>
        </div>
      )}

      {trend.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Attendance Trend (Last 30 Days)</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {trend.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{ height: `${day.attendancePercentage || 0}%` }}
                  title={`${day.date}: ${day.attendancePercentage?.toFixed(1)}%`}
                />
                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {atRisk.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">At-Risk Students (Attendance &lt; 75%)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {atRisk.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.student_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      {student.attendancePercentage?.toFixed(1) || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

