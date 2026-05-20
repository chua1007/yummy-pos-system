import type { OrderType, PaymentMethod } from './enums';

// ─── Order DTOs ──────────────────────────────────────────────

export interface CreateOrderDto {
  type: OrderType;
  tableId?: string;
  items: CreateOrderItemDto[];
  customerId?: string;
  voucherCode?: string;
  notes?: string;
}

export interface CreateOrderItemDto {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  modifiers?: CreateOrderModifierDto[];
  notes?: string;
}

export interface CreateOrderModifierDto {
  modifierId: string;
  quantity: number;
}

export interface UpdateOrderStatusDto {
  status: string;
  reason?: string;
}

// ─── Payment DTOs ────────────────────────────────────────────

export interface ProcessPaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  gatewayToken?: string;
  splitPayments?: SplitPaymentDto[];
}

export interface SplitPaymentDto {
  method: PaymentMethod;
  amount: number;
  gatewayToken?: string;
}

// ─── Menu DTOs ───────────────────────────────────────────────

export interface CreateMenuItemDto {
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  prepTimeMins?: number;
  taxCategory?: string;
  variants?: CreateVariantDto[];
  modifierGroups?: string[];
  tags?: string[];
  allergens?: string[];
}

export interface CreateVariantDto {
  name: string;
  price: number;
  sku?: string;
}

// ─── Tenant DTOs ─────────────────────────────────────────────

export interface CreateTenantDto {
  name: string;
  ownerEmail: string;
  ownerName: string;
  plan: string;
  region: string;
  currency: string;
  timezone: string;
}

// ─── Auth DTOs ───────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  tenantName: string;
  plan?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
