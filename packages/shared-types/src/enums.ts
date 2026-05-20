// ─── Order Enums ─────────────────────────────────────────────

export enum OrderType {
  DineIn = 'dine_in',
  Takeaway = 'takeaway',
  Delivery = 'delivery',
}

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Preparing = 'preparing',
  Ready = 'ready',
  Served = 'served',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

// ─── Payment Enums ───────────────────────────────────────────

export enum PaymentMethod {
  Cash = 'cash',
  Card = 'card',
  EWallet = 'e_wallet',
  BankTransfer = 'bank_transfer',
  LoyaltyPoints = 'loyalty_points',
}

export enum PaymentStatus {
  Pending = 'pending',
  Processing = 'processing',
  Confirmed = 'confirmed',
  Failed = 'failed',
  Refunded = 'refunded',
  PartialRefund = 'partial_refund',
}

// ─── Table Enums ─────────────────────────────────────────────

export enum TableStatus {
  Available = 'available',
  Occupied = 'occupied',
  Reserved = 'reserved',
  Cleaning = 'cleaning',
}

// ─── Tenant Enums ────────────────────────────────────────────

export enum TenantPlan {
  Starter = 'starter',
  Growth = 'growth',
  Enterprise = 'enterprise',
  Custom = 'custom',
}

export enum TenantStatus {
  Active = 'active',
  Trial = 'trial',
  Suspended = 'suspended',
  Cancelled = 'cancelled',
}

// ─── User Enums ──────────────────────────────────────────────

export enum UserRole {
  TenantOwner = 'tenant_owner',
  TenantAdmin = 'tenant_admin',
  BranchManager = 'branch_manager',
  ShiftLead = 'shift_lead',
  Cashier = 'cashier',
  KitchenStaff = 'kitchen_staff',
  Waiter = 'waiter',
  Viewer = 'viewer',
}

// ─── Kitchen Enums ───────────────────────────────────────────

export enum KitchenOrderStatus {
  Queued = 'queued',
  InProgress = 'in_progress',
  Ready = 'ready',
  Served = 'served',
}

// ─── Inventory Enums ─────────────────────────────────────────

export enum StockAlertLevel {
  Normal = 'normal',
  Low = 'low',
  Critical = 'critical',
  OutOfStock = 'out_of_stock',
}
