# NotaryOS - Supabase Migration & Deployment Prompt

## Prompt for Kimi (AI Assistant)

Copy and paste the following prompt to Kimi for database migration assistance:

---

**PROMPT START**

Bertindaklah sebagai Senior DevOps. Saat ini saya sedang memindahkan aplikasi Next.js (Prisma) saya dari SQLite (lokal) ke Supabase (Production) dengan Vercel sebagai host.

Lakukan langkah berikut:

### 1. Prisma Configuration

Berikan panduan cara mengubah `schema.prisma` saya dari `provider = "sqlite"` ke `provider = "postgresql"` dan format `DATABASE_URL` yang benar untuk Supabase (termasuk penggunaan Transaction Mode pada port 6543).

**Contoh yang diharapkan:**

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
# Format DATABASE_URL untuk Supabase (Transaction Mode)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"

# Format untuk migrations (Direct Mode)
DATABASE_URL_DIRECT="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
```

### 2. Migration Strategy

Berikan langkah-langkah detail untuk melakukan `prisma db push` ke Supabase project saya:

1. Cara membuat Supabase project (rekomendasikan region Singapore untuk data residency Indonesia)
2. Cara mendapatkan DATABASE_URL dari Supabase Dashboard
3. Perintah untuk push schema ke Supabase
4. Cara menangani error yang mungkin muncul

### 3. Supabase Security (RLS)

Berikan panduan SQL untuk mengaktifkan RLS (Row Level Security) pada tabel `Client` dan `Document` agar data terisolasi dengan aman. Ini krusial untuk aplikasi notaris (UU PDP).

**Policy yang diharapkan:**

- Admin dapat melihat semua data
- Staff dapat melihat dan mengedit data yang mereka buat
- Data tidak dapat diakses secara publik
- Audit log tidak dapat dihapus
- Dokumen yang sudah ditandatangani tidak dapat dihapus

**Berikan perintah SQL lengkap yang dapat langsung dijalankan di Supabase SQL Editor.**

### 4. Vercel Environment

Berikan daftar Environment Variables yang wajib saya masukkan di Vercel Dashboard (Database URL, API Key, dll).

**Format yang diharapkan:**

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="[generate-with-openssl-rand-base64-32]"

# Security
NODE_ENV="production"
ENCRYPTION_KEY="[generate-with-openssl-rand-base64-32]"
CSRF_SECRET="[generate-with-openssl-rand-base64-16]"
```

### 5. Backup Check

Berikan panduan singkat di mana saya harus memastikan fitur 'Automated Backup' aktif di dashboard Supabase:

1. Navigasi ke menu mana di Supabase Dashboard
2. Opsi apa yang harus diaktifkan
3. Retention period yang disarankan
4. Apakah perlu backup manual tambahan

---

**CONSTRAINTS:**

1. Pastikan semua langkah aman agar tidak ada data bocor saat transisi
2. Berikan instruksi step-by-step yang mudah diikuti
3. Sertakan perintah terminal lengkap untuk copy-paste
4. Berikan catatan tentang kesalahan umum dan cara memperbaikinya

---

**SEED DATA (Opsional):**

Berikan instruksi jika saya ingin melakukan 'Seed' data dari SQLite ke Postgres (jika diperlukan) atau cara memulainya dari awal yang bersih. Jika menggunakan fresh start, berikan perintah untuk membuat user admin awal.

**PROMPT END**

---

## Additional Notes for Kimi

### Context

- **Application**: NotaryOS (Sistem Administrasi Kantor Notaris)
- **Tech Stack**: Next.js 16, TypeScript, Prisma, Tailwind CSS
- **Current Database**: SQLite (development)
- **Target Database**: PostgreSQL/Supabase (production)
- **Deployment**: Vercel
- **Compliance**: UU PDP (Undang-Undang Perlindungan Data Pribadi) - Indonesia

### Key Requirements

1. **Data Residency**: Supabase Singapore region to comply with Indonesian data laws
2. **Security**: RLS policies to ensure data isolation
3. **Compliance**: Audit logging for all operations
4. **Backup**: Automated daily backups with 90-day retention
5. **Rate Limiting**: Brute force protection on authentication

### File Structure Created

```
notaryos/
├── .env.example                    # Environment variables template
├── .env.staging.example            # Staging environment template
├── deployment/
│   └── MIGRATION-GUIDE.md          # Detailed migration guide
├── scripts/
│   ├── backup-database.sh          # Automated backup script
│   └── provision-staging.sh        # Staging setup script
├── supabase/
│   └── security-policies.sql       # RLS policies and security setup
├── src/
│   ├── middleware/
│   │   └── rate-limit.ts           # Rate limiting middleware
│   └── lib/
│       └── security.ts             # Security utilities
├── middleware.ts                   # Security headers and middleware
├── vercel.json                     # Vercel configuration
├── DEPLOYMENT.md                   # Full deployment guide
├── DEPLOYMENT-QUICK-REFERENCE.md   # Quick reference card
└── PRE-DEPLOYMENT-CHECKLIST.md     # Pre-deployment checklist
```

### Commands to Generate Secrets

```bash
# NextAuth Secret
openssl rand -base64 32

# Encryption Key
openssl rand -base64 32

# CSRF Secret
openssl rand -base64 16
```

### Testing Commands

```bash
# Test database connection
bunx prisma studio

# Push schema to database
bun run prisma db push

# Generate Prisma Client
bun run prisma generate

# Seed database (for staging)
bun run db:seed
```

---

## Next Steps

1. Copy the prompt above and send it to Kimi
2. Follow the instructions provided by Kimi
3. Use the additional notes for context
4. Test each step in staging environment first
5. Review the pre-deployment checklist before production

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0