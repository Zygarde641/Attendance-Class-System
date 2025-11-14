import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: number;
  username: string;
  role: 'teacher' | 'student' | 'admin';
  name: string;
  employee_id?: string;
  student_id?: string;
  class_id?: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getUserByUsername(username: string): User | null {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    employee_id: user.employee_id,
    student_id: user.student_id,
    class_id: user.class_id,
  };
}

export function getUserById(id: number): User | null {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    employee_id: user.employee_id,
    student_id: user.student_id,
    class_id: user.class_id,
  };
}

