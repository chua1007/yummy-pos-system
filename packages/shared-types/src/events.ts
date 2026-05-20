// ─── Domain Event Base ───────────────────────────────────────

export interface DomainEvent<T = unknown> {
  id: string;
  source: string;
  type: string;
  specversion: '1.0';
  time: string;
  datacontenttype: 'application/json';
  data: T;
  tenantid: string;
  branchid?: string;
  correlationid: string;
  causationid?: string;
}

// ─── Order Events ────────────────────────────────────────────

export interface OrderPlacedEvent {
  orderId: string;
  orderNumber: string;
  branchId: string;
  type: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  total: number;
  customerId?: string;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  updatedBy: string;
}

// ─── Payment Events ──────────────────────────────────────────

export interface PaymentConfirmedEvent {
  paymentId: string;
  orderId: string;
  amount: number;
  method: string;
  gatewayRef: string;
}

export interface PaymentFailedEvent {
  paymentId: string;
  orderId: string;
  reason: string;
  errorCode: string;
}

// ─── Kitchen Events ──────────────────────────────────────────

export interface KitchenOrderReadyEvent {
  orderId: string;
  orderNumber: string;
  branchId: string;
  completedAt: string;
}

// ─── Inventory Events ────────────────────────────────────────

export interface LowStockEvent {
  ingredientId: string;
  branchId: string;
  currentQuantity: number;
  threshold: number;
  ingredientName: string;
}

// ─── Tenant Events ───────────────────────────────────────────

export interface TenantCreatedEvent {
  tenantId: string;
  name: string;
  plan: string;
  region: string;
  ownerEmail: string;
}
