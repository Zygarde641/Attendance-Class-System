import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword, generateToken } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password, employeeId, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify role matches
    if (user.role !== role) {
      return NextResponse.json(
        { error: 'Invalid role for this login' },
        { status: 403 }
      );
    }

    // For teachers, verify employee ID
    if (role === 'teacher' && employeeId) {
      const dbUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      if (dbUser.employee_id !== employeeId) {
        return NextResponse.json(
          { error: 'Invalid employee ID' },
          { status: 401 }
        );
      }
    }

    // Verify password
    const dbUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!verifyPassword(password, dbUser.password)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken(user);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        employee_id: user.employee_id,
        student_id: user.student_id,
        class_id: user.class_id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

