import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = `
      SELECT 
        t.*,
        c.class_name || ' - ' || c.section as class_name,
        s.name as subject_name,
        u.name as teacher_name,
        r.room_number
      FROM timetables t
      JOIN classes c ON t.class_id = c.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN users u ON t.teacher_id = u.id
      LEFT JOIN rooms r ON t.room_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (classId) {
      query += ' AND t.class_id = ?';
      params.push(classId);
    }
    if (teacherId) {
      query += ' AND t.teacher_id = ?';
      params.push(teacherId);
    }

    query += ' ORDER BY t.day_of_week, t.start_time';

    const timetables = db.prepare(query).all(...params);
    return NextResponse.json({ timetables });
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

    const { classId, subjectId, teacherId, roomId, dayOfWeek, startTime, endTime } = await request.json();

    // Check for conflicts
    const conflict = db.prepare(`
      SELECT * FROM timetables
      WHERE (teacher_id = ? OR room_id = ?)
      AND day_of_week = ?
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `).get(teacherId, roomId, dayOfWeek, startTime, startTime, endTime, endTime, startTime, endTime);

    if (conflict) {
      return NextResponse.json({ error: 'Time slot conflict detected' }, { status: 400 });
    }

    db.prepare(`
      INSERT INTO timetables (class_id, subject_id, teacher_id, room_id, day_of_week, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(classId, subjectId, teacherId, roomId || null, dayOfWeek, startTime, endTime);

    logAudit({
      user_id: decoded.id,
      action: 'create_timetable',
      entity_type: 'timetable',
      new_values: { classId, subjectId, teacherId, dayOfWeek },
    });

    return NextResponse.json({ message: 'Timetable entry created successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Timetable ID required' }, { status: 400 });
    }

    db.prepare('DELETE FROM timetables WHERE id = ?').run(id);

    logAudit({
      user_id: decoded.id,
      action: 'delete_timetable',
      entity_type: 'timetable',
      entity_id: parseInt(id),
    });

    return NextResponse.json({ message: 'Timetable entry deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

