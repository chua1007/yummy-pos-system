import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();

  // Revenue & order stats
  const thisMonth = db.prepare(`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_revenue
    FROM orders WHERE created_at >= date('now', 'start of month')
  `).get() as any;

  const lastMonth = db.prepare(`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_revenue
    FROM orders WHERE created_at >= date('now', 'start of month', '-1 month') AND created_at < date('now', 'start of month')
  `).get() as any;

  // Customer count
  const customerCount = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as any).count;

  // Avg prep time (mock for now since we don't track actual prep)
  const avgOrderValue = thisMonth.total_orders > 0 ? Math.round(thisMonth.total_revenue / thisMonth.total_orders) : 0;

  // Revenue change
  const revenueChange = lastMonth.total_revenue > 0
    ? ((thisMonth.total_revenue - lastMonth.total_revenue) / lastMonth.total_revenue * 100).toFixed(1)
    : thisMonth.total_revenue > 0 ? '100' : '0';

  const orderChange = lastMonth.total_orders > 0
    ? ((thisMonth.total_orders - lastMonth.total_orders) / lastMonth.total_orders * 100).toFixed(1)
    : thisMonth.total_orders > 0 ? '100' : '0';

  // Orders by hour (today)
  const hourlyOrders = db.prepare(`
    SELECT strftime('%H', created_at) as hour, COUNT(*) as count
    FROM orders WHERE date(created_at) = date('now')
    GROUP BY hour ORDER BY hour
  `).all() as any[];

  const hourlyData = [];
  for (let h = 8; h <= 22; h++) {
    const hourStr = h.toString().padStart(2, '0');
    const found = hourlyOrders.find((r: any) => r.hour === hourStr);
    hourlyData.push({ hour: `${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'}`, orders: found?.count || 0 });
  }

  // Top selling items (this month)
  const topItems = db.prepare(`
    SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= date('now', 'start of month')
    GROUP BY oi.name
    ORDER BY total_qty DESC
    LIMIT 5
  `).all() as any[];

  // Orders by day (last 7 days)
  const dailyOrders = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count, SUM(total) as revenue
    FROM orders WHERE created_at >= date('now', '-7 days')
    GROUP BY day ORDER BY day
  `).all();

  return NextResponse.json({
    stats: {
      totalRevenue: thisMonth.total_revenue,
      totalOrders: thisMonth.total_orders,
      customerCount,
      avgOrderValue,
      revenueChange: parseFloat(revenueChange as string),
      orderChange: parseFloat(orderChange as string),
    },
    hourlyData,
    topItems: topItems.map((item: any) => ({
      name: item.name,
      orders: item.total_qty,
      revenue: item.total_revenue,
    })),
    dailyOrders,
  });
}
