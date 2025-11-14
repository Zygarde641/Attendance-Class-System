# 📚 Attendance & Class Management System

<div align="center">

## **👨‍💻 Developed by [@Zygarde641](https://github.com/Zygarde641)**

</div>

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-3-green?style=for-the-badge&logo=sqlite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38bdf8?style=for-the-badge&logo=tailwind-css)

**A comprehensive, production-ready web application for managing student attendance, marks, timetables, exams, and class arrangements**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](./docs) • [API Reference](./docs/API.md)

</div>

---

## 🎯 Overview

A full-featured educational management platform with three user roles (Teacher, Student, Administrator) that streamlines administrative tasks, enhances teacher productivity, and provides students with easy access to their academic information.

### Key Highlights

- ✅ **Three-tier User System**: Separate dashboards for Teachers, Students, and Administrators
- ✅ **Advanced Analytics**: Real-time reporting and performance tracking
- ✅ **Drag & Drop Interface**: Intuitive class and teacher management
- ✅ **Comprehensive Notifications**: In-app, email, and SMS ready
- ✅ **Exam Management**: Automated scheduling with notifications
- ✅ **Dark Mode**: Modern UI with theme switching
- ✅ **Mobile Responsive**: Works seamlessly on all devices

---

## ✨ Features

### 👨‍🏫 Teacher
- Mark attendance (last 3 days)
- Upload internal/external marks
- **Student performance analytics & reports**
- Bulk operations
- Export data (CSV)

### 👨‍🎓 Student
- View attendance records & statistics
- Check marks (internal/external)
- View exam schedules & hall tickets
- Receive notifications

### 👨‍💼 Admin
- **Drag & drop** students and teachers
- Manage classes and assignments
- Mark attendance (any date)
- **Advanced analytics & reporting**
- **Teacher performance analytics**
- Bulk operations (CSV import)
- Timetable management
- Exam scheduling with auto-notifications
- Complete audit logs

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/Zygarde641/Attendance-Class-System.git
cd Attendance-Class-System

# Install dependencies
npm install

# Start development server
npm run dev

# Initialize database (in browser)
# Visit: http://localhost:3000/api/init
```

### Default Credentials

| Role | Username | Password | Employee ID |
|------|----------|----------|-------------|
| Admin | `admin` | `admin123` | - |
| Teacher | `teacher1` | `teacher123` | `EMP001` |
| Student | `stu001` | `student123` | - |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT + bcrypt
- **Features**: Dark mode, Responsive design, Real-time notifications

---

## 📁 Project Structure

```
├── app/
│   ├── api/              # API routes (admin, teacher, student, analytics, etc.)
│   ├── dashboard/        # Role-based dashboards
│   ├── login/            # Authentication pages
│   └── page.tsx          # Home page
├── components/           # React components (Analytics, Notifications, etc.)
├── lib/                  # Utilities (db, auth, analytics, notifications, audit)
└── middleware.ts         # Next.js middleware
```

---

## 🎯 Key Features

### Drag & Drop Management
Intuitive interface for reassigning students and teachers between classes with visual feedback.

### Advanced Analytics
- Real-time attendance trends
- Student performance metrics
- At-risk student identification
- Teacher performance tracking (admin only)
- Export to CSV

### Notification System
- In-app notifications with preferences
- Email/SMS ready (integration ready)
- Exam reminders (3 days before)

### Exam Management
- Automated scheduling
- Room allotment & seat allocation
- Hall ticket generation
- Auto-notifications

---

## 📡 API Overview

### Authentication
```http
POST /api/auth/login
```

### Admin APIs
- `GET /api/admin/classes` - Get all classes
- `POST /api/admin/assign-teacher` - Assign teacher
- `POST /api/admin/change-student-class` - Change student class
- `GET /api/admin/teacher-performance` - Teacher analytics

### Teacher APIs
- `GET /api/teacher/students` - Get class students
- `POST /api/teacher/attendance` - Mark attendance
- `POST /api/teacher/marks` - Upload marks
- `GET /api/teacher/analytics` - Student performance analytics

### Analytics & Export
- `GET /api/analytics/attendance-stats` - Attendance statistics
- `GET /api/export?type=attendance&format=csv` - Export data

**📖 [Full API Documentation](./docs/API.md)**

---

## 🔐 Security

- Password hashing (bcrypt)
- JWT authentication
- Role-based access control
- SQL injection prevention
- Complete audit logging
- Input validation

---

## 💻 Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run linter
```

---

## 🚀 Deployment

### Environment Variables
```env
JWT_SECRET=your-secret-key
DATABASE_PATH=./attendance.db
NODE_ENV=production
```

### Production Build
```bash
npm run build
npm start
```

**📖 [Deployment Guide](./docs/DEPLOYMENT.md)**

---

## 📚 Documentation

- [API Reference](./docs/API.md) - Complete API documentation
- [Database Schema](./docs/DATABASE.md) - Database structure
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Contributing Guide](./docs/CONTRIBUTING.md) - How to contribute

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔮 Roadmap

- [ ] PDF report generation
- [ ] Email/SMS integration
- [ ] Parent portal
- [ ] Mobile applications
- [ ] Multi-language support

---

<div align="center">

**Made with ❤️ for educational institutions**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/Zygarde641/Attendance-Class-System/issues) • [Request Feature](https://github.com/Zygarde641/Attendance-Class-System/issues)

---

**© 2024 [@Zygarde641](https://github.com/Zygarde641). All rights reserved.**

</div>
