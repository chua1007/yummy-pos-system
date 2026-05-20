# Engineering Standards

## Coding Standards

### TypeScript Standards

```typescript
// ─── NAMING CONVENTIONS ─────────────────────────────────────

// Files: kebab-case
// order-service.ts, create-order.dto.ts, order.controller.ts

// Classes: PascalCase
class OrderService {}
class CreateOrderDto {}

// Interfaces: PascalCase (no "I" prefix)
interface OrderRepository {}
interface PaymentGateway {}

// Types: PascalCase
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
type Currency = 'MYR' | 'SGD' | 'THB' | 'IDR' | 'PHP' | 'VND';

// Enums: PascalCase with PascalCase members
enum OrderType {
  DineIn = 'dine_in',
  Takeaway = 'takeaway',
  Delivery = 'delivery',
}

// Functions/Methods: camelCase
function calculateOrderTotal() {}
async function processPayment() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 20;

// Variables: camelCase
const orderItems = [];
let currentPage = 1;

// Boolean variables: is/has/should prefix
const isLoading = true;
const hasPermission = false;
const shouldRetry = true;

// Event names: domain.action_past_tense
const EVENT_ORDER_PLACED = 'order.placed';
const EVENT_PAYMENT_CONFIRMED = 'payment.confirmed';
```

### Backend Architecture Standards (NestJS)

```typescript
// ─── SERVICE STRUCTURE ──────────────────────────────────────

// Each service follows this structure:
// src/
// ├── main.ts                    # Bootstrap
// ├── app.module.ts              # Root module
// ├── controllers/               # HTTP/gRPC controllers
// │   └── order.controller.ts
// ├── services/                  # Business logic
// │   └── order.service.ts
// ├── repositories/              # Data access
// │   └── order.repository.ts
// ├── entities/                  # Database entities
// │   └── order.entity.ts
// ├── dto/                       # Data transfer objects
// │   ├── create-order.dto.ts
// │   └── update-order.dto.ts
// ├── events/                    # Domain events
// │   ├── publishers/
// │   └── handlers/
// ├── guards/                    # Auth/permission guards
// ├── interceptors/              # Request/response interceptors
// ├── pipes/                     # Validation pipes
// ├── interfaces/                # TypeScript interfaces
// └── constants/                 # Service constants

// ─── CONTROLLER PATTERN ─────────────────────────────────────

@Controller('orders')
@ApiTags('Orders')
@UseGuards(AuthGuard, TenantGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission({ resource: 'orders', action: 'create' })
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(
    @TenantId() tenantId: string,
    @BranchId() branchId: string,
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.orderService.create(tenantId, branchId, dto, user);
    return { success: true, data: order };
  }
}

// ─── SERVICE PATTERN ────────────────────────────────────────

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly inventoryClient: InventoryClient,
    private readonly logger: LoggerService,
  ) {}

  async create(
    tenantId: string,
    branchId: string,
    dto: CreateOrderDto,
    user: AuthUser,
  ): Promise<Order> {
    // 1. Validate business rules
    await this.validateOrderItems(tenantId, dto.items);

    // 2. Calculate totals
    const totals = this.calculateTotals(dto);

    // 3. Persist
    const order = await this.orderRepo.create({
      tenantId,
      branchId,
      ...dto,
      ...totals,
      createdBy: user.id,
    });

    // 4. Publish domain event
    await this.eventPublisher.publish(new OrderPlacedEvent(order));

    // 5. Log
    this.logger.info('Order created', { orderId: order.id, tenantId });

    return order;
  }
}

// ─── DTO PATTERN (Zod validation) ───────────────────────────

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  type: z.enum(['dine_in', 'takeaway', 'delivery']),
  tableId: z.string().uuid().optional(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().min(1).max(99),
    modifiers: z.array(z.object({
      modifierId: z.string().uuid(),
      quantity: z.number().int().min(1).default(1),
    })).optional(),
    notes: z.string().max(200).optional(),
  })).min(1),
  customerId: z.string().uuid().optional(),
  voucherCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}
```

### Frontend Architecture Standards (Next.js)

```typescript
// ─── COMPONENT PATTERN ──────────────────────────────────────

// Component file structure:
// components/
// └── order-card/
//     ├── order-card.tsx          # Component implementation
//     ├── order-card.stories.tsx  # Storybook stories
//     ├── order-card.test.tsx     # Unit tests
//     └── index.ts               # Public export

// Component implementation
'use client';

import { motion } from 'framer-motion';
import { cn } from '@yummy/utils';
import { Badge } from '@yummy/ui';
import type { Order } from '@yummy/types';

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  className?: string;
}

export function OrderCard({ order, onStatusChange, className }: OrderCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-lg border border-border bg-surface-primary p-4',
        'shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Component content */}
    </motion.div>
  );
}

// ─── HOOK PATTERN ───────────────────────────────────────────

// Custom hooks for data fetching (TanStack Query)
export function useOrders(branchId: string, filters?: OrderFilters) {
  return useQuery({
    queryKey: ['orders', branchId, filters],
    queryFn: () => api.orders.list(branchId, filters),
    staleTime: 30_000, // 30 seconds
    refetchInterval: 10_000, // Real-time polling
  });
}

// Custom hooks for mutations
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.orders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// ─── STORE PATTERN (Zustand) ────────────────────────────────

interface CartStore {
  items: CartItem[];
  addItem: (item: MenuItem, quantity: number, modifiers?: Modifier[]) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
  total: number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item, quantity, modifiers) => {
    set((state) => ({
      items: [...state.items, { ...item, quantity, modifiers, id: nanoid() }],
    }));
  },
  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }));
  },
  updateQuantity: (itemId, quantity) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      ),
    }));
  },
  clear: () => set({ items: [] }),
  get total() {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
```

## Shared Component Strategy

### Design System (@yummy/ui)

Built on shadcn/ui with custom extensions:
- All components support dark/light themes via CSS variables
- All components are accessible (WCAG 2.1 AA)
- All interactive components have Framer Motion animations
- Components are tree-shakeable
- Storybook documentation for all components

### Component Categories

| Category | Examples | Notes |
|----------|----------|-------|
| Primitives | Button, Input, Badge, Avatar | Base building blocks |
| Layout | Sidebar, Header, Card, Grid | Structural components |
| Data Display | Table, Chart, Stat, Timeline | Data visualization |
| Feedback | Toast, Alert, Skeleton, Progress | User feedback |
| Overlay | Modal, Drawer, Popover, Tooltip | Floating elements |
| Navigation | Tabs, Breadcrumb, Pagination | Navigation patterns |
| Forms | Select, DatePicker, FileUpload | Form controls |
| POS-specific | ProductGrid, CartPanel, ReceiptPreview | Domain components |

## Git Workflow

### Branch Strategy: Trunk-Based Development

```
main (production)
  │
  ├── feature/YUM-123-add-qr-ordering
  ├── feature/YUM-456-inventory-alerts
  ├── fix/YUM-789-payment-timeout
  └── chore/YUM-012-update-dependencies
```

### Commit Convention (Conventional Commits)

```
feat(order-service): add split payment support
fix(pos): resolve offline sync race condition
perf(menu-service): add Redis caching for menu queries
docs(api): update order API documentation
refactor(auth): extract permission evaluation logic
test(payment): add integration tests for refund flow
chore(deps): update NestJS to v10.3
ci(pipeline): add container vulnerability scanning
```

### PR Requirements
- Linked to issue/ticket
- Passing CI (lint, typecheck, tests, security scan)
- Code review by 1+ team member
- No decrease in test coverage
- Updated documentation (if API changes)
- Changelog entry (for user-facing changes)

## Error Handling Standards

```typescript
// Backend: Custom exception hierarchy
export class DomainException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export class OrderNotFoundException extends DomainException {
  constructor(orderId: string) {
    super('ORDER_NOT_FOUND', `Order ${orderId} not found`, 404);
  }
}

export class InsufficientStockException extends DomainException {
  constructor(itemId: string, available: number, requested: number) {
    super(
      'INSUFFICIENT_STOCK',
      `Insufficient stock for item ${itemId}`,
      422,
      { itemId, available, requested },
    );
  }
}

// Frontend: Error boundary + toast
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error) => {
        logger.error('Unhandled error', { error });
        toast.error('Something went wrong. Please try again.');
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

## Testing Standards

| Type | Coverage Target | Tools | Scope |
|------|----------------|-------|-------|
| Unit | 80%+ | Vitest, Jest | Functions, services, components |
| Integration | Key flows | Supertest, TestContainers | API endpoints, DB queries |
| E2E | Critical paths | Playwright | User journeys |
| Performance | SLO targets | k6, Artillery | Load, stress, soak |
| Security | All endpoints | OWASP ZAP, Semgrep | Vulnerability scanning |

## Documentation Standards

- **API**: OpenAPI 3.1 specs (auto-generated from NestJS decorators)
- **Architecture**: ADRs (Architecture Decision Records) for significant decisions
- **Runbooks**: Step-by-step incident response for each alert
- **Code**: JSDoc for public APIs, inline comments for complex logic
- **User**: In-app help, knowledge base, video tutorials
