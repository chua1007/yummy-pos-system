'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Grid3X3 } from 'lucide-react';

// Mock menu data
const categories = [
  { id: '1', name: 'Popular', emoji: '🔥' },
  { id: '2', name: 'Rice', emoji: '🍚' },
  { id: '3', name: 'Noodles', emoji: '🍜' },
  { id: '4', name: 'Drinks', emoji: '🥤' },
  { id: '5', name: 'Desserts', emoji: '🍰' },
];

const menuItems = [
  { id: '1', name: 'Nasi Lemak Special', price: 1500, category: '2', image: '🍛' },
  { id: '2', name: 'Mee Goreng Mamak', price: 1200, category: '3', image: '🍝' },
  { id: '3', name: 'Roti Canai', price: 300, category: '1', image: '🫓' },
  { id: '4', name: 'Teh Tarik', price: 400, category: '4', image: '🍵' },
  { id: '5', name: 'Char Kuey Teow', price: 1400, category: '3', image: '🍜' },
  { id: '6', name: 'Nasi Goreng Kampung', price: 1300, category: '2', image: '🍚' },
  { id: '7', name: 'Iced Milo', price: 500, category: '4', image: '🥤' },
  { id: '8', name: 'Cendol', price: 600, category: '5', image: '🍧' },
  { id: '9', name: 'Satay (10pcs)', price: 1800, category: '1', image: '🍢' },
  { id: '10', name: 'Laksa', price: 1100, category: '3', image: '🍲' },
  { id: '11', name: 'Ayam Penyet', price: 1600, category: '2', image: '🍗' },
  { id: '12', name: 'Kopi O', price: 300, category: '4', image: '☕' },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function POSPage() {
  const [activeCategory, setActiveCategory] = useState('1');
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredItems = activeCategory === '1'
    ? menuItems.slice(0, 8)
    : menuItems.filter((item) => item.category === activeCategory);

  const addToCart = (item: typeof menuItems[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-screen">
      {/* Left: Menu */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border-default))] px-6 py-4">
          <h1 className="text-xl font-bold text-[rgb(var(--color-brand-500))]">🍽️ Yummy POS</h1>
          <div className="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))] px-3 py-2">
            <Search className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
            <input
              type="text"
              placeholder="Search menu..."
              className="w-48 bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 border-b border-[rgb(var(--color-border-default))] px-6 py-3 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[rgb(var(--color-brand-500))] text-white'
                  : 'bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))]'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={() => addToCart(item)}
                  className="flex flex-col items-center rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4 shadow-sm transition-shadow hover:shadow-md active:shadow-sm"
                >
                  <span className="text-4xl">{item.image}</span>
                  <p className="mt-2 text-sm font-medium text-[rgb(var(--color-text-primary))] text-center line-clamp-2">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[rgb(var(--color-brand-500))]">
                    RM {(item.price / 100).toFixed(2)}
                  </p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex w-80 flex-col border-l border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))]">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border-default))] px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[rgb(var(--color-text-primary))]" />
            <span className="font-semibold text-[rgb(var(--color-text-primary))]">Cart</span>
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--color-brand-500))] text-xs text-white"
              >
                {cartCount}
              </motion.span>
            )}
          </div>
          <button className="text-xs text-[rgb(var(--color-text-tertiary))] hover:text-red-500">
            Clear
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="mb-2 flex items-center justify-between rounded-lg bg-[rgb(var(--color-surface-primary))] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[rgb(var(--color-text-tertiary))]">
                    RM {(item.price / 100).toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">
                    RM {((item.price * item.quantity) / 100).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-[rgb(var(--color-text-tertiary))] hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[rgb(var(--color-text-tertiary))]">
              <Grid3X3 className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Tap items to add</p>
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-[rgb(var(--color-border-default))] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-[rgb(var(--color-text-secondary))]">Total</span>
            <motion.span
              key={cartTotal}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-[rgb(var(--color-text-primary))]"
            >
              RM {(cartTotal / 100).toFixed(2)}
            </motion.span>
          </div>
          <button
            disabled={cart.length === 0}
            className="w-full rounded-xl bg-[rgb(var(--color-brand-500))] py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[rgb(var(--color-brand-600))] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}
