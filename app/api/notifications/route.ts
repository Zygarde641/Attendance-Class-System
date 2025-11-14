import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = getUserNotifications(decoded.id, unreadOnly);
    const preferences = getNotificationPreferences(decoded.id);

    return NextResponse.json({ notifications, preferences });
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
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, notificationId, preferences } = await request.json();

    if (action === 'mark-read' && notificationId) {
      markNotificationAsRead(notificationId, decoded.id);
      return NextResponse.json({ message: 'Notification marked as read' });
    }

    if (action === 'mark-all-read') {
      markAllAsRead(decoded.id);
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (action === 'update-preferences' && preferences) {
      updateNotificationPreferences(decoded.id, preferences);
      return NextResponse.json({ message: 'Preferences updated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

