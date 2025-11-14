import db from './db';

export interface Notification {
  user_id?: number;
  title: string;
  message: string;
  type: 'attendance' | 'marks' | 'exam' | 'class' | 'general' | 'system';
  related_id?: number;
  related_type?: string;
}

export function createNotification(notification: Notification) {
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      notification.user_id || null,
      notification.title,
      notification.message,
      notification.type,
      notification.related_id || null,
      notification.related_type || null
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export function createBulkNotifications(notifications: Notification[]) {
  const insert = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const notification of notifications) {
      insert.run(
        notification.user_id || null,
        notification.title,
        notification.message,
        notification.type,
        notification.related_id || null,
        notification.related_type || null
      );
    }
  });

  transaction();
}

export function getUserNotifications(userId: number, unreadOnly: boolean = false) {
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  if (unreadOnly) {
    query += ' AND read = 0';
  }
  query += ' ORDER BY created_at DESC LIMIT 50';
  return db.prepare(query).all(userId);
}

export function markNotificationAsRead(notificationId: number, userId: number) {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(notificationId, userId);
}

export function markAllAsRead(userId: number) {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(userId);
}

export function getNotificationPreferences(userId: number) {
  const prefs = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId) as any;
  if (!prefs) {
    // Create default preferences
    db.prepare(`
      INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, push_enabled, attendance_alerts, marks_alerts, exam_alerts, class_alerts)
      VALUES (?, 1, 0, 1, 1, 1, 1, 1)
    `).run(userId);
    return {
      email_enabled: 1,
      sms_enabled: 0,
      push_enabled: 1,
      attendance_alerts: 1,
      marks_alerts: 1,
      exam_alerts: 1,
      class_alerts: 1,
    };
  }
  return prefs;
}

export function updateNotificationPreferences(userId: number, preferences: any) {
  db.prepare(`
    INSERT OR REPLACE INTO notification_preferences 
    (user_id, email_enabled, sms_enabled, push_enabled, attendance_alerts, marks_alerts, exam_alerts, class_alerts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    preferences.email_enabled ? 1 : 0,
    preferences.sms_enabled ? 1 : 0,
    preferences.push_enabled ? 1 : 0,
    preferences.attendance_alerts ? 1 : 0,
    preferences.marks_alerts ? 1 : 0,
    preferences.exam_alerts ? 1 : 0,
    preferences.class_alerts ? 1 : 0
  );
}

// Email notification (placeholder - integrate with email service)
export async function sendEmailNotification(email: string, subject: string, body: string) {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`[EMAIL] To: ${email}, Subject: ${subject}`);
  // In production, use: await emailService.send({ to: email, subject, body });
}

// SMS notification (placeholder - integrate with SMS service)
export async function sendSMSNotification(phone: string, message: string) {
  // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log(`[SMS] To: ${phone}, Message: ${message}`);
  // In production, use: await smsService.send({ to: phone, message });
}

