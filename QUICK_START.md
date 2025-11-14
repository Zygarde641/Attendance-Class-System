# Quick Start Guide

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize the database:**
   - Start the development server: `npm run dev`
   - Open your browser and visit: `http://localhost:3000/api/init`
   - This will create the database and sample data

3. **Access the application:**
   - Go to: `http://localhost:3000`
   - Select your role (Teacher, Student, or Admin)

## Test Credentials

After initialization, use these credentials:

### Admin Login
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Administrator

### Teacher Login
- **Username:** `teacher1`
- **Password:** `teacher123`
- **Employee ID:** `EMP001`
- **Role:** Teacher

### Student Login
- **Username:** `stu001`
- **Password:** `student123`
- **Role:** Student

## Features Overview

### Teacher Features
- Mark attendance for students (last 3 days only)
- Upload internal and external marks
- View students in assigned class

### Student Features
- View personal attendance records
- View uploaded marks
- See attendance statistics

### Admin Features
- Assign teachers to classes
- Change student class/section
- Mark attendance for any date (no restrictions)
- Manage all classes and users

## Important Notes

- Teachers can only mark attendance for the last 3 days
- Admins have no date restrictions
- The database file (`attendance.db`) is created automatically
- All passwords are hashed for security

