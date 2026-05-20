import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuid } from 'uuid';
import QRCode from 'qrcode';

export async function GET() {
  const db = getDb();
  const tables = db.prepare('SELECT * FROM tables ORDER BY table_number').all();
  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = uuid();

  // Generate QR code as data URL
  const qrData = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/order/${id}`;
  const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });

  db.prepare(
    'INSERT INTO tables (id, table_number, capacity, zone, status, qr_code_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, body.table_number, body.capacity || 4, body.zone || 'Main', 'available', qrCodeUrl);

  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
  return NextResponse.json(table, { status: 201 });
}
