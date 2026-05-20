import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { verifyPassword, generateToken, type AuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const db = getDb();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email) as any;
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Get tenant info
  let tenantName = null;
  if (user.tenant_id) {
    const tenant = db.prepare('SELECT name FROM tenants WHERE id = ?').get(user.tenant_id) as any;
    tenantName = tenant?.name || null;
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenant_id: user.tenant_id,
    tenant_name: tenantName,
  };

  const token = generateToken(authUser);

  // Update last login
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  const response = NextResponse.json({ user: authUser });
  response.cookies.set('yummy_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return response;
}
