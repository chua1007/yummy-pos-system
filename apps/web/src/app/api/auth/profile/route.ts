import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getAuthUser, hashPassword, verifyPassword, generateToken, type AuthUser } from '@/lib/auth';

export async function GET() {
  const user = getAuthUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const db = getDb();
  const dbUser = db.prepare('SELECT id, email, name, role, tenant_id, created_at, last_login_at FROM users WHERE id = ?').get(user.id) as any;

  let tenant = null;
  if (dbUser?.tenant_id) {
    tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(dbUser.tenant_id);
  }

  return NextResponse.json({ user: dbUser, tenant });
}

export async function PATCH(req: NextRequest) {
  const user = getAuthUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const db = getDb();
  const body = await req.json();

  // Update user fields
  if (body.name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(body.name, user.id);
  }
  if (body.email) {
    // Check if email is taken by another user
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(body.email, user.id);
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(body.email, user.id);
  }
  if (body.new_password) {
    if (body.current_password) {
      const dbUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as any;
      if (!verifyPassword(body.current_password, dbUser.password_hash)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    }
    const hash = hashPassword(body.new_password);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  }

  // Update tenant/restaurant info if owner
  if (body.restaurant_name && user.tenant_id) {
    db.prepare('UPDATE tenants SET name = ? WHERE id = ?').run(body.restaurant_name, user.tenant_id);
  }
  if (body.restaurant_phone && user.tenant_id) {
    db.prepare('UPDATE tenants SET phone = ? WHERE id = ?').run(body.restaurant_phone, user.tenant_id);
  }
  if (body.restaurant_address && user.tenant_id) {
    db.prepare('UPDATE tenants SET address = ? WHERE id = ?').run(body.restaurant_address, user.tenant_id);
  }

  // Get updated user and regenerate token
  const updatedUser = db.prepare('SELECT id, email, name, role, tenant_id FROM users WHERE id = ?').get(user.id) as any;
  let tenantName = null;
  if (updatedUser.tenant_id) {
    const tenant = db.prepare('SELECT name FROM tenants WHERE id = ?').get(updatedUser.tenant_id) as any;
    tenantName = tenant?.name || null;
  }

  const authUser: AuthUser = {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
    tenant_id: updatedUser.tenant_id,
    tenant_name: tenantName,
  };

  const token = generateToken(authUser);

  const response = NextResponse.json({ user: authUser });
  response.cookies.set('yummy_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return response;
}
