# API Documentation

Complete API reference for the Attendance & Class Management System.

## Authentication

All API endpoints (except `/api/auth/login` and `/api/init`) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer {token}
```

## Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "teacher1",
  "password": "teacher123",
  "employeeId": "EMP001",  // Required for teachers
  "role": "teacher"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "teacher1",
    "role": "teacher",
    "name": "John Teacher"
  }
}
```

---

### Admin APIs

#### Get All Classes
```http
GET /api/admin/classes
Authorization: Bearer {token}
```

#### Get All Teachers
```http
GET /api/admin/teachers
Authorization: Bearer {token}
```

#### Get All Students
```http
GET /api/admin/students
Authorization: Bearer {token}
```

#### Assign Teacher to Class
```http
POST /api/admin/assign-teacher
Authorization: Bearer {token}
Content-Type: application/json

{
  "classId": 1,
  "teacherId": 2
}
```

#### Change Student Class
```http
POST /api/admin/change-student-class
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": 1,
  "newClassId": 2
}
```

#### Mark Attendance (Any Date)
```http
POST /api/admin/attendance
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-01-15",
  "classId": 1,
  "attendance": [
    {
      "studentId": 1,
      "status": "present"
    }
  ]
}
```

#### Get Teacher Performance
```http
GET /api/admin/teacher-performance
Authorization: Bearer {token}

# Get specific teacher
GET /api/admin/teacher-performance?teacherId=1
```

---

### Teacher APIs

#### Get Students
```http
GET /api/teacher/students
Authorization: Bearer {token}
```

#### Mark Attendance (Last 3 Days Only)
```http
POST /api/teacher/attendance
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-01-15",
  "attendance": [
    {
      "studentId": 1,
      "status": "present"
    }
  ]
}
```

#### Upload Marks
```http
POST /api/teacher/marks
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": 1,
  "subject": "Mathematics",
  "internal": 80,
  "external": 85
}
```

#### Get Analytics
```http
# Student performance
GET /api/teacher/analytics?type=student-performance

# Attendance trend
GET /api/teacher/analytics?type=attendance-trend&days=30

# Marks distribution
GET /api/teacher/analytics?type=marks-distribution

# Class statistics
GET /api/teacher/analytics?type=class-stats

Authorization: Bearer {token}
```

---

### Student APIs

#### Get Attendance
```http
GET /api/student/attendance
Authorization: Bearer {token}
```

#### Get Marks
```http
GET /api/student/marks
Authorization: Bearer {token}
```

---

### Analytics APIs

#### Get Attendance Statistics
```http
# Student stats
GET /api/analytics/attendance-stats?type=student&studentId=1

# Class stats
GET /api/analytics/attendance-stats?type=class&classId=1

# Attendance trend
GET /api/analytics/attendance-stats?type=trend&classId=1&days=30

# At-risk students
GET /api/analytics/attendance-stats?type=at-risk&threshold=75

Authorization: Bearer {token}
```

#### Compare Classes
```http
POST /api/analytics/compare-classes
Authorization: Bearer {token}
Content-Type: application/json

{
  "classIds": [1, 2, 3]
}
```

---

### Export APIs

#### Export Data
```http
GET /api/export?type=attendance&format=csv&classId=1
GET /api/export?type=marks&format=csv&classId=1
Authorization: Bearer {token}
```

---

### Bulk Operations

#### Bulk Student Import
```http
POST /api/bulk/students
Authorization: Bearer {token}
Content-Type: application/json

{
  "students": [
    {
      "name": "Student Name",
      "student_id": "STU001",
      "username": "stu001",
      "password": "student123",
      "class_id": 1
    }
  ],
  "classId": 1
}
```

#### Bulk Attendance
```http
POST /api/bulk/attendance
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-01-15",
  "classId": 1,
  "attendance": [
    {
      "studentId": 1,
      "status": "present"
    }
  ]
}
```

#### Bulk Marks Upload
```http
POST /api/bulk/marks
Authorization: Bearer {token}
Content-Type: application/json

{
  "marks": [
    {
      "studentId": 1,
      "subject": "Mathematics",
      "internal": 80,
      "external": 85
    }
  ]
}
```

---

### Timetable APIs

#### Get Timetables
```http
GET /api/timetables?classId=1
GET /api/timetables?teacherId=1
Authorization: Bearer {token}
```

#### Create Timetable
```http
POST /api/timetables
Authorization: Bearer {token}
Content-Type: application/json

{
  "classId": 1,
  "subjectId": 1,
  "teacherId": 1,
  "roomId": 1,
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:00"
}
```

#### Delete Timetable
```http
DELETE /api/timetables?id=1
Authorization: Bearer {token}
```

---

### Exam APIs

#### Get Exams
```http
GET /api/exams?classId=1
GET /api/exams?studentId=1
Authorization: Bearer {token}
```

#### Create Exam
```http
POST /api/exams
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Midterm Exam",
  "examType": "midterm",
  "classId": 1,
  "subjectId": 1,
  "examDate": "2024-02-15",
  "startTime": "09:00",
  "endTime": "11:00",
  "roomId": 1,
  "totalMarks": 100
}
```

#### Get Hall Ticket
```http
GET /api/exams/hall-ticket?examId=1&studentId=1
Authorization: Bearer {token}
```

---

### Notification APIs

#### Get Notifications
```http
GET /api/notifications?unreadOnly=true
Authorization: Bearer {token}
```

#### Mark as Read
```http
POST /api/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "mark-read",
  "notificationId": 1
}
```

#### Mark All as Read
```http
POST /api/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "mark-all-read"
}
```

#### Update Preferences
```http
POST /api/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "update-preferences",
  "preferences": {
    "email_enabled": true,
    "sms_enabled": false,
    "push_enabled": true,
    "attendance_alerts": true,
    "marks_alerts": true,
    "exam_alerts": true,
    "class_alerts": true
  }
}
```

---

### Audit Logs

#### Get Audit Logs
```http
GET /api/audit-logs?userId=1&entityType=attendance&startDate=2024-01-01&endDate=2024-01-31&limit=100
Authorization: Bearer {token}
```

**Note:** Admin only

---

### Subjects & Rooms

#### Get Subjects
```http
GET /api/subjects
Authorization: Bearer {token}
```

#### Create Subject
```http
POST /api/subjects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mathematics",
  "code": "MATH101"
}
```

#### Get Rooms
```http
GET /api/rooms
Authorization: Bearer {token}
```

#### Create Room
```http
POST /api/rooms
Authorization: Bearer {token}
Content-Type: application/json

{
  "roomNumber": "101",
  "roomType": "classroom",
  "capacity": 30
}
```

---

## Error Responses

All endpoints may return the following error responses:

```json
{
  "error": "Error message here"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there are no rate limits implemented. For production, consider implementing rate limiting.

---

## Versioning

API versioning is not currently implemented. All endpoints are under `/api/`.

