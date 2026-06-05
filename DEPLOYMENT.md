# NotaryOS Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Architecture](#deployment-architecture)
3. [Security Hardening](#security-hardening)
4. [Database Migration](#database-migration)
5. [Vercel Deployment](#vercel-deployment)
6. [Staging vs Production](#staging-vs-production)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying NotaryOS to production, ensure you have:

- [ ] Node.js 18+ and Bun installed
- [ ] Git installed and configured
- [ ] Supabase account (free tier available)
- [ ] Vercel account (free tier available)
- [ ] Domain name configured (optional but recommended)
- [ ] SSL certificate (handled automatically by Vercel)
- [ ] Email service (optional, for notifications)

---

## Deployment Architecture

### Recommended Stack

```
Frontend: Vercel (Edge CDN, Auto SSL, Automatic Deployments)
Database: Supabase (PostgreSQL with built-in auth & RLS)
Region: Singapore (for Indonesia audience compliance)
Backup: Supabase Automated Backups + Custom Backup Script
```

### Data Residency Compliance

- **Singapore Region**: Supabase offers Singapore region which meets Indonesian data residency requirements
- **Automated Backups**: Supabase provides 7-day point-in-time recovery (free), up to 30 days (paid)
- **Custom Backups**: Use the provided backup script for daily backups with 90-day retention

---

## Security Hardening

### 1. Environment Variables

Create a `.env.local` file for development (never commit to git):

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="[RUN: openssl rand -base64 32]"

# Security
NODE_ENV="production"
```

**IMPORTANT**: Never commit `.env.local` to version control!

### 2. Rate Limiting

The application includes built-in rate limiting middleware:

- Login endpoint: 5 attempts per 15 minutes
- API endpoints: 100 requests per 15 minutes
- General pages: 200 requests per 15 minutes

Rate limiting is automatically enforced via `middleware.ts`.

### 3. Security Headers

The middleware automatically adds security headers:

- CSP (Content Security Policy): Prevents XSS attacks
- HSTS (HTTP Strict Transport Security): Forces HTTPS
- X-Frame-Options: Prevents clickjacking
- X-Content-Type-Options: Prevents MIME sniffing
- Referrer-Policy: Controls referrer information

### 4. Password Security

- Minimum 8 characters
- Must include uppercase, lowercase, number, and special character
- Hashed using bcrypt with 12 salt rounds
- Failed login attempts tracked with lockout after 5 attempts

---

## Database Migration

### Step 1: Update Prisma Schema

1. Open `prisma/schema.prisma`
2. Change the provider:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

3. Update `DATABASE_URL` format for Supabase:

```bash
# Format with Transaction Mode (PG Bouncer)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"

# Without Transaction Mode (for migrations)
DATABASE_URL_DIRECT="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose **Singapore** region (for Indonesia data residency)
4. Set strong database password
5. Create project and wait for setup (~2 minutes)

### Step 3: Get Database Connection String

1. In Supabase Dashboard → Settings → Database
2. Copy the "Connection string" (Transaction mode)
3. Update your `.env.local`:

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
```

### Step 4: Install PostgreSQL Client

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows (using WSL)
sudo apt-get install postgresql-client
```

### Step 5: Run Prisma Migration

```bash
# Generate migration
bun run prisma migrate dev --name init

# Push schema to database
bun run prisma db push

# Generate Prisma Client
bun run prisma generate
```

### Step 6: Enable RLS (Row Level Security)

1. In Supabase Dashboard → SQL Editor
2. Run the SQL script from `supabase/security-policies.sql`
3. This will:
   - Enable RLS on all tables
   - Create security policies for data access
   - Create indexes for performance
   - Set up audit triggers

### Step 7: Create Admin User

```bash
# Using the provided setup script
curl -X POST http://localhost:3000/api/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@notaryos.com",
    "password": "YourStrongPassword123!",
    "name": "Administrator"
  }'
```

---

## Vercel Deployment

### Step 1: Install Vercel CLI

```bash
bun install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy to Vercel

```bash
# Deploy to preview environment
vercel

# Deploy to production
vercel --prod
```

### Step 4: Configure Environment Variables in Vercel

In Vercel Dashboard → Settings → Environment Variables, add:

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="[YOUR_GENERATED_SECRET]"

# App Configuration
NODE_ENV="production"
APP_URL="https://yourdomain.com"
APP_NAME="NotaryOS"

# Security
ENCRYPTION_KEY="[GENERATE_WITH_OPENSSL]"
CSRF_SECRET="[GENERATE_WITH_OPENSSL]"
```

### Step 5: Configure Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `notaryos.yourdomain.com`)
3. Update DNS records as instructed by Vercel
4. Wait for SSL certificate issuance (automatic)

---

## Staging vs Production

### Staging Environment Setup

1. Create a separate Supabase project for staging
2. Create a separate Vercel project for staging
3. Use the staging environment variables:

```bash
# .env.staging
DATABASE_URL="postgresql://postgres:[PASSWORD]@[STAGING-PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
NEXTAUTH_URL="https://staging.yourdomain.com"
NODE_ENV="staging"
ENABLE_REGISTRATION="true"  # Allow testing
```

4. Deploy to staging:

```bash
vercel --env NODE_ENV=staging
```

### Best Practices

- ✅ Always test in staging first
- ✅ Use separate databases for staging and production
- ✅ Never use production data in staging
- ✅ Keep staging environment updated with production code
- ✅ Run automated tests in staging before production deployment

---

## Post-Deployment Checklist

### Security

- [ ] Environment variables are set in Vercel (not in code)
- [ ] NextAuth secret is generated with `openssl rand -base64 32`
- [ ] Database password is strong and unique
- [ ] RLS policies are enabled in Supabase
- [ ] Rate limiting is working (test with multiple failed logins)
- [ ] SSL certificate is active (check with SSL Labs)
- [ ] Security headers are configured (check with securityheaders.com)

### Database

- [ ] Prisma migrations ran successfully
- [ ] RLS policies are applied
- [ ] Indexes are created for performance
- [ ] Automated backups are enabled in Supabase
- [ ] Backup script is scheduled (cron job)
- [ ] Database connection pool size is optimized

### Application

- [ ] All API endpoints are accessible
- [ ] Authentication flow works correctly
- [ ] File uploads (if any) work properly
- [ ] Email notifications are configured (if used)
- [ ] Error logging is set up (Sentry or similar)
- [ ] Analytics are configured (Vercel Analytics)

### Performance

- [ ] Page load time is < 3 seconds
- [ ] Images are optimized
- [ ] Database queries are indexed
- [ ] CDN is working (Vercel Edge Network)
- [ ] Caching is configured appropriately

### Compliance

- [ ] Data residency requirements met (Singapore region)
- [ ] Audit logging is active
- [ ] Data retention policy is defined
- [ ] Backup and recovery procedures are tested
- [ ] GDPR/UU PDP compliance checklist completed

---

## Monitoring & Maintenance

### Application Monitoring

1. **Vercel Analytics**: Built-in analytics for traffic and performance
2. **Sentry**: Error tracking and alerting
3. **Uptime Monitoring**: Use UptimeRobot or similar

### Database Monitoring

1. **Supabase Dashboard**: Real-time metrics and logs
2. **Query Performance**: Monitor slow queries
3. **Storage Usage**: Monitor database size

### Backup Monitoring

1. **Automated Backups**: Enable Supabase automated backups
2. **Custom Backup Script**: Schedule daily backup via cron
3. **Backup Verification**: Regularly test backup restoration

### Cron Job for Backup (Linux)

```bash
# Add to crontab
crontab -e

# Run backup daily at 2 AM
0 2 * * * /path/to/notaryos/scripts/backup-database.sh
```

### Update Procedure

1. Create a new branch: `git checkout -b release/v1.0.1`
2. Make changes and test locally
3. Deploy to staging: `vercel --env NODE_ENV=staging`
4. Test thoroughly in staging
5. Merge to main: `git checkout main && git merge release/v1.0.1`
6. Deploy to production: `vercel --prod`
7. Monitor for issues post-deployment

---

## Troubleshooting

### Common Issues

**Issue: Database connection fails**

```bash
# Check if DATABASE_URL format is correct
# Use Transaction Mode (port 6543) for application
# Use Direct Mode (port 5432) for migrations
```

**Issue: RLS policies block legitimate queries**

```sql
-- Check RLS policies in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'Client';
```

**Issue: Rate limiting too aggressive**

```typescript
// Adjust in src/middleware/rate-limit.ts
const rateLimitConfigs = {
  '/api/auth': { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // Increased from 5
}
```

---

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs

---

## Security Best Practices Summary

1. ✅ Never commit environment variables to git
2. ✅ Use strong, unique passwords
3. ✅ Enable RLS on all database tables
4. ✅ Implement rate limiting on all endpoints
5. ✅ Use HTTPS everywhere
6. ✅ Keep dependencies updated
7. ✅ Regularly audit access logs
8. ✅ Test backup restoration
9. ✅ Monitor application uptime
10. ✅ Have an incident response plan

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Maintained by**: NotaryOS Team