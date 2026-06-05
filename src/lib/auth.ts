// ============================================
// NEXTAUTH.JS CONFIGURATION
// Authentication system for NotaryOS
// ============================================

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { UserRole } from '@prisma/client';
import { logLogin, logLogout } from './audit-logger';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi');
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Email atau password salah');
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error('Akun Anda dinonaktifkan. Silakan hubungi admin.');
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const remainingMinutes = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / 60000,
          );
          throw new Error(
            `Akun terkunci sementara. Silakan coba lagi dalam ${remainingMinutes} menit.`,
          );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          // Increment failed login attempts
          const newFailedAttempts = user.failedLoginAttempts + 1;
          const lockedUntil =
            newFailedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes after 5 failed attempts

          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newFailedAttempts,
              lockedUntil,
            },
          });

          // Log failed login attempt
          await logLogin(
            user.id,
            undefined,
            undefined,
            'FAILURE',
          );

          if (lockedUntil) {
            throw new Error('Terlalu banyak percobaan gagal. Akun terkunci selama 15 menit.');
          }

          throw new Error('Email atau password salah');
        }

        // Reset failed login attempts on successful login
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLogin: new Date(),
          },
        });

        // Log successful login
        await logLogin(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};