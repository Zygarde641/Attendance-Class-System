import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllTeachersPerformance, getTeacherPerformance } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (teacherId) {
      // Get specific teacher performance
      const performance = getTeacherPerformance(parseInt(teacherId));
      return NextResponse.json({ performance });
    } else {
      // Get all teachers performance
      const allPerformance = getAllTeachersPerformance();
      return NextResponse.json({ teachers: allPerformance });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

