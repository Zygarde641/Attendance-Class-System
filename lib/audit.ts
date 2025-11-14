import db from './db';

export interface AuditLog {
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
}

export function logAudit(audit: AuditLog) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      audit.user_id || null,
      audit.action,
      audit.entity_type,
      audit.entity_id || null,
      audit.old_values ? JSON.stringify(audit.old_values) : null,
      audit.new_values ? JSON.stringify(audit.new_values) : null,
      audit.ip_address || null,
      audit.user_agent || null
    );
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

export function getAuditLogs(filters?: {
  user_id?: number;
  entity_type?: string;
  entity_id?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
}) {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (filters?.user_id) {
    query += ' AND user_id = ?';
    params.push(filters.user_id);
  }
  if (filters?.entity_type) {
    query += ' AND entity_type = ?';
    params.push(filters.entity_type);
  }
  if (filters?.entity_id) {
    query += ' AND entity_id = ?';
    params.push(filters.entity_id);
  }
  if (filters?.start_date) {
    query += ' AND created_at >= ?';
    params.push(filters.start_date);
  }
  if (filters?.end_date) {
    query += ' AND created_at <= ?';
    params.push(filters.end_date);
  }

  query += ' ORDER BY created_at DESC';
  
  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return db.prepare(query).all(...params);
}

