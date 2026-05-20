# Database Design

## Multi-Tenant Data Isolation Strategy

### Approach: Hybrid Schema Isolation

```
┌─────────────────────────────────────────────────────────────┐
│              MULTI-TENANT DATA STRATEGY                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  TIER 1: Enterprise (Schema-per-Tenant)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Database: yummy_production                          │    │
│  │  ├── schema: tenant_acme_corp                        │    │
│  │  ├── schema: tenant_foodchain_xyz                    │    │
│  │  └── schema: tenant_franchise_abc                    │    │
│  │  Full isolation, dedicated connection pools           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  TIER 2: Standard (Row-Level Security)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Database: yummy_shared                              │    │
│  │  Schema: public                                      │    │
│  │  All tables have tenant_id column                    │    │
│  │  PostgreSQL RLS policies enforce isolation            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  TIER 3: Starter (Shared with Logical Isolation)             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Same as Tier 2 but with resource quotas             │    │
│  │  Rate-limited queries, storage caps                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Row-Level Security Implementation

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Application sets tenant context per request
SET app.current_tenant = 'tenant-uuid-here';
```

## Entity Relationship Diagram (ERD)

### Core Domain: Tenants & Auth

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     tenants      │       │   tenant_configs │       │    branches      │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK, UUID)    │──┐    │ id (PK, UUID)    │       │ id (PK, UUID)    │
│ name             │  │    │ tenant_id (FK)   │◀──┐   │ tenant_id (FK)   │
│ slug             │  │    │ theme_config     │   │   │ name             │
│ plan_id (FK)     │  ├───▶│ branding_config  │   │   │ address          │
│ status           │  │    │ feature_flags    │   │   │ timezone         │
│ region           │  │    │ locale_settings  │   │   │ operating_hours  │
│ created_at       │  │    └──────────────────┘   │   │ status           │
│ updated_at       │  │                           │   │ created_at       │
└──────────────────┘  │                           │   └──────────────────┘
                      │                           │            │
┌──────────────────┐  │    ┌──────────────────┐   │            │
│      users       │  │    │      roles       │   │            │
├──────────────────┤  │    ├──────────────────┤   │            │
│ id (PK, UUID)    │  │    │ id (PK, UUID)    │   │            │
│ tenant_id (FK)   │◀─┘    │ tenant_id (FK)   │◀──┘            │
│ cognito_sub      │       │ name             │                │
│ email            │       │ permissions[]    │                │
│ full_name        │       │ is_system_role   │                │
│ role_id (FK)     │──────▶│ created_at       │                │
│ branch_id (FK)   │───────┼───────────────────────────────────┘
│ status           │       └──────────────────┘
│ last_login_at    │
└──────────────────┘
```

### Core Domain: Menu & Products

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   menu_categories│       │   menu_items     │       │  item_variants   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK, UUID)    │       │ id (PK, UUID)    │       │ id (PK, UUID)    │
│ tenant_id (FK)   │       │ tenant_id (FK)   │       │ item_id (FK)     │
│ branch_id (FK)   │──┐    │ category_id (FK) │◀──┐   │ name             │
│ name             │  │    │ name             │   │   │ price            │
│ description      │  │    │ description      │   │   │ sku              │
│ sort_order       │  │    │ base_price       │   │   │ is_available     │
│ image_url        │  │    │ image_url        │   │   └──────────────────┘
│ is_active        │  │    │ prep_time_mins   │   │
│ available_from   │  │    │ is_available     │   │   ┌──────────────────┐
│ available_until  │  │    │ tax_category     │   │   │ modifier_groups  │
└──────────────────┘  │    │ sort_order       │   │   ├──────────────────┤
                      └───▶│ created_at       │   │   │ id (PK, UUID)    │
                           └──────────────────┘   │   │ tenant_id (FK)   │
                                    │             │   │ name             │
                                    │             │   │ min_selections   │
┌──────────────────┐                │             │   │ max_selections   │
│ item_modifiers   │                │             │   │ is_required      │
├──────────────────┤                │             │   └──────────────────┘
│ id (PK, UUID)    │                │             │            │
│ group_id (FK)    │◀───────────────┼─────────────┘            │
│ item_id (FK)     │◀───────────────┘                          │
│ name             │◀──────────────────────────────────────────┘
│ price_adjustment │
│ is_default       │
└──────────────────┘
```

### Core Domain: Orders & Payments

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     orders       │       │   order_items    │       │    payments      │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK, UUID)    │       │ id (PK, UUID)    │       │ id (PK, UUID)    │
│ tenant_id (FK)   │       │ order_id (FK)    │◀──┐   │ order_id (FK)    │
│ branch_id (FK)   │──┐    │ item_id (FK)     │   │   │ tenant_id (FK)   │
│ order_number     │  │    │ variant_id (FK)  │   │   │ amount           │
│ type (dine_in/   │  │    │ quantity         │   │   │ currency         │
│   takeaway/      │  │    │ unit_price       │   │   │ method           │
│   delivery)      │  │    │ subtotal         │   │   │ gateway          │
│ status           │  │    │ modifiers[]      │   │   │ gateway_ref      │
│ table_id (FK)    │  │    │ notes            │   │   │ status           │
│ customer_id (FK) │  │    │ status           │   │   │ paid_at          │
│ subtotal         │  │    └──────────────────┘   │   │ refund_amount    │
│ tax_amount       │  │                           │   └──────────────────┘
│ discount_amount  │  │    ┌──────────────────┐   │
│ total            │  │    │  order_events    │   │   ┌──────────────────┐
│ notes            │  │    ├──────────────────┤   │   │   invoices       │
│ placed_at        │  │    │ id (PK, UUID)    │   │   ├──────────────────┤
│ completed_at     │  │    │ order_id (FK)    │◀──┤   │ id (PK, UUID)    │
│ created_at       │  │    │ event_type       │   │   │ order_id (FK)    │
└──────────────────┘  │    │ payload          │   │   │ tenant_id (FK)   │
         │            │    │ created_by       │   │   │ invoice_number   │
         │            │    │ created_at       │   │   │ tax_breakdown[]  │
         │            │    └──────────────────┘   │   │ issued_at        │
         │            │                           │   │ pdf_url          │
         └────────────┼───────────────────────────┘   └──────────────────┘
                      │
                      ▼
┌──────────────────┐       ┌──────────────────┐
│     tables       │       │   reservations   │
├──────────────────┤       ├──────────────────┤
│ id (PK, UUID)    │       │ id (PK, UUID)    │
│ tenant_id (FK)   │       │ tenant_id (FK)   │
│ branch_id (FK)   │       │ branch_id (FK)   │
│ table_number     │       │ table_id (FK)    │
│ capacity         │       │ customer_id (FK) │
│ zone             │       │ party_size       │
│ qr_code          │       │ reserved_at      │
│ status           │       │ duration_mins    │
└──────────────────┘       │ status           │
                           │ notes            │
                           └──────────────────┘
```

### Core Domain: Inventory

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   ingredients    │       │  stock_levels    │       │ purchase_orders  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK, UUID)    │       │ id (PK, UUID)    │       │ id (PK, UUID)    │
│ tenant_id (FK)   │       │ ingredient_id(FK)│       │ tenant_id (FK)   │
│ name             │──────▶│ branch_id (FK)   │       │ branch_id (FK)   │
│ unit             │       │ quantity         │       │ supplier_id (FK) │
│ cost_per_unit    │       │ min_threshold    │       │ status           │
│ category         │       │ max_capacity     │       │ total_amount     │
│ is_perishable    │       │ last_restocked   │       │ ordered_at       │
│ shelf_life_days  │       └──────────────────┘       │ received_at      │
└──────────────────┘                                  │ items[]          │
         │                                            └──────────────────┘
         │
         ▼
┌──────────────────┐       ┌──────────────────┐
│  recipe_items    │       │    suppliers     │
├──────────────────┤       ├──────────────────┤
│ id (PK, UUID)    │       │ id (PK, UUID)    │
│ menu_item_id(FK) │       │ tenant_id (FK)   │
│ ingredient_id(FK)│       │ name             │
│ quantity_needed  │       │ contact_email    │
│ unit             │       │ phone            │
└──────────────────┘       │ address          │
                           │ payment_terms    │
                           │ lead_time_days   │
                           └──────────────────┘
```

### Core Domain: CRM & Loyalty

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    customers     │       │  loyalty_points  │       │   memberships    │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK, UUID)    │       │ id (PK, UUID)    │       │ id (PK, UUID)    │
│ tenant_id (FK)   │       │ customer_id (FK) │       │ customer_id (FK) │
│ name             │──────▶│ tenant_id (FK)   │       │ tenant_id (FK)   │
│ email            │       │ points_balance   │       │ tier             │
│ phone            │       │ lifetime_earned  │       │ started_at       │
│ preferences      │       │ last_earned_at   │       │ expires_at       │
│ tags[]           │       └──────────────────┘       │ status           │
│ total_spent      │                                  └──────────────────┘
│ visit_count      │       ┌──────────────────┐
│ last_visit_at    │       │    campaigns     │       ┌──────────────────┐
│ created_at       │       ├──────────────────┤       │    vouchers      │
└──────────────────┘       │ id (PK, UUID)    │       ├──────────────────┤
                           │ tenant_id (FK)   │       │ id (PK, UUID)    │
                           │ name             │       │ tenant_id (FK)   │
                           │ type             │       │ code             │
                           │ channel          │       │ discount_type    │
                           │ segment_rules    │       │ discount_value   │
                           │ content          │       │ min_order_amount │
                           │ scheduled_at     │       │ max_uses         │
                           │ status           │       │ used_count       │
                           └──────────────────┘       │ valid_from       │
                                                      │ valid_until      │
                                                      └──────────────────┘
```

### Core Domain: HR & Workforce

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      staff       │       │    schedules     │       │   attendance     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK, UUID)    │       │ id (PK, UUID)    │       │ id (PK, UUID)    │
│ tenant_id (FK)   │       │ staff_id (FK)    │       │ staff_id (FK)    │
│ user_id (FK)     │──────▶│ tenant_id (FK)   │       │ tenant_id (FK)   │
│ branch_id (FK)   │       │ branch_id (FK)   │       │ branch_id (FK)   │
│ employee_id      │       │ shift_start      │       │ clock_in         │
│ position         │       │ shift_end        │       │ clock_out        │
│ hourly_rate      │       │ day_of_week      │       │ hours_worked     │
│ employment_type  │       │ is_recurring     │       │ overtime_hours   │
│ hired_at         │       │ status           │       │ notes            │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

## Database Indexing Strategy

```sql
-- Composite indexes for multi-tenant queries
CREATE INDEX idx_orders_tenant_branch_date 
  ON orders (tenant_id, branch_id, created_at DESC);

CREATE INDEX idx_orders_tenant_status 
  ON orders (tenant_id, status) WHERE status IN ('pending', 'preparing');

CREATE INDEX idx_menu_items_tenant_category 
  ON menu_items (tenant_id, category_id, sort_order);

CREATE INDEX idx_customers_tenant_phone 
  ON customers (tenant_id, phone);

CREATE INDEX idx_stock_levels_low 
  ON stock_levels (tenant_id, branch_id) 
  WHERE quantity <= min_threshold;

-- Partial indexes for active records
CREATE INDEX idx_active_orders 
  ON orders (tenant_id, branch_id, created_at DESC) 
  WHERE status NOT IN ('completed', 'cancelled');
```

## Database Migration Strategy

- **Tool**: Prisma Migrate (integrated with NestJS)
- **Versioning**: Sequential numbered migrations
- **Rollback**: Every migration has a corresponding down migration
- **Multi-tenant**: Migrations run per-schema for enterprise tenants
- **Zero-downtime**: Expand-contract pattern for schema changes

## Data Partitioning Strategy

```sql
-- Partition orders by month for performance
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ...
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE orders_2024_01 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```
