# Deployment Guide

Guide for deploying the Attendance & Class Management System to production.

## Prerequisites

- Node.js 18+ installed on server
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)
- Database backup strategy

## Environment Variables

Create a `.env.local` file:

```env
# Authentication
JWT_SECRET=your-very-secure-secret-key-change-this-in-production

# Database
DATABASE_PATH=./attendance.db

# Environment
NODE_ENV=production

# Optional: Email Service (when integrated)
EMAIL_SERVICE_API_KEY=your-email-api-key

# Optional: SMS Service (when integrated)
SMS_SERVICE_API_KEY=your-sms-api-key
```

**Important:** Never commit `.env.local` to version control!

## Production Build

```bash
# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Start production server
npm start
```

## Deployment Options

### Vercel (Recommended for Next.js)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add all variables from `.env.local`

### Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t attendance-system .
   docker run -p 3000:3000 --env-file .env.local attendance-system
   ```

### Traditional Server (PM2)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Start Application**
   ```bash
   pm2 start npm --name "attendance-system" -- start
   pm2 save
   pm2 startup
   ```

3. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Database Considerations

### SQLite (Current)
- Good for small to medium deployments
- No separate database server needed
- Backup: Simply copy `attendance.db` file
- Limitations: Not ideal for high concurrency

### PostgreSQL (Recommended for Production)
For production with high traffic, consider migrating to PostgreSQL:

1. Install PostgreSQL
2. Create database
3. Update database connection in `lib/db.ts`
4. Run migrations

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Regular database backups
- [ ] Monitor error logs
- [ ] Set up rate limiting
- [ ] Enable CORS properly
- [ ] Review and update dependencies

## Monitoring

### Recommended Services

- **Error Tracking**: Sentry, LogRocket
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Analytics**: Google Analytics, Plausible
- **Logs**: Logtail, Papertrail

### Health Check Endpoint

Create a health check endpoint for monitoring:

```typescript
// app/api/health/route.ts
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
```

## Backup Strategy

### Database Backup

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp attendance.db backups/attendance_$DATE.db
# Keep only last 30 days
find backups/ -name "attendance_*.db" -mtime +30 -delete
```

### Schedule with Cron

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup-script.sh
```

## Performance Optimization

1. **Enable Caching**
   - Consider Redis for session storage
   - Implement response caching

2. **CDN**
   - Use CDN for static assets
   - Cloudflare, AWS CloudFront

3. **Database Optimization**
   - Regular VACUUM for SQLite
   - Monitor query performance

4. **Load Balancing**
   - Use multiple instances behind load balancer
   - Session stickiness if needed

## Scaling

### Horizontal Scaling
- Use stateless design (JWT tokens)
- Shared database (PostgreSQL recommended)
- Session storage in Redis

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add caching layer

## Troubleshooting

### Common Issues

1. **Database Locked**
   - Check for concurrent writes
   - Consider connection pooling

2. **Memory Issues**
   - Monitor Node.js memory usage
   - Consider increasing server RAM

3. **Slow Queries**
   - Check database indexes
   - Optimize complex queries

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review security patches
- Monitor error logs
- Backup database daily
- Review audit logs weekly

### Updates

```bash
# Update dependencies
npm update

# Test updates
npm test

# Deploy updates
npm run build
pm2 restart attendance-system
```

## Support

For deployment issues:
- Check application logs
- Review error tracking service
- Consult Next.js deployment docs
- Open an issue on GitHub

