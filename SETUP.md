# Environment Setup Guide

## Setup Local Environment

1. Copy example file:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your configuration:

```env
# Database Configuration
# Use relative path for portability
DATABASE_URL=file:./db/custom.db

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3001

# Server Port
PORT=3001
```

## Database Setup

1. Ensure database file exists:
```bash
# Create db directory if not exists
mkdir -p db

# Push schema to database
bun run db:push
```

2. Seed database (optional):
```bash
bun run db:seed
```

## Generate NEXTAUTH_SECRET

For production, generate a secure secret:
```bash
openssl rand -base64 32
```

## Common Issues

### "Unable to open the database file"
- Check that `DATABASE_URL` in `.env.local` points to correct path
- Ensure database file exists at the specified location
- Use absolute path if relative path doesn't work:
  ```env
  DATABASE_URL=file:/absolute/path/to/your/db/custom.db
  ```

### Port already in use
- Change PORT in `.env.local` to a different port
- Update NEXTAUTH_URL accordingly

## Development Server

Start the development server:
```bash
bun run dev
```

The app will run at: http://localhost:3001