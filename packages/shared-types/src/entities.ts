import {
  OrderType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  TableStatus,
  TenantPlan,
  TenantStatus,
  KitchenOrderStatus,
} from './enums';
import type { Currency } from './common';

// ─── Tenant ──────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  region: string;
  currency: Currency;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  timezone: string;
  phone?: string;
  operatingHours: OperatingHours[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface OperatingHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // "09:00"
  closeTime: string; // "22:00"
  isClosed: boolean;
}

// ─── User ────────────────────────────────────────────────────

export interface User {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: string;
  branchId?: string;
  status: 'active' | 'inactive';
  lastLoginAt?: string;
  createdAt: string;
}

// ─── Menu ────────────────────────────────────────────────────

export interface MenuCategory {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: Currency;
  imageUrl?: string;
  prepTimeMins?: number;
  isAvailable: boolean;
  taxCategory?: string;
  sortOrder: number;
  variants: ItemVariant[];
  modifierGroups: ModifierGroup[];
  tags: string[];
  allergens: string[];
  createdAt: string;
}

export interface ItemVariant {
  id: string;
  name: string;
  price: number;
  sku?: string;
  isAvailable: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
}

// ─── Order ───────────────────────────────────────────────────

export interface Order {
  id: string;
  tenantId: string;
  branchId: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  tableId?: string;
  customerId?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: Currency;
  notes?: string;
  placedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  modifiers: OrderItemModifier[];
  notes?: string;
  status: KitchenOrderStatus;
}

export interface OrderItemModifier {
  modifierId: string;
  name: string;
  priceAdjustment: number;
  quantity: number;
}

// ─── Payment ─────────────────────────────────────────────────

export interface Payment {
  id: string;
  orderId: string;
  tenantId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayRef?: string;
  paidAt?: string;
  refundAmount?: number;
  createdAt: string;
}

// ─── Table ───────────────────────────────────────────────────

export interface Table {
  id: string;
  tenantId: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
  zone?: string;
  qrCode: string;
  status: TableStatus;
}

// ─── Customer ────────────────────────────────────────────────

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  totalSpent: number;
  visitCount: number;
  lastVisitAt?: string;
  tags: string[];
  createdAt: string;
}

// ─── Inventory ───────────────────────────────────────────────

export interface Ingredient {
  id: string;
  tenantId: string;
  name: string;
  unit: string;
  costPerUnit: number;
  category: string;
  isPerishable: boolean;
  shelfLifeDays?: number;
}

export interface StockLevel {
  id: string;
  ingredientId: string;
  branchId: string;
  quantity: number;
  minThreshold: number;
  maxCapacity: number;
  lastRestocked?: string;
}
