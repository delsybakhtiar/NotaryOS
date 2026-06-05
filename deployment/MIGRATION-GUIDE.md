# SQLite to PostgreSQL Migration Guide

## Overview

This guide helps you migrate your NotaryOS database from SQLite (development) to PostgreSQL/Supabase (production).

---

## Method 1: Fresh Start (Recommended for Production)

### Why Fresh Start?

1. ✅ Clean database structure
2. ✅ No data corruption risk
3. ✅ Faster and more reliable
4. ✅ Ensures data integrity
5. ✅ Easier to troubleshoot

### Steps

#### 1. Backup Your SQLite Data (for Reference)

```bash
# Export SQLite database
cd /home/z/my-project
sqlite3 prisma/dev.db .dump > sqlite-backup.sql

# Compress backup
gzip sqlite-backup.sql
```

#### 2. Update Prisma Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

#### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project in **Singapore** region
3. Wait for project to be ready (~2 minutes)

#### 4. Get Database Connection String

From Supabase Dashboard → Settings → Database:

```
# Transaction Mode (for application)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"

# Direct Mode (for migrations)
DATABASE_URL_DIRECT="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
```

#### 5. Update Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
```

#### 6. Install PostgreSQL Client

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Verify installation
pg_dump --version
```

#### 7. Generate and Push Schema

```bash
# Generate Prisma Client
bun run prisma generate

# Push schema to PostgreSQL
bun run prisma db push

# Alternatively, create a migration
bun run prisma migrate dev --name init
```

#### 8. Enable Row Level Security

In Supabase Dashboard → SQL Editor, run:

```sql
-- Run the security policies script
-- File: supabase/security-policies.sql
```

#### 9. Create Admin User

```bash
# Use the setup endpoint
curl -X POST http://localhost:3000/api/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@notaryos.com",
    "password": "YourStrongPassword123!",
    "name": "Administrator"
  }'
```

#### 10. Test the Application

```bash
# Start dev server
bun run dev

# Navigate to http://localhost:3000
# Login with your admin credentials
# Verify all features work correctly
```

---

## Method 2: Data Migration (If You Have Important Data)

### Prerequisites

```bash
# Install required tools
bun install -g prisma pgtools

# or
npm install -g prisma pgtools
```

### Step 1: Export SQLite Data

```bash
# Option A: Using Prisma
bun run prisma db pull

# Option B: Manual export
sqlite3 prisma/dev.db <<EOF
.mode csv
.headers on
.output users.csv
SELECT * FROM User;
.output clients.csv
SELECT * FROM Client;
.output documents.csv
SELECT * FROM Document;
.output audit_logs.csv
SELECT * FROM AuditLog;
.quit
EOF
```

### Step 2: Create CSV Import Script

Create `scripts/import-csv-to-postgres.sh`:

```bash
#!/bin/bash

# Database connection
DB_HOST="[PROJECT-REF].supabase.co"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="[PASSWORD]"
DB_NAME="postgres"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Import tables (in order of dependencies)
echo "Importing users..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -c "\COPY User FROM 'users.csv' CSV HEADER"

echo "Importing clients..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -c "\COPY Client FROM 'clients.csv' CSV HEADER"

echo "Importing documents..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -c "\COPY Document FROM 'documents.csv' CSV HEADER"

echo "Importing audit logs..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -c "\COPY AuditLog FROM 'audit_logs.csv' CSV HEADER"

echo "Import completed!"
```

### Step 3: Run Import

```bash
# Make script executable
chmod +x scripts/import-csv-to-postgres.sh

# Run import
./scripts/import-csv-to-postgres.sh
```

### Step 4: Verify Data

```bash
# Check row counts
bunx prisma studio

# Or use psql
psql -h "[PROJECT-REF].supabase.co" -p 5432 -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM User;"
psql -h "[PROJECT-REF].supabase.co" -p 5432 -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM Client;"
psql -h "[PROJECT-REF].supabase.co" -p 5432 -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM Document;"
```

---

## Troubleshooting

### Issue: "Provider is not supported"

```bash
# Solution: Make sure you updated provider in schema.prisma
# Then regenerate Prisma Client
bun run prisma generate
```

### Issue: "Connection refused"

```bash
# Solution 1: Check if DATABASE_URL is correct
# Solution 2: Use Direct Mode for migrations (port 5432)
# Solution 3: Check if Supabase project is running

# Test connection
psql -h "[PROJECT-REF].supabase.co" -p 5432 -U postgres -d postgres
```

### Issue: "Relation does not exist"

```bash
# Solution: Run prisma db push again
bun run prisma db push

# Or run migrations
bun run prisma migrate deploy
```

### Issue: Passwords don't work after migration

```bash
# Solution: Passwords are hashed with bcrypt
# They should work the same in PostgreSQL
# If not, reset passwords:

# Reset admin password
bun run prisma studio

# Manually update password
# Or create a new admin user
```

---

## Verification Checklist

After migration, verify:

- [ ] All tables exist in PostgreSQL
- [ ] All indexes are created
- [ ] RLS policies are enabled
- [ ] Data counts match (if migrated)
- [ ] Authentication works correctly
- [ ] CRUD operations work
- [ ] Audit logging is active
- [ ] Queries are performant

---

## Post-Migration

### 1. Enable Automated Backups

In Supabase Dashboard → Settings → Database → Automated Backups:

- Select backup retention (7 days free, up to 30 days paid)
- Enable Point-in-Time Recovery (PITR) if needed

### 2. Set Up Custom Backups

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

### 3. Monitor Database Performance

- Query performance in Supabase Dashboard
- Slow query logs
- Connection pool usage
- Storage usage

---

## Rollback Plan

If migration fails:

1. **Stop** all operations
2. **Revert** to SQLite development
3. **Restore** SQLite backup
4. **Document** the issue
5. **Retry** migration after fixing

---

## Additional Resources

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Migration Guide](https://www.postgresql.org/docs/current/migr.html)

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0