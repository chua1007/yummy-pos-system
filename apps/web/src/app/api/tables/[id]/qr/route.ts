import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import QRCode from 'qrcode';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(params.id) as any;

  if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const qrData = `${baseUrl}/order/${table.id}`;
  const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 400, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });

  // Update stored QR
  db.prepare('UPDATE tables SET qr_code_url = ? WHERE id = ?').run(qrCodeUrl, params.id);

  return NextResponse.json({ qr_code_url: qrCodeUrl, order_url: qrData, table });
}
