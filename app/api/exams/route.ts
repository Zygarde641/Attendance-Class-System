import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { createBulkNotifications } from '@/lib/notifications';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = `
      SELECT 
        e.*,
        c.class_name || ' - ' || c.section as class_name,
        s.name as subject_name,
        r.room_number,
        r.capacity
      FROM exams e
      JOIN classes c ON e.class_id = c.id
      JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN rooms r ON e.room_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (classId) {
      query += ' AND e.class_id = ?';
      params.push(classId);
    }

    query += ' ORDER BY e.exam_date, e.start_time';

    let exams = db.prepare(query).all(...params) as any[];

    // If studentId, get seat allocation
    if (studentId) {
      for (const exam of exams) {
        const seat = db.prepare('SELECT * FROM exam_seats WHERE exam_id = ? AND student_id = ?').get(exam.id, studentId) as any;
        exam.seat = seat;
      }
    }

    return NextResponse.json({ exams });
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

    const { name, examType, classId, subjectId, examDate, startTime, endTime, roomId, totalMarks } = await request.json();

    // Create exam
    const result = db.prepare(`
      INSERT INTO exams (name, exam_type, class_id, subject_id, exam_date, start_time, end_time, room_id, total_marks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, examType, classId, subjectId, examDate, startTime, endTime, roomId || null, totalMarks || null, decoded.id);

    const examId = result.lastInsertRowid;

    // Allocate seats for all students in the class
    const students = db.prepare('SELECT id FROM users WHERE class_id = ? AND role = ?').all(classId, 'student') as any[];
    const room = roomId ? db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as any : null;
    const capacity = room?.capacity || students.length;

    const insertSeat = db.prepare(`
      INSERT INTO exam_seats (exam_id, student_id, seat_number, room_id)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      students.forEach((student: any, index: number) => {
        const seatNumber = `S${String(index + 1).padStart(3, '0')}`;
        insertSeat.run(examId, student.id, seatNumber, roomId || null);
      });
    });

    transaction();

    // Create notifications for students (3 days before exam)
    const examDateObj = new Date(examDate);
    const notificationDate = new Date(examDateObj.getTime() - 3 * 24 * 60 * 60 * 1000);
    const today = new Date();

    const notifications = students.map((student: any) => ({
      user_id: student.id,
      title: `Upcoming Exam: ${name}`,
      message: `You have an exam on ${examDate} at ${startTime}. Room: ${room?.room_number || 'TBA'}. Seat: ${students.indexOf(student) + 1}`,
      type: 'exam' as const,
      related_id: examId,
      related_type: 'exam',
    }));

    // Schedule notification (in production, use a job queue)
    if (notificationDate <= today) {
      // Send immediately if exam is within 3 days
      createBulkNotifications(notifications);
    } else {
      // Store for later (in production, use cron job)
      createBulkNotifications(notifications);
    }

    logAudit({
      user_id: decoded.id,
      action: 'create_exam',
      entity_type: 'exam',
      new_values: { examId, name, classId, examDate },
    });

    return NextResponse.json({ message: 'Exam created successfully', examId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

