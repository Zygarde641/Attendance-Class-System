# Database Schema

Complete database structure for the Attendance & Class Management System.

## Core Tables

### users
Stores all users (teachers, students, admins).

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| username | TEXT | Unique username |
| password | TEXT | Hashed password |
| role | TEXT | 'teacher', 'student', or 'admin' |
| name | TEXT | Full name |
| employee_id | TEXT | Employee ID (teachers) |
| student_id | TEXT | Student ID (students) |
| class_id | INTEGER | Foreign key to classes |
| created_at | DATETIME | Creation timestamp |

### classes
Stores class information.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| class_name | TEXT | Class name (e.g., "2") |
| section | TEXT | Section (e.g., "A") |
| teacher_id | INTEGER | Foreign key to users |
| created_at | DATETIME | Creation timestamp |

### attendance
Stores attendance records.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| student_id | INTEGER | Foreign key to users |
| class_id | INTEGER | Foreign key to classes |
| date | TEXT | Date (YYYY-MM-DD) |
| status | TEXT | 'present' or 'absent' |
| marked_by | INTEGER | Foreign key to users |
| created_at | DATETIME | Creation timestamp |

### marks
Stores student marks.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| student_id | INTEGER | Foreign key to users |
| class_id | INTEGER | Foreign key to classes |
| subject | TEXT | Subject name |
| internal_marks | REAL | Internal marks |
| external_marks | REAL | External marks |
| uploaded_by | INTEGER | Foreign key to users |
| created_at | DATETIME | Creation timestamp |

## Extended Tables

### subjects
Subject management.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Subject name |
| code | TEXT | Subject code |
| created_at | DATETIME | Creation timestamp |

### rooms
Room/lab management.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| room_number | TEXT | Room number |
| room_type | TEXT | Room type |
| capacity | INTEGER | Room capacity |
| created_at | DATETIME | Creation timestamp |

### timetables
Class and teacher schedules.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| class_id | INTEGER | Foreign key to classes |
| subject_id | INTEGER | Foreign key to subjects |
| teacher_id | INTEGER | Foreign key to users |
| room_id | INTEGER | Foreign key to rooms |
| day_of_week | INTEGER | 0-6 (Sunday-Saturday) |
| start_time | TEXT | Start time (HH:MM) |
| end_time | TEXT | End time (HH:MM) |
| created_at | DATETIME | Creation timestamp |

### exams
Exam scheduling.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Exam name |
| exam_type | TEXT | Exam type |
| class_id | INTEGER | Foreign key to classes |
| subject_id | INTEGER | Foreign key to subjects |
| exam_date | TEXT | Exam date (YYYY-MM-DD) |
| start_time | TEXT | Start time (HH:MM) |
| end_time | TEXT | End time (HH:MM) |
| room_id | INTEGER | Foreign key to rooms |
| total_marks | INTEGER | Total marks |
| created_by | INTEGER | Foreign key to users |
| created_at | DATETIME | Creation timestamp |

### exam_seats
Seat allocation for exams.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| exam_id | INTEGER | Foreign key to exams |
| student_id | INTEGER | Foreign key to users |
| seat_number | TEXT | Seat number |
| room_id | INTEGER | Foreign key to rooms |
| created_at | DATETIME | Creation timestamp |

### notifications
In-app notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users |
| title | TEXT | Notification title |
| message | TEXT | Notification message |
| type | TEXT | Notification type |
| related_id | INTEGER | Related entity ID |
| related_type | TEXT | Related entity type |
| read | BOOLEAN | Read status |
| sent_email | BOOLEAN | Email sent status |
| sent_sms | BOOLEAN | SMS sent status |
| created_at | DATETIME | Creation timestamp |

### notification_preferences
User notification preferences.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users (unique) |
| email_enabled | BOOLEAN | Email notifications |
| sms_enabled | BOOLEAN | SMS notifications |
| push_enabled | BOOLEAN | Push notifications |
| attendance_alerts | BOOLEAN | Attendance alerts |
| marks_alerts | BOOLEAN | Marks alerts |
| exam_alerts | BOOLEAN | Exam alerts |
| class_alerts | BOOLEAN | Class alerts |

### audit_logs
Complete audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users |
| action | TEXT | Action performed |
| entity_type | TEXT | Entity type |
| entity_id | INTEGER | Entity ID |
| old_values | TEXT | JSON of old values |
| new_values | TEXT | JSON of new values |
| ip_address | TEXT | IP address |
| user_agent | TEXT | User agent |
| created_at | DATETIME | Creation timestamp |

### reports
Generated reports tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Report name |
| type | TEXT | Report type |
| parameters | TEXT | JSON parameters |
| generated_by | INTEGER | Foreign key to users |
| file_path | TEXT | File path |
| created_at | DATETIME | Creation timestamp |

### documents
Document management.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Document name |
| file_path | TEXT | File path |
| file_type | TEXT | File type |
| category | TEXT | Document category |
| uploaded_by | INTEGER | Foreign key to users |
| related_entity_type | TEXT | Related entity type |
| related_entity_id | INTEGER | Related entity ID |
| current_version | INTEGER | Current version |
| created_at | DATETIME | Creation timestamp |

### document_versions
Document version control.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| document_id | INTEGER | Foreign key to documents |
| version_number | INTEGER | Version number |
| file_path | TEXT | File path |
| uploaded_by | INTEGER | Foreign key to users |
| change_summary | TEXT | Change summary |
| created_at | DATETIME | Creation timestamp |

## Indexes

Performance indexes on frequently queried columns:

- `idx_attendance_student_date` - (student_id, date)
- `idx_attendance_class_date` - (class_id, date)
- `idx_marks_student` - (student_id)
- `idx_users_role` - (role)
- `idx_timetables_class` - (class_id)
- `idx_timetables_teacher` - (teacher_id)
- `idx_exams_class_date` - (class_id, exam_date)
- `idx_notifications_user` - (user_id)
- `idx_notifications_read` - (read)
- `idx_audit_logs_user` - (user_id)
- `idx_audit_logs_entity` - (entity_type, entity_id)
- `idx_audit_logs_created` - (created_at)

## Relationships

- Users → Classes (many-to-one via class_id)
- Classes → Teachers (many-to-one via teacher_id)
- Attendance → Users, Classes (many-to-one)
- Marks → Users, Classes (many-to-one)
- Timetables → Classes, Subjects, Teachers, Rooms (many-to-one)
- Exams → Classes, Subjects, Rooms (many-to-one)
- Exam Seats → Exams, Students, Rooms (many-to-one)
- Notifications → Users (many-to-one)
- Audit Logs → Users (many-to-one)

## Constraints

- Unique constraints on:
  - `users.username`
  - `classes(class_name, section)`
  - `attendance(student_id, date)`
  - `exam_seats(exam_id, student_id)`
  - `notification_preferences.user_id`

- Foreign key constraints enforce referential integrity
- Check constraints on:
  - `users.role` (must be 'teacher', 'student', or 'admin')
  - `attendance.status` (must be 'present' or 'absent')
  - `timetables.day_of_week` (0-6)

