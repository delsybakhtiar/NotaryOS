# NotaryOS Production Deployment - Quick Reference

## 📋 Pre-Deployment Checklist (10 Critical Items)

Before deploying to production, ensure these 10 items are complete:

1. [ ] **Environment Variables Configured**
   - All secrets in Vercel Dashboard (not in code)
   - DATABASE_URL with Supabase connection string
   - NEXTAUTH_SECRET generated with `openssl rand -base64 32`
   - ENCRYPTION_KEY generated with `openssl rand -base64 32`

2. [ ] **Database Ready**
   - Supabase project created (Singapore region)
   - Prisma schema updated to PostgreSQL
   - `bun run prisma db push` executed successfully
   - RLS policies applied from `supabase/security-policies.sql`

3. [ ] **Security Hardening**
   - Rate limiting middleware active
   - Security headers configured in `middleware.ts`
   - Password complexity enforced
   - Failed login attempts tracked

4. [ ] **Authentication Working**
   - Admin user created
   - NextAuth configuration correct
   - Session management tested
   - Password reset flow tested (if implemented)

5. [ ] **Backup Strategy**
   - Supabase automated backups enabled
   - Custom backup script configured
   - Cron job scheduled (or equivalent)
   - Backup restoration tested

6. [ ] **Staging Tested**
   - All features tested in staging
   - No production data used in staging
   - Team has reviewed staging deployment
   - Bugs identified and fixed

7. [ ] **Monitoring Ready**
   - Vercel Analytics enabled
   - Error tracking configured (Sentry or similar)
   - Uptime monitoring set up
   - Alert notifications configured

8. [ ] **Compliance Verified**
   - Data residency requirements met (Singapore region)
   - Privacy policy published
   - Terms of service ready
   - Audit logging active and tested

9. [ ] **Team Aligned**
   - All stakeholders notified
   - Emergency contact list updated
   - Rollback plan documented
   - Support team briefed

10. [ ] **Documentation Complete**
    - API documentation updated
    - User guide created
    - Admin manual written
    - Troubleshooting guide available

---

## 🚀 Quick Deployment Steps

### 1. Prepare Environment (5 minutes)

```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
openssl rand -base64 16  # For CSRF_SECRET

# Update .env.local
# Use the generated secrets
```

### 2. Setup Database (10 minutes)

```bash
# Create Supabase project (Singapore region)
# Get DATABASE_URL from Supabase Dashboard

# Update prisma/schema.prisma
# Change provider from "sqlite" to "postgresql"

# Push schema to PostgreSQL
bun run prisma db push

# Enable RLS policies
# Run SQL from supabase/security-policies.sql in Supabase Dashboard

# Create admin user
curl -X POST http://localhost:3000/api/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@notaryos.com",
    "password": "YourStrongPassword123!",
    "name": "Administrator"
  }'
```

### 3. Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI
bun install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configure environment variables in Vercel Dashboard
# Add all variables from .env.local
```

### 4. Post-Deployment (10 minutes)

```bash
# Test production URL
curl https://yourdomain.com

# Verify login works
# Navigate to https://yourdomain.com/login
# Login with admin credentials

# Verify features work
# - Client management
# - Document workflow
# - Audit logging

# Check security headers
curl -I https://yourdomain.com | grep -E "(CSP|HSTS|X-Frame)"

# Monitor for 24 hours
# Check Vercel logs
# Monitor error rates
```

---

## 🛡️ Security Configuration

### Rate Limiting

```typescript
// Already configured in src/middleware/rate-limit.ts

// Default limits:
// - Login: 5 attempts / 15 minutes
// - API: 100 requests / 15 minutes
// - General: 200 requests / 15 minutes

// To adjust, edit src/middleware/rate-limit.ts
```

### Security Headers

```typescript
// Already configured in middleware.ts

// Headers added:
// - CSP (Content Security Policy)
// - HSTS (HTTP Strict Transport Security)
// - X-Frame-Options: DENY
// - X-Content-Type-Options: nosniff
// - Referrer-Policy
// - Permissions-Policy
```

---

## 💾 Database Backup

### Automated Backup (Supabase)

1. Go to Supabase Dashboard → Settings → Database
2. Enable "Automated Backups"
3. Set retention period (7 days free, up to 30 days paid)

### Custom Backup Script

```bash
# Make backup script executable
chmod +x scripts/backup-database.sh

# Test backup
./scripts/backup-database.sh

# Add to crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /path/to/notaryos/scripts/backup-database.sh
```

---

## 📊 Monitoring & Logging

### Vercel Analytics

- Automatically enabled
- Visit Vercel Dashboard → Analytics
- Monitor page views, traffic sources, performance

### Error Tracking (Sentry)

```bash
# Install Sentry
bun add @sentry/nextjs

# Initialize Sentry
bun run @sentry/wizard -i nextjs

# Add environment variables
# NEXT_PUBLIC_SENTRY_DSN
# SENTRY_AUTH_TOKEN
```

### Uptime Monitoring

- Use [UptimeRobot](https://uptimerobot.com)
- Configure webhook to Slack/Discord for alerts

---

## 🔄 Environment Management

### Staging Environment

```bash
# Create separate Supabase project
# Create separate Vercel project

# Use staging environment variables
NODE_ENV=staging
NEXTAUTH_URL=https://staging.yourdomain.com

# Deploy to staging
vercel --env NODE_ENV=staging
```

### Production Environment

```bash
# Deploy to production
vercel --prod

# Verify deployment
vercel inspect

# View logs
vercel logs
```

---

## 🆘 Emergency Rollback

### Quick Rollback

```bash
# 1. Stop current deployment
vercel rollback

# 2. Or deploy previous version
vercel --prod <previous-deployment-id>

# 3. Verify rollback
curl https://yourdomain.com
```

### Database Rollback

```bash
# Restore from Supabase backup
# Go to Supabase Dashboard → Database → Backups
# Select backup to restore
# Click "Restore"

# Or use custom backup
gunzip < backup-file.sql.gz | psql -h host -U user -d database
```

---

## 📞 Support & Resources

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Deployment Guide**: `/DEPLOYMENT.md`
- **Migration Guide**: `/deployment/MIGRATION-GUIDE.md`

---

## ✅ Final Verification

After deployment, verify:

- [ ] Production URL loads correctly
- [ ] SSL certificate is valid (green lock)
- [ ] Login works with admin credentials
- [ ] All features are functional
- [ ] Security headers are present
- [ ] Rate limiting is working
- [ ] Audit logs are being created
- [ ] Database backups are running
- [ ] Error tracking is active
- [ ] Team has access to monitoring

---

## 📝 Key Contacts

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Technical Lead | | | |
| Database Admin | | | |
| Security Officer | | | |
| DevOps Engineer | | | |

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Status**: Ready for Production