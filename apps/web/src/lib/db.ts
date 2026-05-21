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
    initAuth();
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

  // Tenant isolation - add tenant_id to all tables
  try { db.exec('ALTER TABLE menu_categories ADD COLUMN tenant_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE menu_items ADD COLUMN tenant_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE tables ADD COLUMN tenant_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE orders ADD COLUMN tenant_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE inventory ADD COLUMN tenant_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE customers ADD COLUMN tenant_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE notifications ADD COLUMN tenant_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE reservations ADD COLUMN tenant_id TEXT'); } catch {}

  // Invoice & Cashier tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      order_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      customer_name TEXT,
      table_number TEXT,
      subtotal INTEGER NOT NULL DEFAULT 0,
      tax_amount INTEGER NOT NULL DEFAULT 0,
      discount_amount INTEGER DEFAULT 0,
      rounding INTEGER DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      cashier_name TEXT,
      cashier_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `);

  // Remove UNIQUE constraint on table_number (now unique per tenant)
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_tables_tenant ON tables(tenant_id, table_number)"); } catch {}
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id, created_at)"); } catch {}
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_menu_tenant ON menu_items(tenant_id)"); } catch {}

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

function initAuth() {
  const bcrypt = require('bcryptjs');
  const { v4: uuid } = require('uuid');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id TEXT,
      plan TEXT DEFAULT 'starter',
      status TEXT DEFAULT 'active',
      logo_url TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      currency TEXT DEFAULT 'MYR',
      tax_rate REAL DEFAULT 6.0,
      timezone TEXT DEFAULT 'Asia/Kuala_Lumpur',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      tenant_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT
    );
  `);

  // Create or update super admin
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'super_admin'").get() as any;
  if (!adminExists) {
    const adminId = uuid();
    const hash = bcrypt.hashSync('admin', 10);
    db.prepare(`INSERT INTO users (id, email, password_hash, name, role, tenant_id) VALUES (?, ?, ?, ?, 'super_admin', NULL)`).run(adminId, 'admin@admin.com', hash, 'Super Admin');
  } else {
    const hash = bcrypt.hashSync('admin', 10);
    db.prepare("UPDATE users SET email = ?, password_hash = ? WHERE role = 'super_admin'").run('admin@admin.com', hash);
  }

  // Create test restaurant 1: user1@email.com / 1111
  const user1Exists = db.prepare("SELECT id FROM users WHERE email = 'user1@email.com'").get();
  if (!user1Exists) {
    const tenant1Id = 'tenant-001';
    const user1Id = 'user-001';
    const hash1 = bcrypt.hashSync('1111', 10);

    try { db.prepare(`INSERT INTO tenants (id, name, slug, owner_id, plan, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(tenant1Id, 'Warung Makan Ali', 'warung-makan-ali', user1Id, 'growth', 'user1@email.com', '+60 12-111 1111', '123 Jalan Ampang, KL'); } catch {}
    try { db.prepare(`INSERT INTO users (id, email, password_hash, name, role, tenant_id) VALUES (?, ?, ?, ?, 'restaurant_owner', ?)`).run(user1Id, 'user1@email.com', hash1, 'Ali Ahmad', tenant1Id); } catch {}

    // Sample menu for tenant 1
    const cats1 = [
      ['t1-cat-1', 'Nasi', '🍚', 1, tenant1Id],
      ['t1-cat-2', 'Mee', '🍜', 2, tenant1Id],
      ['t1-cat-3', 'Minuman', '🥤', 3, tenant1Id],
    ];
    const items1 = [
      ['t1-item-1', 't1-cat-1', 'Nasi Lemak Ayam', 'Coconut rice with fried chicken', 1200, '🍛', tenant1Id],
      ['t1-item-2', 't1-cat-1', 'Nasi Goreng Special', 'Fried rice with egg and prawns', 1000, '🍚', tenant1Id],
      ['t1-item-3', 't1-cat-2', 'Mee Goreng', 'Fried noodles with vegetables', 900, '🍝', tenant1Id],
      ['t1-item-4', 't1-cat-2', 'Laksa Utara', 'Northern style spicy noodle soup', 1100, '🍲', tenant1Id],
      ['t1-item-5', 't1-cat-3', 'Teh Tarik', 'Pulled milk tea', 350, '🍵', tenant1Id],
      ['t1-item-6', 't1-cat-3', 'Air Sirap', 'Rose syrup drink', 300, '🥤', tenant1Id],
    ];
    const tables1 = [
      ['t1-tbl-1', 'A-01', 2, 'Indoor', 'available', tenant1Id],
      ['t1-tbl-2', 'A-02', 4, 'Indoor', 'available', tenant1Id],
      ['t1-tbl-3', 'A-03', 4, 'Indoor', 'available', tenant1Id],
      ['t1-tbl-4', 'A-04', 6, 'Outdoor', 'available', tenant1Id],
      ['t1-tbl-5', 'A-05', 2, 'Outdoor', 'available', tenant1Id],
    ];

    for (const c of cats1) db.prepare('INSERT OR IGNORE INTO menu_categories (id, name, emoji, sort_order, tenant_id) VALUES (?,?,?,?,?)').run(...c);
    for (const i of items1) db.prepare('INSERT OR IGNORE INTO menu_items (id, category_id, name, description, price, image, tenant_id) VALUES (?,?,?,?,?,?,?)').run(...i);
    for (const t of tables1) db.prepare('INSERT OR IGNORE INTO tables (id, table_number, capacity, zone, status, tenant_id) VALUES (?,?,?,?,?,?)').run(...t);
  }

  // Create test restaurant 2: user2@email.com / 2222
  const user2Exists = db.prepare("SELECT id FROM users WHERE email = 'user2@email.com'").get();
  if (!user2Exists) {
    const tenant2Id = 'tenant-002';
    const user2Id = 'user-002';
    const hash2 = bcrypt.hashSync('2222', 10);

    try { db.prepare(`INSERT INTO tenants (id, name, slug, owner_id, plan, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(tenant2Id, 'Restoran Seri Melaka', 'restoran-seri-melaka', user2Id, 'enterprise', 'user2@email.com', '+60 13-222 2222', '456 Jalan Melaka, Melaka'); } catch {}
    try { db.prepare(`INSERT INTO users (id, email, password_hash, name, role, tenant_id) VALUES (?, ?, ?, ?, 'restaurant_owner', ?)`).run(user2Id, 'user2@email.com', hash2, 'Siti Nurhaliza', tenant2Id); } catch {}

    // Sample menu for tenant 2
    const cats2 = [
      ['t2-cat-1', 'Main Course', '🍽️', 1, tenant2Id],
      ['t2-cat-2', 'Appetizers', '🍢', 2, tenant2Id],
      ['t2-cat-3', 'Beverages', '☕', 3, tenant2Id],
    ];
    const items2 = [
      ['t2-item-1', 't2-cat-1', 'Ayam Penyet', 'Smashed fried chicken with sambal', 1500, '🍗', tenant2Id],
      ['t2-item-2', 't2-cat-1', 'Rendang Tok', 'Traditional dry rendang', 1800, '🥘', tenant2Id],
      ['t2-item-3', 't2-cat-1', 'Ikan Bakar', 'Grilled fish with special sauce', 2000, '🐟', tenant2Id],
      ['t2-item-4', 't2-cat-2', 'Satay Celup', 'Dip-your-own satay', 1600, '🍢', tenant2Id],
      ['t2-item-5', 't2-cat-2', 'Otak-Otak', 'Grilled fish cake', 500, '🫓', tenant2Id],
      ['t2-item-6', 't2-cat-3', 'Kopi Melaka', 'Traditional Melaka coffee', 400, '☕', tenant2Id],
      ['t2-item-7', 't2-cat-3', 'Cendol Gula Melaka', 'Shaved ice with palm sugar', 700, '🍧', tenant2Id],
    ];
    const tables2 = [
      ['t2-tbl-1', 'M-01', 2, 'Ground Floor', 'available', tenant2Id],
      ['t2-tbl-2', 'M-02', 4, 'Ground Floor', 'available', tenant2Id],
      ['t2-tbl-3', 'M-03', 6, 'Ground Floor', 'available', tenant2Id],
      ['t2-tbl-4', 'M-04', 4, 'Upstairs', 'available', tenant2Id],
      ['t2-tbl-5', 'M-05', 8, 'Upstairs', 'available', tenant2Id],
      ['t2-tbl-6', 'M-06', 10, 'VIP Room', 'available', tenant2Id],
    ];

    for (const c of cats2) db.prepare('INSERT OR IGNORE INTO menu_categories (id, name, emoji, sort_order, tenant_id) VALUES (?,?,?,?,?)').run(...c);
    for (const i of items2) db.prepare('INSERT OR IGNORE INTO menu_items (id, category_id, name, description, price, image, tenant_id) VALUES (?,?,?,?,?,?,?)').run(...i);
    for (const t of tables2) db.prepare('INSERT OR IGNORE INTO tables (id, table_number, capacity, zone, status, tenant_id) VALUES (?,?,?,?,?,?)').run(...t);
  }
}
