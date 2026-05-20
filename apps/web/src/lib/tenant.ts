import { cookies } from 'next/headers';
import { verifyToken, type AuthUser } from './auth';

/**
 * Get the current authenticated user's tenant_id from the JWT cookie.
 * Returns null for super_admin (they don't belong to a tenant).
 */
export function getTenantId(): string | null {
  const cookieStore = cookies();
  const token = cookieStore.get('yummy_token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  return user?.tenant_id || null;
}

/**
 * Get the full auth user from cookie.
 */
export function getCurrentUser(): AuthUser | null {
  const cookieStore = cookies();
  const token = cookieStore.get('yummy_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
