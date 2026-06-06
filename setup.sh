#!/bin/bash

# NotaryOS Setup Script
# This script helps setup the environment automatically

echo "🚀 NotaryOS Setup Script"
echo "========================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists"
    read -p "Backup and recreate? (y/n): " backup
    if [ "$backup" = "y" ]; then
        cp .env.local .env.local.backup
        echo "✅ Backed up to .env.local.backup"
    else
        echo "❌ Setup cancelled"
        exit 0
    fi
fi

# Detect database location
echo ""
echo "🔍 Detecting database location..."

DB_PATHS=(
    "./db/custom.db"
    "./NotaryOS/db/custom.db"
    "../db/custom.db"
    "$PWD/db/custom.db"
)

FOUND_DB=""
for path in "${DB_PATHS[@]}"; do
    if [ -f "$path" ]; then
        FOUND_DB="$path"
        echo "✅ Found database at: $path"
        break
    fi
done

if [ -z "$FOUND_DB" ]; then
    echo "❌ Database not found in default locations"
    echo ""
    read -p "Enter database file path (e.g., ./db/custom.db): " custom_db
    if [ -f "$custom_db" ]; then
        FOUND_DB="$custom_db"
        echo "✅ Using custom path: $custom_db"
    else
        echo "❌ Database not found at: $custom_db"
        echo ""
        echo "Creating database directory..."
        mkdir -p db
        bun run db:push
        FOUND_DB="./db/custom.db"
        echo "✅ Database created at: $FOUND_DB"
    fi
fi

# Convert to absolute path if relative
ABSOLUTE_DB_PATH=$(cd "$(dirname "$FOUND_DB")" && pwd)/$(basename "$FOUND_DB")

# Generate NEXTAUTH_SECRET
echo ""
echo "🔑 Generating NEXTAUTH_SECRET..."
if command -v openssl &> /dev/null; then
    SECRET=$(openssl rand -base64 32)
else
    SECRET="notaryos-secret-$(date +%s)"
    echo "⚠️  openssl not found, using generated secret"
fi
echo "✅ Secret generated"

# Determine port
PORT=${1:-3001}

# Create .env.local
echo ""
echo "📝 Creating .env.local..."
cat > .env.local <<EOF
# Database Configuration
DATABASE_URL=file:$ABSOLUTE_DB_PATH

# NextAuth Configuration
NEXTAUTH_SECRET=$SECRET
NEXTAUTH_URL=http://localhost:$PORT

# Server Port
PORT=$PORT
EOF

echo "✅ .env.local created"

# Verify database connection
echo ""
echo "🔍 Verifying database connection..."
bun -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const count = await prisma.user.count();
console.log('✅ Database connected successfully');
console.log('📊 Total users:', count);
await prisma.\$disconnect();
" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup completed successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Start dev server: bun run dev"
    echo "   2. Open: http://localhost:$PORT"
    echo ""
    echo "📝 .env.local created with:"
    echo "   - DATABASE_URL: file:$ABSOLUTE_DB_PATH"
    echo "   - PORT: $PORT"
    echo "   - NEXTAUTH_SECRET: [generated]"
else
    echo ""
    echo "⚠️  Database connection failed. Please check:"
    echo "   - Database file exists at: $ABSOLUTE_DB_PATH"
    echo "   - Prisma client generated: bun run db:generate"
fi