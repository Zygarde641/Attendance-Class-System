import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
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

    const { classId, teacherId } = await request.json();

    if (!classId || !teacherId) {
      return NextResponse.json({ error: 'Class ID and Teacher ID are required' }, { status: 400 });
    }

    // Verify class exists
    const classRecord = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
    if (!classRecord) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Verify teacher exists
    const teacher = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(teacherId, 'teacher');
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Update class with teacher
    db.prepare('UPDATE classes SET teacher_id = ? WHERE id = ?').run(teacherId, classId);

    return NextResponse.json({ message: 'Teacher assigned successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

