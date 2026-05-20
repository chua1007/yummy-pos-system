import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import getDb from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'yummy-secret-key-change-in-production-2024';
const TOKEN_EXPIRY = '7d';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'restaurant_owner' | 'manager' | 'staff';
  tenant_id: string | null; // null for super_admin
  tenant_name: string | null;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function getAuthUser(): AuthUser | null {
  const cookieStore = cookies();
  const token = cookieStore.get('yummy_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function initAuthTables() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      tenant_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id TEXT,
      plan TEXT DEFAULT 'starter',
      status TEXT DEFAULT 'active',
      logo_url TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      currency TEXT DEFAULT 'MYR',
      tax_rate REAL DEFAULT 6.0,
      timezone TEXT DEFAULT 'Asia/Kuala_Lumpur',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create default super admin if not exists
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'super_admin'").get();
  if (!adminExists) {
    const { v4: uuid } = require('uuid');
    const adminId = uuid();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, tenant_id)
      VALUES (?, ?, ?, ?, 'super_admin', NULL)
    `).run(adminId, 'admin@yummy.io', hashPassword('admin123'), 'Super Admin');
  }
}
