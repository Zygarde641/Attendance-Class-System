'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils';

export default function TeacherAnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'trends' | 'marks'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const [statsRes, performanceRes, trendRes, distributionRes] = await Promise.all([
        fetch('/api/teacher/analytics?type=class-stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/teacher/analytics?type=student-performance', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/teacher/analytics?type=attendance-trend&days=30', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/teacher/analytics?type=marks-distribution', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const performanceData = await performanceRes.json();
      const trendData = await trendRes.json();
      const distributionData = await distributionRes.json();

      if (statsRes.ok) setStats(statsData.stats);
      if (performanceRes.ok) setPerformance(performanceData.performance || []);
      if (trendRes.ok) setTrend(trendData.trend || []);
      if (distributionRes.ok) setDistribution(distributionData.distribution || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    try {
      const token = getAuthToken();
      const url = `/api/export?type=${type}&format=csv`;
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

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Performance Analytics</h2>
        <div className="flex gap-2">
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'students', label: 'Student Performance' },
              { id: 'trends', label: 'Attendance Trends' },
              { id: 'marks', label: 'Marks Distribution' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Students</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalStudents}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avg Attendance</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.averageAttendance}%</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avg Marks</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.averageMarks.toFixed(1)}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subjects</h3>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.subjectsCount}</p>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Attendance %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Avg Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subjects</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {performance.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.student_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${
                          student.attendancePercentage >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {student.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {student.avgMarks.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.subjectsCount || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'trends' && trend.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Attendance Trend (Last 30 Days)</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {trend.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      style={{ height: `${day.attendancePercentage || 0}%` }}
                      title={`${day.date}: ${day.attendancePercentage?.toFixed(1)}%`}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-left">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'marks' && distribution.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Marks Distribution</h3>
              <div className="space-y-4">
                {distribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">{item.grade}</div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative">
                      <div
                        className="bg-blue-500 h-8 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(item.count / distribution.reduce((sum, d) => sum + d.count, 0)) * 100}%` }}
                      >
                        <span className="text-xs text-white font-semibold">{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

