import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
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

    const { studentId, subject, internal, external } = await request.json();

    if (!studentId || !subject) {
      return NextResponse.json({ error: 'Student ID and subject are required' }, { status: 400 });
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

    // Verify student is in teacher's class
    const student = db.prepare('SELECT * FROM users WHERE id = ? AND class_id = ?').get(studentId, classRecord.id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found in your class' }, { status: 404 });
    }

    db.prepare(`
      INSERT INTO marks (student_id, class_id, subject, internal_marks, external_marks, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      studentId,
      classRecord.id,
      subject,
      internal || null,
      external || null,
      decoded.id
    );

    return NextResponse.json({ message: 'Marks uploaded successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

