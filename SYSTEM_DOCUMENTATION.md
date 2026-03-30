#### AquaLasTech — Full System Documentation

> A complete technical and academic reference for understanding, installing, configuring, and mastering the AquaLasTech water refilling station management system.

---

##### Table of Contents

1. [[#Project Overview]]
2. [[#Technology Stack]]
3. [[#System Architecture]]
4. [[#Project Folder Structure]]
5. [[#Installation and Configuration]]
6. [[#Database Design]]
7. [[#Server — Deep Dive]]
8. [[#Client — Deep Dive]]
9. [[#Authentication and Authorization Flow]]
10. [[#Role-Based Access Control]]
11. [[#API Endpoints Reference]]
12. [[#Core Feature Walkthroughs]]
13. [[#Maintenance Mode System]]
14. [[#File Upload System]]
15. [[#Notification System]]
16. [[#Reports and Analytics]]
17. [[#Point of Sale System]]
18. [[#Environment Variables Reference]]
19. [[#Enum Constants Reference]]

---

##### Project Overview

**AquaLasTech** is a full-stack web application built to digitize and streamline the operations of water refilling stations. It serves four distinct user roles — **System Administrator**, **Super Admin**, **Admin**, and **Customer** — each with a dedicated interface and permission scope.

The system handles the full operational lifecycle of a water refilling station: from a customer browsing products and placing orders, to an admin managing inventory and processing payments, to a system administrator overseeing all stations and putting the platform into maintenance mode.

**Core capabilities of the system:**

- Customer-facing order placement with GCash and cash payment support
- Admin dashboard for managing orders, inventory, and point-of-sale transactions
- Super admin control over station settings, logo, QR codes, and staff accounts
- System admin control over all stations globally, with maintenance mode toggle and audit logs
- Real-time notifications for order status changes
- Auto-generated daily, weekly, monthly, and yearly sales reports
- Full RBAC (role-based access control) using JWT cookies

---

##### Technology Stack

##### Backend

| Technology | Version | Purpose |
| --- | --- | --- |
| **Node.js** | v20+ | JavaScript runtime for the server |
| **TypeScript** | ~5.9 | Strongly-typed superset of JavaScript |
| **Express.js** | ^5.2 | HTTP server and routing framework |
| **MySQL 2** | ^3.18 | Database driver for MySQL with promise support |
| **JSON Web Tokens (JWT)** | ^9.0 | Stateless authentication tokens |
| **bcrypt** | ^6.0 | Password hashing algorithm |
| **Multer** | ^2.1 | File upload middleware |
| **Nodemailer** | ^8.0 | Email sending (password reset) |
| **Helmet** | ^8.1 | HTTP security headers middleware |
| **CORS** | ^2.8 | Cross-Origin Resource Sharing control |
| **cookie-parser** | ^1.4 | Parses cookies from HTTP requests |
| **dotenv** | ^17.3 | Loads environment variables from `.env` |
| **tsx** | ^4.21 | TypeScript execution engine (development) |

##### Frontend

| Technology | Version | Purpose |
| --- | --- | --- |
| **React** | ^19.2 | UI component library |
| **TypeScript** | ~5.9 | Type-safe JavaScript for the frontend |
| **Vite** | ^7.3 | Build tool and development server |
| **React Router DOM** | ^7.13 | Client-side routing |
| **Axios** | ^1.13 | HTTP client for API requests |
| **TailwindCSS** | ^3.4 | Utility-first CSS framework |
| **Lucide React** | ^0.576 | Icon library |
| **React Icons** | ^5.5 | Additional icon packs (e.g. FcGoogle) |
| **Leaflet / React-Leaflet** | ^1.9 / ^5.0 | Interactive map for station location |
| **PostCSS** | ^8.5 | CSS transformation pipeline |
| **Autoprefixer** | ^10.4 | Automatically adds vendor CSS prefixes |

##### Database

| Technology | Purpose |
| --- | --- |
| **MySQL 8.0+** | Relational database for all persistent data |

##### Development Tools

| Tool | Purpose |
| --- | --- |
| **Nodemon** | Auto-restarts server on file change |
| **ESLint** | Linting for code quality |
| **Git** | Version control |

---

##### System Architecture

AquaLasTech follows a classic **three-tier architecture**: a React frontend (presentation), an Express API server (application logic), and a MySQL database (data layer). These three tiers are entirely decoupled and communicate over HTTP.

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                        │
│  React + Vite + TailwindCSS                                  │
│  - Renders UI components                                     │
│  - Manages routing (React Router)                            │
│  - Reads auth state from AuthContext                         │
│  - Sends HTTP requests via Axios (with credentials: true)    │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP/REST (JSON)
                       │  Cookies (JWT token)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER                         │
│  Node.js + TypeScript (port 8080)                            │
│  - Validates JWT tokens via verifyToken middleware           │
│  - Routes requests to handlers                               │
│  - Applies role-based authorization                          │
│  - Processes business logic                                  │
│  - Reads/writes from MySQL via connection pool               │
│  - Serves static uploads (/uploads/*)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │  mysql2 (TCP)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     MySQL DATABASE                           │
│  - Stores users, stations, orders, inventory, logs           │
│  - Optimized with TINYINT enums and VARCHAR limits           │
└─────────────────────────────────────────────────────────────┘
```

**Communication pattern:**
- The frontend always uses `withCredentials: true` in Axios, which means the browser automatically attaches the JWT cookie on every request.
- The server reads the token from the cookie (not the `Authorization` header), so there is no need for localStorage or manual token management.
- CORS is configured to only allow requests from `http://localhost:5173` (the Vite dev server) with credentials.

---

##### Project Folder Structure

##### Root

```
AquaLasTech/
├── client/          ← React + Vite frontend
├── server/          ← Express + TypeScript backend
└── SYSTEM_DOCUMENTATION.md
```

##### Client Directory

```
client/
├── public/
│   └── vite.svg
├── src/
│   ├── api/
│   │   └── axios.ts                   ← Pre-configured Axios instance
│   ├── assets/
│   │   ├── aqualastech-logo.png       ← Logo with background
│   │   ├── aqualastech-logo-noBG.png  ← Transparent logo
│   │   ├── ALT_FONT.png               ← Hero title image
│   │   ├── water-bg.jpg               ← Hero background texture
│   │   └── favicon_io/                ← Browser favicons
│   ├── components/
│   │   ├── LocationMap.tsx            ← Leaflet map for GPS coordinates
│   │   ├── MaintenanceGuard.tsx       ← Blocks customers during maintenance
│   │   ├── ProfileAvatarUpload.tsx    ← Profile picture upload UI
│   │   ├── SuperAdminRoute.tsx        ← Restricts routes to super_admin
│   │   ├── Topbar.tsx                 ← Top header bar
│   │   └── ui/
│   │       ├── InputField.tsx         ← Reusable labeled input
│   │       └── WaterLoader.tsx        ← Water-themed spinner
│   ├── context/
│   │   └── AuthContext.tsx            ← Global authentication state
│   ├── hooks/
│   │   └── useStation.ts              ← Fetches current station data
│   ├── layout/
│   │   ├── AdminLayout.tsx            ← Sidebar + topbar for admins
│   │   ├── CustomerLayout.tsx         ← Bottom nav for customers
│   │   ├── MainLayout.tsx             ← Minimal wrapper for public pages
│   │   └── SystemAdminLayout.tsx      ← Side nav for system admins
│   ├── pages/
│   │   ├── LandingPage.tsx            ← Marketing/home page
│   │   ├── LandingPage.css            ← Landing page custom CSS
│   │   ├── LoginPage.tsx              ← Login form
│   │   ├── SignupPage.tsx             ← Registration form
│   │   ├── ForgotPasswordPage.tsx     ← Email-based password reset
│   │   ├── ResetPasswordPage.tsx      ← Token-validated password reset
│   │   ├── MaintenancePage.tsx        ← Shown to customers during maintenance
│   │   ├── NotFoundPage.tsx           ← 404 page
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx     ← Sales overview + inventory modal
│   │   │   ├── AdminCustomerOrder.tsx ← Order management table
│   │   │   ├── AdminInventory.tsx     ← Stock control panel
│   │   │   ├── AdminSettings.tsx      ← Station config (super_admin only)
│   │   │   └── PointOfSale.tsx        ← Walk-in customer POS
│   │   ├── customer/
│   │   │   ├── CustomerDashboard.tsx  ← Order history overview
│   │   │   ├── CustomerOrder.tsx      ← Product catalog + checkout
│   │   │   └── CustomerSettings.tsx   ← Profile management
│   │   └── system-admin/
│   │       ├── SAStations.tsx         ← All station management
│   │       └── SALogs.tsx             ← System audit log viewer
│   ├── routes/
│   │   ├── router.tsx                 ← All client-side routes
│   │   └── ProtectedRoute.tsx         ← Role-enforced route wrapper
│   ├── main.tsx                       ← React entry point
│   └── index.css                      ← Global CSS
├── vite.config.ts                     ← Vite bundler configuration
├── tailwind.config.cjs                ← TailwindCSS theme
├── postcss.config.cjs                 ← PostCSS pipeline
├── tsconfig.json                      ← Root TypeScript config
├── package.json                       ← Frontend dependencies
└── .env                               ← Environment variables
```

##### Server Directory

```
server/
├── src/
│   ├── app.ts                         ← Express setup: middleware, routes
│   ├── server.ts                      ← HTTP server startup (port 8080)
│   ├── config/
│   │   └── db.ts                      ← MySQL connection pool
│   ├── constants/
│   │   └── dbEnums.ts                 ← All TINYINT enum mappings
│   ├── middleware/
│   │   ├── verifyToken.middleware.ts  ← JWT validation from cookie
│   │   ├── auth.middleware.ts         ← Auth wrapper
│   │   └── role.middleware.ts         ← Role-based access helper
│   ├── routes/
│   │   ├── auth.routes.ts             ← /auth/* login, signup, logout
│   │   ├── user.routes.ts             ← /users/* profile endpoints
│   │   ├── station.routes.ts          ← /stations/* admin CRUD
│   │   ├── station.customer.routes.ts ← /stations/* customer-facing reads
│   │   ├── product.routes.ts          ← /products/* catalog
│   │   ├── inventory.routes.ts        ← /inventory/* stock management
│   │   ├── order.routes.ts            ← /orders/* full order lifecycle
│   │   ├── pos.routes.ts              ← /pos/* walk-in transactions
│   │   ├── customer.routes.ts         ← /customer/* profile actions
│   │   ├── settings.routes.ts         ← /settings/* station config
│   │   ├── reports.routes.ts          ← /reports/* analytics
│   │   ├── sysadmin.routes.ts         ← /sysadmin/* global controls
│   │   └── seedOrders.ts              ← Dev seed script
│   ├── scripts/
│   │   ├── createAdmin.ts             ← CLI: create an admin account
│   │   ├── createStation.ts           ← CLI: create a station
│   │   ├── ManageAdmins.ts            ← CLI: admin management menu
│   │   └── ManageStations.ts          ← CLI: station management menu
│   └── utils/
│       └── generateReference.ts       ← Unique order reference generator
├── uploads/                           ← Uploaded files (gitignored)
│   ├── stations/                      ← Station logos
│   ├── products/                      ← Product images
│   ├── qrcodes/                       ← GCash QR codes
│   └── receipts/                      ← GCash payment receipts
├── tsconfig.json                      ← TypeScript config
├── package.json                       ← Backend dependencies
├── nodemon.json                       ← Auto-reload config
└── .env                               ← Environment variables
```

---

##### Installation and Configuration

##### Prerequisites

Before running the project, ensure you have the following installed on your machine:

- **Node.js** v20 or higher — [nodejs.org](https://nodejs.org)
- **MySQL** 8.0 or higher — [mysql.com](https://mysql.com)
- **Git** — for cloning the repository

##### Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd AquaLasTech
```

##### Step 2 — Set Up the Database

Open MySQL Workbench or your terminal MySQL client and create the database:

```sql
CREATE DATABASE aqualastech;
USE aqualastech;
```

Then import the schema. Use the clean schema file located at:

```
server/src/aqualastech_clean.sql
```

Run it via terminal:

```bash
mysql -u root -p aqualastech < server/src/aqualastech_clean.sql
```

This creates all required tables: `users`, `stations`, `products`, `inventory`, `orders`, `order_items`, `payments`, `pos_transactions`, `notifications`, `system_logs`, and more.

##### Step 3 — Configure the Server Environment

Navigate to the `server/` directory and create a `.env` file:

```bash
cd server
cp .env.example .env   # if example exists, otherwise create manually
```

Edit `.env` with the following values:

```env
PORT=8080
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=aqualastech
JWT_KEY=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=AquaLasTech <your_email@gmail.com>
```

> **Note on MAIL_PASS:** This should be a Gmail App Password, not your regular Gmail password. Generate it from Google Account → Security → 2-Step Verification → App Passwords.

##### Step 4 — Configure the Client Environment

Navigate to the `client/` directory and create a `.env` file:

```env
VITE_API_URL=http://localhost:8080
VITE_FB_PAGE_URL=https://www.facebook.com/your-page
VITE_CONTACT_EMAIL=your@email.com
VITE_CONTACT_PHONE=09XXXXXXXXX
```

##### Step 5 — Install Dependencies

Install both server and client dependencies separately:

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

##### Step 6 — Create the System Administrator Account

The system admin (the topmost role) must be created manually using the CLI script:

```bash
cd server
npm run station:create
```

This launches an interactive terminal wizard that creates a station and its associated super admin account.

To create a standalone system admin:

```bash
npm run admin:create
```

##### Step 7 — Run the Application

Open **two terminal windows** and run:

**Terminal 1 — Server:**
```bash
cd server
npm run dev
```

The server starts at `http://localhost:8080`

**Terminal 2 — Client:**
```bash
cd client
npm run dev
```

The frontend starts at `http://localhost:5173`

##### Step 8 — Build for Production

```bash
# Server
cd server
npm run build
npm start

# Client
cd client
npm run build
```

The client build outputs to `client/dist/`. The server compiles TypeScript to `server/dist/`.

---

##### Database Design

##### Overview

The database uses **MySQL 8.0+** with a relational schema optimized for storage efficiency. All status-type columns use **TINYINT** instead of VARCHAR enums, which reduces storage by approximately 90% while maintaining full readability through the `dbEnums.ts` constants file.

##### Core Tables

##### `users`
The central identity table for all accounts in the system.

| Column | Type | Description |
| --- | --- | --- |
| `user_id` | INT AUTO_INCREMENT | Primary key |
| `full_name` | VARCHAR(100) | Display name |
| `email` | VARCHAR(150) | Unique login identifier |
| `password_hash` | VARCHAR(255) | bcrypt-hashed password |
| `role` | TINYINT | 1=customer, 2=admin, 3=super_admin, 4=sys_admin |
| `account_status` | TINYINT | 1=active, 2=suspended, 3=deleted |
| `profile_picture` | VARCHAR(500) | Path to uploaded avatar |
| `created_at` | DATETIME | Account creation timestamp |
| `updated_at` | DATETIME | Last modification timestamp |

##### `stations`
Represents each individual water refilling station in the network.

| Column | Type | Description |
| --- | --- | --- |
| `station_id` | INT AUTO_INCREMENT | Primary key |
| `station_name` | VARCHAR(150) | Display name |
| `address` | VARCHAR(500) | Short address from GPS |
| `complete_address` | VARCHAR(500) | Full address with landmarks |
| `contact_number` | VARCHAR(20) | Station contact phone |
| `latitude` | DECIMAL(10,8) | GPS latitude |
| `longitude` | DECIMAL(11,8) | GPS longitude |
| `status` | TINYINT | 1=open, 2=closed, 3=maintenance |
| `image_path` | VARCHAR(500) | Station logo path |
| `qr_code_path` | VARCHAR(500) | GCash QR code path |
| `created_at` | DATETIME | — |
| `updated_at` | DATETIME | — |

##### `admins`
Junction table linking users to stations. A user with `role=2` (admin) or `role=3` (super_admin) must have an entry here.

| Column | Type | Description |
| --- | --- | --- |
| `admin_id` | INT AUTO_INCREMENT | Primary key |
| `user_id` | INT FK → users | The admin user |
| `station_id` | INT FK → stations | Their assigned station |

##### `customers`
Extended profile for customer-role users, storing address and location.

| Column | Type | Description |
| --- | --- | --- |
| `customer_id` | INT AUTO_INCREMENT | Primary key |
| `user_id` | INT FK → users | The customer user |
| `address` | VARCHAR(500) | Delivery address |
| `complete_address` | VARCHAR(500) | Additional address details |
| `latitude` | DECIMAL(10,8) | Customer GPS latitude |
| `longitude` | DECIMAL(11,8) | Customer GPS longitude |

##### `products`
The catalog of products available at a station.

| Column | Type | Description |
| --- | --- | --- |
| `product_id` | INT AUTO_INCREMENT | Primary key |
| `station_id` | INT FK → stations | Which station sells this |
| `product_name` | VARCHAR(150) | Display name |
| `description` | VARCHAR(500) | Product details |
| `price` | DECIMAL(10,2) | Selling price |
| `cost_price` | DECIMAL(10,2) | Purchase cost (for profit tracking) |
| `unit_type` | TINYINT | 1=liter, 2=gallon, 3=piece |
| `image_path` | VARCHAR(500) | Product photo path |
| `is_active` | TINYINT(1) | Whether the product is listed |

##### `inventory`
Current stock levels per product per station.

| Column | Type | Description |
| --- | --- | --- |
| `inventory_id` | INT AUTO_INCREMENT | Primary key |
| `station_id` | INT FK → stations | Which station |
| `product_id` | INT FK → products | Which product |
| `quantity` | INT | Current units in stock |
| `min_stock_level` | INT | Alert threshold |
| `updated_at` | DATETIME | Last stock change |

##### `inventory_transactions`
Audit trail of every stock movement (restock, deduction, adjustment).

| Column | Type | Description |
| --- | --- | --- |
| `transaction_id` | INT AUTO_INCREMENT | Primary key |
| `inventory_id` | INT FK → inventory | Target inventory record |
| `transaction_type` | TINYINT | 1=restock, 2=deduction, 3=adjustment |
| `quantity_change` | INT | Positive or negative change |
| `notes` | VARCHAR(500) | Reason for transaction |
| `created_at` | DATETIME | Timestamp |

##### `orders`
Customer delivery/pickup orders.

| Column | Type | Description |
| --- | --- | --- |
| `order_id` | INT AUTO_INCREMENT | Primary key |
| `customer_id` | INT FK → users | Ordering customer |
| `station_id` | INT FK → stations | Fulfilling station |
| `order_reference` | VARCHAR(20) | Human-readable order ID |
| `order_status` | TINYINT | 1–6 (confirmed → returned) |
| `payment_mode` | TINYINT | 1=gcash, 2=cash, 3=COD, 4=COP |
| `payment_status` | TINYINT | 1=pending, 2=verified, 3=rejected |
| `total_amount` | DECIMAL(10,2) | Order total |
| `delivery_address` | VARCHAR(500) | Delivery destination |
| `notes` | VARCHAR(500) | Customer instructions |
| `created_at` | DATETIME | Order placement time |
| `updated_at` | DATETIME | Last status change |

##### `order_items`
Line items within each order.

| Column | Type | Description |
| --- | --- | --- |
| `item_id` | INT AUTO_INCREMENT | Primary key |
| `order_id` | INT FK → orders | Parent order |
| `product_id` | INT FK → products | Product ordered |
| `quantity` | INT | Quantity of product |
| `unit_price` | DECIMAL(10,2) | Price at time of order |
| `subtotal` | DECIMAL(10,2) | quantity × unit_price |

##### `payments`
Payment records linked to orders, supports GCash receipt uploads.

| Column | Type | Description |
| --- | --- | --- |
| `payment_id` | INT AUTO_INCREMENT | Primary key |
| `order_id` | INT FK → orders | Related order |
| `payment_mode` | TINYINT | 1=gcash, 2=cash, etc. |
| `payment_status` | TINYINT | 1=pending, 2=verified, 3=rejected |
| `amount` | DECIMAL(10,2) | Amount paid |
| `reference_number` | VARCHAR(100) | GCash reference code |
| `receipt_path` | VARCHAR(500) | Uploaded receipt image |
| `verified_at` | DATETIME | When admin verified |

##### `pos_transactions`
Walk-in in-store transactions processed through the POS system.

| Column | Type | Description |
| --- | --- | --- |
| `pos_id` | INT AUTO_INCREMENT | Primary key |
| `station_id` | INT FK → stations | Processed at |
| `admin_id` | INT FK → users | Who processed it |
| `product_id` | INT FK → products | Product sold |
| `quantity` | INT | Units sold |
| `unit_price` | DECIMAL(10,2) | Price at time of sale |
| `total_amount` | DECIMAL(10,2) | Total transaction |
| `payment_method` | TINYINT | 1=cash, 2=gcash |
| `transaction_status` | TINYINT | 1=completed, 2=cancelled |
| `created_at` | DATETIME | Transaction time |

##### `notifications`
In-app notifications for users.

| Column | Type | Description |
| --- | --- | --- |
| `notification_id` | INT AUTO_INCREMENT | Primary key |
| `user_id` | INT FK → users | Recipient |
| `message` | VARCHAR(500) | Notification text |
| `notification_type` | TINYINT | 1=order, 2=payment, 3=inventory, 4=system |
| `is_read` | TINYINT(1) | 0=unread, 1=read |
| `created_at` | DATETIME | When created |

##### `system_logs`
Immutable audit trail of all significant system events.

| Column | Type | Description |
| --- | --- | --- |
| `log_id` | INT AUTO_INCREMENT | Primary key |
| `event_type` | VARCHAR(50) | e.g. 'login', 'station_created' |
| `description` | VARCHAR(500) | Human-readable event description |
| `user_id` | INT FK → users | Who triggered the event |
| `ip_address` | VARCHAR(50) | Source IP (if tracked) |
| `created_at` | DATETIME | Event timestamp |

---

##### Server — Deep Dive

##### Entry Point: `server.ts`

This is the very first file that runs. It loads environment variables using `dotenv`, imports the configured Express `app`, and starts the HTTP listener on the specified port (default `8080`).

```typescript
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

##### Application Setup: `app.ts`

This file is the heart of the Express configuration. It is responsible for:

1. **CORS** — Only allows the frontend origin (`http://localhost:5173`) with credentials. This means cookies are allowed cross-origin.
2. **Helmet** — Adds security headers to every response. Configured with `crossOriginResourcePolicy: { policy: "cross-origin" }` to allow images from `uploads/` to be displayed on the frontend.
3. **cookie-parser** — Parses the `Cookie` header on incoming requests so `req.cookies.token` is accessible.
4. **express.json()** — Parses JSON request bodies.
5. **Static file serving** — The `uploads/` directory is served as public static files at the `/uploads` URL path. This allows profile pictures, product images, station logos, and GCash QR codes to be loaded directly by the browser.
6. **Route mounting** — Every route module is registered under its own URL prefix.

```typescript
// Route mounting in app.ts
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

##### Database Connection: `config/db.ts`

The database module maintains a **singleton connection pool** using `mysql2/promise`. The first time `connectToDatabase()` is called, it creates a pool of up to 10 connections. Every subsequent call reuses the same pool. This avoids the overhead of opening a new connection for each request.

```typescript
let connection; // singleton pool

export const connectToDatabase = async () => {
    if (!connection) {
        connection = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
        });
    }
    return connection;
};
```

**How routes use it:**

```typescript
const db = await connectToDatabase();
const [rows]: any = await db.query('SELECT * FROM users WHERE user_id = ?', [id]);
```

The parameterized query (`?` placeholders) automatically prevents SQL injection.

##### Middleware: `verifyToken.middleware.ts`

This is the most important middleware in the system. It intercepts every protected request and validates the JWT token stored in the `token` cookie.

```typescript
export const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded; // attaches user data to the request
        next();
    } catch {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
```

After this middleware runs, all subsequent route handlers can access `req.user` which contains:

```typescript
{
    id: number,           // user_id
    email: string,
    role: string,         // 'customer' | 'admin' | 'super_admin' | 'sys_admin'
    station_id: number    // for admins and super_admins
}
```

##### Route Files

Each route file is a modular Express Router. They are grouped by functionality:

##### `auth.routes.ts` — `/auth/*`

Handles the entire authentication lifecycle.

- `POST /auth/signup` — Creates a new customer account. Hashes the password with `bcrypt`, inserts into `users` and `customers` tables.
- `POST /auth/login` — Validates email and password. If correct, creates a JWT signed with `JWT_KEY`, sets it as an `httpOnly` cookie (not accessible by JavaScript), and returns user data. The cookie has a 7-day expiry.
- `POST /auth/logout` — Clears the token cookie by setting it to an empty string with `maxAge: 0`.
- `GET /auth/me` — Reads the cookie, verifies the token, and returns the current user's full profile from the database.

**Why httpOnly cookies?** Because JavaScript cannot read httpOnly cookies, they are immune to XSS attacks. The browser sends them automatically on every request.

##### `order.routes.ts` — `/orders/*`

Manages the full order lifecycle from placement to delivery or return. Key logic:

- **Order placement** — Validates stock, creates an `order`, inserts `order_items`, deducts inventory, and creates a `notification` for the admin.
- **Status updates** — Only allowed status transitions are permitted (e.g., you cannot set an order from `delivered` back to `confirmed`). Uses `isFinalOrderStatus()` from `dbEnums.ts`.
- **Payment verification** — Admin marks a payment as `verified` (TINYINT 2) or `rejected` (TINYINT 3). This updates both the `payments` and `orders` tables.
- **Return requests** — Customer can request a return after delivery. Admin approves or rejects it.

##### `inventory.routes.ts` — `/inventory/*`

Controls stock levels with a complete audit trail.

- **Restock** — Increases `quantity` in `inventory`, logs a `TRANSACTION_TYPE.RESTOCK` entry in `inventory_transactions`.
- **Deduction** — Decreases quantity, logs `TRANSACTION_TYPE.DEDUCTION`.
- **Adjustment** — Sets quantity to an exact number, logs `TRANSACTION_TYPE.ADJUSTMENT`.
- **Low stock alerts** — When quantity falls below `min_stock_level`, a notification is automatically created for the admin.

##### `pos.routes.ts` — `/pos/*`

Handles walk-in customer transactions directly at the station.

- Creates a `pos_transactions` record.
- Deducts from `inventory` just like a regular order.
- Supports both cash and GCash payments.
- Does not create a customer account — it is a direct sale.

##### `settings.routes.ts` — `/settings/*`

Two-tier access control within this single route file:

1. **Before the super_admin guard:** `GET /settings/maintenance-status` is accessible to any authenticated user (customers and admins alike). This is intentional — customers need to check if their station is in maintenance when they log in.

2. **After the super_admin guard:** All other settings endpoints (update station info, upload logo, upload QR, manage admins) require `role = 'super_admin'`. The guard middleware is mounted with `router.use(guard)`, which applies it to all routes defined after that line.

##### `sysadmin.routes.ts` — `/sysadmin/*`

Exclusively for the `sys_admin` role. Uses an inline `requireSysAdmin` middleware that checks `req.user.role`.

- `PUT /sysadmin/maintenance` — Toggles ALL stations' `status` column between `1` (open) and `3` (maintenance). Requires password confirmation. Logs the event to `system_logs`.
- `GET /sysadmin/stations` — Returns all stations with their assigned super admin.
- `POST /sysadmin/stations` — Creates a new station AND its super admin account in a single database transaction. Rolls back if any step fails.
- `DELETE /sysadmin/stations/:id` — Deletes a station and all its data. Requires password confirmation.
- `GET /sysadmin/logs` — Returns the latest 200 system log entries.
- `DELETE /sysadmin/logs` — Clears all logs. Requires password confirmation.

##### `reports.routes.ts` — `/reports/*`

Generates aggregated sales and performance data for the admin dashboard.

- Accepts a `?period=daily|weekly|monthly|yearly` query parameter.
- Queries `orders` and `order_items` filtered by `station_id` and date range.
- Returns: total revenue, total orders, best-selling products, revenue per day (for charting).

##### Constants: `dbEnums.ts`

This file is the single source of truth for all numeric status codes used in the database. Instead of using magic numbers like `3` scattered throughout the codebase, all code uses named constants:

```typescript
export const ORDER_STATUS = {
    CONFIRMED: 1,
    PREPARING: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
    CANCELLED: 5,
    RETURNED: 6,
};
```

This makes the code self-documenting and prevents bugs from misremembered numbers.

---

##### Client — Deep Dive

##### Entry Point: `main.tsx`

The entire React application starts here. It wraps everything in two providers:

1. **`AuthProvider`** — Makes the authenticated user available to every component in the tree via `useAuth()`.
2. **`RouterProvider`** — Initializes the React Router with the `router` configuration from `router.tsx`.

```typescript
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>
);
```

##### Authentication Context: `context/AuthContext.tsx`

This is the global state manager for authentication. When the app first loads, it fires an Axios GET to `/auth/me` to check if there is a valid cookie session. If yes, it stores the user object in state. If no, it stores `null`.

Any component anywhere in the app can call `useAuth()` to get:

```typescript
const { user, loading, setUser } = useAuth();
// user  → the full user object, or null if not logged in
// loading → true while the initial /auth/me check is pending
// setUser → used to update state after login or logout
```

This avoids prop-drilling and keeps auth state in one place.

##### Routing: `routes/router.tsx`

Uses React Router v7's `createBrowserRouter`. Routes are organized into four groups based on layout and access level:

**Public routes (`/`)** — wrapped in `MainLayout`. No authentication required. Accessible to everyone.

**Admin routes (`/admin/*`)** — wrapped in `ProtectedRoute role="admin"` then `AdminLayout`. Any user with `role=admin` or `role=super_admin` can access these. The `settings` sub-route is additionally wrapped in `SuperAdminRoute` which further restricts it to `super_admin` only.

**Customer routes (`/customer/*`)** — wrapped in `ProtectedRoute role="customer"` then `MaintenanceGuard` then `CustomerLayout`. Customers are blocked if their station is in maintenance mode.

**System admin routes (`/sysadmin/*`)** — wrapped in `ProtectedRoute role="sys_admin"` then `SystemAdminLayout`.

##### Protected Route: `routes/ProtectedRoute.tsx`

This component reads `user` from `AuthContext`. While loading, it renders nothing (or a spinner). If the user is not logged in, it redirects to `/login`. If the user's role does not match the required role, it redirects to `/login` as well.

```typescript
// Simplified logic
if (loading) return <WaterLoader />
if (!user) return <Navigate to="/login" />
if (!hasRequiredRole(user.role, requiredRole)) return <Navigate to="/login" />
return <Outlet />
```

##### Layouts

Layouts are shell components. They render the navigation chrome (sidebar, bottom nav, topbar) and an `<Outlet />` which is where the current page component renders.

- **`MainLayout`** — A minimal wrapper with a light blue background. No navigation. Used for public pages.
- **`AdminLayout`** — A full sidebar navigation with links to Dashboard, Orders, POS, Inventory, and Settings. Includes a notification bell with a dropdown panel. Reads the station name using `useStation()`. Has a hamburger menu for mobile.
- **`CustomerLayout`** — A mobile-first bottom navigation bar with Home, Orders, and Settings. Also has a notification bell. Has logout functionality.
- **`SystemAdminLayout`** — A clean sidebar with Stations and Logs links. Shows the system admin's name. Has a mobile drawer for small screens.

##### Custom Hook: `hooks/useStation.ts`

This hook encapsulates fetching the station data for an admin. It accepts a `stationId` and returns `{ station, loading, refetch }`.

The `refetch` function uses a `tick` counter trick — incrementing it causes `useEffect` to re-run, which re-fetches the station data. This is used in `AdminSettings` after a logo or station info update, so the UI reflects the change immediately without requiring a page reload.

##### Pages — Admin

##### `admin/AdminDashboard.tsx`

The main overview page for admins. Key elements:

- **Stats cards** — Total orders today, revenue today, pending orders, low stock count.
- **Order status breakdown** — Counts of orders by status.
- **Daily breakdown modal** — Shows a day-by-day revenue table for the current period.
- **Inventory modal** — Opens a panel showing all products with their current stock levels, color-coded by severity (red = critical, amber = warning, green = ok), sorted by critically low first.
- **Refresh button** — Re-fetches dashboard data on demand.

##### `admin/AdminCustomerOrder.tsx`

The order management interface. Admins can:

- View all orders for their station, filterable by status.
- Click an order to expand it and see all items, customer details, payment info.
- Update order status (e.g., `Preparing → Out for Delivery`).
- Verify or reject GCash payments, with receipt image viewing.
- Approve or reject return requests.

##### `admin/AdminInventory.tsx`

Full stock management UI. Admins can:

- See all products and their current quantities.
- Add stock (restock transaction).
- Deduct stock (deduction transaction).
- Adjust stock to an exact value.
- View transaction history per product.
- Add and manage products (name, price, image, unit type).

##### `admin/PointOfSale.tsx`

Walk-in customer sales terminal. Designed to be fast and simple:

- Displays product grid.
- Click a product to add to cart.
- Select quantity per item.
- Choose payment method (cash or GCash).
- Confirm sale → deducts inventory and records a `pos_transaction`.

##### `admin/AdminSettings.tsx`

Station configuration panel, visible only to `super_admin`. Allows:

- Updating station name, address, contact number, and GPS coordinates.
- Uploading a station logo image.
- Uploading a GCash QR code for payments.
- Managing admin accounts (create new admin, delete existing admins with password confirmation).

##### Pages — Customer

##### `customer/CustomerOrder.tsx`

The product catalog and checkout flow. The full order journey from this page:

1. Customer browses the product grid.
2. Adds items to cart (client-side state).
3. Selects payment method (GCash, cash, COD, cash on pickup).
4. For GCash: uploads a screenshot of the payment receipt.
5. Submits order → POST `/orders`.
6. Order confirmation message appears.

##### `customer/CustomerDashboard.tsx`

A summary of recent orders with their current statuses. Quick navigation to place a new order.

##### `customer/CustomerSettings.tsx`

Profile management: update name, address, GPS coordinates, and profile picture.

##### Pages — System Admin

##### `system-admin/SAStations.tsx`

The primary tool for the system administrator. Features:

- **Station grid** — All registered stations with their status badge (open/closed/maintenance), contact info, GPS coordinates, and assigned super admin.
- **New Station button** — Opens a modal to create a station and its super admin in one step. Includes a Leaflet map for GPS pinning, address autocomplete via OpenStreetMap Nominatim, and a reverse geocoding fallback.
- **Delete station** — Password-confirmed deletion that cascades to products and inventory.
- **Maintenance toggle** — In the header. A single toggle that switches ALL stations' status between `open` and `maintenance`. Opens a confirmation modal requiring password entry.
- **Maintenance banner** — Displayed at the top of the page when maintenance is active.

##### `system-admin/SALogs.tsx`

A read-only audit log viewer. Shows the last 200 system events with event type, description, actor name, and timestamp. Has a "Clear Logs" action with password confirmation.

---

##### Authentication and Authorization Flow

##### Login Flow (Step by Step)

1. User enters email and password on `LoginPage.tsx`.
2. Frontend sends `POST /auth/login` with `{ email, password }`.
3. Server queries `users` table for a matching email.
4. Server calls `bcrypt.compare(password, stored_hash)`.
5. If the hash matches, server creates a JWT payload:
   ```json
   {
     "id": 5,
     "email": "admin@station1.com",
     "role": "super_admin",
     "station_id": 2
   }
   ```
6. Server signs the JWT with `JWT_KEY` and an expiry of 7 days.
7. Server sets the JWT as an **httpOnly cookie**:
   ```http
   Set-Cookie: token=eyJ...; HttpOnly; Path=/; Max-Age=604800
   ```
8. Frontend receives `{ user: { ... } }` in the response body.
9. `AuthContext` calls `setUser(response.data.user)`.
10. React Router redirects to the appropriate dashboard based on role.

##### Request Authentication Flow (Every Protected Request)

1. Browser sends request to, e.g., `GET /orders`.
2. Browser automatically attaches the `token` cookie (because `withCredentials: true` is set in Axios).
3. Express `verifyToken` middleware runs.
4. `jwt.verify(token, JWT_KEY)` is called. If invalid or expired, returns `403`.
5. If valid, `req.user` is populated with the decoded token payload.
6. Route handler executes and uses `req.user.station_id` to scope queries.

##### Logout Flow

1. Frontend calls `POST /auth/logout`.
2. Server sets the cookie to an empty string with `maxAge: 0`, effectively deleting it.
3. Frontend calls `setUser(null)`.
4. React Router redirects to `/login`.

---

##### Role-Based Access Control

The system enforces four levels of access:

##### Level 1 — Customer (`role = 1`)

- Can access `/customer/*` routes only.
- Can only see products from their assigned station.
- Can place orders, track orders, request returns.
- Cannot see other customers' orders.
- Blocked from customer routes if station is in maintenance.

##### Level 2 — Admin (`role = 2`)

- Can access `/admin/*` routes.
- All queries are scoped by `station_id` from the JWT token. They can never see or modify data from another station.
- Can manage orders, inventory, and process POS transactions.
- Cannot access `AdminSettings` (super_admin only).

##### Level 3 — Super Admin (`role = 3`)

- Same as admin, but also has access to `AdminSettings`.
- Can create and delete admin accounts.
- Can configure station details, logo, GCash QR.
- The `SuperAdminRoute` component and the `super_admin` guard middleware in `settings.routes.ts` enforce this.

##### Level 4 — System Admin (`role = 4`)

- Accesses `/sysadmin/*` only. Has no dashboard for individual station management.
- Can see ALL stations across the entire network.
- Can create and delete entire stations (with their admins).
- Can toggle system-wide maintenance mode.
- Can view and clear the global audit log.
- Enforced by `requireSysAdmin` inline middleware in `sysadmin.routes.ts`.

---

##### API Endpoints Reference

##### Authentication — `/auth`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/signup` | None | Register a new customer account |
| POST | `/auth/login` | None | Login, receive JWT cookie |
| POST | `/auth/logout` | Cookie | Clear JWT cookie |
| GET | `/auth/me` | Cookie | Get current logged-in user |

##### Stations — `/stations`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/stations` | Any | List all stations |
| GET | `/stations/:id` | Any | Get station details |
| POST | `/stations` | super_admin | Create new station |
| PUT | `/stations/:id` | admin+ | Update station info |

##### Inventory — `/inventory`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/inventory` | admin+ | Get stock levels for station |
| POST | `/inventory/restock` | admin+ | Add stock to a product |
| POST | `/inventory/deduction` | admin+ | Remove stock from a product |
| POST | `/inventory/adjustment` | admin+ | Set exact stock level |
| GET | `/inventory/transactions` | admin+ | View stock movement history |

##### Orders — `/orders`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/orders` | customer | Place a new order |
| GET | `/orders` | admin/customer | List orders (scoped by role) |
| GET | `/orders/:id` | admin/customer | View specific order |
| PUT | `/orders/:id/status` | admin+ | Update order status |
| PUT | `/orders/:id/payment` | admin+ | Verify or reject payment |
| POST | `/orders/:id/cancel` | customer | Cancel an order |
| POST | `/orders/:id/return` | customer | Request a return |
| PUT | `/orders/:id/return` | admin+ | Approve or reject return |

##### POS — `/pos`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/pos/transaction` | admin+ | Process walk-in sale |
| GET | `/pos/history` | admin+ | View POS transaction history |

##### Settings — `/settings`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/settings/maintenance-status` | Any | Check if station is in maintenance |
| PUT | `/settings/station/:id` | super_admin | Update station details |
| POST | `/settings/station/:id/upload-logo` | super_admin | Upload station logo |
| POST | `/settings/station/:id/upload-qr` | super_admin | Upload GCash QR code |
| GET | `/settings/admins` | super_admin | List admins for station |
| DELETE | `/settings/admins/:id` | super_admin | Delete admin (password required) |
| POST | `/settings/create-admin` | super_admin | Create a new admin account |

##### Customer — `/customer`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| PUT | `/customer/profile` | customer | Update name and address |
| PUT | `/customer/password` | customer | Change password |
| POST | `/customer/avatar` | customer | Upload profile picture |

##### Reports — `/reports`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/reports/summary` | admin+ | Sales summary (daily/weekly/monthly/yearly) |

##### System Admin — `/sysadmin`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/sysadmin/stations` | sys_admin | All stations with super admin info |
| POST | `/sysadmin/stations` | sys_admin | Create station + super admin |
| DELETE | `/sysadmin/stations/:id` | sys_admin | Delete station (password required) |
| PUT | `/sysadmin/maintenance` | sys_admin | Toggle system-wide maintenance |
| GET | `/sysadmin/logs` | sys_admin | View audit logs |
| DELETE | `/sysadmin/logs` | sys_admin | Clear all logs (password required) |

---

##### Core Feature Walkthroughs

##### Customer Places an Order

1. Customer logs in → `GET /auth/me` confirms identity and station assignment.
2. `MaintenanceGuard` calls `GET /settings/maintenance-status`. If `is_maintenance=true`, shows `MaintenancePage` and blocks access.
3. Customer navigates to `CustomerOrder.tsx` → products are fetched for their station.
4. Customer adds items to cart (React state, no server calls yet).
5. Customer selects payment method. For GCash, they upload a receipt screenshot.
6. Customer clicks "Place Order" → `POST /orders` is called.
7. Server validates stock, creates `order` record, inserts `order_items`, deducts inventory, creates notification for admin.
8. Customer sees order confirmation. Order appears in their dashboard.

##### Admin Processes an Order

1. Admin sees notification bell light up with unread count.
2. Admin opens `AdminCustomerOrder.tsx` → new order is visible with status `confirmed`.
3. Admin expands the order, reviews items and payment proof (receipt image for GCash).
4. Admin clicks "Verify Payment" → `PUT /orders/:id/payment` updates `payment_status=2`.
5. Admin updates status to `Preparing` → `PUT /orders/:id/status`.
6. When dispatched, admin sets `Out for Delivery`.
7. Upon completion, admin sets `Delivered`.
8. Customer receives a notification at each step.

##### System Admin Enables Maintenance

1. System admin logs in → routed to `/sysadmin`.
2. In `SAStations.tsx`, the Maintenance toggle is off (gray).
3. System admin clicks the toggle.
4. Confirmation modal opens with amber header: "Enable Maintenance Mode?"
5. System admin enters their password and clicks "Enable Maintenance".
6. Frontend sends `PUT /sysadmin/maintenance` with `{ maintenance: true, password: "..." }`.
7. Server verifies password with bcrypt, then runs: `UPDATE stations SET status = 3`.
8. Server logs event to `system_logs`: "System-wide maintenance mode enabled".
9. All stations now have `status = 3`.
10. Any customer trying to access `/customer/*` → `MaintenanceGuard` fires, calls `GET /settings/maintenance-status`, gets `is_maintenance: true`, renders `MaintenancePage`.

---

##### Maintenance Mode System

The maintenance mode system involves four files working in coordination:

##### 1. `sysadmin.routes.ts` — Toggle endpoint

`PUT /sysadmin/maintenance` updates every row in `stations` simultaneously. It requires password verification before applying the change, ensuring accidental toggles are prevented.

##### 2. `settings.routes.ts` — Status check endpoint

`GET /settings/maintenance-status` reads the `status` column of the customer's assigned station. It returns `{ is_maintenance: boolean, status: number }`. This endpoint is placed **before** the `super_admin` middleware guard, making it accessible to any authenticated user including customers.

##### 3. `MaintenanceGuard.tsx` — Frontend guard component

Wraps the entire `CustomerLayout`. On mount, it calls the status endpoint. While loading, it renders nothing. If maintenance is active, it renders `MaintenancePage` instead of the customer interface. If not, it renders children normally.

##### 4. `MaintenancePage.tsx` — Customer-facing maintenance screen

A water-themed page with an animated SVG water drop icon with a wrench, "Under Maintenance" heading, and a "Back to Home" button. Uses a dark navy gradient background with animated floating bubbles.

---

##### File Upload System

The system handles three types of file uploads:

##### Station Logos (`/uploads/stations/`)

Managed in `settings.routes.ts`. Uses Multer disk storage. Files are saved as `logo_<timestamp>.<ext>`. Only image MIME types are accepted. File size limited to 5MB. The `image_path` column in `stations` is updated after upload.

##### GCash QR Codes (`/uploads/qrcodes/`)

Saved as `qr_<timestamp>.<ext>`. Same size and type restrictions. Stored in `stations.qr_code_path`. Displayed to customers at checkout when they select GCash payment.

##### Product Images (`/uploads/products/`)

Managed in `inventory.routes.ts`. Saved with a timestamped filename. Stored in `products.image_path`. Displayed in the product catalog for both admin and customer views.

##### GCash Payment Receipts (`/uploads/receipts/`)

Managed in `order.routes.ts` and `pos.routes.ts`. Customers upload screenshots of their GCash payment. Admins view these when verifying payment. Stored in `payments.receipt_path`.

##### Profile Pictures (`/uploads/avatars/`)

Managed in `customer.routes.ts`. Users upload a profile photo. Stored in `users.profile_picture`.

**Static serving:** All uploaded files are served at `http://localhost:8080/uploads/*` via the `express.static` middleware registered in `app.ts`. The frontend references them as:

```typescript
`${import.meta.env.VITE_API_URL}${user.profile_picture}`
// → http://localhost:8080/uploads/avatars/avatar_1234567890.jpg
```

---

##### Notification System

Notifications are stored in the `notifications` table and linked to a specific `user_id`. They are created automatically by the server at key events:

| Trigger | Recipient | Type |
| --- | --- | --- |
| Customer places order | Admin | Order update |
| Admin changes order status | Customer | Order update |
| Admin verifies payment | Customer | Payment update |
| Admin rejects payment | Customer | Payment update |
| Stock falls below min level | Admin | Inventory alert |
| Return request submitted | Admin | Order update |
| Return approved/rejected | Customer | Order update |

**Frontend reading notifications:**

Both `AdminLayout` and `CustomerLayout` poll the notifications endpoint on mount and maintain a count of unread notifications. Clicking the bell icon opens a dropdown showing recent notifications, each with a time-ago label and read/unread indicator. Clicking "Mark all read" sends a bulk update request.

---

##### Reports and Analytics

The reports system generates aggregated sales data for the admin dashboard. It is scoped to the admin's `station_id` from their JWT.

**Period options:**
- `daily` — Today's breakdown hour by hour
- `weekly` — Last 7 days, one row per day
- `monthly` — Last 30 days, one row per day
- `yearly` — Last 12 months, one row per month

**Data returned:**
- Total revenue for the period
- Total orders placed
- Total orders completed (delivered)
- Breakdown by day/month with revenue and order count
- Best-selling products by quantity and revenue

The data feeds the chart and summary cards in `AdminDashboard.tsx`. The "Current Inventory Levels" modal in the dashboard fetches from `inventory` separately, showing real-time stock with color-coded severity indicators.

---

##### Point of Sale System

The POS system (`PointOfSale.tsx` + `pos.routes.ts`) is designed for walk-in customers who purchase directly at the station without placing an online order.

**POS flow:**

1. Admin selects products from the grid — quantities are adjustable.
2. Cart total is calculated client-side.
3. Admin selects payment method: Cash or GCash.
4. For GCash: admin optionally uploads a receipt photo.
5. Admin confirms the transaction.
6. Server creates a `pos_transaction` record and deducts the quantities from `inventory`.
7. If inventory drops below `min_stock_level`, a notification is auto-created.

POS transactions appear in the history panel and are included in the reports data.

---

##### Environment Variables Reference

##### Server `.env`

| Variable | Example | Description |
| --- | --- | --- |
| `PORT` | `8080` | Port the Express server listens on |
| `DB_HOST` | `127.0.0.1` | MySQL server host |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | `yourpassword` | MySQL password |
| `DB_NAME` | `aqualastech` | Database name |
| `JWT_KEY` | `some_secret_key` | Secret used to sign and verify JWTs |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS |
| `MAIL_USER` | `email@gmail.com` | Gmail address for Nodemailer |
| `MAIL_PASS` | `app_password` | Gmail App Password (not regular password) |
| `MAIL_FROM` | `AquaLasTech <email>` | Display name and email in sent emails |

##### Client `.env`

| Variable | Example | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080` | Base URL of the backend API |
| `VITE_FB_PAGE_URL` | `https://facebook.com/...` | Facebook page URL for landing page |
| `VITE_CONTACT_EMAIL` | `info@aqualas.com` | Contact email shown on landing page |
| `VITE_CONTACT_PHONE` | `09XXXXXXXXX` | Contact number shown on landing page |

> **Important:** All Vite environment variables must be prefixed with `VITE_`. They are embedded at build time and become readable in the browser. Never put secrets (database passwords, JWT keys) in the client `.env`.

---

##### Enum Constants Reference

All numeric status codes used in the database are defined in `server/src/constants/dbEnums.ts`. The same constants are used throughout all route files.

##### User Roles (`users.role`)

| Name | Value | Access Level |
| --- | --- | --- |
| `ROLE.CUSTOMER` | 1 | Customer dashboard only |
| `ROLE.ADMIN` | 2 | Admin dashboard (station-scoped) |
| `ROLE.SUPER_ADMIN` | 3 | Admin + Settings |
| `ROLE.SYS_ADMIN` | 4 | System-wide control |

##### Station Status (`stations.status`)

| Name | Value | Meaning |
| --- | --- | --- |
| `STATION_STATUS.OPEN` | 1 | Normal operation |
| `STATION_STATUS.CLOSED` | 2 | Temporarily closed |
| `STATION_STATUS.MAINTENANCE` | 3 | System maintenance active |

##### Order Status (`orders.order_status`)

| Name | Value | Meaning |
| --- | --- | --- |
| `ORDER_STATUS.CONFIRMED` | 1 | Order received |
| `ORDER_STATUS.PREPARING` | 2 | Being prepared |
| `ORDER_STATUS.OUT_FOR_DELIVERY` | 3 | En route |
| `ORDER_STATUS.DELIVERED` | 4 | Successfully delivered |
| `ORDER_STATUS.CANCELLED` | 5 | Cancelled |
| `ORDER_STATUS.RETURNED` | 6 | Returned after delivery |

##### Payment Mode (`orders.payment_mode`)

| Name | Value | Meaning |
| --- | --- | --- |
| `PAYMENT_MODE.GCASH` | 1 | GCash digital payment |
| `PAYMENT_MODE.CASH` | 2 | Upfront cash |
| `PAYMENT_MODE.CASH_ON_DELIVERY` | 3 | Pay when order arrives |
| `PAYMENT_MODE.CASH_ON_PICKUP` | 4 | Pay when picking up |

##### Payment Status (`payments.payment_status`)

| Name | Value | Meaning |
| --- | --- | --- |
| `PAYMENT_STATUS.PENDING` | 1 | Awaiting admin verification |
| `PAYMENT_STATUS.VERIFIED` | 2 | Payment confirmed |
| `PAYMENT_STATUS.REJECTED` | 3 | Payment rejected |

##### Inventory Transaction Type (`inventory_transactions.transaction_type`)

| Name | Value | Meaning |
| --- | --- | --- |
| `TRANSACTION_TYPE.RESTOCK` | 1 | Stock added |
| `TRANSACTION_TYPE.DEDUCTION` | 2 | Stock removed |
| `TRANSACTION_TYPE.ADJUSTMENT` | 3 | Stock set to exact value |

##### Notification Type (`notifications.notification_type`)

| Name | Value | Meaning |
| --- | --- | --- |
| `NOTIFICATION_TYPE.ORDER_UPDATE` | 1 | Order status changed |
| `NOTIFICATION_TYPE.PAYMENT_UPDATE` | 2 | Payment verified or rejected |
| `NOTIFICATION_TYPE.INVENTORY_ALERT` | 3 | Low stock warning |
| `NOTIFICATION_TYPE.SYSTEM_MESSAGE` | 4 | General system notification |

##### System Log Event Types (`system_logs.event_type` — VARCHAR)

| Value | Trigger |
| --- | --- |
| `login` | User logs in |
| `logout` | User logs out |
| `station_created` | System admin creates a station |
| `station_updated` | Station details changed |
| `station_deleted` | System admin deletes a station |
| `user_created` | Admin account created |
| `user_updated` | Account details changed |
| `user_deleted` | Account deleted |
| `maintenance_on` | System maintenance enabled |
| `maintenance_off` | System maintenance disabled |
| `logs_cleared` | Audit logs cleared |
| `order_created` | New order placed |
| `order_updated` | Order status changed |

---

*This document covers the complete technical structure of the AquaLasTech system as of March 2026. For changes after this date, refer to the git history (`git log`) and the current source files.*
