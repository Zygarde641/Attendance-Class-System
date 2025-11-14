import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { exportAttendanceToCSV, exportMarksToCSV, exportToJSON } from '@/lib/exports';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'csv';
    const classId = searchParams.get('classId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const subject = searchParams.get('subject');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let data: string;
    let filename: string;
    let contentType: string;

    if (type === 'attendance') {
      if (format === 'csv') {
        data = exportAttendanceToCSV(
          classId ? parseInt(classId) : undefined,
          startDate || undefined,
          endDate || undefined
        );
        filename = `attendance_${Date.now()}.csv`;
        contentType = 'text/csv';
      } else {
        return NextResponse.json({ error: 'Only CSV format supported for attendance' }, { status: 400 });
      }
    } else if (type === 'marks') {
      if (format === 'csv') {
        data = exportMarksToCSV(
          classId ? parseInt(classId) : undefined,
          subject || undefined
        );
        filename = `marks_${Date.now()}.csv`;
        contentType = 'text/csv';
      } else {
        return NextResponse.json({ error: 'Only CSV format supported for marks' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

