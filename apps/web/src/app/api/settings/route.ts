import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();

  // Ensure settings table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const rows = db.prepare('SELECT * FROM settings').all() as any[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  // Return defaults if not set
  return NextResponse.json({
    restaurant_name: settings.restaurant_name || 'Yummy Cafe',
    restaurant_address: settings.restaurant_address || '123 Jalan Bukit Bintang, 55100 Kuala Lumpur',
    restaurant_phone: settings.restaurant_phone || '+60 3-1234 5678',
    restaurant_email: settings.restaurant_email || 'hello@yummycafe.my',
    opening_time: settings.opening_time || '08:00',
    closing_time: settings.closing_time || '22:00',
    currency: settings.currency || 'MYR',
    tax_rate: settings.tax_rate || '6',
    service_tax: settings.service_tax || '0',
    timezone: settings.timezone || 'Asia/Kuala_Lumpur',
    language: settings.language || 'en',
    logo_url: settings.logo_url || '',
    primary_color: settings.primary_color || '#f97316',
    notification_email: settings.notification_email || '1',
    notification_push: settings.notification_push || '1',
    notification_sms: settings.notification_sms || '0',
    notification_low_stock: settings.notification_low_stock || '1',
    notification_new_order: settings.notification_new_order || '1',
  });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  const saveAll = db.transaction(() => {
    for (const [key, value] of Object.entries(body)) {
      upsert.run(key, String(value));
    }
  });

  saveAll();

  return NextResponse.json({ success: true });
}
