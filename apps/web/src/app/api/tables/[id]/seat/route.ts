import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import QRCode from 'qrcode';

// Seat a table - generates QR and sets status to occupied
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(params.id) as any;
  if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

  // Generate fresh QR code for this session
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://56.69.41.130';
  const sessionId = `${params.id}-${Date.now()}`;
  const qrData = `${baseUrl}/order/${params.id}`;
  const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 400, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });

  db.prepare('UPDATE tables SET status = ?, qr_code_url = ? WHERE id = ?').run('occupied', qrCodeUrl, params.id);

  const updated = db.prepare('SELECT * FROM tables WHERE id = ?').get(params.id);
  return NextResponse.json(updated);
}
