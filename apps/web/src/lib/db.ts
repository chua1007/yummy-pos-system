import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'yummy.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '🍽️',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      image TEXT DEFAULT '🍽️',
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      prep_time_mins INTEGER DEFAULT 10,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES menu_categories(id)
    );

    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      table_number TEXT NOT NULL UNIQUE,
      capacity INTEGER NOT NULL DEFAULT 4,
      zone TEXT DEFAULT 'Main',
      status TEXT NOT NULL DEFAULT 'available',
      qr_code_url TEXT,
      current_order_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'dine_in',
      status TEXT NOT NULL DEFAULT 'pending',
      table_id TEXT,
      table_number TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      subtotal INTEGER DEFAULT 0,
      tax_amount INTEGER DEFAULT 0,
      discount_amount INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      menu_item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      min_threshold REAL NOT NULL DEFAULT 0,
      max_capacity REAL NOT NULL DEFAULT 100,
      cost_per_unit REAL DEFAULT 0,
      category TEXT,
      supplier TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      total_spent INTEGER DEFAULT 0,
      visit_count INTEGER DEFAULT 0,
      tier TEXT DEFAULT 'Bronze',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_visit_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      table_id TEXT,
      party_size INTEGER NOT NULL DEFAULT 2,
      reserved_at TEXT NOT NULL,
      duration_mins INTEGER DEFAULT 90,
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );
  `);

  // Add image_url column if not exists (migration)
  try { db.exec('ALTER TABLE menu_items ADD COLUMN image_url TEXT'); } catch {}
  try { db.exec('ALTER TABLE menu_items ADD COLUMN prep_time_mins INTEGER DEFAULT 10'); } catch {}
  try { db.exec('ALTER TABLE orders ADD COLUMN table_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE orders ADD COLUMN customer_phone TEXT'); } catch {}
  try { db.exec('ALTER TABLE orders ADD COLUMN payment_method TEXT'); } catch {}
  try { db.exec('ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT "unpaid"'); } catch {}
  try { db.exec('ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0'); } catch {}

  // Seed data if empty
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM menu_categories').get() as any;
  if (categoryCount.count === 0) {
    seedData();
  }
}

function seedData() {
  const insertCategory = db.prepare('INSERT INTO menu_categories (id, name, emoji, sort_order) VALUES (?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO menu_items (id, category_id, name, description, price, image, prep_time_mins) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertInventory = db.prepare('INSERT INTO inventory (id, name, unit, quantity, min_threshold, max_capacity, category) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertTable = db.prepare('INSERT INTO tables (id, table_number, capacity, zone, status) VALUES (?, ?, ?, ?, ?)');
  const insertNotification = db.prepare('INSERT INTO notifications (id, type, title, message, link) VALUES (?, ?, ?, ?, ?)');

  const categories = [
    ['cat-1', 'Rice', '🍚', 1],
    ['cat-2', 'Noodles', '🍜', 2],
    ['cat-3', 'Drinks', '🥤', 3],
    ['cat-4', 'Appetizers', '🍢', 4],
    ['cat-5', 'Desserts', '🍰', 5],
    ['cat-6', 'Western', '🍔', 6],
  ];

  const items = [
    ['item-1', 'cat-1', 'Nasi Lemak Special', 'Fragrant coconut rice with sambal, anchovies, peanuts, egg, and rendang', 1500, '🍛', 12],
    ['item-2', 'cat-2', 'Mee Goreng Mamak', 'Spicy stir-fried yellow noodles with egg, tofu, and vegetables', 1200, '🍝', 10],
    ['item-3', 'cat-4', 'Roti Canai', 'Flaky flatbread served with dhal and curry', 300, '🫓', 5],
    ['item-4', 'cat-3', 'Teh Tarik', 'Pulled milk tea, hot and frothy', 400, '🍵', 3],
    ['item-5', 'cat-2', 'Char Kuey Teow', 'Stir-fried flat rice noodles with prawns and cockles', 1400, '🍜', 12],
    ['item-6', 'cat-1', 'Nasi Goreng Kampung', 'Village-style fried rice with anchovies and chili', 1300, '🍚', 10],
    ['item-7', 'cat-3', 'Iced Milo', 'Chocolate malt drink served cold', 500, '🥤', 3],
    ['item-8', 'cat-5', 'Cendol', 'Shaved ice with pandan jelly, coconut milk, and gula melaka', 600, '🍧', 5],
    ['item-9', 'cat-4', 'Satay (10pcs)', 'Grilled chicken skewers with peanut sauce', 1800, '🍢', 15],
    ['item-10', 'cat-2', 'Laksa', 'Spicy coconut curry noodle soup', 1100, '🍲', 10],
    ['item-11', 'cat-1', 'Ayam Penyet', 'Smashed fried chicken with sambal and rice', 1600, '🍗', 12],
    ['item-12', 'cat-3', 'Kopi O', 'Traditional black coffee', 300, '☕', 3],
    ['item-13', 'cat-6', 'Chicken Chop', 'Grilled chicken with black pepper sauce and fries', 1800, '🍗', 15],
    ['item-14', 'cat-6', 'Fish & Chips', 'Battered fish fillet with tartar sauce', 2000, '🐟', 15],
    ['item-15', 'cat-5', 'Pisang Goreng', 'Fried banana fritters', 400, '🍌', 8],
  ];

  const tables = [
    ['tbl-1', 'T-01', 2, 'Window', 'available'],
    ['tbl-2', 'T-02', 4, 'Main', 'available'],
    ['tbl-3', 'T-03', 4, 'Main', 'available'],
    ['tbl-4', 'T-04', 6, 'Main', 'available'],
    ['tbl-5', 'T-05', 2, 'Window', 'available'],
    ['tbl-6', 'T-06', 8, 'Private', 'available'],
    ['tbl-7', 'T-07', 4, 'Outdoor', 'available'],
    ['tbl-8', 'T-08', 4, 'Outdoor', 'available'],
    ['tbl-9', 'T-09', 6, 'Main', 'available'],
    ['tbl-10', 'T-10', 10, 'Private', 'available'],
  ];

  const notifications = [
    ['notif-1', 'order', 'New Order', 'Order ORD-0001 received from Table T-05', '/dashboard/orders'],
    ['notif-2', 'inventory', 'Low Stock Alert', 'Cooking Oil is below minimum threshold', '/dashboard/inventory'],
    ['notif-3', 'reservation', 'New Reservation', 'Reservation for 4 pax at 7:00 PM tonight', '/dashboard/tables'],
  ];

  const seedTransaction = db.transaction(() => {
    for (const c of categories) insertCategory.run(...c);
    for (const i of items) insertItem.run(...i);
    for (const inv of [
      ['inv-1', 'Rice (Jasmine)', 'kg', 45, 20, 100, 'Staples'],
      ['inv-2', 'Cooking Oil', 'litre', 8, 10, 50, 'Staples'],
      ['inv-3', 'Chicken Breast', 'kg', 12, 5, 30, 'Protein'],
      ['inv-4', 'Eggs', 'pcs', 30, 30, 200, 'Protein'],
      ['inv-5', 'Coconut Milk', 'litre', 15, 10, 40, 'Dairy'],
      ['inv-6', 'Sambal Paste', 'kg', 4, 5, 20, 'Condiments'],
      ['inv-7', 'Noodles (Yellow)', 'kg', 22, 10, 50, 'Staples'],
      ['inv-8', 'Bean Sprouts', 'kg', 6, 3, 15, 'Vegetables'],
      ['inv-9', 'Condensed Milk', 'can', 18, 12, 60, 'Dairy'],
      ['inv-10', 'Sugar', 'kg', 9, 10, 50, 'Staples'],
    ]) insertInventory.run(...inv);
    for (const t of tables) insertTable.run(...t);
    for (const n of notifications) insertNotification.run(...n);
  });

  seedTransaction();
}

export default getDb;
