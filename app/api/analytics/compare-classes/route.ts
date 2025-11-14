import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { compareClasses } from '@/lib/analytics';

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

    const { classIds } = await request.json();

    if (!Array.isArray(classIds) || classIds.length === 0) {
      return NextResponse.json({ error: 'Class IDs array required' }, { status: 400 });
    }

    const comparison = compareClasses(classIds);
    return NextResponse.json({ comparison });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

