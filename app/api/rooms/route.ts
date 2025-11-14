import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = db.prepare('SELECT * FROM rooms ORDER BY room_number').all();
    return NextResponse.json({ rooms });
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

    const { roomNumber, roomType, capacity } = await request.json();

    if (!roomNumber) {
      return NextResponse.json({ error: 'Room number required' }, { status: 400 });
    }

    db.prepare('INSERT INTO rooms (room_number, room_type, capacity) VALUES (?, ?, ?)').run(
      roomNumber,
      roomType || null,
      capacity || null
    );

    logAudit({
      user_id: decoded.id,
      action: 'create_room',
      entity_type: 'room',
      new_values: { roomNumber, roomType, capacity },
    });

    return NextResponse.json({ message: 'Room created successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

