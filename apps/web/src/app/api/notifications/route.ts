import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const db = getDb();
  const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
  const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get() as any).count;
  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  if (body.action === 'mark_read') {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(body.id);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'mark_all_read') {
    db.prepare('UPDATE notifications SET is_read = 1').run();
    return NextResponse.json({ success: true });
  }

  const id = uuid();
  db.prepare('INSERT INTO notifications (id, type, title, message, link) VALUES (?, ?, ?, ?, ?)').run(
    id, body.type || 'info', body.title, body.message, body.link || null
  );
  return NextResponse.json({ id }, { status: 201 });
}
