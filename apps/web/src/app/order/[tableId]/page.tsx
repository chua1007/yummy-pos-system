'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, X, Check, Send } from 'lucide-react';

interface MenuItem {
  id: string; name: string; description: string | null; price: number; image: string; image_url: string | null; category_id: string; is_available: number;
}

interface Category {
  id: string; name: string; emoji: string;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
  notes: string;
}

export default function CustomerOrderPage({ params }: { params: { tableId: string } }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [taxRate, setTaxRate] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableTenantId, setTableTenantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);

  useEffect(() => {
    // Fetch tax rates
    fetch('/api/tax-rates').then((r) => r.json()).then((d) => { setTaxRate(d.total_tax_rate); }).catch(() => {});
    // Fetch table info + restaurant details
    fetch(`/api/tables/${params.tableId}/info`).then((r) => r.json()).then((data) => {
      if (data.table_number) setTableName(data.table_number);
      if (data.tenant_id) setTableTenantId(data.tenant_id);
      if (data.restaurant_name) setRestaurantName(data.restaurant_name);
      if (data.restaurant_logo) setRestaurantLogo(data.restaurant_logo);
      // Fetch menu for this tenant
      const menuUrl = data.tenant_id ? `/api/menu?tenant_id=${data.tenant_id}` : '/api/menu';
      fetch(menuUrl).then((r) => r.json()).then((menuData) => {
        setCategories(menuData.categories);
        setItems(menuData.items.filter((i: MenuItem) => i.is_available));
        setLoading(false);
      });
    }).catch(() => {
      fetch('/api/menu').then((r) => r.json()).then((data) => {
        setCategories(data.categories);
        setItems(data.items.filter((i: MenuItem) => i.is_available));
        setLoading(false);
      });
    });
  }, [params.tableId]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((c) => {
        if (c.item.id !== itemId) return c;
        const newQty = c.quantity + delta;
        return newQty <= 0 ? c : { ...c, quantity: newQty };
      }).filter((c) => c.quantity > 0);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const filteredItems = activeCategory === 'all' ? items : items.filter((i) => i.category_id === activeCategory);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'dine_in',
        table_number: tableName,
        customer_name: customerName || 'QR Customer',
        tenant_id: tableTenantId,
        items: cart.map((c) => ({ menu_item_id: c.item.id, quantity: c.quantity, notes: c.notes })),
      }),
    });

    const order = await res.json();
    setOrderNumber(order.order_number);
    setOrderPlaced(true);
    setSubmitting(false);
    setCart([]);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-white p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Placed!</h1>
          <p className="mt-2 text-gray-600">Your order <span className="font-semibold text-orange-600">{orderNumber}</span> has been sent to the kitchen.</p>
          {tableName && <p className="mt-1 text-sm text-gray-500">Table: {tableName}</p>}
          <p className="mt-4 text-sm text-gray-400">Please wait while we prepare your food. Thank you!</p>
          <button onClick={() => { setOrderPlaced(false); setOrderNumber(''); }} className="mt-6 rounded-full bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-600">
            Order More
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {restaurantLogo ? (
                <img src={restaurantLogo} alt={restaurantName} className="h-8 w-8 rounded-lg object-cover" />
              ) : null}
              <div>
                <h1 className="text-lg font-bold text-gray-900">{restaurantName}</h1>
                {tableName && <p className="text-xs text-gray-500">Table {tableName}</p>}
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative rounded-full bg-orange-500 p-2.5 text-white shadow-md"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <motion.span key={cartCount} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          <button onClick={() => setActiveCategory('all')} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${activeCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap ${activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-3">
        {filteredItems.map((item) => {
          const inCart = cart.find((c) => c.item.id === item.id);
          return (
            <motion.div key={item.id} layout className="flex gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100">
              {/* Image */}
              <div className="shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-20 w-20 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-3xl">
                    {item.image}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                {item.description && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{item.description}</p>}
                <p className="mt-1 text-sm font-bold text-orange-600">RM {(item.price / 100).toFixed(2)}</p>
              </div>

              {/* Add button */}
              <div className="flex items-end">
                {inCart ? (
                  <div className="flex items-center gap-2 rounded-full bg-orange-50 px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="rounded-full bg-orange-100 p-1"><Minus className="h-3 w-3 text-orange-600" /></button>
                    <span className="text-sm font-bold text-orange-600 w-4 text-center">{inCart.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="rounded-full bg-orange-500 p-1"><Plus className="h-3 w-3 text-white" /></button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item)} className="rounded-full bg-orange-500 p-2 text-white shadow-sm active:scale-95 transition-transform">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && !showCart && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-white via-white">
          <button onClick={() => setShowCart(true)} className="w-full flex items-center justify-between rounded-xl bg-orange-500 px-5 py-4 text-white shadow-lg active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">{cartCount} items</span>
            </div>
            <span className="text-lg font-bold">RM {(cartTotal / 100).toFixed(2)}</span>
          </button>
        </motion.div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCart(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl bg-white overflow-hidden flex flex-col">
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
                <button onClick={() => setShowCart(false)} className="rounded-full bg-gray-100 p-1.5"><X className="h-4 w-4" /></button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Your cart is empty</p>
                ) : (
                  cart.map((c) => (
                    <div key={c.item.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{c.item.name}</p>
                        <p className="text-xs text-gray-500">RM {(c.item.price / 100).toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(c.item.id, -1)} className="rounded-full bg-gray-200 p-1"><Minus className="h-3 w-3" /></button>
                        <span className="text-sm font-bold w-4 text-center">{c.quantity}</span>
                        <button onClick={() => updateQuantity(c.item.id, 1)} className="rounded-full bg-orange-500 p-1 text-white"><Plus className="h-3 w-3" /></button>
                      </div>
                      <p className="text-sm font-bold text-gray-900 w-16 text-right">RM {((c.item.price * c.quantity) / 100).toFixed(2)}</p>
                      <button onClick={() => removeFromCart(c.item.id)} className="text-gray-300 hover:text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                  ))
                )}

                {cart.length > 0 && (
                  <div className="pt-3">
                    <label className="text-sm font-medium text-gray-700">Your Name (optional)</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your name" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500">Subtotal</span>
                    <span className="text-sm text-gray-700">RM {(cartTotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Tax ({taxRate}%)</span>
                    <span className="text-sm text-gray-700">RM {(cartTotal * taxRate / 100 / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-orange-600">RM {((cartTotal * (1 + taxRate / 100)) / 100).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={placeOrder}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-base font-semibold text-white shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
