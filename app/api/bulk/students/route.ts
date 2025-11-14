import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';

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

    const { students, classId } = await request.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Students array required' }, { status: 400 });
    }

    const insertStudent = db.prepare(`
      INSERT INTO users (username, password, role, name, student_id, class_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const student of students) {
        const hashedPassword = hashPassword(student.password || 'student123');
        insertStudent.run(
          student.username || student.student_id?.toLowerCase(),
          hashedPassword,
          'student',
          student.name,
          student.student_id,
          classId || student.class_id || null
        );
      }
    });

    transaction();

    // Log audit
    logAudit({
      user_id: decoded.id,
      action: 'bulk_student_create',
      entity_type: 'users',
      old_values: null,
      new_values: { count: students.length, classId },
    });

    return NextResponse.json({ message: `${students.length} students created successfully` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

