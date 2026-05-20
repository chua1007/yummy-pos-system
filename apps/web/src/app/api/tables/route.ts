import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId } from '@/lib/tenant';
import { v4 as uuid } from 'uuid';
import QRCode from 'qrcode';

export async function GET() {
  const db = getDb();
  const tenantId = getTenantId();

  let tables;
  if (tenantId) {
    tables = db.prepare('SELECT * FROM tables WHERE tenant_id = ? ORDER BY table_number').all(tenantId);
  } else {
    tables = db.prepare('SELECT * FROM tables ORDER BY table_number').all();
  }
  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  const body = await req.json();
  const id = uuid();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://56.69.41.130';
  const qrData = `${baseUrl}/order/${id}`;
  const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });

  db.prepare(
    'INSERT INTO tables (id, table_number, capacity, zone, status, qr_code_url, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.table_number, body.capacity || 4, body.zone || 'Main', 'available', qrCodeUrl, tenantId);

  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
  return NextResponse.json(table, { status: 201 });
}
