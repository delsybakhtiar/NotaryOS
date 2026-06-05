#!/bin/bash

# ============================================
# PROVISIONING SCRIPT - STAGING ENVIRONMENT
# ============================================

set -e

echo "=========================================="
echo "NotaryOS Staging Environment Setup"
echo "=========================================="

# ============================================
# CONFIGURATION
# ============================================

STAGING_DOMAIN="staging.notaryos.com"
PROJECT_NAME="notaryos-staging"

# ============================================
# CREATE VERCEL PROJECT
# ============================================

echo "Creating Vercel project..."

vercel link --yes --scope=${VERCEL_ORG} || vercel link --yes

# ============================================
# SET ENVIRONMENT VARIABLES
# ============================================

echo "Setting environment variables..."

# Database
vercel env add DATABASE_URL staging

# NextAuth
vercel env add NEXTAUTH_URL staging
vercel env add NEXTAUTH_SECRET staging

# Security
vercel env add NODE_ENV staging
vercel env add APP_URL staging
vercel env add ENCRYPTION_KEY staging
vercel env add CSRF_SECRET staging

# Features
vercel env add ENABLE_REGISTRATION staging

# ============================================
# DEPLOY TO STAGING
# ============================================

echo "Deploying to staging..."

vercel --env NODE_ENV=staging --env NEXTAUTH_URL=https://${STAGING_DOMAIN}

echo "=========================================="
echo "Staging deployment complete!"
echo "=========================================="
echo "Staging URL: https://${PROJECT_NAME}.vercel.app"
echo "Custom Domain: https://${STAGING_DOMAIN}"
echo "=========================================="