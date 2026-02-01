# Deployment Guide

This guide covers deploying the Facility Walkdown System to production.

## Prerequisites

- PostgreSQL database (hosted or managed service)
- Node.js hosting platform (Vercel, AWS, DigitalOcean, etc.)
- S3-compatible storage (optional, for production file uploads)

## Environment Variables

Set these environment variables in your production environment:

```env
# Database
DATABASE_URL="postgresql://user:password@your-db-host:5432/walks_prod?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-production-secret-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"

# File Upload
UPLOAD_DIR="/var/data/uploads"  # or use S3

# Optional: S3 Storage
S3_BUCKET="your-bucket-name"
S3_REGION="us-east-1"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
```

## Deployment Options

### Option 1: Vercel (Recommended for Quick Deploy)

Vercel is the easiest way to deploy Next.js applications.

#### Steps:

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Configure environment variables
   - Deploy

3. **Set Up Database**
   - Use Vercel Postgres or an external PostgreSQL service
   - Update DATABASE_URL environment variable

4. **Run Migrations**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Link project
   vercel link
   
   # Run migrations
   vercel env pull .env.production.local
   npx prisma migrate deploy
   ```

#### Vercel Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "prisma generate && next build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Option 2: Docker Deployment

Use Docker for consistent deployment across any platform.

#### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: walks
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: walks_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://walks:changeme@db:5432/walks_prod?schema=public
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
    depends_on:
      - db
    volumes:
      - uploads:/app/uploads

volumes:
  postgres_data:
  uploads:
```

#### Deploy with Docker:

```bash
# Build and start
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# View logs
docker-compose logs -f app
```

### Option 3: Traditional VPS (Ubuntu/Debian)

Deploy to a VPS like DigitalOcean, Linode, or AWS EC2.

#### 1. Set Up Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2. Set Up PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE walks_prod;
CREATE USER walks WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE walks_prod TO walks;
\q
```

#### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/walks.git
cd walks

# Install dependencies
npm install

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2
pm2 start npm --name "walks" -- start
pm2 save
pm2 startup
```

#### 4. Set Up Nginx

```bash
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/walks
```

Add this configuration:

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

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/walks /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Database Migrations in Production

Always use `migrate deploy` instead of `migrate dev` in production:

```bash
npx prisma migrate deploy
```

## File Upload Considerations

### Local Storage

For local file storage, ensure the uploads directory is:
- Writable by the application
- Backed up regularly
- Not in the Git repository

### S3-Compatible Storage

For production, use S3 or compatible services:
- AWS S3
- DigitalOcean Spaces
- Cloudflare R2
- MinIO (self-hosted)

Update the upload API to use S3 SDK instead of local filesystem.

## Monitoring and Logging

### Application Logs

```bash
# PM2 logs
pm2 logs walks

# Docker logs
docker-compose logs -f app
```

### Database Monitoring

- Set up pg_stat_statements for query analysis
- Monitor connection pool usage
- Set up automated backups

### Recommended Tools

- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **APM**: New Relic, DataDog
- **Log Management**: Logtail, Papertrail

## Backup Strategy

### Database Backups

Automated daily backups:

```bash
# Backup script
#!/bin/bash
pg_dump -h localhost -U walks walks_prod | gzip > backup-$(date +%Y%m%d).sql.gz

# Cron job (daily at 2 AM)
0 2 * * * /path/to/backup.sh
```

### File Backups

If using local storage, back up the uploads directory:

```bash
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /path/to/uploads
```

## Security Checklist

- [ ] Use strong, unique NEXTAUTH_SECRET
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Set up firewall rules
- [ ] Use strong database passwords
- [ ] Enable database SSL connections
- [ ] Set up regular security updates
- [ ] Implement rate limiting
- [ ] Set up WAF if using cloud provider
- [ ] Regular dependency updates (`npm audit`)

## Scaling Considerations

### Horizontal Scaling

- Use a managed database (AWS RDS, DigitalOcean Managed Database)
- Use S3 for file storage (not local filesystem)
- Deploy multiple app instances behind a load balancer
- Use Redis for session storage

### Performance Optimization

- Enable Next.js output caching
- Use CDN for static assets
- Optimize images with Next.js Image component
- Set up database connection pooling
- Monitor and optimize slow queries

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL format
   - Verify database is accessible
   - Check connection limits

2. **File upload failures**
   - Verify UPLOAD_DIR permissions
   - Check disk space
   - Ensure directory exists

3. **Build failures**
   - Run `npx prisma generate` before build
   - Clear `.next` folder and rebuild
   - Check Node.js version

### Health Check Endpoint

Create `/api/health/route.ts` for monitoring:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 })
  }
}
```

## Rollback Procedure

If deployment fails:

1. **With PM2**:
   ```bash
   git checkout previous-stable-tag
   npm install
   npm run build
   pm2 restart walks
   ```

2. **With Docker**:
   ```bash
   docker-compose down
   git checkout previous-stable-tag
   docker-compose up -d --build
   ```

3. **Database rollback**:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

## Post-Deployment

1. Verify health check endpoint
2. Test authentication
3. Create test walkdown
4. Upload test blueprint
5. Create test issue
6. Generate test PDF report
7. Monitor logs for errors
8. Set up alerts

## Support

For deployment issues, check:
- Application logs
- Database logs
- Nginx/reverse proxy logs
- System resource usage (CPU, RAM, disk)
