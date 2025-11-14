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
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { marks } = await request.json();

    if (!Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json({ error: 'Marks array required' }, { status: 400 });
    }

    const teacher = getUserById(decoded.id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const insertMark = db.prepare(`
      INSERT INTO marks (student_id, class_id, subject, internal_marks, external_marks, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const mark of marks) {
        // Get student's class
        const student = db.prepare('SELECT class_id FROM users WHERE id = ?').get(mark.studentId) as any;
        if (student && student.class_id) {
          insertMark.run(
            mark.studentId,
            student.class_id,
            mark.subject,
            mark.internal || null,
            mark.external || null,
            decoded.id
          );
        }
      }
    });

    transaction();

    // Log audit
    logAudit({
      user_id: decoded.id,
      action: 'bulk_marks_upload',
      entity_type: 'marks',
      old_values: null,
      new_values: { count: marks.length },
    });

    // Create notifications
    const studentIds = [...new Set(marks.map((m: any) => m.studentId))];
    const notifications = studentIds.map((studentId: number) => ({
      user_id: studentId,
      title: 'New Marks Uploaded',
      message: 'Your marks have been updated.',
      type: 'marks' as const,
      related_id: studentId,
      related_type: 'student',
    }));
    createBulkNotifications(notifications);

    return NextResponse.json({ message: `${marks.length} marks uploaded successfully` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

