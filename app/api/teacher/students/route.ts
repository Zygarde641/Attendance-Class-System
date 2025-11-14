import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
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

    const teacher = getUserById(decoded.id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get class ID from classes table where teacher is assigned
    const classRecord = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(decoded.id) as any;
    if (!classRecord) {
      return NextResponse.json({ error: 'Teacher not assigned to a class' }, { status: 400 });
    }

    const students = db.prepare(`
      SELECT id, name, student_id, username
      FROM users
      WHERE role = 'student' AND class_id = ?
      ORDER BY name
    `).all(classRecord.id);

    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

