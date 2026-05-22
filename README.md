# 🍽️ Yummy POS - Cloud-Native Restaurant Management System

A production-grade, multi-tenant SaaS restaurant management platform built with Next.js. Designed for restaurants, cafes, and food chains across Southeast Asia.

## 🌐 Live Demo

**URL:** http://56.69.41.130

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@admin.com | admin |
| Restaurant 1 (Warung Makan Ali) | user1@email.com | 1111 |
| Restaurant 2 (Restoran Seri Melaka) | user2@email.com | 2222 |

---

## ✨ Features

### 🔐 Multi-Tenant Authentication
- Super Admin panel to create and manage restaurant accounts
- Each restaurant gets isolated data (menu, orders, tables, inventory, customers)
- JWT-based session authentication with httpOnly cookies
- Role-based access: Super Admin, Restaurant Owner, Manager, Cashier, Staff

### 📋 Menu Management
- Add/edit/delete menu items with categories
- **Image upload** (JPG, PNG, WebP) for food photos
- Toggle item availability
- Category management with emoji icons
- Price management in MYR (cents-based for precision)

### 🛒 Order Management
- Create orders (dine-in, takeaway, delivery)
- Real-time order status flow: Pending → Confirmed → Preparing → Ready → Completed
- Cancel orders
- **Remove individual items** from an order
- Order history with date filtering, search, and CSV export

### 💳 Cashier & Payment System
- **Cashier switching** with 4-digit passcode (no login required for cashiers)
- Must select active cashier before processing payment
- Payment methods: Cash, Card, Touch n Go, GrabPay, Boost, DuitNow QR
- Payment method recorded on every invoice

### 🧾 Invoice & Receipt System
- Malaysian-format receipts with SST registration number
- **SST and Service Tax shown separately** on all invoices
- Rounding to nearest 5 sen (Malaysian standard)
- Cashier name recorded on every receipt
- Print receipts directly from browser
- Invoice history with search, date filter, payment method filter
- Export invoices to CSV
- Reprint any past receipt

### 🪑 Table & QR Management
- Visual table layout organized by zone (Indoor, Outdoor, Private, etc.)
- Table flow: Available → Seat Guest (activates QR) → Occupied → Clear Table → Cleaning → Ready
- **QR code generation** for each table — customers scan to order
- Download QR codes as PNG for printing
- QR only active when table is occupied

### 📱 Customer QR Ordering
- Mobile-optimized ordering page (no app download needed)
- Shows **restaurant name and logo** from settings
- Browse menu by category with food photos
- Add/remove items with quantity controls
- **SST and Service Tax displayed separately**
- Place order → success screen with order number
- Orders appear in real-time on the dashboard

### 📦 Inventory Management
- Track stock levels with min/max thresholds
- **Set threshold** per item (visual preview with threshold line)
- Low stock and critical alerts
- Adjust stock (+10 / -1 buttons)
- Add/delete inventory items

### 👥 CRM & Loyalty
- Customer profiles with contact info
- Loyalty tiers: Bronze → Silver → Gold → Platinum
- Customer order history and spending analytics
- Filter by tier, search by name/email/phone
- Customer detail drawer with full profile

### 👨‍💼 Staff Management
- Add cashiers with **name + 4-digit passcode + position**
- Positions: Cashier, Senior Cashier, Shift Lead, Manager
- Toggle active/inactive
- No email/login needed for cashiers — just passcode to switch

### 📊 Analytics (Real Data)
- Revenue, orders, customers pulled from actual database
- Orders by hour chart (today's activity)
- Top selling items (this month)
- Comparison vs last month (% change)
- All scoped by tenant

### ⚙️ Settings
- **Restaurant Profile**: name, email, phone, address, operating hours, logo upload
- **Tax Configuration**: SST rate (%) + Service Tax rate (%) — applied system-wide
- **Appearance**: Light/Dark/System theme, brand color picker
- **Notifications**: Toggle email, push, SMS, low stock alerts, new order alerts
- **Localization**: Language (EN, MS, ZH-CN, ZH-TW, TH, ID), currency, timezone

### 🌍 Multi-Language
- English, Bahasa Melayu, 简体中文, 繁體中文, ภาษาไทย, Bahasa Indonesia
- Sidebar navigation translates instantly on language change
- Language preference persists

### 🌙 Dark Mode
- Full dark/light/system theme support
- Logo switches between light and dark variants
- All UI elements properly themed

### 👤 User Profile
- Clickable avatar (top-right) with dropdown: Profile, Settings, Logout
- Edit name, email, password
- Edit restaurant name, phone, address
- Changes reflect immediately in sidebar and header

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Animations | Framer Motion |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| QR Codes | qrcode library |
| Image Upload | File system + API route serving |
| Deployment | Ubuntu EC2 instance |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm

### Install & Run

```bash
# Install dependencies
pnpm install

# Start development server (port 3000)
pnpm --filter @yummy/web dev

# Build for production
pnpm --filter @yummy/web build

# Start production server
pnpm --filter @yummy/web start
```

### Deploy to Server

```bash
# On Ubuntu server:
git clone https://github.com/chua1007/yummy-pos-system.git
cd yummy-pos-system
npm install -g pnpm
pnpm install
cd apps/web
NODE_OPTIONS='--max-old-space-size=512' npx next build
sudo nohup npx next start -p 80 > /tmp/yummy.log 2>&1 &
```

---

## 📁 Project Structure

```
yummy-pos-system/
├── apps/
│   ├── web/                    # Main Next.js application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (dashboard)/  # Protected dashboard pages
│   │   │   │   ├── admin/        # Super admin panel
│   │   │   │   ├── login/        # Login page
│   │   │   │   ├── order/        # Customer QR ordering (public)
│   │   │   │   └── api/          # API routes
│   │   │   ├── components/       # Shared components
│   │   │   └── lib/              # Database, auth, i18n, tenant
│   │   └── uploads/              # Uploaded images
│   ├── pos/                    # POS terminal app (standalone)
│   └── services/               # Backend microservices (NestJS)
├── packages/
│   ├── ui/                     # Shared design system
│   └── shared-types/           # TypeScript types
├── infrastructure/
│   ├── docker/                 # Docker compose for local dev
│   └── terraform/              # AWS infrastructure
└── docs/                       # Architecture documentation
```

---

## 🔒 Security

- JWT tokens in httpOnly cookies (not accessible via JavaScript)
- Password hashing with bcryptjs
- Tenant data isolation at database query level
- File upload validation (type + size limits)
- Path traversal prevention on file serving

---

## 📄 License

Proprietary - All rights reserved.
