import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId } from '@/lib/tenant';

export async function GET() {
  const db = getDb();
  const tenantId = getTenantId();

  const tenantFilter = tenantId ? 'AND tenant_id = ?' : '';
  const params = tenantId ? [tenantId] : [];

  const todayOrders = db.prepare(
    `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders WHERE date(created_at) = date('now') ${tenantFilter}`
  ).get(...params) as any;

  const yesterdayOrders = db.prepare(
    `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders WHERE date(created_at) = date('now', '-1 day') ${tenantFilter}`
  ).get(...params) as any;

  const customerFilter = tenantId ? 'WHERE tenant_id = ?' : '';
  const totalCustomers = (db.prepare(`SELECT COUNT(*) as count FROM customers ${customerFilter}`).get(...(tenantId ? [tenantId] : [])) as any).count;

  const totalOrders = todayOrders.count;
  const totalRevenue = todayOrders.revenue;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const revenueChange = yesterdayOrders.revenue > 0
    ? (((totalRevenue - yesterdayOrders.revenue) / yesterdayOrders.revenue) * 100).toFixed(1)
    : '0';
  const orderChange = yesterdayOrders.count > 0
    ? (((totalOrders - yesterdayOrders.count) / yesterdayOrders.count) * 100).toFixed(1)
    : '0';

  return NextResponse.json({
    revenue: totalRevenue,
    orders: totalOrders,
    customers: totalCustomers,
    avgOrderValue,
    revenueChange: parseFloat(revenueChange),
    orderChange: parseFloat(orderChange),
  });
}
