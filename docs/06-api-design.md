# API Design Standards

## API Gateway Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  External Clients                                            │
│       │                                                       │
│       ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AWS API Gateway                          │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │    │
│  │  │WAF   │ │Rate  │ │Auth  │ │Route │ │Cache │     │    │
│  │  │Rules │ │Limit │ │Check │ │Match │ │Layer │     │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                       │
│       ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           NestJS API Gateway (BFF)                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │Request   │ │Response  │ │Aggregation│            │    │
│  │  │Transform │ │Transform │ │Layer      │            │    │
│  │  └──────────┘ └──────────┘ └──────────┘            │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                       │
│       ▼                                                       │
│  Internal Services (gRPC / REST)                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## API Versioning Strategy

- **URL-based versioning**: `/api/v1/orders`, `/api/v2/orders`
- **Header-based for minor versions**: `X-API-Version: 2024-01-15`
- **Deprecation policy**: 6-month sunset period with `Sunset` header

## RESTful API Standards

### URL Conventions
```
Base URL: https://api.yummy.io/v1

Resources:
GET    /tenants/{tenantId}/branches                    # List branches
POST   /tenants/{tenantId}/branches                    # Create branch
GET    /tenants/{tenantId}/branches/{branchId}         # Get branch
PATCH  /tenants/{tenantId}/branches/{branchId}         # Update branch
DELETE /tenants/{tenantId}/branches/{branchId}         # Delete branch

Nested Resources:
GET    /branches/{branchId}/orders                     # List orders
POST   /branches/{branchId}/orders                     # Create order
GET    /branches/{branchId}/orders/{orderId}           # Get order
PATCH  /branches/{branchId}/orders/{orderId}/status    # Update status

Actions (non-CRUD):
POST   /orders/{orderId}/confirm                       # Confirm order
POST   /orders/{orderId}/cancel                        # Cancel order
POST   /payments/{paymentId}/refund                    # Refund payment

Filtering & Pagination:
GET    /orders?status=pending&page=1&limit=20&sort=-created_at
GET    /menu-items?category=drinks&available=true
GET    /analytics/revenue?from=2024-01-01&to=2024-01-31&granularity=daily
```

### Request/Response Standards

```typescript
// Standard Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Standard Error Response
interface ApiError {
  success: false;
  error: {
    code: string;          // "ORDER_NOT_FOUND"
    message: string;       // Human-readable message
    details?: unknown[];   // Validation errors
    requestId: string;     // For support/debugging
    timestamp: string;     // ISO 8601
  };
}

// Pagination Request
interface PaginationParams {
  page?: number;       // Default: 1
  limit?: number;      // Default: 20, Max: 100
  sort?: string;       // "-created_at" (prefix - for DESC)
  cursor?: string;     // For cursor-based pagination
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE |
| 400 | Validation error, malformed request |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state conflict) |
| 422 | Business logic validation failure |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable |

## API Examples

### Order API

```typescript
// POST /api/v1/branches/{branchId}/orders
// Create a new order

// Request
{
  "type": "dine_in",
  "tableId": "tbl_abc123",
  "items": [
    {
      "menuItemId": "item_xyz789",
      "variantId": "var_001",
      "quantity": 2,
      "modifiers": [
        { "modifierId": "mod_extra_cheese", "quantity": 1 }
      ],
      "notes": "No onions"
    }
  ],
  "customerId": "cust_456",
  "voucherCode": "WELCOME10",
  "notes": "Birthday celebration"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "ord_abc123",
    "orderNumber": "A-0042",
    "type": "dine_in",
    "status": "pending",
    "tableId": "tbl_abc123",
    "items": [...],
    "subtotal": 4500,
    "taxAmount": 270,
    "discountAmount": 450,
    "total": 4320,
    "currency": "MYR",
    "estimatedPrepTime": 15,
    "placedAt": "2024-03-15T10:30:00Z",
    "createdAt": "2024-03-15T10:30:00Z"
  }
}
```

### Menu API

```typescript
// GET /api/v1/branches/{branchId}/menu?category=main_course&available=true

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "item_xyz789",
      "name": "Nasi Lemak Special",
      "description": "Fragrant coconut rice with sambal, anchovies...",
      "category": {
        "id": "cat_main",
        "name": "Main Course"
      },
      "basePrice": 1500,
      "currency": "MYR",
      "imageUrl": "https://cdn.yummy.io/items/nasi-lemak.jpg",
      "prepTimeMins": 12,
      "isAvailable": true,
      "variants": [
        { "id": "var_001", "name": "Regular", "price": 1500 },
        { "id": "var_002", "name": "Large", "price": 1800 }
      ],
      "modifierGroups": [
        {
          "id": "grp_protein",
          "name": "Extra Protein",
          "minSelections": 0,
          "maxSelections": 3,
          "modifiers": [
            { "id": "mod_egg", "name": "Fried Egg", "price": 200 },
            { "id": "mod_chicken", "name": "Ayam Goreng", "price": 500 }
          ]
        }
      ],
      "tags": ["halal", "spicy", "popular"],
      "allergens": ["peanuts", "shellfish"]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Real-time WebSocket API

```typescript
// WebSocket connection for real-time updates
// ws://api.yummy.io/v1/ws?token={jwt}

// Client subscribes to channels
{ "action": "subscribe", "channel": "orders:branch_abc123" }
{ "action": "subscribe", "channel": "kitchen:branch_abc123" }

// Server pushes events
{
  "channel": "orders:branch_abc123",
  "event": "order.status_changed",
  "data": {
    "orderId": "ord_abc123",
    "previousStatus": "preparing",
    "newStatus": "ready",
    "updatedAt": "2024-03-15T10:45:00Z"
  }
}

// Kitchen Display updates
{
  "channel": "kitchen:branch_abc123",
  "event": "kitchen.new_order",
  "data": {
    "orderId": "ord_abc123",
    "orderNumber": "A-0042",
    "items": [...],
    "priority": "normal",
    "placedAt": "2024-03-15T10:30:00Z"
  }
}
```

## Rate Limiting Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  RATE LIMITING TIERS                          │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Plan         │ Requests/min │ Burst        │ WebSocket Conn │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ Starter      │ 100          │ 150          │ 5              │
│ Growth       │ 500          │ 750          │ 20             │
│ Enterprise   │ 5000         │ 7500         │ 100            │
│ Custom       │ Unlimited    │ Unlimited    │ Unlimited      │
└──────────────┴──────────────┴──────────────┴────────────────┘

Headers returned:
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 423
X-RateLimit-Reset: 1710500000
Retry-After: 30 (when 429)
```

## API Security

- **Authentication**: Bearer JWT tokens (Cognito-issued)
- **Tenant Isolation**: Tenant ID extracted from JWT, enforced at gateway
- **Input Validation**: Zod schemas on all endpoints
- **Output Sanitization**: Strip internal fields before response
- **CORS**: Strict origin allowlist per tenant
- **Request Signing**: HMAC for webhook callbacks
- **Idempotency**: `Idempotency-Key` header for POST/PATCH mutations
