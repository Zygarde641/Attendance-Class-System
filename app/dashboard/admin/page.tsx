'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, getAuthToken } from '@/lib/utils';
import NotificationsPanel from '@/components/NotificationsPanel';
import DarkModeToggle from '@/components/DarkModeToggle';
import TeacherPerformanceDashboard from '@/components/TeacherPerformanceDashboard';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'drag-students' | 'drag-teachers' | 'attendance' | 'overview' | 'teacher-performance'>('overview');
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [draggedStudent, setDraggedStudent] = useState<any>(null);
  const [draggedTeacher, setDraggedTeacher] = useState<any>(null);
  const [dragOverClass, setDragOverClass] = useState<string | null>(null);
  const [studentsByClass, setStudentsByClass] = useState<Record<string, any[]>>({});
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (!storedUser || storedUser.role !== 'admin') {
      router.push('/');
      return;
    }
    setUser(storedUser);
    loadData();
  }, []);

  useEffect(() => {
    // Organize students by class
    const byClass: Record<string, any[]> = {};
    const unassigned: any[] = [];

    students.forEach((student) => {
      // Use class_id if available (most reliable)
      if (student.class_id) {
        const key = student.class_id.toString();
        if (!byClass[key]) byClass[key] = [];
        byClass[key].push(student);
        return;
      }

      // Fallback: Find by matching class_name format
      const studentClass = classes.find(c => {
        const classKey = `${c.class_name} - ${c.section}`;
        return student.class_name === classKey || student.class_name === `${c.class_name}-${c.section}`;
      });

      if (studentClass) {
        const key = studentClass.id.toString();
        if (!byClass[key]) byClass[key] = [];
        byClass[key].push(student);
      } else {
        unassigned.push(student);
      }
    });

    setStudentsByClass(byClass);
    setUnassignedStudents(unassigned);
  }, [students, classes]);

  const loadData = async () => {
    try {
      const token = getAuthToken();
      const [classesRes, teachersRes, studentsRes] = await Promise.all([
        fetch('/api/admin/classes', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/teachers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      const classesData = await classesRes.json();
      const teachersData = await teachersRes.json();
      const studentsData = await studentsRes.json();

      if (classesRes.ok) setClasses(classesData.classes || []);
      if (teachersRes.ok) setTeachers(teachersData.teachers || []);
      if (studentsRes.ok) setStudents(studentsData.students || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleStudentDrop = async (classId: string) => {
    if (!draggedStudent) return;

    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/change-student-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId: draggedStudent.id, newClassId: classId }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Student ${draggedStudent.name} moved successfully!`);
        setDraggedStudent(null);
        loadData();
      } else {
        setMessage(data.error || 'Failed to move student');
      }
    } catch (error) {
      setMessage('Failed to move student');
    } finally {
      setLoading(false);
      setDragOverClass(null);
    }
  };

  const handleTeacherDrop = async (classId: string) => {
    if (!draggedTeacher) return;

    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/assign-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ classId, teacherId: draggedTeacher.id }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Teacher ${draggedTeacher.name} assigned successfully!`);
        setDraggedTeacher(null);
        loadData();
      } else {
        setMessage(data.error || 'Failed to assign teacher');
      }
    } catch (error) {
      setMessage('Failed to assign teacher');
    } finally {
      setLoading(false);
      setDragOverClass(null);
    }
  };

  const loadClassStudents = async (classId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/class-students?classId=${classId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setClassStudents(data.students || []);
        loadAttendanceForDate(attendanceDate, classId);
      }
    } catch (error) {
      console.error('Failed to load class students:', error);
    }
  };

  const loadAttendanceForDate = async (date: string, classId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/attendance?date=${date}&classId=${classId}`, {
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
    if (!selectedClass) {
      setMessage('Please select a class first');
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: attendanceDate,
          classId: selectedClass,
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

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
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
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('drag-students')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'drag-students'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Drag & Drop Students
              </button>
              <button
                onClick={() => setActiveTab('drag-teachers')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'drag-teachers'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Drag & Drop Teachers
              </button>
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
                onClick={() => router.push('/dashboard/admin/analytics')}
                className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Analytics & Reports
              </button>
              <button
                onClick={() => router.push('/dashboard/admin/bulk')}
                className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Bulk Operations
              </button>
              <button
                onClick={() => setActiveTab('teacher-performance')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'teacher-performance'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Teacher Performance
              </button>
            </nav>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
            <button onClick={() => setMessage('')} className="float-right text-sm">×</button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Classes</h3>
                <p className="text-3xl font-bold text-blue-600">{classes.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Teachers</h3>
                <p className="text-3xl font-bold text-green-600">{teachers.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Students</h3>
                <p className="text-3xl font-bold text-purple-600">{students.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Classes Overview</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map((cls) => (
                      <tr key={cls.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cls.class_name} - {cls.section}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cls.teacher_name || 'No teacher assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {studentsByClass[cls.id]?.length || 0} students
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drag-students' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Drag & Drop Students to Change Classes</h2>
              <p className="text-sm text-gray-600">Drag students from any class and drop them into another class to reassign them.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Unassigned Students */}
              {unassignedStudents.length > 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]">
                  <h3 className="font-semibold text-gray-700 mb-3">Unassigned Students</h3>
                  <div className="space-y-2">
                    {unassignedStudents.map((student) => (
                      <div
                        key={student.id}
                        draggable
                        onDragStart={() => setDraggedStudent(student)}
                        onDragEnd={() => setDraggedStudent(null)}
                        className="bg-gray-100 p-3 rounded-lg cursor-move hover:bg-gray-200 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.student_id}</p>
                        </div>
                        <span className="text-xs text-gray-400">⋮⋮</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Classes with Students */}
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverClass(cls.id.toString());
                  }}
                  onDragLeave={() => setDragOverClass(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedStudent) {
                      handleStudentDrop(cls.id);
                    }
                    setDragOverClass(null);
                  }}
                  className={`border-2 rounded-lg p-4 min-h-[200px] transition-all ${
                    dragOverClass === cls.id.toString()
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700">
                      {cls.class_name} - {cls.section}
                    </h3>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {studentsByClass[cls.id]?.length || 0}
                    </span>
                  </div>
                  {cls.teacher_name && (
                    <p className="text-xs text-gray-500 mb-2">Teacher: {cls.teacher_name}</p>
                  )}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {studentsByClass[cls.id]?.map((student) => (
                      <div
                        key={student.id}
                        draggable
                        onDragStart={() => setDraggedStudent(student)}
                        onDragEnd={() => setDraggedStudent(null)}
                        className="bg-gray-100 p-3 rounded-lg cursor-move hover:bg-gray-200 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.student_id}</p>
                        </div>
                        <span className="text-xs text-gray-400">⋮⋮</span>
                      </div>
                    ))}
                    {(!studentsByClass[cls.id] || studentsByClass[cls.id].length === 0) && (
                      <p className="text-sm text-gray-400 text-center py-4">Drop students here</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'drag-teachers' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Drag & Drop Teachers to Assign Classes</h2>
              <p className="text-sm text-gray-600">Drag teachers and drop them onto classes to assign them.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Teachers List */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Available Teachers</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {teachers.map((teacher) => {
                    const assignedClass = classes.find(c => c.teacher_id === teacher.id);
                    return (
                      <div
                        key={teacher.id}
                        draggable
                        onDragStart={() => setDraggedTeacher(teacher)}
                        onDragEnd={() => setDraggedTeacher(null)}
                        className={`p-4 rounded-lg cursor-move transition-colors flex justify-between items-center ${
                          assignedClass
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-gray-500">{teacher.employee_id}</p>
                          {assignedClass && (
                            <p className="text-xs text-green-600 mt-1">
                              Currently: {assignedClass.class_name} - {assignedClass.section}
                            </p>
                          )}
                        </div>
                        <span className="text-gray-400">⋮⋮</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Classes */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Classes</h3>
                <div className="space-y-3">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverClass(cls.id.toString());
                      }}
                      onDragLeave={() => setDragOverClass(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedTeacher) {
                          handleTeacherDrop(cls.id);
                        }
                        setDragOverClass(null);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        dragOverClass === cls.id.toString()
                          ? 'border-blue-500 bg-blue-50 scale-105'
                          : cls.teacher_id
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {cls.class_name} - {cls.section}
                          </p>
                          {cls.teacher_name ? (
                            <p className="text-sm text-green-600 mt-1">
                              Teacher: {cls.teacher_name}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 mt-1">No teacher assigned</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {studentsByClass[cls.id]?.length || 0} students
                          </p>
                        </div>
                        {!cls.teacher_id && (
                          <span className="text-xs text-gray-400">Drop teacher here</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Mark Attendance (Any Date)</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    if (e.target.value) {
                      loadClassStudents(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name} - {cls.section}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => {
                    setAttendanceDate(e.target.value);
                    if (selectedClass) {
                      loadAttendanceForDate(e.target.value, selectedClass);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            {selectedClass && (
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
                      {classStudents.map((student) => (
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
            )}
          </div>
        )}

        {activeTab === 'teacher-performance' && (
          <TeacherPerformanceDashboard />
        )}
      </div>
    </div>
  );
}
