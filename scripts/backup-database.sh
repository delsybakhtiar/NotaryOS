#!/bin/bash

# ============================================
# NOTARYOS - DATABASE BACKUP SCRIPT
# Automated daily backup with retention policy
# ============================================

# ============================================
# CONFIGURATION
# ============================================

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Backup configuration
BACKUP_DIR="/backups/notaryos"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-90}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/notaryos_backup_${TIMESTAMP}.sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"

# Log file
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# ============================================
# FUNCTIONS
# ============================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# ============================================
# BACKUP PROCESS
# ============================================

log "=========================================="
log "Starting NotaryOS Database Backup"
log "=========================================="

# Validate DATABASE_URL
if [ -z "${DATABASE_URL}" ]; then
    error_exit "DATABASE_URL environment variable not set"
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database

DB_HOST=$(echo "${DATABASE_URL}" | awk -F'[@]' '{print $2}' | awk -F'[:/]' '{print $1}')
DB_PORT=$(echo "${DATABASE_URL}" | awk -F'[@]' '{print $2}' | awk -F'[:/]' '{print $2}')
DB_USER=$(echo "${DATABASE_URL}" | awk -F'[:@]' '{print $4}')
DB_PASSWORD=$(echo "${DATABASE_URL}" | awk -F'[:@]' '{print $5}' | awk -F'[/]' '{print $1}')
DB_NAME=$(echo "${DATABASE_URL}" | awk -F'[/]' '{print $4}')

log "Database Host: ${DB_HOST}"
log "Database Port: ${DB_PORT}"
log "Database Name: ${DB_NAME}"

# Set PGPASSWORD for pg_dump
export PGPASSWORD="${DB_PASSWORD}"

# ============================================
# PERFORM BACKUP
# ============================================

log "Starting database dump..."

if ! pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=plain \
    --no-owner \
    --no-acl \
    --verbose \
    > "${BACKUP_FILE}" 2>> "${LOG_FILE}"; then
    error_exit "Database dump failed"
fi

log "Database dump completed successfully"

# ============================================
# COMPRESS BACKUP
# ============================================

log "Compressing backup file..."

if ! gzip "${BACKUP_FILE}"; then
    error_exit "Backup compression failed"
fi

# Get file sizes
UNCOMPRESSED_SIZE=$(du -h "${BACKUP_FILE}" 2>/dev/null | cut -f1 || echo "N/A")
COMPRESSED_SIZE=$(du -h "${BACKUP_FILE_COMPRESSED}" | cut -f1)

log "Backup sizes - Uncompressed: ${UNCOMPRESSED_SIZE}, Compressed: ${COMPRESSED_SIZE}"

# ============================================
# UPLOAD TO CLOUD STORAGE (Optional)
# ============================================

# Uncomment and configure for cloud storage backup
# Currently supporting: AWS S3, Backblaze B2, Wasabi

# Example: Upload to AWS S3
# if command -v aws &> /dev/null; then
#     log "Uploading backup to AWS S3..."
#     aws s3 cp "${BACKUP_FILE_COMPRESSED}" \
#         "s3://your-bucket-name/notaryos-backups/$(basename ${BACKUP_FILE_COMPRESSED})" \
#         2>> "${LOG_FILE}"
#     log "S3 upload completed"
# fi

# Example: Upload to Backblaze B2
# if command -v b2 &> /dev/null; then
#     log "Uploading backup to Backblaze B2..."
#     b2 upload-file \
#         your-bucket-name \
#         "${BACKUP_FILE_COMPRESSED}" \
#         "notaryos-backups/$(basename ${BACKUP_FILE_COMPRESSED})" \
#         2>> "${LOG_FILE}"
#     log "B2 upload completed"
# fi

# ============================================
# CLEANUP OLD BACKUPS
# ============================================

log "Cleaning up backups older than ${RETENTION_DAYS} days..."

find "${BACKUP_DIR}" \
    -name "notaryos_backup_*.sql.gz" \
    -type f \
    -mtime +${RETENTION_DAYS} \
    -delete 2>> "${LOG_FILE}"

# Also clean up old log files
find "${BACKUP_DIR}" \
    -name "backup_*.log" \
    -type f \
    -mtime +${RETENTION_DAYS} \
    -delete 2>> "${LOG_FILE}"

log "Cleanup completed"

# ============================================
# VERIFY BACKUP
# ============================================

log "Verifying backup integrity..."

# Check if compressed file exists and is not empty
if [ ! -s "${BACKUP_FILE_COMPRESSED}" ]; then
    error_exit "Backup file is empty or does not exist"
fi

# Test gzip integrity
if ! gzip -t "${BACKUP_FILE_COMPRESSED}" 2>> "${LOG_FILE}"; then
    error_exit "Backup file is corrupted"
fi

log "Backup verification completed successfully"

# ============================================
# BACKUP SUMMARY
# ============================================

BACKUP_SIZE=$(du -h "${BACKUP_FILE_COMPRESSED}" | cut -f1)
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "notaryos_backup_*.sql.gz" | wc -l)

log "=========================================="
log "Backup Summary"
log "=========================================="
log "Backup File: ${BACKUP_FILE_COMPRESSED}"
log "Size: ${BACKUP_SIZE}"
log "Total Backups: ${BACKUP_COUNT}"
log "Retention Policy: ${RETENTION_DAYS} days"
log "=========================================="

# ============================================
# NOTIFICATIONS (Optional)
# ============================================

# Send notification on backup completion
# Uncomment and configure for your notification service

# Example: Send email notification
# if command -v mail &> /dev/null; then
#     mail -s "NotaryOS Backup Completed - ${TIMESTAMP}" \
#         admin@yourdomain.com \
#         < "${LOG_FILE}"
# fi

# Example: Send Slack notification
# if command -v curl &> /dev/null; then
#     curl -X POST \
#         -H 'Content-type: application/json' \
#         --data "{\"text\":\"NotaryOS backup completed successfully. File: ${BACKUP_FILE_COMPRESSED}\"}" \
#         "YOUR_SLACK_WEBHOOK_URL"
# fi

log "Backup process completed successfully"

exit 0