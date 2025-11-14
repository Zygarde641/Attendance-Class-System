import db from './db';

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  filters?: any;
}

export function exportAttendanceToCSV(classId?: number, startDate?: string, endDate?: string): string {
  let query = `
    SELECT 
      u.name as student_name,
      u.student_id,
      a.date,
      a.status,
      c.class_name || ' - ' || c.section as class_name
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    JOIN classes c ON a.class_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (classId) {
    query += ' AND a.class_id = ?';
    params.push(classId);
  }
  if (startDate) {
    query += ' AND a.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND a.date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY a.date DESC, u.name';

  const records = db.prepare(query).all(...params) as any[];

  // Convert to CSV
  const headers = ['Student Name', 'Student ID', 'Date', 'Status', 'Class'];
  const rows = records.map(r => [r.student_name, r.student_id, r.date, r.status, r.class_name]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csv;
}

export function exportMarksToCSV(classId?: number, subject?: string): string {
  let query = `
    SELECT 
      u.name as student_name,
      u.student_id,
      m.subject,
      m.internal_marks,
      m.external_marks,
      (m.internal_marks + m.external_marks) as total_marks,
      c.class_name || ' - ' || c.section as class_name
    FROM marks m
    JOIN users u ON m.student_id = u.id
    JOIN classes c ON m.class_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (classId) {
    query += ' AND m.class_id = ?';
    params.push(classId);
  }
  if (subject) {
    query += ' AND m.subject = ?';
    params.push(subject);
  }

  query += ' ORDER BY u.name, m.subject';

  const records = db.prepare(query).all(...params) as any[];

  const headers = ['Student Name', 'Student ID', 'Subject', 'Internal Marks', 'External Marks', 'Total Marks', 'Class'];
  const rows = records.map(r => [
    r.student_name,
    r.student_id,
    r.subject,
    r.internal_marks || '',
    r.external_marks || '',
    r.total_marks || '',
    r.class_name
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
  ].join('\n');

  return csv;
}

export function exportToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2);
}

