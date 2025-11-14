import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const classId = searchParams.get('classId');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!date || !classId) {
      return NextResponse.json({ error: 'Date and Class ID are required' }, { status: 400 });
    }

    const attendance = db.prepare(`
      SELECT a.*
      FROM attendance a
      WHERE a.date = ? AND a.class_id = ?
      ORDER BY a.student_id
    `).all(date, classId);

    return NextResponse.json({ attendance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, classId, attendance: attendanceData } = await request.json();

    if (!date || !classId || !attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const insertAttendance = db.prepare(`
      INSERT OR REPLACE INTO attendance (student_id, class_id, date, status, marked_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const record of attendanceData) {
        insertAttendance.run(
          record.studentId,
          classId,
          date,
          record.status,
          decoded.id
        );
      }
    });

    transaction();

    return NextResponse.json({ message: 'Attendance marked successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

