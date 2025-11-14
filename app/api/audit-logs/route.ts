import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filters = {
      user_id: searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined,
      entity_type: searchParams.get('entityType') || undefined,
      entity_id: searchParams.get('entityId') ? parseInt(searchParams.get('entityId')!) : undefined,
      start_date: searchParams.get('startDate') || undefined,
      end_date: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
    };

    const logs = getAuditLogs(filters);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

