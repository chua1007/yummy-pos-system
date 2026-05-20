# Offline POS Synchronization Architecture

## Offline-First Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OFFLINE POS ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    POS TERMINAL (Client)                              │    │
│  │                                                                       │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                 APPLICATION LAYER                              │   │    │
│  │  │  Next.js PWA + Service Worker                                  │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                              │                                       │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                 LOCAL DATA LAYER                               │   │    │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │   │    │
│  │  │  │ IndexedDB  │  │ Local      │  │ Service    │             │   │    │
│  │  │  │ (Orders,   │  │ Storage    │  │ Worker     │             │   │    │
│  │  │  │  Menu,     │  │ (Config,   │  │ (Cache,    │             │   │    │
│  │  │  │  Cart)     │  │  Auth)     │  │  Assets)   │             │   │    │
│  │  │  └────────────┘  └────────────┘  └────────────┘             │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                              │                                       │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                 SYNC ENGINE                                    │   │    │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │   │    │
│  │  │  │ Outbox     │  │ Conflict   │  │ Retry      │             │   │    │
│  │  │  │ Queue      │  │ Resolution │  │ Manager    │             │   │    │
│  │  │  └────────────┘  └────────────┘  └────────────┘             │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                              │                                       │    │
│  └──────────────────────────────┼───────────────────────────────────────┘    │
│                                 │                                              │
│                    ┌────────────┼────────────┐                                │
│                    │  ONLINE    │   OFFLINE  │                                │
│                    │  (sync)    │   (queue)  │                                │
│                    └────────────┼────────────┘                                │
│                                 │                                              │
│  ┌──────────────────────────────┼───────────────────────────────────────┐    │
│  │                    CLOUD SYNC SERVICE                                  │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │    │
│  │  │ WebSocket  │  │ Sync       │  │ Conflict   │  │ Event      │    │    │
│  │  │ Gateway    │  │ Processor  │  │ Resolver   │  │ Publisher  │    │    │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Sync Strategy

### Data Classification

| Data Type | Sync Direction | Offline Behavior | Priority |
|-----------|---------------|------------------|----------|
| Menu & Prices | Cloud → POS | Cached locally, periodic refresh | High |
| Orders | POS → Cloud | Created offline, synced when online | Critical |
| Payments | POS → Cloud | Processed offline (cash), queued (card) | Critical |
| Inventory | Bidirectional | Optimistic deduction, reconcile on sync | Medium |
| Customer Data | Cloud → POS | Read-only cache | Low |
| Shift Data | POS → Cloud | Created locally, synced | Medium |
| Config/Settings | Cloud → POS | Cached, refresh on reconnect | Low |

### Outbox Pattern Implementation

```typescript
// Offline order creation flow
class OfflinePOSService {
  private db: IndexedDB;
  private syncQueue: SyncQueue;

  async createOrder(order: CreateOrderDto): Promise<Order> {
    // 1. Generate client-side UUID (prevents conflicts)
    const orderId = generateUUID();
    const orderNumber = this.generateOfflineOrderNumber();

    // 2. Save to IndexedDB immediately
    const localOrder = {
      id: orderId,
      ...order,
      orderNumber,
      status: 'pending',
      syncStatus: 'pending', // pending | syncing | synced | failed
      createdAt: new Date().toISOString(),
      clientTimestamp: Date.now(),
    };
    await this.db.orders.put(localOrder);

    // 3. Add to sync outbox queue
    await this.syncQueue.enqueue({
      id: generateUUID(),
      type: 'order.create',
      payload: localOrder,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 10,
    });

    // 4. Attempt immediate sync if online
    if (navigator.onLine) {
      this.syncQueue.flush();
    }

    return localOrder;
  }
}
```

### Conflict Resolution Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              CONFLICT RESOLUTION RULES                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Strategy: Last-Write-Wins + Domain-Specific Rules           │
│                                                               │
│  Orders:                                                     │
│  • Client-generated UUIDs prevent duplicate creation         │
│  • Server timestamp is authoritative for ordering            │
│  • Offline orders get sequential offline numbers             │
│  • Server assigns final order number on sync                 │
│                                                               │
│  Inventory:                                                  │
│  • Optimistic deduction on POS                               │
│  • Server reconciles actual stock on sync                    │
│  • If stock went negative: flag for manager review           │
│  • Never block a sale due to sync lag                        │
│                                                               │
│  Menu/Prices:                                                │
│  • Server is always authoritative                            │
│  • POS uses cached version until next sync                   │
│  • Price at time of sale is honored (no retroactive change)  │
│                                                               │
│  Payments:                                                   │
│  • Cash: recorded locally, synced as-is                      │
│  • Card: queued for processing when online                   │
│  • E-wallet: requires online (graceful degradation)          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Sync Queue Processing

```typescript
class SyncQueue {
  private queue: SyncItem[] = [];
  private processing = false;

  async flush(): Promise<void> {
    if (this.processing || !navigator.onLine) return;
    this.processing = true;

    try {
      const items = await this.db.syncQueue
        .where('syncStatus')
        .equals('pending')
        .sortBy('timestamp');

      for (const item of items) {
        try {
          // Process in order (FIFO)
          await this.processItem(item);
          await this.db.syncQueue.update(item.id, { syncStatus: 'synced' });
        } catch (error) {
          if (item.retryCount >= item.maxRetries) {
            await this.db.syncQueue.update(item.id, { syncStatus: 'failed' });
            this.notifyManager(item); // Alert for manual resolution
          } else {
            await this.db.syncQueue.update(item.id, {
              retryCount: item.retryCount + 1,
              lastError: error.message,
              nextRetryAt: this.calculateBackoff(item.retryCount),
            });
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private calculateBackoff(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s max
    return Math.min(1000 * Math.pow(2, retryCount), 60000);
  }
}
```

## Service Worker Strategy

```typescript
// sw.ts - Service Worker for POS PWA
const CACHE_VERSION = 'yummy-pos-v1';
const STATIC_ASSETS = [
  '/',
  '/pos',
  '/pos/orders',
  '/offline.html',
  // Critical CSS, JS bundles
];

// Cache strategies:
// - Static assets: Cache-first (versioned)
// - API responses: Network-first with cache fallback
// - Menu data: Stale-while-revalidate
// - Images: Cache-first with expiry

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.url.includes('/api/')) {
    // Network-first for API calls
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET responses
          if (request.method === 'GET' && response.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
```

## Connectivity Detection

```typescript
// Real-time connectivity monitoring
class ConnectivityMonitor {
  private status: 'online' | 'offline' | 'degraded' = 'online';
  private listeners: Set<(status: string) => void> = new Set();

  constructor() {
    // Browser events
    window.addEventListener('online', () => this.updateStatus('online'));
    window.addEventListener('offline', () => this.updateStatus('offline'));

    // Active health check (more reliable than browser events)
    setInterval(() => this.healthCheck(), 5000);
  }

  private async healthCheck(): Promise<void> {
    try {
      const start = Date.now();
      const response = await fetch('/api/health/ping', {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      const latency = Date.now() - start;

      if (response.ok && latency < 2000) {
        this.updateStatus('online');
      } else {
        this.updateStatus('degraded');
      }
    } catch {
      this.updateStatus('offline');
    }
  }

  private updateStatus(newStatus: string): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.listeners.forEach((fn) => fn(newStatus));

      // Trigger sync when coming back online
      if (newStatus === 'online') {
        syncQueue.flush();
      }
    }
  }
}
```

## Offline UI Indicators

```typescript
// Visual feedback for offline state
// - Persistent banner: "Operating offline - orders will sync when connected"
// - Sync status icon in header (green/yellow/red)
// - Per-order sync status badge
// - Queue count indicator
// - Last synced timestamp
// - Graceful degradation of features requiring connectivity
```

## Data Storage Limits

| Storage | Capacity | Content |
|---------|----------|---------|
| IndexedDB | ~50MB | Orders, menu, customers, sync queue |
| LocalStorage | ~5MB | Auth tokens, preferences, config |
| Service Worker Cache | ~100MB | Static assets, API responses |
| Total offline capacity | ~155MB | Sufficient for 7 days of operations |
