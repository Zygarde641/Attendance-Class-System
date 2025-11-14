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

    const { studentId, newClassId } = await request.json();

    if (!studentId || !newClassId) {
      return NextResponse.json({ error: 'Student ID and New Class ID are required' }, { status: 400 });
    }

    // Verify student exists
    const student = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(studentId, 'student');
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify class exists
    const classRecord = db.prepare('SELECT * FROM classes WHERE id = ?').get(newClassId);
    if (!classRecord) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Update student's class
    db.prepare('UPDATE users SET class_id = ? WHERE id = ?').run(newClassId, studentId);

    return NextResponse.json({ message: 'Student class changed successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

