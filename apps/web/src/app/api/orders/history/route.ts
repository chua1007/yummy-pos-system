import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  const searchParams = req.nextUrl.searchParams;
  const dateFrom = searchParams.get('from');
  const dateTo = searchParams.get('to');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  let whereClause = '1=1';
  const params: any[] = [];

  if (tenantId) {
    whereClause += ' AND tenant_id = ?';
    params.push(tenantId);
  }

  if (dateFrom) {
    whereClause += ' AND date(created_at) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ' AND date(created_at) <= date(?)';
    params.push(dateTo);
  }
  if (status && status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    whereClause += ' AND (order_number LIKE ? OR customer_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE ${whereClause}`).get(...params) as any;
  const total = totalRow.count;

  const orders = db.prepare(`SELECT * FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as any[];

  // Get items for each order
  const ordersWithItems = orders.map((order: any) => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });

  // Summary stats
  const summaryParams = [...params];
  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(AVG(total), 0) as avg_order_value,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
      COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_orders
    FROM orders WHERE ${whereClause}
  `).get(...summaryParams) as any;

  return NextResponse.json({
    orders: ordersWithItems,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary,
  });
}
