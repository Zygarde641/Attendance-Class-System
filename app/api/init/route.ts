import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    // Initialize database
    initDatabase();

    // Create sample data for testing
    const bcrypt = require('bcryptjs');
    
    // Create sample classes
    const class1 = db.prepare('INSERT OR IGNORE INTO classes (class_name, section) VALUES (?, ?)').run('2', 'A');
    const class2 = db.prepare('INSERT OR IGNORE INTO classes (class_name, section) VALUES (?, ?)').run('2', 'B');
    
    const classes = db.prepare('SELECT id FROM classes').all() as any[];
    
    // Create sample teacher
    const teacherPassword = hashPassword('teacher123');
    const teacher = db.prepare(`
      INSERT OR IGNORE INTO users (username, password, role, name, employee_id, class_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('teacher1', teacherPassword, 'teacher', 'John Teacher', 'EMP001', classes[0]?.id || null);

    // Create sample students
    const studentPassword = hashPassword('student123');
    const students = [
      { name: 'Alice Student', studentId: 'STU001', classId: classes[0]?.id },
      { name: 'Bob Student', studentId: 'STU002', classId: classes[0]?.id },
      { name: 'Charlie Student', studentId: 'STU003', classId: classes[1]?.id },
    ];

    for (const student of students) {
      db.prepare(`
        INSERT OR IGNORE INTO users (username, password, role, name, student_id, class_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        student.studentId.toLowerCase(),
        studentPassword,
        'student',
        student.name,
        student.studentId,
        student.classId
      );
    }

    // Assign teacher to class
    if (classes[0]?.id) {
      const teacherUser = db.prepare('SELECT id FROM users WHERE username = ?').get('teacher1') as any;
      if (teacherUser) {
        db.prepare('UPDATE classes SET teacher_id = ? WHERE id = ?').run(teacherUser.id, classes[0].id);
      }
    }

    return NextResponse.json({
      message: 'Database initialized successfully',
      credentials: {
        admin: { username: 'admin', password: 'admin123' },
        teacher: { username: 'teacher1', password: 'teacher123', employeeId: 'EMP001' },
        student: { username: 'stu001', password: 'student123' },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

