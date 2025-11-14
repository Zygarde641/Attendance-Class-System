import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { isWithinLast3Days } from '@/lib/utils';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
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

    const attendance = db.prepare(`
      SELECT a.*, u.name as student_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE a.date = ? AND a.class_id = ?
      ORDER BY u.name
    `).all(date, classRecord.id);

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
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, attendance: attendanceData } = await request.json();

    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Check if date is within last 3 days
    if (!isWithinLast3Days(date)) {
      return NextResponse.json(
        { error: 'You can only mark attendance for the last 3 days' },
        { status: 403 }
      );
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

    const insertAttendance = db.prepare(`
      INSERT OR REPLACE INTO attendance (student_id, class_id, date, status, marked_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const record of attendanceData) {
        insertAttendance.run(
          record.studentId,
          classRecord.id,
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

