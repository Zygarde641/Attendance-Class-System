import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { createBulkNotifications } from '@/lib/notifications';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, classId, attendance } = await request.json();

    if (!date || !classId || !Array.isArray(attendance)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const user = getUserById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const insertAttendance = db.prepare(`
      INSERT OR REPLACE INTO attendance (student_id, class_id, date, status, marked_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const record of attendance) {
        insertAttendance.run(record.studentId, classId, date, record.status, decoded.id);
      }
    });

    transaction();

    // Log audit
    logAudit({
      user_id: decoded.id,
      action: 'bulk_attendance_mark',
      entity_type: 'attendance',
      old_values: null,
      new_values: { date, classId, count: attendance.length },
    });

    // Create notifications for students with low attendance
    const students = db.prepare('SELECT id FROM users WHERE class_id = ? AND role = ?').all(classId, 'student') as any[];
    const notifications = students.map((student: any) => ({
      user_id: student.id,
      title: 'Attendance Updated',
      message: `Your attendance for ${date} has been marked.`,
      type: 'attendance' as const,
      related_id: classId,
      related_type: 'class',
    }));
    createBulkNotifications(notifications);

    return NextResponse.json({ message: 'Bulk attendance marked successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

