# AquaLasTech — Full System Documentation

> This document is the single source of truth for the AquaLasTech codebase. Written for developers of all levels — whether you are encountering this project for the first time or a senior engineer adapting it for new requirements. Reading this from start to finish will give you a complete mental model of every layer: how requests flow, how data is stored, how authentication works, and how every file fits into the whole.

---

## Table of Contents

1. [[#Project Overview]]
2. [[#Technology Stack]]
3. [[#System Architecture]]
4. [[#Project Folder Structure]]
5. [[#Database Design]]
6. [[#Server — Deep Dive]]
7. [[#Client — Deep Dive]]
8. [[#Authentication and Authorization Flow]]
9. [[#Role-Based Access Control]]
10. [[#API Endpoints Reference]]
11. [[#Core Feature Walkthroughs]]
12. [[#Maintenance Mode System]]
13. [[#File Upload System]]
14. [[#Notification System]]
15. [[#Reports and Analytics]]
16. [[#Point of Sale System]]
17. [[#Environment Variables Reference]]
18. [[#Enum Constants Reference]]
19. [[#Deployment Guide]]

---

## Project Overview

**AquaLasTech** is a full-stack web application that digitizes and automates the operations of water refilling stations. Before a system like this, station owners managed orders by phone, tracked inventory on paper, handled payments manually, and had no way to see sales data at a glance. AquaLasTech replaces all of that with one platform.

The system is designed around **four distinct user roles**, each with their own interface and permissions:

- **Customer** — browses products at their assigned station, places delivery or pickup orders, pays via GCash or cash, tracks order status in real time, and receives notifications when their order moves forward.
- **Staff (Admin)** — the station staff who process incoming orders, manage inventory, confirm GCash payments, and handle walk-in sales through the Point of Sale terminal.
- **Store Owner (Super Admin)** — the station owner. Has all Staff capabilities plus the ability to configure the station: name, address, logo, GCash QR code, and which Staff accounts are linked to the station.
- **System Admin** — the platform operator. Oversees all stations across the entire network, creates or deletes stations, and can put the entire platform into maintenance mode with one action.

The app runs as two separate processes — a **React frontend** served by Vercel and an **Express API backend** hosted on Render — connected to a **MySQL database** on Aiven. The frontend and backend deploy independently.

---

## Technology Stack

### Why This Stack?

The stack was chosen to keep the entire codebase in one language (TypeScript) across both frontend and backend, minimize operational complexity, and use well-documented tools that any JavaScript developer can pick up quickly.

### Backend

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| Node.js | v20+ | JavaScript runtime for the server |
| TypeScript | ~5.9 | Adds static types — catches bugs at compile time before they reach production |
| Express.js | ^5.2 | HTTP server and routing framework |
| MySQL 2 | ^3.18 | MySQL database driver with async/await support |
| JSON Web Tokens (JWT) | ^9.0 | Creates and verifies stateless authentication tokens |
| bcrypt | ^6.0 | Hashes passwords before storing them — never stores plaintext |
| Multer | ^2.1 | Handles file upload streams from multipart/form-data requests |
| multer-storage-cloudinary | — | Streams uploaded files directly to Cloudinary instead of local disk |
| Cloudinary SDK | — | Cloud media storage and global CDN for images |
| Nodemailer | ^8.0 | Sends emails (used for password reset links) |
| Helmet | ^8.1 | Automatically sets secure HTTP response headers |
| CORS | ^2.8 | Controls which origins (domains) the server accepts requests from |
| cookie-parser | ^1.4 | Parses the Cookie request header so req.cookies.token is accessible |
| dotenv | ^17.3 | Loads .env file variables into process.env at startup |
| tsx | ^4.21 | Runs TypeScript files directly in development without pre-compiling |

**Why TypeScript?** JavaScript does not tell you when you pass the wrong type to a function or access a property that does not exist. TypeScript catches these errors at compile time — critical in a system where a type mistake in a payment route can corrupt financial records.

**Why Express?** Express is minimal and explicit. You control exactly what middleware runs on each request. This makes it easy to trace a request from entry to response just by reading the code top-to-bottom.

**Why MySQL over NoSQL?** The data here is deeply relational: an order belongs to a customer and a station, has many items, each item references a product linked to inventory. These relationships are enforced with foreign keys. MySQL also supports transactions — if an order insert succeeds but the inventory deduction fails, everything rolls back atomically.

### Frontend

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| React | ^19.2 | Component-based UI library |
| TypeScript | ~5.9 | Type-safe JavaScript for the frontend |
| Vite | ^7.3 | Build tool and dev server with instant Hot Module Replacement |
| React Router DOM | ^7.13 | Client-side routing — switches pages without full page reloads |
| Axios | ^1.13 | HTTP client; supports interceptors for global request modification |
| TailwindCSS | ^3.4 | Utility-first CSS — styles applied as class names directly in JSX |
| Lucide React | ^0.576 | Clean, consistent icon library |
| React Icons | ^5.5 | Additional icon sets (e.g. Google icon on the landing page) |
| Leaflet / React-Leaflet | ^1.9 / ^5.0 | Interactive maps for GPS coordinate picking |
| PostCSS | ^8.5 | Processes CSS (required by Tailwind) |
| Autoprefixer | ^10.4 | Adds browser vendor prefixes to CSS rules automatically |

**Why Vite?** Vite's dev server starts in under a second and pushes updates to the browser instantly when you save. Create React App could take 30+ seconds to rebuild on every change.

**Why Tailwind?** Styles live directly in the component markup as class names. No separate `.css` files to hunt through. Every style decision is visible in the JSX.

### Database

| Technology | Purpose |
| :--- | :--- |
| MySQL 8.0+ | Relational database for all persistent data. Cloud-hosted on Aiven. |

### Development Tools

| Tool | Purpose |
| :--- | :--- |
| Nodemon | Watches server files for changes and restarts the process automatically |
| ESLint | Enforces code quality rules |
| Git | Version control |

---

## System Architecture

AquaLasTech follows a **three-tier architecture**: a React frontend (presentation), an Express API (application logic), and a MySQL database (data). Each tier has one responsibility and talks to the adjacent tier over a defined interface.

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (React Client)                     │
│  React + Vite + TailwindCSS                                  │
│  - Renders UI components from application state              │
│  - Manages client-side routing (React Router)                │
│  - Reads auth state from AuthContext (global store)          │
│  - Sends HTTP requests via Axios                             │
│  - Authenticates via Cookie AND Authorization header (dual)  │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTPS / REST (JSON)
                       │  Cookie: token=eyJ...
                       │  Authorization: Bearer eyJ...
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER                         │
│  Node.js + TypeScript (port 8080, hosted on Render)          │
│  - Validates JWT from cookie OR Authorization header         │
│  - Routes requests to the correct handler                    │
│  - Enforces role-based authorization per route               │
│  - Executes business logic (orders, inventory, reports)      │
│  - Reads/writes MySQL via a shared connection pool           │
│  - Uploads images to Cloudinary, stores CDN URLs in DB       │
└──────────────────────┬──────────────────────────────────────┘
                       │  mysql2 (TCP + SSL)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   MySQL DATABASE (Aiven)                      │
│  - Stores users, stations, orders, inventory, logs           │
│  - Status columns use TINYINT (1 byte) for storage savings   │
│  - Data integrity enforced via foreign key constraints       │
└─────────────────────────────────────────────────────────────┘
```

### The Dual-Token Authentication Strategy

When the server issues a JWT after login, it does two things simultaneously: it sets the token as an **httpOnly cookie** in the response headers, and it also returns the raw token in the JSON response body.

The frontend stores the body token in `localStorage`. An Axios interceptor registered in `main.tsx` reads from `localStorage` before every request and attaches it as an `Authorization: Bearer` header. The browser also automatically sends the cookie on every request via `withCredentials: true`.

On the server, `verifyToken` middleware accepts whichever arrives first — cookie or header. This dual strategy exists because **iOS Safari's Intelligent Tracking Prevention (ITP)** silently blocks third-party (cross-site) cookies. When the frontend is on Vercel and the backend is on Render (different domains), iOS treats the cookie as third-party and drops it. The `Authorization` header is not affected by ITP, so iOS users authenticate via that path while desktop browsers use the cookie.

---

## Project Folder Structure

### Monorepo Layout

The repository holds two completely independent projects: `client/` and `server/`. They have separate `package.json`, `node_modules`, TypeScript configs, and `.env` files. They share nothing except this git repository and the fact that the server is the API the client calls.

```
AquaLasTech/
├── client/                  ← React + Vite frontend
├── server/                  ← Express + TypeScript backend API
├── SYSTEM_DOCUMENTATION.md  ← This file
├── README.md                ← Setup and deployment guide
└── .gitattributes           ← Enforces LF line endings on Windows
```

### `client/` — React Frontend

All frontend code lives in `client/src/`. Vite serves it during development and bundles it into `client/dist/` for production deployment.

```
client/
├── public/
│   └── vite.svg                       ← Browser tab favicon
├── src/
│   ├── api/
│   │   └── axios.ts                   ← Pre-configured Axios instance with VITE_API_URL as baseURL
│   ├── assets/
│   │   ├── aqualastech-logo.png       ← Logo with white background
│   │   ├── aqualastech-logo-noBG.png  ← Transparent PNG logo for dark backgrounds
│   │   ├── ALT_FONT.png               ← Stylized title image used in the landing page hero
│   │   ├── water-bg.jpg               ← Background texture for the landing page
│   │   └── favicon_io/                ← Full favicon set for all device sizes
│   ├── components/
│   │   ├── LocationMap.tsx            ← Leaflet map for interactive GPS coordinate picking
│   │   ├── MaintenanceGuard.tsx       ← Wraps customer routes; shows MaintenancePage if station is under maintenance
│   │   ├── ProfileAvatarUpload.tsx    ← Reusable profile picture upload component with live preview
│   │   ├── SuperAdminRoute.tsx        ← Route guard that blocks non-super_admin users from settings
│   │   ├── Topbar.tsx                 ← Top header bar shared across admin pages
│   │   └── ui/
│   │       ├── InputField.tsx         ← Reusable labeled input with inline error message display
│   │       └── WaterLoader.tsx        ← Water-themed loading spinner animation
│   ├── context/
│   │   └── AuthContext.tsx            ← React Context that holds the logged-in user globally
│   ├── hooks/
│   │   └── useStation.ts              ← Custom hook: fetches station data with a manual refetch trigger
│   ├── layout/
│   │   ├── AdminLayout.tsx            ← Sidebar + topbar shell for staff and store owner pages
│   │   ├── CustomerLayout.tsx         ← Bottom navigation shell for customer pages
│   │   ├── MainLayout.tsx             ← Minimal wrapper for public pages (no navigation)
│   │   └── SystemAdminLayout.tsx      ← Sidebar shell for the system admin
│   ├── pages/
│   │   ├── LandingPage.tsx            ← Public marketing home page
│   │   ├── LandingPage.css            ← Custom CSS animations for the landing page hero
│   │   ├── LoginPage.tsx              ← Email and password login form
│   │   ├── SignupPage.tsx             ← New customer registration form
│   │   ├── ForgotPasswordPage.tsx     ← Submit email to receive a password reset link
│   │   ├── ResetPasswordPage.tsx      ← Enter new password using the token received by email
│   │   ├── MaintenancePage.tsx        ← Full-screen page shown to customers during maintenance
│   │   ├── NotFoundPage.tsx           ← 404 fallback for any unknown URL
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx     ← Sales metrics, period chart, daily breakdown, inventory modal
│   │   │   ├── AdminCustomerOrder.tsx ← Order list with status controls, payment verification, return approval
│   │   │   ├── AdminInventory.tsx     ← Product catalog and full stock management panel
│   │   │   ├── AdminSettings.tsx      ← Station configuration page (store owner only)
│   │   │   └── PointOfSale.tsx        ← Walk-in customer sales terminal
│   │   ├── customer/
│   │   │   ├── CustomerDashboard.tsx  ← Customer's order history overview
│   │   │   ├── CustomerOrder.tsx      ← Product catalog, cart, and checkout flow
│   │   │   └── CustomerSettings.tsx   ← Customer profile, address, and avatar management
│   │   └── system-admin/
│   │       ├── SAStations.tsx         ← All-station management grid with maintenance toggle
│   │       └── SALogs.tsx             ← System-wide audit log viewer
│   ├── routes/
│   │   ├── router.tsx                 ← All client-side routes organized by role
│   │   └── ProtectedRoute.tsx         ← Redirects unauthenticated or wrong-role users
│   ├── main.tsx                       ← React entry point: Axios interceptor + providers + router
│   └── index.css                      ← Global CSS reset and Tailwind @layer directives
├── vite.config.ts                     ← Vite build and dev server configuration
├── tailwind.config.cjs                ← Tailwind theme and content file paths
├── postcss.config.cjs                 ← PostCSS pipeline required by Tailwind
├── tsconfig.json                      ← TypeScript config for the app source code
├── tsconfig.node.json                 ← TypeScript config for Vite config files (separate because Vite runs in Node)
├── package.json                       ← Frontend dependencies and npm scripts
└── .env                               ← Frontend environment variables (gitignored)
```

**`src/components/`** holds reusable UI pieces used across more than one page. Logic that only belongs to one page stays in that page file. Shared logic gets extracted here.

**`src/context/`** holds React Context providers. Context is React's mechanism for making data available to any component in the tree without passing it as props through every level. `AuthContext` is the only context here — it makes the logged-in user available everywhere without prop-drilling.

**`src/layout/`** holds shell components. A layout renders the navigation chrome (sidebar, bottom nav, topbar) and an `<Outlet />` from React Router where the current page renders. Think of it as the constant frame while the inner page changes.

**`src/hooks/`** holds custom React hooks. A custom hook is a function built from React's built-in hooks (`useState`, `useEffect`) that encapsulates reusable stateful logic. Moving data-fetching logic into a hook keeps page components clean and readable.

### `server/` — Express Backend

```
server/
├── src/
│   ├── app.ts                           ← Express app: all middleware registered, all routes mounted
│   ├── server.ts                        ← HTTP server: loads .env, calls app.listen()
│   ├── config/
│   │   ├── db.ts                        ← MySQL singleton connection pool with optional SSL
│   │   └── cloudinary.ts                ← Cloudinary upload middleware factory (createUpload)
│   ├── constants/
│   │   └── dbEnums.ts                   ← All TINYINT numeric codes, name maps, and helper functions
│   ├── middleware/
│   │   ├── verifyToken.middleware.ts    ← JWT validation — accepts cookie OR Authorization header
│   │   ├── auth.middleware.ts           ← Re-exports verifyToken for convenience
│   │   └── role.middleware.ts           ← Role-checking helper used by some route files
│   ├── routes/
│   │   ├── auth.routes.ts               ← /auth/* login, signup, logout, password reset
│   │   ├── user.routes.ts               ← /users/* user profile endpoints
│   │   ├── station.routes.ts            ← /stations/* station CRUD for admins
│   │   ├── station.customer.routes.ts   ← /stations/* read-only endpoints for customers
│   │   ├── product.routes.ts            ← /products/* product catalog
│   │   ├── inventory.routes.ts          ← /inventory/* stock management with full audit trail
│   │   ├── order.routes.ts              ← /orders/* complete order lifecycle
│   │   ├── pos.routes.ts                ← /pos/* walk-in POS transactions
│   │   ├── customer.routes.ts           ← /customer/* profile update and avatar upload
│   │   ├── settings.routes.ts           ← /settings/* station config (store owner restricted)
│   │   ├── reports.routes.ts            ← /reports/* sales analytics
│   │   ├── sysadmin.routes.ts           ← /sysadmin/* system-wide controls
│   │   └── seedOrders.ts                ← Dev utility to seed test order data
│   ├── scripts/
│   │   ├── createAdmin.ts               ← CLI: create a staff or store owner account interactively
│   │   ├── createStation.ts             ← CLI: create a station + store owner in one step
│   │   ├── ManageAdmins.ts              ← CLI: interactive admin management menu
│   │   ├── ManageStations.ts            ← CLI: interactive station management menu
│   │   └── migrateImagesToCloudinary.ts ← One-time script: upload local images to Cloudinary
│   └── utils/
│       └── generateReference.ts         ← Generates unique human-readable order reference codes
├── uploads/                             ← Legacy local image folder (gitignored; replaced by Cloudinary)
├── tsconfig.json                        ← TypeScript configuration
├── package.json                         ← Backend dependencies and npm scripts
├── nodemon.json                         ← Nodemon watches src/ and restarts on any change
└── .env                                 ← Server environment variables (gitignored)
```

**`src/routes/`** is where most business logic lives. Each file handles one domain and is mounted at a URL prefix in `app.ts`. Applying `router.use(verifyToken)` at the top of a route file means every endpoint in that file requires a valid JWT — one line covers all routes.

**`src/scripts/`** contains command-line programs run manually by the operator. They are not HTTP endpoints. They exist because some operations (creating the first system admin) cannot be done through the UI without already having an account.

---

## Database Design

### Storage Strategy

Two key design decisions reduce storage usage significantly:

**1. TINYINT instead of VARCHAR for status fields.**
Status columns like `order_status`, `payment_status`, and `role` store a small set of named values. Storing them as strings (`'confirmed'`, `'preparing'`) uses 10–15 bytes per value. TINYINT uses exactly 1 byte. This is mapped back to human-readable strings in code via `dbEnums.ts`. For high-volume tables like `orders` and `inventory_transactions`, this saves roughly 90% of storage on those columns.

**2. VARCHAR(500) instead of TEXT for long strings.**
MySQL stores TEXT columns off-page — in a separate location from the rest of the row. Any query that touches a TEXT column incurs an extra I/O read. VARCHAR(500) stays in-row, eliminating that overhead. 500 characters covers all addresses, notes, and descriptions used in this system.

### Table Relationships

- **`users`** — the central identity table. Every person has one row. The `role` TINYINT determines their interface.
- **`admins`** — links a user to a station. Staff and store owners have one row here. The JWT carries `station_id` from this table, scoping all admin queries to their own station.
- **`customers`** — extends the user record for customers with address and GPS coordinates.
- **`stations`** — each physical water refilling station. Products, admins, and orders all link back here.
- **`products`** — items a station sells. Each product belongs to one station.
- **`inventory`** — current stock level per product. Decremented on order placement and POS transactions.
- **`inventory_transactions`** — append-only audit log of every stock change. Never deleted.
- **`orders`** — online orders placed by customers. One order has many `order_items`.
- **`order_items`** — individual line items within an order. Prices are captured at order time.
- **`payments`** — payment record per order including GCash receipt Cloudinary URL.
- **`pos_transactions`** — walk-in counter sales, separate from online orders.
- **`notifications`** — in-app alerts linked to a user, created server-side at key events.
- **`system_logs`** — immutable audit trail of significant system events.
- **`password_reset_tokens`** — hashed one-time tokens for the forgot-password flow.

### Table Reference

### `users`

Every account in the system has one row here regardless of role.

| Column | Type | Description |
| :--- | :--- | :--- |
| user_id | INT AUTO_INCREMENT | Primary key |
| full_name | VARCHAR(100) | Display name shown in the UI |
| email | VARCHAR(150) | Unique login identifier |
| password_hash | VARCHAR(255) | bcrypt hash — raw password is never stored |
| role | TINYINT | 1=customer, 2=staff/admin, 3=store owner/super_admin, 4=sys_admin |
| account_status | TINYINT | 1=active, 2=suspended, 3=deleted |
| profile_picture | VARCHAR(500) | Cloudinary CDN URL of the avatar |
| deleted_at | DATETIME | NULL if active; set on soft-delete |
| created_at | DATETIME | Account creation timestamp |
| updated_at | DATETIME | Last modification timestamp |

### `admins`

Links a staff or store owner user to their station. The `station_id` from this table is embedded in the JWT at login, which is how all admin API queries know which station's data to return.

| Column | Type | Description |
| :--- | :--- | :--- |
| admin_id | INT AUTO_INCREMENT | Primary key |
| user_id | INT FK → users | The admin user |
| station_id | INT FK → stations | Their assigned station |

### `customers`

Extends the user record for customer-role users with delivery information.

| Column | Type | Description |
| :--- | :--- | :--- |
| customer_id | INT AUTO_INCREMENT | Primary key |
| user_id | INT FK → users | The customer user |
| address | VARCHAR(500) | Short delivery address |
| complete_address | VARCHAR(500) | Full address with landmarks |
| latitude | DECIMAL(10,8) | GPS latitude |
| longitude | DECIMAL(11,8) | GPS longitude |

### `stations`

Each physical water refilling station in the network.

| Column | Type | Description |
| :--- | :--- | :--- |
| station_id | INT AUTO_INCREMENT | Primary key |
| station_name | VARCHAR(150) | Display name |
| address | VARCHAR(500) | Short address from GPS reverse geocoding |
| complete_address | VARCHAR(500) | Full address with landmarks |
| contact_number | VARCHAR(20) | Station contact phone |
| latitude | DECIMAL(10,8) | GPS latitude |
| longitude | DECIMAL(11,8) | GPS longitude |
| status | TINYINT | 1=open, 2=closed, 3=maintenance |
| image_path | VARCHAR(500) | Cloudinary URL of the station logo |
| qr_code_path | VARCHAR(500) | Cloudinary URL of the GCash QR code |
| created_at | DATETIME | — |
| updated_at | DATETIME | — |

### `products`

Items a station sells. Belongs to one station.

| Column | Type | Description |
| :--- | :--- | :--- |
| product_id | INT AUTO_INCREMENT | Primary key |
| station_id | INT FK → stations | Which station sells this |
| product_name | VARCHAR(150) | Display name |
| description | VARCHAR(500) | Product details |
| price | DECIMAL(10,2) | Selling price |
| cost_price | DECIMAL(10,2) | Purchase cost for profit calculations |
| unit_type | TINYINT | 1=liter, 2=gallon, 3=piece |
| image_path | VARCHAR(500) | Cloudinary URL of the product photo |
| is_active | TINYINT(1) | 1=visible in catalog, 0=hidden |

### `inventory`

Current stock level. One row per product per station. Updated every time an order is placed, a POS transaction occurs, or an admin manually adjusts stock.

| Column | Type | Description |
| :--- | :--- | :--- |
| inventory_id | INT AUTO_INCREMENT | Primary key |
| station_id | INT FK → stations | Which station |
| product_id | INT FK → products | Which product |
| quantity | INT | Current units in stock |
| min_stock_level | INT | Threshold — notifications created when quantity drops below this |
| updated_at | DATETIME | Last stock change timestamp |

### `inventory_transactions`

Append-only audit log. Every change to `inventory.quantity` creates one row here. Rows are never deleted — there is always a full history.

| Column | Type | Description |
| :--- | :--- | :--- |
| transaction_id | INT AUTO_INCREMENT | Primary key |
| inventory_id | INT FK → inventory | Which inventory record changed |
| transaction_type | TINYINT | 1=restock, 2=deduction, 3=adjustment |
| quantity_change | INT | Positive or negative change in units |
| notes | VARCHAR(500) | Reason for the change |
| created_at | DATETIME | When it happened |

### `orders`

Online orders placed by customers.

| Column | Type | Description |
| :--- | :--- | :--- |
| order_id | INT AUTO_INCREMENT | Primary key |
| customer_id | INT FK → users | Customer who placed the order |
| station_id | INT FK → stations | Station fulfilling the order |
| order_reference | VARCHAR(20) | Human-readable ID, e.g. ORD-20240315-A4X2 |
| order_status | TINYINT | 1=confirmed, 2=preparing, 3=out_for_delivery, 4=delivered, 5=cancelled, 6=returned |
| payment_mode | TINYINT | 1=gcash, 2=cash, 3=cash_on_delivery, 4=cash_on_pickup |
| payment_status | TINYINT | 1=pending, 2=verified, 3=rejected |
| total_amount | DECIMAL(10,2) | Sum of all order_items subtotals |
| delivery_address | VARCHAR(500) | Where to deliver |
| notes | VARCHAR(500) | Customer instructions |
| hidden_at | DATETIME | NULL unless soft-deleted from admin history view |
| created_at | DATETIME | Order placement time |
| updated_at | DATETIME | Last status change time |

### `order_items`

One row per product in an order. Prices are captured at the time of ordering — they do not change if the product price is updated later.

| Column | Type | Description |
| :--- | :--- | :--- |
| item_id | INT AUTO_INCREMENT | Primary key |
| order_id | INT FK → orders | Parent order |
| product_id | INT FK → products | Product ordered |
| quantity | INT | Number of units |
| unit_price | DECIMAL(10,2) | Price per unit at time of order |
| subtotal | DECIMAL(10,2) | quantity × unit_price |

### `payments`

Payment record per order. Stores GCash reference numbers and receipt screenshot URLs.

| Column | Type | Description |
| :--- | :--- | :--- |
| payment_id | INT AUTO_INCREMENT | Primary key |
| order_id | INT FK → orders | The order this covers |
| payment_mode | TINYINT | Same values as orders.payment_mode |
| payment_status | TINYINT | 1=pending, 2=verified, 3=rejected |
| amount | DECIMAL(10,2) | Amount paid |
| reference_number | VARCHAR(100) | GCash reference code from the customer |
| receipt_path | VARCHAR(500) | Cloudinary URL of the uploaded receipt screenshot |
| verified_at | DATETIME | When the admin verified or rejected |

### `pos_transactions`

Walk-in counter sales. Does not require a customer account.

| Column | Type | Description |
| :--- | :--- | :--- |
| pos_id | INT AUTO_INCREMENT | Primary key |
| station_id | INT FK → stations | Which station processed the sale |
| admin_id | INT FK → users | Which staff member processed it |
| product_id | INT FK → products | Product sold |
| quantity | INT | Units sold |
| unit_price | DECIMAL(10,2) | Price at time of sale |
| total_amount | DECIMAL(10,2) | Total transaction value |
| payment_method | TINYINT | 1=cash, 2=gcash |
| transaction_status | TINYINT | 1=completed, 2=cancelled |
| created_at | DATETIME | Transaction time |

### `notifications`

In-app alerts linked to a user. Always created server-side, never by the frontend.

| Column | Type | Description |
| :--- | :--- | :--- |
| notification_id | INT AUTO_INCREMENT | Primary key |
| user_id | INT FK → users | Recipient |
| message | VARCHAR(500) | Human-readable notification text |
| notification_type | TINYINT | 1=order_update, 2=payment_update, 3=inventory_alert, 4=system_message |
| is_read | TINYINT(1) | 0=unread, 1=read |
| created_at | DATETIME | Creation time |

### `system_logs`

Immutable audit trail. Never updated. Only cleared by the system admin with password confirmation.

| Column | Type | Description |
| :--- | :--- | :--- |
| log_id | INT AUTO_INCREMENT | Primary key |
| event_type | VARCHAR(50) | Named event string, e.g. login, station_created |
| description | VARCHAR(500) | Human-readable description of what happened |
| user_id | INT FK → users | Who triggered the event |
| ip_address | VARCHAR(50) | Source IP address |
| created_at | DATETIME | Event time |

### `password_reset_tokens`

Hashed one-time tokens for the forgot-password flow. The raw token is only in the email — only its hash is stored here, so a database breach cannot yield valid reset URLs.

| Column | Type | Description |
| :--- | :--- | :--- |
| id | INT AUTO_INCREMENT | Primary key |
| user_id | INT FK → users | Which user requested the reset |
| token_hash | VARCHAR(64) | SHA-256 hash of the emailed raw token |
| expires_at | DATETIME | 15 minutes from creation |
| used | TINYINT(1) | 0=valid, 1=already consumed (enforces one-time use) |
| created_at | DATETIME | Request time |

---

## Server — Deep Dive

### `server.ts` — Entry Point

The first file Node.js executes on `npm run dev` or `npm start`. It loads environment variables, imports the Express app, and starts the HTTP listener.

```typescript
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

`dotenv.config()` must run first — before anything imports `db.ts` — otherwise `DB_HOST`, `DB_PASSWORD`, etc. are undefined when the connection pool is created. Separating `server.ts` from `app.ts` also means tests can import `app` without starting a real HTTP listener.

### `app.ts` — Express Application Setup

Every incoming request passes through the middleware registered here before reaching any route handler. Order matters.

**CORS configuration:**
```typescript
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CLIENT_URL,   // e.g. https://your-app.vercel.app
].filter(Boolean) as string[];

const corsOptions = {
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,  // required for cookies to be sent cross-origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],  // Authorization for dual-auth
};

app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));  // handles preflight OPTIONS requests
```

Without CORS configured correctly, browsers block any request from `localhost:5173` to `localhost:8080` (different ports = different origins). `credentials: true` allows cookies to be included in cross-origin requests. `Authorization` must be in `allowedHeaders` because every request sends it via the Axios interceptor.

**Helmet:**
```typescript
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
```

Helmet automatically sets security HTTP headers (X-Frame-Options, Content-Security-Policy, etc.) on every response. The `crossOriginResourcePolicy` override allows images hosted on the server to be loaded by a frontend on a different domain.

**Body parsers:**
```typescript
app.use(cookieParser());                      // populates req.cookies
app.use(express.json());                      // populates req.body for JSON requests
app.use(express.urlencoded({ extended: true })); // populates req.body for form data
```

Without `cookieParser()`, `req.cookies.token` is undefined and the JWT is inaccessible. Without `express.json()`, every POST and PUT body is undefined.

**Route mounting:**
```typescript
app.use("/auth",      authRoutes);
app.use("/stations",  stationRoutes);
app.use("/settings",  settingsRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/orders",    ordersRoutes);
app.use("/pos",       posRoutes);
app.use("/reports",   reportsRoutes);
app.use("/customer",  customerRoutes);
app.use("/sysadmin",  sysadminRoutes);
```

A request to `GET /orders` is handed to `ordersRoutes`. Within that file, `router.get("/")` handles it.

### `config/db.ts` — MySQL Connection Pool

Uses the **singleton pattern** — one shared pool across the entire application.

```typescript
let connection: mysql.Pool | null = null;

export const connectToDatabase = async () => {
    if (!connection) {
        connection = await mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            // Enable SSL for Aiven cloud database
            ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
        })
    }
    return connection
}
```

A **connection pool** pre-opens up to 10 database connections and reuses them. Opening a fresh connection per request involves a TCP handshake, authentication, and session setup — expensive for a high-frequency server. With a pool, a request borrows an open connection and returns it when done.

`DB_SSL=true` enables SSL, required by Aiven's cloud MySQL service.

**How routes use it:**
```typescript
const db = await connectToDatabase();
const [rows]: any = await db.query(
    'SELECT * FROM orders WHERE station_id = ?',
    [stationId]  // ← parameterized, never string-concatenated
);
```

The `?` placeholder is critical for security. mysql2 sends the SQL and the value separately to the database engine — this prevents **SQL injection**. Never interpolate user input directly into a query string.

### `config/cloudinary.ts` — Cloud Image Upload Factory

A factory function that returns a configured Multer middleware instance. Instead of saving files to local disk (which is ephemeral on Render), it streams them directly to Cloudinary.

```typescript
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key:    process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
})

export function createUpload(folder: string) {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `aqualastech/${folder}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            resource_type: 'image',
        } as any,
    })
    return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB max
    })
}
```

Route files call `createUpload()` once at the top to get a ready-to-use upload middleware:

```typescript
// In inventory.routes.ts
const upload = createUpload('products')

router.post('/product', upload.single('image'), async (req, res) => {
    const imageUrl = req.file?.path  // ← the Cloudinary CDN URL
    await db.query(
        'UPDATE products SET image_path = ? WHERE product_id = ?',
        [imageUrl, id]
    )
})
```

After Multer-Cloudinary processes the request, `req.file.path` contains the permanent Cloudinary URL (e.g. `https://res.cloudinary.com/yourcloud/image/upload/v1/aqualastech/products/file.jpg`). This is stored in the database and referenced directly by the frontend.

### `constants/dbEnums.ts` — Type-Safe Status Codes

The central dictionary for all numeric status codes. Instead of scattering magic numbers like `WHERE order_status = 4` throughout the codebase, everything uses named constants:

```typescript
export const ORDER_STATUS = {
    CONFIRMED:        1,
    PREPARING:        2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED:        4,
    CANCELLED:        5,
    RETURNED:         6,
} as const;
```

`as const` makes TypeScript treat each value as a literal type (`1`, `2`...) rather than a plain `number`. This means TypeScript catches it if you accidentally compare the wrong constants.

**Validation arrays** for rejecting invalid API input:
```typescript
export const VALID_ORDER_STATUSES = Object.values(ORDER_STATUS); // [1,2,3,4,5,6]

// In a route handler:
if (!VALID_ORDER_STATUSES.includes(newStatus)) {
    return res.status(400).json({ message: "Invalid status" })
}
```

**Helper functions** that encode business rules:
```typescript
// Returns true if an order's status can no longer be changed
export const isFinalOrderStatus = (status: number): boolean => {
    return [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED]
        .includes(status);
};
```

Used in `order.routes.ts` to prevent admins from accidentally changing a delivered order back to preparing.

**Name maps** for building readable API responses:
```typescript
export const ORDER_STATUS_NAMES: Record<number, string> = {
    1: 'confirmed', 2: 'preparing', 3: 'out_for_delivery',
    4: 'delivered', 5: 'cancelled', 6: 'returned',
};
```

The server uses these when returning orders so the frontend receives `'confirmed'` as a string rather than `1`.

### `middleware/verifyToken.middleware.ts` — JWT Authentication Gate

The most important security file in the entire server. Every protected endpoint runs through this. It validates the JWT and populates `req.user` with the decoded token data.

```typescript
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    // Cookie path — standard desktop browsers
    const cookieToken = (req as any).cookies?.token;

    // Authorization header path — iOS Safari (ITP blocks cross-site cookies)
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7) : null;

    const token = cookieToken || bearerToken;  // cookie preferred

    if (!token) {
        return res.status(401).json({ message: "No token, access denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY || "");
        (req as any).user = decoded;  // attach to the request object
        next();                        // pass control to the route handler
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
```

**What `jwt.verify()` does:** A JWT is a signed string with a payload (`{ id, role, station_id }`). `jwt.verify()` checks the signature against `JWT_KEY` and confirms the token has not expired. If both pass, it returns the decoded payload. If either fails, it throws — caught here and returned as a 403.

**After this middleware runs**, all route handlers in the same file can access:
```typescript
const user = (req as any).user;
// user.id         → user_id from the database
// user.role       → 'admin' | 'super_admin' | 'customer' | 'sys_admin'
// user.station_id → station the admin manages (null for customers and sys_admin)
```

### Route Files

#### `auth.routes.ts` — Authentication (`/auth/*`)

Handles the full authentication lifecycle.

**`POST /auth/signup`** — Creates a new customer. Has soft-delete reactivation: if the email exists but `deleted_at` is set, the account is reactivated with the new credentials instead of creating a duplicate.

After the `users` insert, a second INSERT creates the `customers` profile row. The login JOIN query depends on this row existing.

**`POST /auth/login`** — Uses a JOIN to fetch user data, `station_id` (for admins), and address (for customers) in one query. Verifies the password with `bcrypt.compare()`. On success:
- Signs a 7-day JWT with `{ id, role, station_id }`.
- Sets it as an httpOnly cookie (`SameSite: "none"` in production for cross-site Vercel→Render).
- Returns the raw token in the response body for `localStorage` (iOS fallback).
- Logs the login to `system_logs`.

**`GET /auth/me`** — Session restoration on page reload. Accepts cookie or Authorization header. Returns `{ token, user }` — the token is returned so `AuthContext` can refresh `localStorage` even for old sessions that predate the iOS fix.

**`POST /auth/forgot-password`** — Security features: (1) Always returns the same generic response to prevent email enumeration. (2) Stores only a SHA-256 hash of the raw token — the raw token exists only in the email. (3) Invalidates any previous unused tokens before creating a new one. (4) Token expires in 15 minutes.

**`POST /auth/reset-password`** — Hashes the incoming token, looks up the record, verifies it is unused and not expired, updates the password with bcrypt, marks the token `used = 1` (one-time use).

**`PUT /auth/profile`** — Any authenticated user can update their own name and email. Checks for email conflicts before saving.

**`PUT /auth/change-password`** — Requires current password verification before accepting the new one.

#### `order.routes.ts` — Order Lifecycle (`/orders/*`)

All routes use `router.use(verifyToken)` at the top — one line protects every endpoint in the file.

Has a self-healing startup block that adds missing columns to `orders` via `ALTER TABLE`. If a column already exists, the error is silently caught. This handles incremental schema changes without a formal migration tool.

**Key patterns:**

- **Atomic placement:** `POST /orders` validates stock, inserts `orders`, inserts `order_items`, deducts `inventory`, and creates an admin notification — all in one request. If any product has insufficient stock, the entire request is rejected before any inserts.
- **Status guard:** Before updating, calls `isFinalOrderStatus(currentStatus)`. Delivered, cancelled, and returned orders cannot have their status changed.
- **Soft delete:** `DELETE /orders/history` sets `hidden_at = NOW()` rather than deleting rows. Orders with `hidden_at IS NOT NULL` are filtered from the admin list but remain in the database for reports.
- **Return approval:** When an admin approves a return (`PUT /orders/:id/return`), the order status is set to `returned`. Inventory is **not** restocked — returned items are considered consumed. If the return is rejected, the order status reverts to `out_for_delivery`.

#### `inventory.routes.ts` — Stock Management (`/inventory/*`)

Three stock change types, each appending a row to `inventory_transactions`:

- **Restock** — adds to `quantity`. Used when new stock arrives.
- **Deduction** — subtracts from `quantity`. Used for manual corrections.
- **Adjustment** — sets `quantity` to an exact value. Used for physical reconciliation counts.

After every change, checks if the new quantity is below `min_stock_level`. If so, creates an inventory alert notification for the admin automatically.

#### `settings.routes.ts` — Station Configuration (`/settings/*`)

Demonstrates a **two-tier access control pattern within a single route file**:

```typescript
// OPEN to any authenticated user — customers check this on login
router.get('/maintenance-status', verifyToken, handler)

// All routes defined AFTER this line require store owner (super_admin) role
router.use(verifyToken, requireSuperAdmin)

router.put('/station/:id', handler)                    // store owner only
router.post('/station/:id/upload-logo', upload, ...)   // store owner only
// etc.
```

The `maintenance-status` endpoint is placed before the `requireSuperAdmin` boundary deliberately. Customers call it through `MaintenanceGuard` on every page load — it must be accessible to any authenticated user.

#### `sysadmin.routes.ts` — System-Wide Controls (`/sysadmin/*`)

All routes check `req.user.role === 'sys_admin'` via an inline `requireSysAdmin` middleware. Every request must pass both JWT validation and this role check.

The maintenance toggle runs a single SQL statement affecting every station simultaneously:
```typescript
await db.query('UPDATE stations SET status = ?', [
    enabled ? STATION_STATUS.MAINTENANCE : STATION_STATUS.OPEN
])
```

Requires password verification before executing. Logged to `system_logs`.

Creating a new station runs inside a **database transaction** — if the super_admin INSERT fails after the station INSERT succeeds, everything rolls back and neither record exists.

#### `reports.routes.ts` — Analytics (`/reports/*`)

Accepts `?period=daily|weekly|monthly|annually` and returns aggregated sales data. All queries are scoped to `station_id` from the JWT — an admin can never see another station's data.

---

## Client — Deep Dive

### `main.tsx` — Entry Point and Axios Interceptor

React starts here. Three things happen: a global Axios interceptor is registered, providers wrap the app, and React Router takes control.

```typescript
// Runs before EVERY Axios request in the entire application
axios.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("authToken");
        if (token) config.headers.set("Authorization", `Bearer ${token}`);
    } catch { /* localStorage unavailable in some private browsing modes */ }
    return config;
});
```

An **Axios interceptor** is a function that runs before every request is sent. This one reads from `localStorage` and adds the token as `Authorization: Bearer <token>`. Because it is registered here — which runs once at app startup — it applies to every Axios call in every component without any component needing to handle it.

```typescript
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>
);
```

`AuthProvider` makes `useAuth()` available everywhere. `RouterProvider` renders the matched page. `React.StrictMode` renders each component twice in development to expose side effects — no production effect.

### `context/AuthContext.tsx` — Global Auth State

React Context makes data available to any component in the tree without passing it as props through every level. `AuthContext` holds the logged-in user.

```typescript
type User = {
    user_id: number;
    full_name: string;
    email: string;
    role: "super_admin" | "admin" | "customer" | "sys_admin";
    station_id: number | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    complete_address: string | null;
    profile_picture: string | null;
} | null;  // null = not logged in
```

The `| null` union forces every component that calls `useAuth()` to handle the unauthenticated case — TypeScript enforces this.

```typescript
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/auth/me`, { withCredentials: true })
            .then(res => {
                if (res.data.token) localStorage.setItem('authToken', res.data.token);
                setUser(res.data.user);
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);  // empty array = runs once on mount
};
```

On mount, `AuthProvider` calls `/auth/me` to check for an existing session. The empty dependency array `[]` means this runs exactly once. While pending, `loading` is `true` — `ProtectedRoute` shows a spinner instead of redirecting. This prevents the brief flash where a logged-in user is redirected to `/login` before the session check resolves.

If `/auth/me` returns a token, it is saved to `localStorage` — ensuring the iOS fallback path is populated even for users who logged in before the feature existed.

### `routes/router.tsx` — Route Definitions

Uses `createBrowserRouter` to organize all routes into four groups by access level.

**Public routes (`/`)** — Wrapped in `MainLayout`. No authentication. Anyone can visit: landing, login, signup, forgot password, reset password.

**Admin routes (`/admin/*`):**
```typescript
{
    path: "/admin",
    element: (
        <ProtectedRoute role="admin">
            <AdminLayout />
        </ProtectedRoute>
    ),
    children: [
        { index: true, element: <Navigate to="inventory" replace /> },
        { path: "dashboard",  element: <AdminDashboard /> },
        { path: "orders",     element: <AdminCustomerOrder /> },
        { path: "pos",        element: <PointOfSale /> },
        { path: "inventory",  element: <AdminInventory /> },
        {
            element: <SuperAdminRoute />,  // extra gate for settings
            children: [
                { path: "settings", element: <AdminSettings /> },
            ]
        },
    ],
}
```

`ProtectedRoute role="admin"` allows both `admin` (staff) and `super_admin` (store owner). The `settings` route has an extra `SuperAdminRoute` that checks for `super_admin` specifically — regular staff members are redirected back to inventory if they try to access it.

**Customer routes (`/customer/*`):**
```typescript
element: (
    <ProtectedRoute role="customer">
        <MaintenanceGuard>
            <CustomerLayout />
        </MaintenanceGuard>
    </ProtectedRoute>
)
```

Three layers: must be a logged-in customer → station must not be in maintenance → then the layout renders.

**System admin routes (`/sysadmin/*`)** — `ProtectedRoute role="sys_admin"` then `SystemAdminLayout`. Only `sys_admin` users can enter.

### `routes/ProtectedRoute.tsx` — Role Guard

```typescript
const ADMIN_ROLES = ["admin", "super_admin"]

function getRedirect(userRole: string): string {
    if (userRole === "sys_admin")   return "/sysadmin"
    if (userRole === "super_admin") return "/admin/dashboard"
    if (userRole === "admin")       return "/admin/inventory"
    return "/customer/dashboard"
}

export default function ProtectedRoute({ role, children }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user)   return <Navigate to="/login" replace />;

    const hasAccess = role === "admin"
        ? ADMIN_ROLES.includes(user.role)
        : user.role === role

    if (!hasAccess) return <Navigate to={getRedirect(user.role)} replace />;

    return <>{children}</>;
}
```

**Why `role="admin"` allows both `admin` and `super_admin`:** Store owners manage a station — they need all the same pages that staff use. They are only differentiated at the `settings` page via `SuperAdminRoute`.

**`getRedirect`** sends wrong-role users to their correct dashboard instead of showing a blank error. A customer who visits `/admin` is redirected to `/customer/dashboard`, not kicked to an error page.

### `components/SuperAdminRoute.tsx` — Store Owner Gate

```typescript
export default function SuperAdminRoute() {
    const { user, loading } = useAuth()
    if (loading) return null
    return user?.role === 'super_admin'
        ? <Outlet />                                    // render the settings page
        : <Navigate to="/admin/inventory" replace />   // redirect staff to inventory
}
```

Used as a layout route in `router.tsx` — no `path` of its own, just a gate. Redirects to `/admin/inventory` (not `/login`) because the user is already authenticated — they just are not a store owner.

`<Outlet />` renders the matched child route (the settings page) when access is granted.

### `components/MaintenanceGuard.tsx` — Maintenance Check

```typescript
const MaintenanceGuard = ({ children }) => {
    const [isMaintenance, setIsMaintenance] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/settings/maintenance-status`,
                 { withCredentials: true })
            .then(res => setIsMaintenance(res.data.is_maintenance))
            .catch(() => setIsMaintenance(false))  // on error: allow through
            .finally(() => setLoading(false))
    }, [])

    if (loading)       return null
    if (isMaintenance) return <MaintenancePage />  // replace entire customer UI
    return <>{children}</>
}
```

When maintenance is active, this replaces `CustomerLayout` and all child routes with `MaintenancePage`. The customer cannot interact with anything. On API error, defaults to `false` — preventing a backend outage from locking out all customers permanently.

### `hooks/useStation.ts` — Station Data with Refetch

```typescript
export function useStation(stationId: number | null | undefined) {
    const [station, setStation] = useState<Station | null>(null)
    const [tick, setTick] = useState(0)  // incrementing this triggers a re-fetch

    const fetchStation = useCallback(() => {
        if (!stationId) return
        axios.get(`/stations/${stationId}`, { withCredentials: true })
            .then(res => setStation(res.data))
    }, [stationId])

    useEffect(() => {
        fetchStation()
    }, [fetchStation, tick])  // re-runs when tick changes

    const refetch = useCallback(() => setTick(t => t + 1), [])

    return { station, loading, refetch }
}
```

`tick` is the key pattern. A `useEffect` re-runs when its dependencies change. Since `fetchStation` only changes when `stationId` changes, there would be no way to manually trigger a re-fetch otherwise. Including `tick` in the dependency array and exposing `refetch()` (which increments `tick`) lets any component force a re-fetch. `AdminSettings.tsx` calls `refetch()` after uploading a new logo so the sidebar shows the updated image immediately.

### Layouts

**`AdminLayout.tsx`** — Shell for all staff and store owner pages. Sidebar with navigation: Dashboard, Orders, POS, Inventory, Settings (Settings link only visible to store owners). Displays the station name via `useStation(user?.station_id)`. Role badge shows **STORE OWNER** for super_admin or **STAFF** for admin. Notification bell with dropdown. Mobile hamburger drawer. Bottom tab bar for mobile.

**`CustomerLayout.tsx`** — Mobile-first shell with a fixed bottom nav bar. Links to Dashboard, Orders, and Settings. Notification bell. Logout button.

**`SystemAdminLayout.tsx`** — Clean sidebar with Stations and Logs links. Shows the system admin's name. Mobile drawer.

**`MainLayout.tsx`** — Minimal wrapper with a light background. No navigation. Used for public pages.

### Pages — Admin

**`AdminDashboard.tsx`** — Period selector (daily / weekly / monthly / annually) drives the report data. Stats cards show total orders, revenue, pending count, and low-stock count. Chart shows revenue breakdown for the selected period. Daily Breakdown modal shows a day-by-day table. Inventory modal shows all products with stock levels color-coded: red = critical (at or below min), amber = warning (within 20% of min), green = healthy.

**`AdminCustomerOrder.tsx`** — Order list filterable by status tabs. Expanding an order shows: items, customer details, payment info, GCash receipt image viewer, status dropdown, Verify/Reject buttons for payment, and return approval controls. Status moves one direction — the UI only shows valid next steps.

**`AdminInventory.tsx`** — Full stock management. Per product: restock, deduct, or set exact quantity. Transaction history panel per product. Product management: create with Cloudinary image upload, edit details, deactivate/activate.

**`PointOfSale.tsx`** — Walk-in terminal. Active products shown as a clickable grid. Cart with quantity controls and running total. Cash or GCash payment. Confirm → `POST /pos/transaction` → inventory decremented → cart reset.

**`AdminSettings.tsx`** — Store owner only. Station info form with GPS map. Logo upload. GCash QR upload. Admin account management (list, delete with password, create new). Calls `refetch()` from `useStation` after logo upload so the sidebar updates immediately.

### Pages — Customer

**`CustomerOrder.tsx`** — Product catalog and checkout. Cart is React state only — no API calls until submit. GCash path shows station's QR code and receipt upload. Submits as `multipart/form-data` to `POST /orders`.

**`CustomerDashboard.tsx`** — Recent orders with statuses. Active order counts. Quick link to place a new order.

**`CustomerSettings.tsx`** — Update name/email, change password, update address and GPS, upload profile picture.

### Pages — System Admin

**`SAStations.tsx`** — All stations in a card grid with status badge, contact info, and assigned store owner. New Station modal with Leaflet map and OpenStreetMap reverse geocoding. Delete station (password required, cascades to all data). Global maintenance toggle in the header (all stations, password required).

**`SALogs.tsx`** — Read-only audit log. Last 200 system events with event type, description, actor, and timestamp. Clear Logs button (password required).

### Pages — Public

**`LoginPage.tsx`** — On success: stores token to `localStorage`, sets default Axios header, redirects to correct dashboard by role.

**`SignupPage.tsx`** — New customer registration.

**`ForgotPasswordPage.tsx`** — Submit email → reset link sent.

**`ResetPasswordPage.tsx`** — Reads `?token=` from URL, applies new password, redirects to login.

**`MaintenancePage.tsx`** — Animated water-drop icon, "Under Maintenance" heading, "Back to Home" link.

**`NotFoundPage.tsx`** — 404 fallback for any unknown URL.

---

## Authentication and Authorization Flow

### What the JWT Contains

After login the server creates a JWT with this payload:

```json
{
    "id": 5,
    "role": "admin",
    "station_id": 2,
    "iat": 1710000000,
    "exp": 1710604800
}
```

The payload is **base64-encoded, not encrypted** — anyone with the token can decode it. However it is **signed** with `JWT_KEY`. The signature proves the server created it and that the contents have not been tampered with. Never put sensitive data (passwords, card numbers) in a JWT payload.

### Login Flow

1. User submits email and password on `LoginPage.tsx`.
2. `POST /auth/login` sent with `{ email, password }` as JSON.
3. Server JOINs `users`, `admins`, and `customers` in one query.
4. `bcrypt.compare(enteredPassword, storedHash)` verifies the password.
5. Server signs a JWT `{ id, role, station_id }` expiring in 7 days.
6. Server sets the token as an **httpOnly cookie** — JavaScript cannot read it (XSS protection).
7. Server returns the raw token in the JSON body.
8. `LoginPage.tsx` saves token to `localStorage` and sets it as a default Axios header.
9. `AuthContext` updates `user` state.
10. React Router redirects to the correct dashboard by role.

### Session Restoration (Page Reload)

1. React remounts. `AuthProvider` starts with `loading = true`.
2. `useEffect` fires `GET /auth/me`. Axios interceptor adds `Authorization: Bearer <token>` from `localStorage`. Browser also sends the cookie.
3. Server accepts whichever token arrives first.
4. Server verifies, fetches full user record, returns `{ token, user }`.
5. `AuthContext` saves returned token to `localStorage` (keeps it fresh) and sets `user`.
6. `loading` becomes `false`. `ProtectedRoute` renders the page.

### Every Protected API Call

1. Component calls `axios.get('/orders')`.
2. Interceptor adds `Authorization: Bearer <token>`.
3. Browser sends the cookie automatically.
4. `verifyToken` reads cookie first, falls back to Bearer header.
5. `jwt.verify()` validates signature and expiry.
6. `req.user = { id, role, station_id }` is populated.
7. Route handler runs all queries scoped to `req.user.station_id`.

### Logout Flow

1. `POST /auth/logout` called.
2. Server clears the cookie.
3. Frontend calls `setUser(null)`, removes `authToken` from `localStorage`.
4. React Router redirects to `/login`.

### Password Reset Flow

1. User submits email. Server generates a 32-byte random token, stores its SHA-256 hash with 15-minute expiry, emails the raw token in a reset URL.
2. User clicks the link → `/reset-password?token=<raw>`.
3. User submits new password. Server hashes the incoming token, looks it up.
4. Server checks: record exists, not used, not expired.
5. Server updates `password_hash` with new bcrypt hash, marks token `used = 1`.

---

## Role-Based Access Control

RBAC is enforced at three independent layers. Bypassing one layer still leaves two more.

### Layer 1 — Frontend Route Guards

Prevents navigating to the wrong pages. Not the final security line — JavaScript can be manipulated in a browser. These guards are for UX; backend guards enforce real security.

| Guard | Allows | File |
| :--- | :--- | :--- |
| `ProtectedRoute role="admin"` | admin and super_admin | `ProtectedRoute.tsx` |
| `ProtectedRoute role="customer"` | customer only | `ProtectedRoute.tsx` |
| `ProtectedRoute role="sys_admin"` | sys_admin only | `ProtectedRoute.tsx` |
| `SuperAdminRoute` | super_admin only; redirects staff to inventory | `SuperAdminRoute.tsx` |
| `MaintenanceGuard` | blocks customers when maintenance is active | `MaintenanceGuard.tsx` |

### Layer 2 — Backend Middleware and Role Checks

Every protected endpoint runs `verifyToken`. Additional role checks:

- `sysadmin.routes.ts` — Inline `requireSysAdmin` rejects any role that is not `sys_admin`.
- `settings.routes.ts` — `requireSuperAdmin` middleware covers all configuration endpoints.
- `order.routes.ts` — Cancel/return customer endpoints verify `req.user.id` matches the order's `customer_id`.

### Layer 3 — Database Query Scoping

The deepest layer. Every admin query is scoped to `station_id` from the JWT:

```typescript
const [rows]: any = await db.query(
    'SELECT * FROM orders WHERE station_id = ?',
    [req.user.station_id]   // from the signed JWT, not from the request body
);
```

An admin cannot fake their `station_id` by modifying the request — it comes from a signature-verified JWT. They can only read and write data for their assigned station.

### Role Reference

| Role | DB Value | Routes | Key Restrictions |
| :--- | :--- | :--- | :--- |
| Customer | 1 | /customer/* | Blocked if station is in maintenance |
| Staff (Admin) | 2 | /admin/* except settings | All queries scoped to their station |
| Store Owner (Super Admin) | 3 | /admin/* including settings | All queries scoped to their station |
| System Admin | 4 | /sysadmin/* | Cannot access station admin panels |

---

## API Endpoints Reference

### Authentication — `/auth`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | /auth/signup | None | Register a new customer |
| POST | /auth/login | None | Login; returns JWT cookie + token in body |
| POST | /auth/logout | Cookie | Clears the JWT cookie |
| GET | /auth/me | Cookie or Bearer | Returns current user; refreshes localStorage token |
| PUT | /auth/profile | Cookie or Bearer | Update name and email |
| PUT | /auth/change-password | Cookie or Bearer | Change password (requires current password) |
| POST | /auth/forgot-password | None | Send password reset email |
| POST | /auth/reset-password | None | Apply new password using reset token |

### Stations — `/stations`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /stations | Any | List all stations |
| GET | /stations/:id | Any | Get one station |
| POST | /stations | super_admin | Create a station |
| PUT | /stations/:id | admin+ | Update station info |

### Inventory — `/inventory`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /inventory | admin+ | Get stock levels for the station |
| POST | /inventory/restock | admin+ | Add stock to a product |
| POST | /inventory/deduction | admin+ | Remove stock from a product |
| POST | /inventory/adjustment | admin+ | Set stock to exact value |
| GET | /inventory/transactions | admin+ | View stock movement history |

### Orders — `/orders`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | /orders | customer | Place a new order |
| GET | /orders | admin or customer | List orders (scoped by role) |
| GET | /orders/:id | admin or customer | View a specific order |
| PUT | /orders/:id/status | admin+ | Update order status |
| PUT | /orders/:id/payment | admin+ | Verify or reject payment |
| POST | /orders/:id/cancel | customer | Cancel an order |
| POST | /orders/:id/return | customer | Request a return |
| PUT | /orders/:id/return | admin+ | Approve or reject a return |
| DELETE | /orders/history | admin+ | Soft-delete completed orders from the admin view |

### POS — `/pos`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | /pos/transaction | admin+ | Process a walk-in sale |
| GET | /pos/history | admin+ | View POS transaction history |

### Settings — `/settings`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /settings/maintenance-status | Any authenticated | Check if station is in maintenance |
| PUT | /settings/station/:id | super_admin | Update station details |
| POST | /settings/station/:id/upload-logo | super_admin | Upload station logo |
| POST | /settings/station/:id/upload-qr | super_admin | Upload GCash QR code |
| GET | /settings/admins | super_admin | List admin accounts for station |
| DELETE | /settings/admins/:id | super_admin | Delete an admin (password required) |
| POST | /settings/create-admin | super_admin | Create a new staff account |

### Customer — `/customer`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| PUT | /customer/profile | customer | Update address and coordinates |
| PUT | /customer/password | customer | Change password |
| POST | /customer/avatar | customer | Upload profile picture |

### Reports — `/reports`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /reports/summary | admin+ | Sales summary (daily/weekly/monthly/annually) |

### System Admin — `/sysadmin`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /sysadmin/stations | sys_admin | All stations with store owner info |
| POST | /sysadmin/stations | sys_admin | Create station + store owner (transaction) |
| DELETE | /sysadmin/stations/:id | sys_admin | Delete station (password required) |
| PUT | /sysadmin/maintenance | sys_admin | Toggle system-wide maintenance mode |
| GET | /sysadmin/logs | sys_admin | View audit logs |
| DELETE | /sysadmin/logs | sys_admin | Clear all logs (password required) |

---

## Core Feature Walkthroughs

### A Customer Places an Order

1. Customer logs in. `POST /auth/login` returns JWT cookie + token. Token stored in `localStorage`.
2. `ProtectedRoute role="customer"` passes. `MaintenanceGuard` checks status — not in maintenance. `CustomerLayout` renders.
3. Customer navigates to `/customer/orders`. Products fetched for their station.
4. Customer adds items to cart. Cart lives in React state only — no server calls yet.
5. Customer selects GCash — station's QR code appears. Customer uploads receipt screenshot.
6. Customer clicks "Place Order" → `POST /orders` as `multipart/form-data`.
7. Server validates JWT. Checks inventory — rejects if any product has insufficient stock.
8. Server inserts `orders`, then `order_items` rows. Streams receipt to Cloudinary, stores URL in `payments`.
9. Server decrements `inventory.quantity` for each product.
10. Server creates a notification for the admin.
11. Frontend shows confirmation. Order appears in the customer's dashboard.

### An Admin Processes an Order

1. Staff sees notification bell with unread count. Notification: "New order from [customer]."
2. Staff opens `AdminCustomerOrder.tsx`. New order shows status `Confirmed`.
3. Staff expands order — sees items, GCash receipt image from Cloudinary.
4. Staff clicks "Verify Payment" → `PUT /orders/:id/payment { payment_status: "verified" }`.
5. Server updates payment status, creates notification for customer.
6. Staff changes status to "Preparing" → "Out for Delivery" → "Delivered". A notification is sent to the customer at each step.

### System Admin Enables Maintenance

1. System admin navigates to `/sysadmin/stations`. Maintenance toggle is off.
2. Admin clicks toggle. Confirmation modal opens.
3. Admin enters password. `PUT /sysadmin/maintenance { maintenance: true, password }` sent.
4. Server verifies password with `bcrypt.compare()`.
5. `UPDATE stations SET status = 3` — all stations updated simultaneously.
6. Event logged to `system_logs`.
7. Every customer now visiting `/customer/*` → `MaintenanceGuard` → `is_maintenance: true` → `MaintenancePage` replaces the entire UI.

---

## Maintenance Mode System

Four files coordinate to block customer access during maintenance.

### 1. `sysadmin.routes.ts` — The Toggle

`PUT /sysadmin/maintenance` requires `sys_admin` role and password confirmation. A single SQL statement updates all stations:

```sql
UPDATE stations SET status = 3  -- enable maintenance
UPDATE stations SET status = 1  -- disable maintenance
```

All-or-nothing by design — maintenance is a platform-wide event. Always logged to `system_logs`.

### 2. `settings.routes.ts` — The Status Check

`GET /settings/maintenance-status` reads the customer's station's `status` column and returns `{ is_maintenance: boolean }`. Placed before the `requireSuperAdmin` boundary so any authenticated user — including customers — can call it.

### 3. `MaintenanceGuard.tsx` — The Frontend Enforcer

Sits between `ProtectedRoute` and `CustomerLayout` in the router. Calls the status endpoint on mount. If `is_maintenance` is true, renders `MaintenancePage` — completely replacing the customer interface. On API error, defaults to false (allows customers through rather than locking everyone out).

### 4. `MaintenancePage.tsx` — The Customer Screen

Standalone page with no navigation. Animated water-drop icon, "Under Maintenance" heading, and a "Back to Home" link. Displayed whenever `MaintenanceGuard` intercepts.

---

## File Upload System

All uploads go to **Cloudinary** — a cloud media storage and CDN. The system migrated from local disk because Render's hosting uses an **ephemeral filesystem**: files written to disk are deleted when the server restarts or redeploys. Cloudinary images are permanent and served from a global CDN rather than from the Express server.

### Complete Upload Flow

1. Client selects a file. Form submits as `multipart/form-data`.
2. Express receives the request. `upload.single('fieldname')` (Multer) intercepts the file stream.
3. `CloudinaryStorage` streams the file directly to Cloudinary's API.
4. Cloudinary stores the file and returns the CDN URL.
5. Multer sets `req.file.path` to the CDN URL.
6. Route handler stores `req.file.path` in the database.
7. Frontend loads images directly from Cloudinary URLs.

### Upload Types

| Type | Cloudinary Folder | Database Column | Used In |
| :--- | :--- | :--- | :--- |
| Station logo | aqualastech/logos | stations.image_path | AdminLayout sidebar, SAStations |
| GCash QR code | aqualastech/qrcodes | stations.qr_code_path | CustomerOrder checkout |
| Product image | aqualastech/products | products.image_path | AdminInventory, CustomerOrder |
| Payment receipt | aqualastech/receipts | payments.receipt_path | AdminCustomerOrder payment view |
| Profile picture | aqualastech/avatars | users.profile_picture | Topbar, CustomerSettings |

### Migration Script

`server/src/scripts/migrateImagesToCloudinary.ts` is a one-time utility that reads existing local image paths from the database, uploads each file to Cloudinary, and updates the database with the new CDN URL.

```bash
DB_HOST=<host> DB_NAME=<db> DB_USER=<user> DB_PASSWORD=<pass> \
CLOUDINARY_CLOUD_NAME=<name> CLOUDINARY_API_KEY=<key> CLOUDINARY_API_SECRET=<secret> \
npx tsx src/scripts/migrateImagesToCloudinary.ts
```

---

## Notification System

Notifications are stored in the `notifications` table linked to a `user_id`. Always created server-side at key events — never by the frontend.

### When Notifications Are Created

| Event | Recipient | Type |
| :--- | :--- | :--- |
| Customer places order | Admin/Staff | order_update |
| Admin updates order status | Customer | order_update |
| Admin verifies payment | Customer | payment_update |
| Admin rejects payment | Customer | payment_update |
| Stock falls below min_stock_level | Admin/Staff | inventory_alert |
| Customer submits return request | Admin/Staff | order_update |
| Admin approves or rejects return | Customer | order_update |

### How the Frontend Reads Them

`AdminLayout` and `CustomerLayout` fetch notifications on mount. They track an unread count and a recent notification list for the dropdown. Clicking "Mark all read" sends a bulk update: `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`.

---

## Reports and Analytics

Aggregates `orders` and `order_items` data scoped to the admin's `station_id`.

### Period Options

| Period | Range | Grouping |
| :--- | :--- | :--- |
| daily | Last 30 days | One row per day |
| weekly | Last 12 weeks | One row per week |
| monthly | Last 12 months | One row per month |
| annually | Last 5 years | One row per year |

### Data Returned per Period

- Total revenue and total orders
- Completed (delivered) order count
- Per-period breakdown for the chart
- Best-selling products by quantity and by revenue

The Inventory modal fetches separately from `inventory` and shows real-time stock with color-coded severity: red = at or below `min_stock_level`, amber = within 20% above min, green = healthy.

---

## Point of Sale System

Handles walk-in customers at the counter — no customer account required.

### POS Flow

1. Staff opens `PointOfSale.tsx`. Active products shown as a clickable grid.
2. Staff clicks products to add to cart. Quantity controls. Running total in React state.
3. Staff selects Cash or GCash. Clicks Confirm.
4. `POST /pos/transaction` sent. Server inserts `pos_transactions` row and decrements `inventory.quantity`.
5. If stock drops below `min_stock_level`, an inventory alert notification is created.
6. Cart resets. Success confirmation shown.

POS transactions count as station revenue and appear in reports data.

---

## Environment Variables Reference

### Server — `server/.env`

| Variable | Example | Description |
| :--- | :--- | :--- |
| PORT | 8080 | Port Express listens on |
| DB_HOST | 127.0.0.1 | MySQL server hostname |
| DB_PORT | 3306 | MySQL port (Aiven uses a non-standard port) |
| DB_USER | root | MySQL username |
| DB_PASSWORD | yourpassword | MySQL password |
| DB_NAME | aqualastech | Database name (Aiven uses defaultdb) |
| DB_SSL | true | Set to true for Aiven (requires SSL) |
| JWT_KEY | a_long_random_secret | Signs and verifies JWTs — must never change in production |
| CLIENT_URL | https://your-app.vercel.app | Allowed frontend origin for CORS |
| MAIL_USER | you@gmail.com | Gmail address for password reset emails |
| MAIL_PASS | your_app_password | Gmail App Password (not your regular password) |
| MAIL_FROM | AquaLasTech \<you@gmail.com\> | Display name and address in outgoing emails |
| CLOUDINARY_CLOUD_NAME | yourcloudname | From the Cloudinary dashboard |
| CLOUDINARY_API_KEY | 123456789012345 | From the Cloudinary dashboard |
| CLOUDINARY_API_SECRET | your_api_secret | From the Cloudinary dashboard |
| NODE_ENV | production | Set to production on Render — activates secure cookie settings |

> **Critical:** `JWT_KEY` must be the same value every time the server starts. Changing it invalidates all existing tokens and signs out every logged-in user. Use a long random string (32+ characters) and never change it in production.

> **MAIL_PASS** must be a Gmail **App Password**, not your regular Gmail password. Generate one at: Google Account → Security → 2-Step Verification → App Passwords.

### Client — `client/.env`

| Variable | Example | Description |
| :--- | :--- | :--- |
| VITE_API_URL | http://localhost:8080 | Base URL of the backend API |
| VITE_FB_PAGE_URL | https://facebook.com/yourpage | Facebook page URL shown on the landing page |
| VITE_CONTACT_EMAIL | info@aqualas.com | Contact email on the landing page |
| VITE_CONTACT_PHONE | 09XXXXXXXXX | Contact phone on the landing page |

> All Vite variables must start with `VITE_`. They are embedded into the JavaScript bundle at build time and are readable in the browser. Never put secrets (database credentials, API keys) in the client `.env`.

---

## Enum Constants Reference

All numeric codes are defined in `server/src/constants/dbEnums.ts`.

### User Roles (`users.role`)

| Constant | Value | Label in UI |
| :--- | :--- | :--- |
| ROLE.CUSTOMER | 1 | Customer |
| ROLE.ADMIN | 2 | Staff |
| ROLE.SUPER_ADMIN | 3 | Store Owner |
| ROLE.SYS_ADMIN | 4 | System Admin |

### Station Status (`stations.status`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| STATION_STATUS.OPEN | 1 | Normal operation |
| STATION_STATUS.CLOSED | 2 | Temporarily closed |
| STATION_STATUS.MAINTENANCE | 3 | Maintenance active — customers blocked |

### Order Status (`orders.order_status`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| ORDER_STATUS.CONFIRMED | 1 | Order received, awaiting processing |
| ORDER_STATUS.PREPARING | 2 | Being prepared |
| ORDER_STATUS.OUT_FOR_DELIVERY | 3 | En route to the customer |
| ORDER_STATUS.DELIVERED | 4 | Delivered successfully (final) |
| ORDER_STATUS.CANCELLED | 5 | Cancelled before delivery (final) |
| ORDER_STATUS.RETURNED | 6 | Returned after delivery (final) |

Statuses 4, 5, and 6 are **final** — `isFinalOrderStatus()` returns `true` and the API rejects any attempt to change them.

### Payment Mode (`orders.payment_mode`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| PAYMENT_MODE.GCASH | 1 | GCash digital (requires receipt upload) |
| PAYMENT_MODE.CASH | 2 | Upfront cash |
| PAYMENT_MODE.CASH_ON_DELIVERY | 3 | Pay cash when order arrives |
| PAYMENT_MODE.CASH_ON_PICKUP | 4 | Pay cash when picking up at station |

### Payment Status (`payments.payment_status`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| PAYMENT_STATUS.PENDING | 1 | Awaiting admin verification |
| PAYMENT_STATUS.VERIFIED | 2 | Admin confirmed payment received |
| PAYMENT_STATUS.REJECTED | 3 | Admin rejected — customer must resubmit |

### Return Status (`order_returns.return_status`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| RETURN_STATUS.PENDING | 1 | Return request submitted |
| RETURN_STATUS.APPROVED | 2 | Admin approved — inventory unchanged |
| RETURN_STATUS.REJECTED | 3 | Admin rejected — order reverts to Out for Delivery |

### Inventory Transaction Type

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| TRANSACTION_TYPE.RESTOCK | 1 | Stock added |
| TRANSACTION_TYPE.DEDUCTION | 2 | Stock removed manually |
| TRANSACTION_TYPE.ADJUSTMENT | 3 | Stock set to exact value |

### Notification Type

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| NOTIFICATION_TYPE.ORDER_UPDATE | 1 | Order status changed |
| NOTIFICATION_TYPE.PAYMENT_UPDATE | 2 | Payment verified or rejected |
| NOTIFICATION_TYPE.INVENTORY_ALERT | 3 | Low stock warning |
| NOTIFICATION_TYPE.SYSTEM_MESSAGE | 4 | General system notification |

### System Log Event Types (`system_logs.event_type` — VARCHAR)

`event_type` is a VARCHAR string, not a TINYINT, because log entries must be readable without a lookup table.

| Value | Trigger |
| :--- | :--- |
| login | User logs in |
| logout | User logs out |
| station_created | System admin creates a station |
| station_updated | Station details changed |
| station_deleted | System admin deletes a station |
| user_created | Admin account created |
| user_updated | Account details changed |
| user_deleted | Account deleted |
| maintenance_on | System-wide maintenance enabled |
| maintenance_off | System-wide maintenance disabled |
| logs_cleared | Audit logs cleared |
| order_created | New order placed |
| order_updated | Order status changed |

---

## Deployment Guide

The production stack uses three cloud services: **Render** (backend), **Vercel** (frontend), and **Aiven** (MySQL). All have free tiers.

### Part 1 — Database (Aiven)

1. Create a free account at aiven.io.
2. Create a new **MySQL** service on the free plan. Wait for provisioning (a few minutes).
3. From the service overview, note the connection details: host, port, username, password. The database name on Aiven is `defaultdb`.
4. Connect with MySQL Workbench or a terminal client and import the schema:
   ```bash
   mysql -u <user> -p --host <host> --port <port> defaultdb < server/src/aqualastech_clean.sql
   ```
5. Aiven enforces SSL by default. Set `DB_SSL=true` in your server environment variables.

### Part 2 — Backend (Render)

1. Create a free account at render.com.
2. Click **New → Web Service**. Connect your GitHub repository.
3. Set **Root Directory** to `server`.
4. Set **Build Command** to `npm install && npm run build`.
5. Set **Start Command** to `npm start`.
6. Set **Branch** to `final` (or whichever branch Render watches).
7. Under **Environment Variables**, add all variables from the Server `.env` section above. Set `NODE_ENV=production`.
8. For `CLIENT_URL`, enter your Vercel URL once you have it from Part 3.
9. Click **Create Web Service**. Copy the Render URL (e.g. `https://your-app.onrender.com`).

> **Free-tier note:** Render spins down the server after 15 minutes of inactivity. The first request after that takes ~30 seconds to wake up. Paid plans keep the server always-on.

### Part 3 — Frontend (Vercel)

1. Create a free account at vercel.com.
2. Click **Add New → Project**. Import your GitHub repository.
3. Set **Root Directory** to `client`.
4. Set **Build Command** to `npm run build`. Set **Output Directory** to `dist`.
5. Set **Branch** to `main` (Vercel watches this branch).
6. Under **Environment Variables**, add:
   - `VITE_API_URL` → the Render backend URL from Part 2
   - `VITE_FB_PAGE_URL`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`
7. Click **Deploy**. Copy the Vercel URL.
8. Go back to Render → Environment Variables → set `CLIENT_URL` to the Vercel URL. Render redeploys automatically.

### Part 4 — Push Frontend Changes to Vercel

Vercel watches the `main` branch. Your active work is on the `final` branch. To update Vercel:

```bash
git push origin final:main
```

This pushes your local `final` branch to the remote `main` branch — Vercel picks it up automatically.

### Part 5 — Create the First System Admin

The system admin account must be created with the CLI script — there is no signup page for this role:

```bash
cd server
npm run admin:create
```

Interactive wizard prompts for name, email, and password. The account can log in at `/login` and will be redirected to `/sysadmin`.

### Part 6 — Create the First Station

From `/sysadmin/stations`, click **New Station** and fill in the details. This creates the station and its store owner account in a single database transaction. The store owner can then log in and configure the station (logo, QR code, products, staff accounts) from `/admin/settings`.

### Redeployment Summary

| What changed | Command | Who rebuilds |
| :--- | :--- | :--- |
| Backend code | `git push origin final` | Render (watches `final`) |
| Frontend code | `git push origin final:main` | Vercel (watches `main`) |
| Both | Run both commands | Both |

---

*This document covers the complete technical structure of AquaLasTech as of April 2026. For changes after this date, refer to the git history (`git log --oneline`) and the current source files. The source code is always the authoritative reference.*
