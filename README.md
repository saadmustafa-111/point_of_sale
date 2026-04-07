# POS System — Home Appliances Shop

A professional desktop Point-of-Sale system built with **Electron + React + NestJS + Prisma + PostgreSQL**.

---

## Architecture

```
Admin PC
 ├── Electron App  (Admin Role UI  — localhost:5173 → dist/)
 ├── NestJS API    (http://0.0.0.0:3000  — accessible over LAN)
 └── PostgreSQL    (localhost:5432)

Cashier PC 1 / Cashier PC 2
 └── Electron App  (Cashier Role UI — connects to Admin PC IP:3000)
```

---

## Folder Structure

```
pos/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Context bridge — exposes safe IPC to renderer
├── apps/
│   ├── backend/         # NestJS application
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── prisma/          # PrismaService (global)
│   │   │   ├── auth/            # JWT auth, login, strategy
│   │   │   ├── users/           # CRUD — Admin only
│   │   │   ├── products/        # CRUD + barcode/search
│   │   │   ├── categories/      # CRUD
│   │   │   ├── brands/          # CRUD
│   │   │   ├── customers/       # CRUD
│   │   │   ├── sales/           # Create sale (with stock deduction in transaction)
│   │   │   ├── inventory/       # Stock-in / Stock-out / Adjustment
│   │   │   ├── reports/         # Daily, monthly, top products, cashier-wise
│   │   │   ├── settings/        # Key-value shop settings
│   │   │   └── common/
│   │   │       ├── guards/      # JwtAuthGuard, RolesGuard
│   │   │       └── decorators/  # @Roles()
│   │   └── prisma/
│   │       ├── schema.prisma    # Full DB schema
│   │       └── seed.ts          # Default admin + cashier + categories + brands
│   └── renderer/        # React + Vite application
│       ├── src/
│       │   ├── main.tsx         # React entry + QueryClientProvider
│       │   ├── App.tsx          # Router + PrivateRoute
│       │   ├── index.css        # Tailwind base + component classes
│       │   ├── store/
│       │   │   └── authStore.ts # Zustand auth state (persisted)
│       │   ├── services/
│       │   │   ├── api.ts       # Axios instance + JWT interceptor
│       │   │   └── index.ts     # All service functions
│       │   ├── layouts/
│       │   │   └── DashboardLayout.tsx  # Sidebar nav
│       │   └── pages/
│       │       ├── LoginPage.tsx
│       │       ├── admin/
│       │       │   ├── DashboardPage.tsx
│       │       │   ├── ProductsPage.tsx
│       │       │   ├── CategoriesPage.tsx
│       │       │   ├── BrandsPage.tsx
│       │       │   ├── InventoryPage.tsx
│       │       │   ├── UsersPage.tsx
│       │       │   ├── SalesAdminPage.tsx
│       │       │   ├── ReportsPage.tsx
│       │       │   └── SettingsPage.tsx
│       │       └── cashier/
│       │           ├── POSPage.tsx      # Full POS terminal
│       │           ├── MySalesPage.tsx
│       │           └── CustomersPage.tsx
└── package.json   # Root — Electron + concurrently scripts
```

---

## Database Schema (Prisma)

| Model        | Key Fields |
|---|---|
| `User`        | id, username, password (bcrypt), fullName, role (ADMIN/CASHIER), isActive |
| `Category`    | id, name (unique), description |
| `Brand`       | id, name (unique), description |
| `Product`     | id, name, sku (unique), barcode, categoryId, brandId, purchasePrice, salePrice, stock, lowStockLimit, warrantyMonths, imageUrl, isActive |
| `Customer`    | id, name, phone, email, address |
| `Sale`        | id, invoiceNumber, cashierId, customerId?, subtotal, discount, total, paymentMethod, notes |
| `SaleItem`    | id, saleId, productId, quantity, unitPrice, discount, total |
| `InventoryLog`| id, productId, type (STOCK_IN/OUT/ADJUSTMENT), quantity, reason, performedById |
| `Setting`     | id, key (unique), value |

---

## API Routes

| Method | Endpoint | Auth | Access |
|---|---|---|---|
| POST | `/api/v1/auth/login` | — | Public |
| GET  | `/api/v1/auth/profile` | JWT | Any authenticated |
| GET/POST/PUT/DELETE | `/api/v1/users` | JWT | Admin only |
| GET/POST/PUT/DELETE | `/api/v1/categories` | JWT | GET: all, mutate: Admin |
| GET/POST/PUT/DELETE | `/api/v1/brands` | JWT | GET: all, mutate: Admin |
| GET/POST/PUT/DELETE | `/api/v1/products` | JWT | GET: all, mutate: Admin |
| GET | `/api/v1/products/low-stock` | JWT | Any |
| GET | `/api/v1/products/barcode/:code` | JWT | Any |
| GET/POST | `/api/v1/customers` | JWT | Any |
| GET/POST | `/api/v1/sales` | JWT | GET: role-filtered, POST: any |
| GET/POST | `/api/v1/inventory` | JWT | Admin only |
| GET | `/api/v1/reports/daily` | JWT | Admin only |
| GET | `/api/v1/reports/monthly` | JWT | Admin only |
| GET | `/api/v1/reports/top-products` | JWT | Admin only |
| GET | `/api/v1/reports/low-stock` | JWT | Admin only |
| GET | `/api/v1/reports/cashier-sales` | JWT | Admin only |
| GET/PUT | `/api/v1/settings` | JWT | Admin only |

Swagger UI: `http://localhost:3000/api/docs`

---

## React Pages

| Route | Role | Page |
|---|---|---|
| `/login` | Public | LoginPage |
| `/dashboard` | Admin | Dashboard (stats, low-stock, top products) |
| `/products` | Admin | Products CRUD + search |
| `/categories` | Admin | Categories CRUD |
| `/brands` | Admin | Brands CRUD |
| `/inventory` | Admin | Stock movements log + add movement |
| `/users` | Admin | Users/Cashiers CRUD |
| `/sales` | Admin | All sales table |
| `/reports` | Admin | Daily/Monthly/Top Products/Cashier-wise charts |
| `/settings` | Admin | Shop settings form |
| `/pos` | Cashier | Full POS terminal + barcode scan |
| `/my-sales` | Cashier | Own sales history |
| `/customers` | Cashier | Customer list + add customer |

---

## Step-by-Step Implementation Order

### Phase 1 — Environment Setup
```bash
# Install PostgreSQL and create database
createdb pos_db

# Install root dependencies
npm install

# Setup backend
cd apps/backend
cp .env.example .env       # edit DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts

# Setup renderer
cd ../renderer
npm install
```

### Phase 2 — Run in Development
```bash
# Terminal 1 — Backend
cd apps/backend && npm run start:dev

# Terminal 2 — Frontend + Electron (from root)
npm run dev
```

### Phase 3 — Cashier PC Setup (LAN)
1. Find Admin PC's LAN IP: `ipconfig` / `ifconfig`
2. On Cashier PC, set environment variable:  
   `API_URL=http://192.168.1.x:3000`
3. Build and distribute Electron app

### Phase 4 — Production Build
```bash
npm run build           # builds renderer + packages Electron
npm run backend:build   # compiles NestJS
npm run backend:migrate:prod
```

---

## Default Credentials (after seed)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Cashier | `cashier1` | `cashier123` |

> **Change these immediately in production.**

---

## Key Design Decisions

- **Role enforcement**: Both JWT guard and `RolesGuard` on every protected endpoint
- **Cashier data isolation**: Sales `GET /sales` returns only own sales for CASHIER role
- **Atomic sales**: `prisma.$transaction` — stock deduction + inventory log in one DB transaction
- **LAN connectivity**: NestJS binds to `0.0.0.0:3000` so cashier PCs can connect
- **Print**: Electron IPC `printReceipt` opens native print dialog for receipts
- **State**: Zustand persisted store for auth — survives app restarts
- **Queries**: TanStack Query for all server state — caching, refetching, optimistic updates
