# Contributing Guide

Thank you for considering contributing to the Attendance & Class Management System!

## Getting Started

1. Fork the repository
2. Clone your fork
   ```bash
   git clone https://github.com/Zygarde641/Attendance-Class-System.git
   cd Attendance-Class-System
   ```
3. Create a branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. Install dependencies
   ```bash
   npm install
   ```

2. Initialize database
   ```bash
   npm run dev
   # Visit http://localhost:3000/api/init
   ```

3. Start development server
   ```bash
   npm run dev
   ```

## Code Style

- **TypeScript**: Use strict mode
- **Formatting**: 2 spaces indentation
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: Add comments for complex logic
- **ESLint**: Follow Next.js recommended rules

## Commit Messages

Use clear, descriptive commit messages:

```
Add: Teacher analytics dashboard
Fix: Attendance date validation
Update: API documentation
Refactor: Database query optimization
```

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Test on multiple user roles
4. Update CHANGELOG.md
5. Create pull request with description

## Testing

Before submitting:
- Test all user roles (admin, teacher, student)
- Verify API endpoints
- Check for console errors
- Test on different screen sizes

## Questions?

Open an issue or start a discussion on GitHub.

