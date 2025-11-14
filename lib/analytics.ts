import db from './db';

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ClassPerformance {
  classId: number;
  className: string;
  averageAttendance: number;
  totalStudents: number;
  averageMarks: number;
}

export function getStudentAttendanceStats(studentId: number, startDate?: string, endDate?: string): AttendanceStats {
  let query = `
    SELECT 
      COUNT(*) as totalDays,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absentDays
    FROM attendance
    WHERE student_id = ?
  `;
  const params: any[] = [studentId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  const result = db.prepare(query).get(...params) as any;
  const totalDays = result.totalDays || 0;
  const presentDays = result.presentDays || 0;
  const absentDays = result.absentDays || 0;
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // Calculate trend (simplified - compare last week vs previous week)
  const today = new Date();
  const lastWeekEnd = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const lastWeekStats = getStudentAttendanceStats(studentId, lastWeekEnd.toISOString().split('T')[0], today.toISOString().split('T')[0]);
  const prevWeekStats = getStudentAttendanceStats(studentId, lastWeekStart.toISOString().split('T')[0], lastWeekEnd.toISOString().split('T')[0]);

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (lastWeekStats.attendancePercentage > prevWeekStats.attendancePercentage + 5) {
    trend = 'improving';
  } else if (lastWeekStats.attendancePercentage < prevWeekStats.attendancePercentage - 5) {
    trend = 'declining';
  }

  return {
    totalDays,
    presentDays,
    absentDays,
    attendancePercentage: Math.round(attendancePercentage * 100) / 100,
    trend,
  };
}

export function getClassPerformance(classId: number): ClassPerformance {
  const classInfo = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  
  // Get attendance stats
  const attendanceStats = db.prepare(`
    SELECT 
      COUNT(DISTINCT date) as totalDays,
      AVG(CASE WHEN status = 'present' THEN 1.0 ELSE 0.0 END) * 100 as avgAttendance
    FROM attendance
    WHERE class_id = ?
  `).get(classId) as any;

  // Get student count
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE class_id = ? AND role = ?').get(classId, 'student') as any;

  // Get average marks
  const marksStats = db.prepare(`
    SELECT AVG(internal_marks + external_marks) as avgMarks
    FROM marks
    WHERE class_id = ?
  `).get(classId) as any;

  return {
    classId,
    className: `${classInfo.class_name} - ${classInfo.section}`,
    averageAttendance: Math.round((attendanceStats.avgAttendance || 0) * 100) / 100,
    totalStudents: studentCount.count || 0,
    averageMarks: Math.round((marksStats.avgMarks || 0) * 100) / 100,
  };
}

export function getAtRiskStudents(threshold: number = 75): any[] {
  const query = `
    SELECT 
      u.id,
      u.name,
      u.student_id,
      COUNT(a.id) as totalDays,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as presentDays,
      (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)) as attendancePercentage
    FROM users u
    LEFT JOIN attendance a ON u.id = a.student_id
    WHERE u.role = 'student'
    GROUP BY u.id
    HAVING attendancePercentage < ? OR attendancePercentage IS NULL
    ORDER BY attendancePercentage ASC
  `;

  return db.prepare(query).all(threshold);
}

export function getAttendanceTrend(classId: number, days: number = 30): any[] {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const query = `
    SELECT 
      date,
      COUNT(*) as totalStudents,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentCount,
      (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as attendancePercentage
    FROM attendance
    WHERE class_id = ? AND date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date ASC
  `;

  return db.prepare(query).all(classId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
}

export function getMarksDistribution(classId: number, subject?: string): any {
  let query = `
    SELECT 
      CASE 
        WHEN (internal_marks + external_marks) >= 90 THEN 'A+ (90-100)'
        WHEN (internal_marks + external_marks) >= 80 THEN 'A (80-89)'
        WHEN (internal_marks + external_marks) >= 70 THEN 'B (70-79)'
        WHEN (internal_marks + external_marks) >= 60 THEN 'C (60-69)'
        WHEN (internal_marks + external_marks) >= 50 THEN 'D (50-59)'
        ELSE 'F (<50)'
      END as grade,
      COUNT(*) as count
    FROM marks
    WHERE class_id = ?
  `;
  const params: any[] = [classId];

  if (subject) {
    query += ' AND subject = ?';
    params.push(subject);
  }

  query += ' GROUP BY grade ORDER BY grade';

  return db.prepare(query).all(...params);
}

export function compareClasses(classIds: number[]): any[] {
  const placeholders = classIds.map(() => '?').join(',');
  const query = `
    SELECT 
      c.id,
      c.class_name || ' - ' || c.section as className,
      COUNT(DISTINCT a.date) as totalDays,
      AVG(CASE WHEN a.status = 'present' THEN 1.0 ELSE 0.0 END) * 100 as avgAttendance,
      AVG(m.internal_marks + m.external_marks) as avgMarks
    FROM classes c
    LEFT JOIN attendance a ON c.id = a.class_id
    LEFT JOIN marks m ON c.id = m.class_id
    WHERE c.id IN (${placeholders})
    GROUP BY c.id
  `;

  return db.prepare(query).all(...classIds);
}

export function getTeacherPerformance(teacherId: number): any {
  // Get classes assigned to teacher
  const classes = db.prepare('SELECT * FROM classes WHERE teacher_id = ?').all(teacherId) as any[];
  
  if (classes.length === 0) {
    return {
      teacherId,
      classes: [],
      totalStudents: 0,
      averageAttendance: 0,
      averageMarks: 0,
      studentPerformance: [],
    };
  }

  const classIds = classes.map(c => c.id);
  const placeholders = classIds.map(() => '?').join(',');

  // Get overall statistics
  const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT u.id) as totalStudents,
      AVG(CASE WHEN a.status = 'present' THEN 1.0 ELSE 0.0 END) * 100 as avgAttendance,
      AVG(m.internal_marks + m.external_marks) as avgMarks
    FROM users u
    LEFT JOIN attendance a ON u.id = a.student_id AND a.class_id IN (${placeholders})
    LEFT JOIN marks m ON u.id = m.student_id AND m.class_id IN (${placeholders})
    WHERE u.class_id IN (${placeholders}) AND u.role = 'student'
  `).get(...classIds, ...classIds, ...classIds) as any;

  // Get student performance breakdown
  const studentPerformance = db.prepare(`
    SELECT 
      u.id,
      u.name,
      u.student_id,
      COUNT(DISTINCT a.date) as totalDays,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as presentDays,
      (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT a.date)) as attendancePercentage,
      AVG(m.internal_marks + m.external_marks) as avgMarks
    FROM users u
    LEFT JOIN attendance a ON u.id = a.student_id AND a.class_id IN (${placeholders})
    LEFT JOIN marks m ON u.id = m.student_id AND m.class_id IN (${placeholders})
    WHERE u.class_id IN (${placeholders}) AND u.role = 'student'
    GROUP BY u.id
    ORDER BY avgMarks DESC, attendancePercentage DESC
  `).all(...classIds, ...classIds, ...classIds) as any[];

  return {
    teacherId,
    classes: classes.map(c => ({
      id: c.id,
      name: `${c.class_name} - ${c.section}`,
    })),
    totalStudents: stats.totalStudents || 0,
    averageAttendance: Math.round((stats.avgAttendance || 0) * 100) / 100,
    averageMarks: Math.round((stats.avgMarks || 0) * 100) / 100,
    studentPerformance: studentPerformance.map(s => ({
      ...s,
      attendancePercentage: Math.round((s.attendancePercentage || 0) * 100) / 100,
      avgMarks: Math.round((s.avgMarks || 0) * 100) / 100,
    })),
  };
}

export function getAllTeachersPerformance(): any[] {
  const teachers = db.prepare(`
    SELECT u.id, u.name, u.employee_id, c.id as class_id, c.class_name || ' - ' || c.section as class_name
    FROM users u
    LEFT JOIN classes c ON u.id = c.teacher_id
    WHERE u.role = 'teacher'
    ORDER BY u.name
  `).all() as any[];

  return teachers.map(teacher => {
    if (!teacher.class_id) {
      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        employeeId: teacher.employee_id,
        classes: [],
        totalStudents: 0,
        averageAttendance: 0,
        averageMarks: 0,
      };
    }

    const performance = getTeacherPerformance(teacher.id);
    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      employeeId: teacher.employee_id,
      classes: performance.classes,
      totalStudents: performance.totalStudents,
      averageAttendance: performance.averageAttendance,
      averageMarks: performance.averageMarks,
    };
  });
}

export function getClassStudentPerformance(classId: number): any[] {
  const students = db.prepare(`
    SELECT 
      u.id,
      u.name,
      u.student_id,
      COUNT(DISTINCT a.date) as totalDays,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as presentDays,
      (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT a.date), 0)) as attendancePercentage,
      AVG(m.internal_marks + m.external_marks) as avgMarks,
      COUNT(DISTINCT m.subject) as subjectsCount
    FROM users u
    LEFT JOIN attendance a ON u.id = a.student_id
    LEFT JOIN marks m ON u.id = m.student_id
    WHERE u.class_id = ? AND u.role = 'student'
    GROUP BY u.id
    ORDER BY avgMarks DESC, attendancePercentage DESC
  `).all(classId) as any[];

  return students.map(s => ({
    ...s,
    attendancePercentage: Math.round((s.attendancePercentage || 0) * 100) / 100,
    avgMarks: Math.round((s.avgMarks || 0) * 100) / 100,
  }));
}

