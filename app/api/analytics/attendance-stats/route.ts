import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getStudentAttendanceStats, getClassPerformance, getAttendanceTrend, getAtRiskStudents } from '@/lib/analytics';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (type) {
      case 'student':
        if (!studentId) {
          return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
        }
        const stats = getStudentAttendanceStats(parseInt(studentId), startDate || undefined, endDate || undefined);
        return NextResponse.json({ stats });

      case 'class':
        if (!classId) {
          return NextResponse.json({ error: 'Class ID required' }, { status: 400 });
        }
        const performance = getClassPerformance(parseInt(classId));
        return NextResponse.json({ performance });

      case 'trend':
        if (!classId) {
          return NextResponse.json({ error: 'Class ID required' }, { status: 400 });
        }
        const days = parseInt(searchParams.get('days') || '30');
        const trend = getAttendanceTrend(parseInt(classId), days);
        return NextResponse.json({ trend });

      case 'at-risk':
        const threshold = parseInt(searchParams.get('threshold') || '75');
        const atRisk = getAtRiskStudents(threshold);
        return NextResponse.json({ students: atRisk });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

