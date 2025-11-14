import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { getClassStudentPerformance, getStudentAttendanceStats, getAttendanceTrend, getMarksDistribution } from '@/lib/analytics';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = getUserById(decoded.id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get class ID from classes table where teacher is assigned
    const classRecord = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(decoded.id) as any;
    if (!classRecord) {
      return NextResponse.json({ error: 'Teacher not assigned to a class' }, { status: 400 });
    }

    switch (type) {
      case 'student-performance':
        const performance = getClassStudentPerformance(classRecord.id);
        return NextResponse.json({ performance });

      case 'attendance-trend':
        const days = parseInt(searchParams.get('days') || '30');
        const trend = getAttendanceTrend(classRecord.id, days);
        return NextResponse.json({ trend });

      case 'marks-distribution':
        const subject = searchParams.get('subject') || undefined;
        const distribution = getMarksDistribution(classRecord.id, subject);
        return NextResponse.json({ distribution });

      case 'class-stats':
        const stats = db.prepare(`
          SELECT 
            COUNT(DISTINCT u.id) as totalStudents,
            AVG(CASE WHEN a.status = 'present' THEN 1.0 ELSE 0.0 END) * 100 as avgAttendance,
            AVG(m.internal_marks + m.external_marks) as avgMarks,
            COUNT(DISTINCT m.subject) as subjectsCount
          FROM users u
          LEFT JOIN attendance a ON u.id = a.student_id AND a.class_id = ?
          LEFT JOIN marks m ON u.id = m.student_id AND m.class_id = ?
          WHERE u.class_id = ? AND u.role = 'student'
        `).get(classRecord.id, classRecord.id, classRecord.id) as any;

        return NextResponse.json({
          stats: {
            totalStudents: stats.totalStudents || 0,
            averageAttendance: Math.round((stats.avgAttendance || 0) * 100) / 100,
            averageMarks: Math.round((stats.avgMarks || 0) * 100) / 100,
            subjectsCount: stats.subjectsCount || 0,
          },
        });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

