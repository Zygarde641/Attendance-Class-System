'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils';

export default function TeacherPerformanceDashboard() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [teacherDetails, setTeacherDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherDetails(selectedTeacher.teacherId);
    }
  }, [selectedTeacher]);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/teacher-performance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Failed to load teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherDetails = async (teacherId: number) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/teacher-performance?teacherId=${teacherId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTeacherDetails(data.performance);
      }
    } catch (error) {
      console.error('Failed to load teacher details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && teachers.length === 0) {
    return <div className="text-center py-8">Loading teacher performance...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teacher Performance Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teachers List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-4">All Teachers</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {teachers.map((teacher) => (
                <div
                  key={teacher.teacherId}
                  onClick={() => setSelectedTeacher(teacher)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedTeacher?.teacherId === teacher.teacherId
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">{teacher.teacherName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.employeeId}</p>
                  {teacher.classes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Classes: {teacher.classes.map((c: any) => c.name).join(', ')}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-green-600 dark:text-green-400">
                          Attendance: {teacher.averageAttendance}%
                        </span>
                        <span className="text-purple-600 dark:text-purple-400">
                          Avg Marks: {teacher.averageMarks.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Teacher Details */}
        <div className="lg:col-span-2">
          {selectedTeacher && teacherDetails ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{teacherDetails.classes[0]?.name || 'No Class'}</h3>
                <p className="text-gray-600 dark:text-gray-400">Teacher: {selectedTeacher.teacherName}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Students</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{teacherDetails.totalStudents}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avg Attendance</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{teacherDetails.averageAttendance}%</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avg Marks</h4>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{teacherDetails.averageMarks.toFixed(1)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Student Performance Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Attendance %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Avg Marks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {teacherDetails.studentPerformance.map((student: any) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{student.student_id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${
                              student.attendancePercentage >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {student.attendancePercentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {student.avgMarks.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">Select a teacher to view performance details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

