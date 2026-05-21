import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

// Public endpoint - returns tax rates (used by QR ordering page too)
export async function GET(req: NextRequest) {
  const db = getDb();

  // Ensure settings table exists
  try { db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`); } catch {}

  let sstRate = 6;
  let serviceRate = 0;

  try {
    const sst = db.prepare("SELECT value FROM settings WHERE key = 'tax_rate'").get() as any;
    const service = db.prepare("SELECT value FROM settings WHERE key = 'service_tax'").get() as any;
    if (sst) sstRate = parseFloat(sst.value);
    if (service) serviceRate = parseFloat(service.value);
  } catch {}

  return NextResponse.json({
    sst_rate: sstRate,
    service_tax_rate: serviceRate,
    total_tax_rate: sstRate + serviceRate,
  });
}
