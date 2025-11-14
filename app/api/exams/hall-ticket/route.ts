import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!examId || !studentId) {
      return NextResponse.json({ error: 'Exam ID and Student ID required' }, { status: 400 });
    }

    const exam = db.prepare(`
      SELECT 
        e.*,
        c.class_name || ' - ' || c.section as class_name,
        s.name as subject_name,
        r.room_number
      FROM exams e
      JOIN classes c ON e.class_id = c.id
      JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN rooms r ON e.room_id = r.id
      WHERE e.id = ?
    `).get(examId) as any;

    const student = db.prepare('SELECT * FROM users WHERE id = ?').get(studentId) as any;
    const seat = db.prepare('SELECT * FROM exam_seats WHERE exam_id = ? AND student_id = ?').get(examId, studentId) as any;

    if (!exam || !student || !seat) {
      return NextResponse.json({ error: 'Exam or seat not found' }, { status: 404 });
    }

    return NextResponse.json({
      hallTicket: {
        exam: {
          name: exam.name,
          type: exam.exam_type,
          subject: exam.subject_name,
          date: exam.exam_date,
          startTime: exam.start_time,
          endTime: exam.end_time,
        },
        student: {
          name: student.name,
          studentId: student.student_id,
          class: exam.class_name,
        },
        seat: {
          seatNumber: seat.seat_number,
          room: exam.room_number,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

