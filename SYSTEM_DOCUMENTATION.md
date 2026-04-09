# AquaLasTech — Full System Documentation

> A complete technical and academic reference for understanding, installing, configuring, and extending the AquaLasTech water refilling station management system. Written for developers of all experience levels — from those encountering full-stack web development for the first time, to senior engineers adapting the system for new requirements.

---

## Table of Contents

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

## Project Overview

**AquaLasTech** is a full-stack web application built to digitize and streamline the daily operations of water refilling station businesses. Before systems like this existed, station operators had to manage inventory, track orders, and process payments manually — through paper records, phone calls, or informal messages. AquaLasTech replaces all of that with a centralized, browser-based platform that works on any device including smartphones.

The system is built around four distinct user roles, each with its own interface, permissions, and responsibilities. Understanding these roles is essential before reading any further, because almost every architectural decision in this system — from database table design to frontend routing — is shaped by the need to keep these four types of users separate and secure.

**The four roles are:**

- **Customer** — An individual who uses the platform to browse water products, place delivery or pickup orders, upload GCash payment receipts, and track their order status. Customers only ever see the products and information belonging to their assigned station.

- **Admin** — A staff member employed by a specific water refilling station. Admins can view and manage orders for their station, adjust inventory stock levels, and process walk-in customer sales through the Point of Sale (POS) module. They cannot change station settings or create other admin accounts.

- **Super Admin** — The station owner or manager. Has all the capabilities of a regular admin, plus the ability to configure the station itself — updating the station name, address, logo, GCash QR code, and managing which admin staff accounts exist under their station.

- **System Admin** — The platform-level administrator. Has no involvement in day-to-day station operations. Instead, the system admin can see all stations in the network, create or delete entire stations and their associated accounts, and toggle a system-wide maintenance mode that blocks customer access across all stations simultaneously.

This separation of concerns is not just an organizational choice — it is enforced in code at multiple layers: in the database (through the `role` column on every user account), in the server (through middleware that checks the role on every protected request), and in the frontend (through route guards that redirect users who do not belong on a given page).

---

## Technology Stack

The technology choices in AquaLasTech reflect a deliberate balance between capability, maintainability, and the realities of deploying a production web application on a budget.

### Backend

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| Node.js | v20+ | JavaScript runtime for the server |
| TypeScript | ~5.9 | Strongly-typed superset of JavaScript |
| Express.js | ^5.2 | HTTP server and routing framework |
| MySQL 2 | ^3.18 | Database driver for MySQL with promise support |
| JSON Web Tokens (JWT) | ^9.0 | Stateless authentication tokens |
| bcrypt | ^6.0 | Password hashing algorithm |
| Multer | ^2.1 | File upload middleware |
| multer-storage-cloudinary | ^4.0 | Routes file uploads directly to Cloudinary |
| Cloudinary | ^2.x | Cloud-based image storage and delivery |
| Nodemailer | ^8.0 | Email sending for password reset |
| Helmet | ^8.1 | HTTP security headers middleware |
| CORS | ^2.8 | Cross-Origin Resource Sharing control |
| cookie-parser | ^1.4 | Parses cookies from incoming HTTP requests |
| dotenv | ^17.3 | Loads environment variables from a .env file |
| tsx | ^4.21 | TypeScript execution engine for development |

**Why Node.js and Express?** Node.js allows the same language (JavaScript/TypeScript) to be used on both the frontend and backend, which reduces context-switching for developers working across the full stack. Express is intentionally minimal — it handles HTTP routing and middleware but imposes no opinions on application structure, which makes it straightforward to understand and trace the flow of any request.

**Why TypeScript?** TypeScript adds static type checking on top of JavaScript. This catches entire categories of bugs at compile time rather than at runtime — for example, passing a `string` where a `number` is expected, or accessing a property that does not exist on an object. For a system like AquaLasTech where database rows are passed directly to API responses, TypeScript makes it far easier to reason about data shapes across the entire codebase.

**Why MySQL?** The data in AquaLasTech is fundamentally relational — orders belong to customers who belong to stations, inventory belongs to products which belong to stations, and so on. Relational databases like MySQL are designed exactly for this kind of structured, interconnected data. They enforce referential integrity through foreign keys, meaning the database itself will reject an operation that would create an orphaned record.

**Why Cloudinary?** When deploying to cloud platforms like Render, the server's filesystem is ephemeral — any file saved to disk is deleted when the server restarts or redeploys. Cloudinary solves this by storing all uploaded images externally in the cloud, returning a permanent HTTPS URL that the application saves to the database. This means image uploads persist indefinitely regardless of how many times the server is redeployed.

### Frontend

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| React | ^19.2 | UI component library |
| TypeScript | ~5.9 | Type-safe JavaScript for the frontend |
| Vite | ^7.3 | Build tool and development server |
| React Router DOM | ^7.13 | Client-side routing |
| Axios | ^1.13 | HTTP client for API requests |
| TailwindCSS | ^3.4 | Utility-first CSS framework |
| Lucide React | ^0.576 | Icon library |
| React Icons | ^5.5 | Additional icon packs (e.g. FcGoogle) |
| Leaflet / React-Leaflet | ^1.9 / ^5.0 | Interactive map for station location pinning |
| PostCSS | ^8.5 | CSS transformation pipeline |
| Autoprefixer | ^10.4 | Automatically adds vendor CSS prefixes |

**Why React?** React is a component-based UI library. Instead of writing HTML pages, developers write reusable components — self-contained units of UI logic that manage their own state and render themselves based on that state. This model makes it straightforward to build complex, interactive interfaces like the admin dashboard or the customer order flow, because each screen can be broken into smaller, independently testable pieces.

**Why Vite?** Vite is the build tool that compiles and bundles the React code into static files that browsers can run. It is significantly faster than older tools like Webpack because it uses native ES modules during development, meaning only the changed file needs to be recompiled on each edit rather than the entire bundle.

**Why TailwindCSS?** TailwindCSS provides a large set of utility classes (e.g. `flex`, `p-4`, `text-blue-600`) that can be combined directly in the HTML/JSX to build layouts and styles without writing separate CSS files. For a project where the entire styling needs to be consistent but there is no dedicated CSS designer, Tailwind's constraint-based system helps maintain visual coherence across all pages.

### Database

| Technology | Purpose |
| :--- | :--- |
| MySQL 8.0+ | Relational database for all persistent data |

### Development Tools

| Tool | Purpose |
| :--- | :--- |
| Nodemon | Auto-restarts the server process when source files change |
| ESLint | Analyzes code for potential errors and style inconsistencies |
| Git | Version control for tracking changes and collaborative development |

---

## System Architecture

AquaLasTech follows a **three-tier architecture**, which is the standard model for modern web applications. The three tiers are:

1. **The Presentation Tier** — the React frontend running in the user's browser
2. **The Application Tier** — the Express API server running on Node.js
3. **The Data Tier** — the MySQL database storing all persistent information

These three tiers are completely independent services. They do not share memory, do not run in the same process, and communicate exclusively through defined interfaces — the frontend and backend speak through HTTP requests and JSON responses; the backend and database speak through SQL queries over a TCP connection.

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                        │
│  React + Vite + TailwindCSS                                  │
│  - Renders UI components from application state              │
│  - Manages client-side routing via React Router              │
│  - Holds authenticated user in AuthContext                   │
│  - Sends HTTP requests via Axios with auth token             │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP/REST (JSON)
                       │  JWT via Cookie + Authorization Header
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER                         │
│  Node.js + TypeScript (port 8080)                            │
│  - Validates JWT tokens via verifyToken middleware           │
│  - Routes requests to the appropriate handler               │
│  - Applies role-based authorization checks                  │
│  - Executes business logic and data validation              │
│  - Reads and writes from MySQL via a connection pool         │
└──────────────────────┬──────────────────────────────────────┘
                       │  mysql2 driver (TCP connection)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     MySQL DATABASE (Aiven)                   │
│  - Stores users, stations, orders, inventory, logs           │
│  - Enforces referential integrity through foreign keys       │
│  - Optimized with TINYINT status codes and VARCHAR limits    │
└─────────────────────────────────────────────────────────────┘
```

**How the tiers communicate:**

When a user loads the application in their browser, the React frontend is served as a static bundle of HTML, CSS, and JavaScript files. From that point on, the browser never loads a new page — instead, React updates the UI dynamically based on data it fetches from the API server. This pattern is called a **Single Page Application (SPA)**.

Every time the frontend needs data — for example, loading the list of products when a customer opens the order page — it sends an HTTP request to the Express server. The server validates the request (checking the user's identity and permissions), queries the MySQL database, and returns the result as a JSON object. The frontend then updates its state with that data and re-renders the relevant components.

**Authentication across the tiers:**

Authentication in this system uses **JSON Web Tokens (JWT)**. When a user logs in, the server creates a compact, digitally-signed token that encodes the user's ID, role, and station assignment. This token is sent back to the browser in two forms simultaneously:

1. As an **httpOnly cookie** — a cookie that the browser stores and attaches automatically to every subsequent request. Because it is marked `httpOnly`, JavaScript code cannot read or modify it, which protects it from cross-site scripting (XSS) attacks.

2. As a **value in the response body** — so the frontend can explicitly store it in `localStorage` and attach it as an `Authorization: Bearer` header on every outgoing request.

The dual approach exists to handle a specific real-world problem: iOS Safari's Intelligent Tracking Prevention (ITP) sometimes blocks cookies from being sent on cross-origin requests. By also sending the token via the `Authorization` header from localStorage, the system works reliably on all browsers and devices. The server accepts the token from either source — whichever is present.

**Why the server does not store sessions:**

Traditional web applications store session data on the server (for example, in a database or in memory). This means the server has to look up the session on every request to verify who the user is. JWTs are different — the token itself contains all the information the server needs (user ID, role, station ID), and the server can verify its authenticity without any database lookup by checking the digital signature. This is called **stateless authentication** and it scales better because no server-side session storage is required.

---

## Project Folder Structure

The repository is split into two top-level directories: `client/` for the React frontend and `server/` for the Express backend. This separation reflects the two-application nature of the system — they are independent services that happen to live in the same repository.

### Root

```
AquaLasTech/
├── client/                ← React + Vite frontend application
├── server/                ← Express + TypeScript API server
├── README.md              ← Deployment documentation
└── SYSTEM_DOCUMENTATION.md
```

### Client Directory

```
client/
├── public/
│   └── vite.svg
├── src/
│   ├── api/
│   │   └── axios.ts                   ← Pre-configured Axios instance
│   ├── assets/
│   │   ├── aqualastech-logo.png       ← Logo with background
│   │   ├── aqualastech-logo-noBG.png  ← Transparent logo variant
│   │   ├── ALT_FONT.png               ← Hero title image
│   │   ├── water-bg.jpg               ← Hero background texture
│   │   └── favicon_io/                ← Browser favicons (all sizes)
│   ├── components/
│   │   ├── LocationMap.tsx            ← Leaflet map for GPS coordinates
│   │   ├── MaintenanceGuard.tsx       ← Blocks customers during maintenance
│   │   ├── ProfileAvatarUpload.tsx    ← Profile picture upload UI component
│   │   ├── SuperAdminRoute.tsx        ← Restricts routes to super_admin only
│   │   ├── Topbar.tsx                 ← Top header bar component
│   │   └── ui/
│   │       ├── InputField.tsx         ← Reusable labeled text input
│   │       └── WaterLoader.tsx        ← Water-themed loading spinner
│   ├── context/
│   │   └── AuthContext.tsx            ← Global authentication state (React Context)
│   ├── hooks/
│   │   └── useStation.ts              ← Custom hook: fetches station data
│   ├── layout/
│   │   ├── AdminLayout.tsx            ← Sidebar + topbar shell for admin pages
│   │   ├── CustomerLayout.tsx         ← Bottom navigation shell for customer pages
│   │   ├── MainLayout.tsx             ← Minimal wrapper for public pages
│   │   └── SystemAdminLayout.tsx      ← Side navigation shell for sysadmin pages
│   ├── pages/
│   │   ├── LandingPage.tsx            ← Marketing and home page
│   │   ├── LandingPage.css            ← Landing page custom CSS animations
│   │   ├── LoginPage.tsx              ← Login form
│   │   ├── SignupPage.tsx             ← Customer registration form
│   │   ├── ForgotPasswordPage.tsx     ← Email-based password reset request
│   │   ├── ResetPasswordPage.tsx      ← Token-validated new password form
│   │   ├── MaintenancePage.tsx        ← Shown to customers during maintenance mode
│   │   ├── NotFoundPage.tsx           ← 404 error page
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx     ← Sales overview and inventory modal
│   │   │   ├── AdminCustomerOrder.tsx ← Order management and payment verification
│   │   │   ├── AdminInventory.tsx     ← Stock control panel
│   │   │   ├── AdminSettings.tsx      ← Station configuration (super_admin only)
│   │   │   └── PointOfSale.tsx        ← Walk-in customer POS terminal
│   │   ├── customer/
│   │   │   ├── CustomerDashboard.tsx  ← Order history overview
│   │   │   ├── CustomerOrder.tsx      ← Product catalog and checkout flow
│   │   │   └── CustomerSettings.tsx   ← Profile and address management
│   │   └── system-admin/
│   │       ├── SAStations.tsx         ← All-station management panel
│   │       └── SALogs.tsx             ← System audit log viewer
│   ├── routes/
│   │   ├── router.tsx                 ← All client-side route definitions
│   │   └── ProtectedRoute.tsx         ← Role-enforced route guard component
│   ├── main.tsx                       ← React application entry point
│   └── index.css                      ← Global CSS and Tailwind base styles
├── vite.config.ts                     ← Vite build and dev server configuration
├── tailwind.config.cjs                ← TailwindCSS theme customization
├── postcss.config.cjs                 ← PostCSS plugin pipeline
├── tsconfig.json                      ← Root TypeScript compiler configuration
├── package.json                       ← Frontend dependencies and scripts
└── .env                               ← Environment variables (not committed to git)
```

### Server Directory

```
server/
├── src/
│   ├── app.ts                         ← Express app setup: middleware and routes
│   ├── server.ts                      ← HTTP server entry point (port 8080)
│   ├── config/
│   │   ├── db.ts                      ← MySQL connection pool (singleton)
│   │   └── cloudinary.ts              ← Cloudinary upload factory function
│   ├── constants/
│   │   └── dbEnums.ts                 ← All TINYINT enum mappings as named constants
│   ├── middleware/
│   │   ├── verifyToken.middleware.ts  ← JWT validation (cookie + Authorization header)
│   │   ├── auth.middleware.ts         ← Auth wrapper for specific role checks
│   │   └── role.middleware.ts         ← Role-based access helper
│   ├── routes/
│   │   ├── auth.routes.ts             ← /auth/* — login, signup, logout, me
│   │   ├── user.routes.ts             ← /users/* — profile endpoints
│   │   ├── station.routes.ts          ← /stations/* — admin-facing CRUD
│   │   ├── station.customer.routes.ts ← /stations/* — customer-facing reads
│   │   ├── product.routes.ts          ← /products/* — product catalog
│   │   ├── inventory.routes.ts        ← /inventory/* — stock management
│   │   ├── order.routes.ts            ← /orders/* — full order lifecycle
│   │   ├── pos.routes.ts              ← /pos/* — walk-in POS transactions
│   │   ├── customer.routes.ts         ← /customer/* — customer profile actions
│   │   ├── settings.routes.ts         ← /settings/* — station configuration
│   │   ├── reports.routes.ts          ← /reports/* — sales analytics
│   │   ├── sysadmin.routes.ts         ← /sysadmin/* — system-wide controls
│   │   └── seedOrders.ts              ← Development seed script (not for production)
│   ├── scripts/
│   │   ├── createAdmin.ts             ← CLI: interactively create an admin account
│   │   ├── createStation.ts           ← CLI: interactively create a station
│   │   ├── ManageAdmins.ts            ← CLI: admin account management menu
│   │   └── ManageStations.ts          ← CLI: station management menu
│   └── utils/
│       └── generateReference.ts       ← Generates unique human-readable order IDs
├── tsconfig.json                      ← TypeScript compiler configuration
├── package.json                       ← Backend dependencies and npm scripts
├── nodemon.json                       ← Nodemon auto-reload configuration
└── .env                               ← Environment variables (not committed to git)
```

---

## Installation and Configuration

This section walks through the complete process of setting up the project on a local development machine from scratch. Each step explains not just what to do, but why the step is necessary.

### Prerequisites

Before running the project, ensure you have the following installed on your machine:

- **Node.js v20 or higher** — The JavaScript runtime that powers both the development tools and the server. Download from [nodejs.org](https://nodejs.org). You can verify your version by running `node --version` in a terminal.
- **MySQL 8.0 or higher** — The relational database where all application data is stored. You can install it directly or use a GUI tool like MySQL Workbench which bundles the database server.
- **Git** — Version control for cloning the repository and managing code changes.

### Step 1 — Clone the Repository

The repository contains both the frontend and backend in a single monorepo structure. Clone it to a local directory and enter that directory:

```bash
git clone <repository-url>
cd AquaLasTech
```

### Step 2 — Set Up the Database

The application requires a MySQL database to exist before the server can start. First, create the database and select it as the active context:

```sql
CREATE DATABASE aqualastech;
USE aqualastech;
```

Then import the schema file, which creates all the tables, indexes, and relationships the application depends on. The schema file is located at `server/src/aqualastech_clean.sql`. Run it using the MySQL command-line client:

```bash
mysql -u root -p aqualastech < server/src/aqualastech_clean.sql
```

This single command creates all required tables: `users`, `stations`, `products`, `inventory`, `orders`, `order_items`, `payments`, `pos_transactions`, `notifications`, `system_logs`, `password_reset_tokens`, and more. The schema file is idempotent — running it multiple times will not cause errors because all statements use `CREATE TABLE IF NOT EXISTS`.

### Step 3 — Configure the Server Environment

Environment variables are used to store configuration values that differ between development and production environments — things like database credentials, secret keys, and API keys. They are never committed to version control because they contain sensitive information.

Navigate to the `server/` directory and create a `.env` file. You can copy the example if one exists, or create it manually:

```bash
cd server
cp .env.example .env
```

Edit `.env` with the following values, replacing the placeholders with your actual credentials:

```env
PORT=8080
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=aqualastech
JWT_KEY=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=AquaLasTech <your_email@gmail.com>
```

> **About JWT_KEY:** This is the secret key used to digitally sign and verify authentication tokens. It should be a long, random string — at minimum 32 characters. Anyone who knows this key could forge authentication tokens, so it must never be committed to version control or shared publicly. You can generate one with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

> **About MAIL_PASS:** This must be a Gmail App Password, not your regular Gmail account password. App Passwords are 16-character codes generated from Google Account → Security → 2-Step Verification → App Passwords. They allow applications to send email on your behalf without using your main password.

> **About Cloudinary:** If you are running locally and do not yet have a Cloudinary account, you can skip these for now. Image uploads will fail but all other features will work. For production, Cloudinary is required.

### Step 4 — Configure the Client Environment

The frontend also needs environment variables to know where the API server is running. Navigate to the `client/` directory and create a `.env` file:

```env
VITE_API_URL=http://localhost:8080
VITE_FB_PAGE_URL=https://www.facebook.com/your-page
VITE_CONTACT_EMAIL=your@email.com
VITE_CONTACT_PHONE=09XXXXXXXXX
```

> **Important:** All Vite environment variables must be prefixed with `VITE_`. This prefix tells Vite that the variable should be embedded into the JavaScript bundle at build time and made available to browser code. Variables without the `VITE_` prefix are ignored. Never put secrets (database passwords, JWT keys) in the client `.env` — anything embedded in the frontend bundle is readable by anyone who opens the browser developer tools.

### Step 5 — Install Dependencies

Both the server and client have their own `package.json` files and must be installed separately. The `node_modules` folder, which contains all downloaded packages, is gitignored and must be reinstalled on each fresh clone.

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 6 — Create the Initial Accounts

The database starts empty — there are no users, no stations, and no accounts. The system provides interactive CLI scripts to bootstrap the initial data.

To create the first station and its associated super admin account:

```bash
cd server
npm run station:create
```

This launches a terminal wizard that prompts for the station name, address, and super admin credentials. After completion, the station and super admin account are inserted into the database.

To create a standalone system admin account (the platform-level administrator):

```bash
npm run admin:create
```

Follow the prompts to set the system admin's email and password.

### Step 7 — Run the Application

The server and client are separate processes. Open **two terminal windows** and start each one independently.

**Terminal 1 — Start the backend server:**

```bash
cd server
npm run dev
```

The server starts at `http://localhost:8080`. You should see a message like `Server running on port 8080`. The `dev` script uses Nodemon, which watches for file changes and automatically restarts the server — you do not need to manually stop and restart it during development.

**Terminal 2 — Start the frontend development server:**

```bash
cd client
npm run dev
```

The frontend starts at `http://localhost:5173`. Open this URL in your browser. The Vite development server supports **Hot Module Replacement (HMR)** — when you edit a React component, the browser updates the running application instantly without a full page reload, preserving your current navigation state.

### Step 8 — Build for Production

Development mode includes extra tooling (source maps, hot reload, verbose error messages) that is not suitable for production. Building compiles and optimizes the code for deployment.

```bash
# Build the backend (TypeScript → JavaScript)
cd server
npm run build
npm start

# Build the frontend (React → static HTML/CSS/JS bundle)
cd client
npm run build
```

The client build outputs to `client/dist/`. These static files are what Vercel serves in production. The server compiles TypeScript to `server/dist/`, and `npm start` runs the compiled JavaScript directly (without TypeScript compilation overhead).

---

## Database Design

### Overview

The database is structured according to **Third Normal Form (3NF)** relational modeling principles. This means data is not duplicated — each piece of information is stored in exactly one place, and related records reference each other through foreign keys rather than by copying data. For example, a product's name is stored once in the `products` table; the `order_items` table references `product_id` rather than duplicating the name.

All status-type columns — such as order status, payment status, and user role — use **TINYINT** (an integer that stores values 0–255) rather than VARCHAR strings. This design choice reduces storage consumption by approximately 90% per status column. For context, storing the string `"out_for_delivery"` requires 16 bytes; storing the integer `3` requires 1 byte. The trade-off is readability: to understand what `3` means in the `order_status` column, you must consult the `dbEnums.ts` constants file. All code in the system uses named constants (e.g. `ORDER_STATUS.OUT_FOR_DELIVERY`) rather than raw numbers, which preserves readability at the code level.

### Core Tables

### `users`

The central identity table for every account in the system, regardless of role. All four user types — customer, admin, super admin, and system admin — have a row in this table.

| Column | Type | Description |
| :--- | :--- | :--- |
| user_id | INT AUTO_INCREMENT | Primary key — unique identifier for each user |
| full_name | VARCHAR(100) | The user's display name |
| email | VARCHAR(150) | Unique login identifier — no two accounts share an email |
| password_hash | VARCHAR(255) | The result of bcrypt hashing the user's password |
| role | TINYINT | 1=customer, 2=admin, 3=super_admin, 4=sys_admin |
| account_status | TINYINT | 1=active, 2=suspended, 3=deleted |
| profile_picture | VARCHAR(500) | Cloudinary URL of the user's avatar image |
| created_at | DATETIME | When the account was created |
| updated_at | DATETIME | When the account was last modified |

The `password_hash` column never stores a plain-text password. When a user sets or changes their password, bcrypt applies a one-way hashing function with a randomly generated salt. The resulting hash is what gets stored. At login, bcrypt re-computes the hash from the submitted password and compares it to the stored value. If they match, the password is correct — but the original password can never be reconstructed from the hash.

### `stations`

Each row represents one water refilling station in the network. Stations are the top-level organizational unit — all products, orders, and admin accounts belong to a station.

| Column | Type | Description |
| :--- | :--- | :--- |
| station_id | INT AUTO_INCREMENT | Primary key |
| station_name | VARCHAR(150) | Display name of the station |
| address | VARCHAR(500) | Short address derived from GPS coordinates |
| complete_address | VARCHAR(500) | Full address with landmarks |
| contact_number | VARCHAR(20) | Station contact phone number |
| latitude | DECIMAL(10,8) | GPS latitude for map display |
| longitude | DECIMAL(11,8) | GPS longitude for map display |
| status | TINYINT | 1=open, 2=closed, 3=maintenance |
| image_path | VARCHAR(500) | Cloudinary URL of the station logo |
| qr_code_path | VARCHAR(500) | Cloudinary URL of the GCash QR code image |
| created_at | DATETIME | When the station record was created |
| updated_at | DATETIME | When the station was last updated |

### `admins`

This is a **junction table** — its sole purpose is to link user accounts to stations. Any user with `role=2` (admin) or `role=3` (super_admin) must have a corresponding row here. Without this row, the server would not know which station the admin belongs to, and all their station-scoped queries would fail.

| Column | Type | Description |
| :--- | :--- | :--- |
| admin_id | INT AUTO_INCREMENT | Primary key |
| user_id | INT FK → users | References the admin's user account |
| station_id | INT FK → stations | References their assigned station |

When an admin logs in, the server performs a JOIN between `users` and `admins` to retrieve both the user's credentials and their `station_id` in a single query. This `station_id` is then embedded into the JWT token, which means every subsequent request carries the admin's station assignment without requiring another database lookup.

### `customers`

An extension table for customer-role users. Because customers have additional profile data (delivery address and GPS coordinates) that admins and system admins do not need, that data lives in a separate table rather than adding nullable columns to `users`.

| Column | Type | Description |
| :--- | :--- | :--- |
| customer_id | INT AUTO_INCREMENT | Primary key |
| user_id | INT FK → users | References the customer's user account |
| address | VARCHAR(500) | Saved delivery address |
| complete_address | VARCHAR(500) | Additional address details and landmarks |
| latitude | DECIMAL(10,8) | Customer's GPS latitude |
| longitude | DECIMAL(11,8) | Customer's GPS longitude |

### `products`

The product catalog. Each product belongs to exactly one station. Customers only see products from their assigned station.

| Column | Type | Description |
| :--- | :--- | :--- |
| product_id | INT AUTO_INCREMENT | Primary key |
| station_id | INT FK → stations | Which station sells this product |
| product_name | VARCHAR(150) | Display name (e.g. "5-Gallon Purified Water") |
| description | VARCHAR(500) | Optional product description |
| price | DECIMAL(10,2) | Selling price to customers |
| cost_price | DECIMAL(10,2) | Purchase cost — used for profit margin reporting |
| unit_type | TINYINT | 1=liter, 2=gallon, 3=piece |
| image_path | VARCHAR(500) | Cloudinary URL of the product photo |
| is_active | TINYINT(1) | 0=hidden, 1=listed in catalog |

### `inventory`

Tracks the current stock quantity for each product at each station. Each product has exactly one inventory record per station. The `min_stock_level` field defines the threshold below which the system will generate an automatic low-stock notification for the admin.

| Column | Type | Description |
| :--- | :--- | :--- |
| inventory_id | INT AUTO_INCREMENT | Primary key |
| station_id | INT FK → stations | Which station holds this stock |
| product_id | INT FK → products | Which product is being tracked |
| quantity | INT | Current number of units in stock |
| min_stock_level | INT | Alert threshold — notify admin when quantity drops below this |
| updated_at | DATETIME | When the quantity was last changed |

### `inventory_transactions`

Every change to stock quantity — whether from a restock, a customer order, or a manual adjustment — creates a row in this table. This provides a complete, immutable audit trail of stock movements. It answers questions like "why is there only 2 gallons left?" by showing every restock and deduction event in chronological order.

| Column | Type | Description |
| :--- | :--- | :--- |
| transaction_id | INT AUTO_INCREMENT | Primary key |
| inventory_id | INT FK → inventory | Which inventory record was affected |
| transaction_type | TINYINT | 1=restock, 2=deduction, 3=adjustment |
| quantity_change | INT | The change applied (positive for restock, negative for deduction) |
| notes | VARCHAR(500) | Optional description of why the change was made |
| created_at | DATETIME | When the transaction occurred |

### `orders`

The central order table. Each row is one complete customer order, linking a customer to a station with a specific set of products, a payment method, and a status that progresses through the order lifecycle.

| Column | Type | Description |
| :--- | :--- | :--- |
| order_id | INT AUTO_INCREMENT | Primary key |
| customer_id | INT FK → users | The customer who placed the order |
| station_id | INT FK → stations | The station fulfilling the order |
| order_reference | VARCHAR(20) | Human-readable order ID (e.g. "ORD-20240301-0042") |
| order_status | TINYINT | 1=confirmed, 2=preparing, 3=out_for_delivery, 4=delivered, 5=cancelled, 6=returned |
| payment_mode | TINYINT | 1=gcash, 2=cash, 3=cash_on_delivery, 4=cash_on_pickup |
| payment_status | TINYINT | 1=pending, 2=verified, 3=rejected |
| total_amount | DECIMAL(10,2) | Sum of all order_items subtotals |
| delivery_address | VARCHAR(500) | Where to deliver the order |
| notes | VARCHAR(500) | Special instructions from the customer |
| created_at | DATETIME | When the order was placed |
| updated_at | DATETIME | When the order was last modified |

### `order_items`

The individual product lines within an order. An order for three different products creates three rows here. The `unit_price` is captured at the time of order — this is critical because if the product's price changes later, the historical order record still reflects what the customer actually paid.

| Column | Type | Description |
| :--- | :--- | :--- |
| item_id | INT AUTO_INCREMENT | Primary key |
| order_id | INT FK → orders | The parent order this item belongs to |
| product_id | INT FK → products | Which product was ordered |
| quantity | INT | How many units of this product |
| unit_price | DECIMAL(10,2) | Price per unit at the time of order |
| subtotal | DECIMAL(10,2) | quantity × unit_price |

### `payments`

A payment record is created when an order is placed. For GCash orders, the customer uploads a screenshot of their payment receipt, which is stored here and reviewed by the admin during verification.

| Column | Type | Description |
| :--- | :--- | :--- |
| payment_id | INT AUTO_INCREMENT | Primary key |
| order_id | INT FK → orders | The order this payment is for |
| payment_mode | TINYINT | 1=gcash, 2=cash, etc. |
| payment_status | TINYINT | 1=pending, 2=verified, 3=rejected |
| amount | DECIMAL(10,2) | Amount paid |
| reference_number | VARCHAR(100) | GCash transaction reference code |
| receipt_path | VARCHAR(500) | Cloudinary URL of the uploaded receipt image |
| verified_at | DATETIME | Timestamp of when the admin verified the payment |

### `pos_transactions`

Records walk-in sales processed through the Point of Sale terminal. Unlike regular orders, POS transactions do not require a customer account — they represent anonymous in-store purchases processed by an admin.

| Column | Type | Description |
| :--- | :--- | :--- |
| pos_id | INT AUTO_INCREMENT | Primary key |
| station_id | INT FK → stations | Which station processed the sale |
| admin_id | INT FK → users | Which admin processed it |
| product_id | INT FK → products | Which product was sold |
| quantity | INT | Units sold |
| unit_price | DECIMAL(10,2) | Price at time of sale |
| total_amount | DECIMAL(10,2) | Total transaction value |
| payment_method | TINYINT | 1=cash, 2=gcash |
| transaction_status | TINYINT | 1=completed, 2=cancelled |
| created_at | DATETIME | When the transaction occurred |

### `notifications`

In-app notifications are stored in the database and delivered to the frontend through polling. Each notification targets a specific user and belongs to one of four typed categories that determine which user interface will display it.

| Column | Type | Description |
| :--- | :--- | :--- |
| notification_id | INT AUTO_INCREMENT | Primary key |
| user_id | INT FK → users | The recipient of the notification |
| message | VARCHAR(500) | The notification text |
| notification_type | TINYINT | 1=order_update, 2=payment_update, 3=inventory_alert, 4=system_message |
| is_read | TINYINT(1) | 0=unread, 1=read by the recipient |
| created_at | DATETIME | When the notification was created |

The `notification_type` is fundamental to keeping the admin and customer notification feeds separate. The customer-facing notification panel only polls for types 1 and 2. The admin-facing panel only polls for types 3 and 4. This ensures that inventory alerts (which are irrelevant to customers) never appear in the customer feed, and customer order updates never appear in the admin notification panel.

### `system_logs`

An immutable audit trail of significant system events. Every login, station creation, maintenance toggle, and account deletion creates an entry here. System admins can view this log to understand what actions have been taken on the platform and by whom.

| Column | Type | Description |
| :--- | :--- | :--- |
| log_id | INT AUTO_INCREMENT | Primary key |
| event_type | VARCHAR(50) | Category of the event (e.g. 'login', 'station_created') |
| description | VARCHAR(500) | Human-readable description of what happened |
| user_id | INT FK → users | The user account that triggered the event |
| ip_address | VARCHAR(50) | Source IP address (if tracked) |
| created_at | DATETIME | When the event occurred |

---

## Server — Deep Dive

### Entry Point: `server.ts`

This is the very first file that Node.js executes when the server starts. It has three responsibilities: load environment variables from the `.env` file, import the configured Express application, and start the HTTP listener on the specified port.

```typescript
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

`dotenv.config()` must be called before any code that reads `process.env.*` values — it reads the `.env` file from disk and populates the `process.env` object. This separation of concerns means configuration values are never hardcoded into the source code.

### Application Setup: `app.ts`

While `server.ts` starts the process, `app.ts` is where the Express application is configured. It assembles the middleware pipeline — the chain of functions that every incoming HTTP request passes through before reaching a route handler.

The middleware registered in `app.ts` runs in declaration order. This order matters: for example, `cookie-parser` must run before any route that needs to read `req.cookies`, and `express.json()` must run before any route that reads `req.body`.

The key middleware and their purposes:

1. **CORS** — Browsers enforce a security policy that prevents frontend JavaScript from making requests to a different domain than the one the page was loaded from. CORS (Cross-Origin Resource Sharing) is the mechanism that allows the server to grant exceptions to this rule. In AquaLasTech, the server explicitly allows requests from the frontend origin (`CLIENT_URL`) and sets `credentials: true` to permit cookies to be included in those cross-origin requests.

2. **Helmet** — Adds a set of security-focused HTTP response headers that defend against common web attacks. For example, it sets `X-Content-Type-Options: nosniff` to prevent MIME-type sniffing attacks, and `X-Frame-Options: DENY` to block clickjacking. It is configured with `crossOriginResourcePolicy: { policy: "cross-origin" }` so that images served from the API can be loaded by the frontend even though they are on different origins.

3. **cookie-parser** — Parses the raw `Cookie` header from incoming requests and populates `req.cookies` as a JavaScript object. Without this middleware, `req.cookies` would be undefined and no cookie-based authentication would work.

4. **express.json()** — Parses incoming request bodies that have a `Content-Type: application/json` header and populates `req.body` as a JavaScript object. Without this, `req.body` would be undefined for all JSON POST and PUT requests.

5. **Route mounting** — Every route module is an Express Router mounted under its own URL prefix. Mounting a router at `/orders` means all routes defined inside that module are automatically prefixed with `/orders`:

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

### Database Connection: `config/db.ts`

The database module exposes a single exported function: `connectToDatabase()`. Internally, it maintains a **singleton connection pool** — a managed collection of pre-established database connections that can be reused across requests.

```typescript
let pool; // The singleton — created once and reused forever

export const connectToDatabase = async () => {
    if (!pool) {
        pool = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
        });
    }
    return pool;
};
```

**Why a pool rather than individual connections?** Opening a TCP connection to the database is expensive — it involves a network handshake and authentication. If the server opened a new connection on every request, a busy server handling 50 simultaneous requests would open 50 database connections. A connection pool solves this by maintaining a fixed set of open connections (up to `connectionLimit: 10`) and lending them to requests as needed. When a request finishes, the connection is returned to the pool rather than closed.

**Why a singleton?** The first call to `connectToDatabase()` creates the pool. Every subsequent call returns the already-created pool. This ensures the pool is initialized once at startup and never recreated, regardless of how many route handlers call the function.

**Usage in route handlers:**

```typescript
const db = await connectToDatabase();
const [rows]: any = await db.query(
    'SELECT * FROM users WHERE user_id = ?',
    [userId]
);
```

The `?` placeholders in the query string are not string concatenation — they are **parameterized query bindings**. The `mysql2` driver sends the query template and the parameter values separately to the database server, which renders them immune to SQL injection attacks. If a malicious user submits `'; DROP TABLE users; --` as their user ID, the database treats it as a literal string value, not as SQL code to execute.

### Middleware: `verifyToken.middleware.ts`

This is the most important middleware in the system. It is placed on every route that requires authentication and acts as the gatekeeper — no request reaches a protected route handler unless it carries a valid JWT.

```typescript
export const verifyToken = (req, res, next) => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    const token = cookieToken || bearerToken;

    if (!token)
        return res.status(401).json({ message: "No token, access denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded; // attaches the decoded payload to the request
        next();             // passes control to the next handler
    } catch {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
```

The middleware accepts the token from **two sources** and uses whichever is present — first checking the `token` cookie, then checking the `Authorization: Bearer <token>` HTTP header. This dual-source approach exists because iOS Safari applies a privacy feature called **Intelligent Tracking Prevention (ITP)** that can block cookies in cross-origin requests. By also supporting the `Authorization` header, the system works reliably across all browsers and mobile platforms. The frontend stores the token in `localStorage` and uses an Axios interceptor to attach it as a header on every request.

After `jwt.verify()` succeeds, the decoded payload is attached to the request object as `req.user`. This makes the user's identity and role available to all subsequent middleware and route handlers without requiring another database query:

```typescript
// What req.user contains after verification:
{
    id: 5,                // user_id from the users table
    role: "super_admin",  // string role name
    station_id: 2         // assigned station (null for customers and sys_admin)
}
```

Route handlers use this to scope their database queries. For example, an admin dashboard query always filters by `station_id = req.user.station_id`, ensuring an admin from Station A can never accidentally see or modify data from Station B.

### Route Files

Each route file is a modular Express Router — a self-contained set of HTTP endpoint definitions. Grouping routes by domain (auth, orders, inventory, etc.) keeps each file focused and makes it easy to find the code responsible for a specific API endpoint.

### `auth.routes.ts` — `/auth/*`

Handles the entire authentication lifecycle — account creation, login, session verification, profile updates, and password recovery.

- `POST /auth/signup` — Creates a new customer account. Checks for duplicate emails first. Hashes the submitted password with bcrypt (never storing it in plain text), then inserts into both the `users` table and the `customers` table (the latter for address/location data).

- `POST /auth/login` — Validates the submitted email and password. If the credentials are correct, creates a signed JWT containing the user's ID, role, and station ID. Returns the token both as an httpOnly cookie (for browsers) and in the response body (for the frontend to store in `localStorage`). The token expires after 7 days.

- `GET /auth/me` — Accepts a token from either the cookie or the `Authorization` header. Verifies it, then queries the database for the full current user profile (including any changes made since the token was issued). Returns both the user object and the token — this allows an existing cookie-based session to automatically receive a token for header-based auth on the next page load.

- `POST /auth/logout` — Clears the `token` cookie by overwriting it with an empty value and `maxAge: 0`. The frontend also removes the token from `localStorage`.

- `POST /auth/forgot-password` — Generates a secure random token, hashes it with SHA-256, stores the hash in `password_reset_tokens`, and sends an email containing the raw token as a URL parameter. The raw token is never stored — only its hash — so even if the database were compromised, the tokens could not be extracted and used directly.

- `POST /auth/reset-password` — Accepts the raw token from the URL, re-hashes it, and looks it up in `password_reset_tokens`. Validates that it has not expired (15-minute window) and has not already been used. If valid, updates the user's `password_hash` and marks the token as used (one-time use only).

**Why httpOnly cookies?** Because JavaScript cannot read httpOnly cookies, they are immune to **Cross-Site Scripting (XSS)** attacks — a class of attack where malicious JavaScript injected into a page attempts to steal authentication tokens. The browser sends the cookie automatically without any JavaScript involvement.

### `order.routes.ts` — `/orders/*`

Manages the full order lifecycle from the moment a customer places an order to its final resolution (delivery, cancellation, or return). Key logic points:

- **Order placement** — Before creating the order, the server validates that sufficient stock exists for every item in the cart. If any product is out of stock, the entire order is rejected. Upon success, it creates the `order` record, inserts all `order_items`, deducts each product's inventory (creating `inventory_transaction` records), and dispatches a notification to the admin.

- **Status transitions** — The `isFinalOrderStatus()` helper from `dbEnums.ts` prevents illegal status changes. For example, an order that has been `delivered` cannot be moved back to `preparing`. Only forward transitions are permitted.

- **Payment verification** — For GCash orders, the admin views the customer's uploaded receipt and clicks Verify or Reject. Verifying updates both `payments.payment_status` to `VERIFIED` and sends a notification to the customer. Rejecting similarly notifies the customer and sets the status to `REJECTED`.

- **Return requests** — After a customer receives a delivered order, they can submit a return request. The admin then approves or rejects it. This is a separate workflow from cancellation, which is only available before the order enters processing.

### `inventory.routes.ts` — `/inventory/*`

Controls stock levels with a complete audit trail. Every change to `inventory.quantity` is accompanied by an `inventory_transactions` record that logs what changed, by how much, and why.

- **Restock** — Increases `quantity` by the specified amount, creates a `TRANSACTION_TYPE.RESTOCK` record.
- **Deduction** — Decreases `quantity`, creates a `TRANSACTION_TYPE.DEDUCTION` record.
- **Adjustment** — Sets `quantity` to an exact number (useful for correcting stock counts after a physical count), creates a `TRANSACTION_TYPE.ADJUSTMENT` record.
- **Low stock alerts** — After any deduction or adjustment, if the resulting quantity falls below `min_stock_level`, an `NOTIFICATION_TYPE.INVENTORY_ALERT` notification is automatically created for the admin.

### `pos.routes.ts` — `/pos/*`

Handles walk-in customer transactions processed directly at the station counter. The POS workflow is intentionally simpler than the customer order workflow — there is no delivery address, no GCash receipt upload requirement, and no customer account involved.

- Creates a `pos_transactions` record capturing the product, quantity, price, and payment method.
- Deducts stock from `inventory` just as a regular order does, including the low-stock alert check.
- Supports both cash and GCash payments.
- The transaction is included in the `reports.routes.ts` sales aggregations so POS revenue is reflected in the admin dashboard analytics.

### `settings.routes.ts` — `/settings/*`

This route file demonstrates a two-tier access control pattern within a single module. The middleware guard is not mounted at the top of the file — it is mounted in the middle, which means routes defined before it are public (or leniently authenticated), and routes defined after it require the elevated `super_admin` role.

- **Before the guard:** `GET /settings/maintenance-status` — Returns whether a station is currently in maintenance mode. This endpoint is intentionally accessible to any authenticated user, including customers, because `MaintenanceGuard.tsx` needs to call it when a customer logs in to determine whether to block their access.

- **After the guard (super_admin only):** All other settings endpoints — updating station info, uploading logos and QR codes, listing admin accounts, creating new admin accounts, and deleting admin accounts. The `super_admin` guard middleware is mounted with `router.use(guard)`, which applies it to all routes defined after that line in the file.

This architectural decision means a developer adding a new settings endpoint must think carefully about where in the file they place the route — before or after the guard — based on whether the endpoint should be restricted to super admins.

### `sysadmin.routes.ts` — `/sysadmin/*`

Exclusively for the `sys_admin` role. Every endpoint in this file is protected by an inline `requireSysAdmin` middleware that checks `req.user.role === 'sys_admin'` and returns `403 Forbidden` if the check fails.

- `PUT /sysadmin/maintenance` — Toggles ALL stations between `status=1` (open) and `status=3` (maintenance) in a single `UPDATE stations SET status = ?` query. Requires the system admin to enter their password as a secondary confirmation before the change takes effect.
- `GET /sysadmin/stations` — Returns all stations with their assigned super admin joined from `users` and `admins`.
- `POST /sysadmin/stations` — Creates a new station AND its super admin account in a single atomic **database transaction**. If any step fails (e.g. the email is already taken), the entire operation rolls back, leaving the database unchanged.
- `DELETE /sysadmin/stations/:id` — Deletes a station and all its cascading data (products, inventory, orders, etc.). Requires password confirmation.
- `GET /sysadmin/logs` — Returns the latest 200 entries from `system_logs`.
- `DELETE /sysadmin/logs` — Clears all log entries. Requires password confirmation.

### `reports.routes.ts` — `/reports/*`

Generates aggregated sales and performance metrics for the admin dashboard. All queries are scoped to `req.user.station_id`, so an admin from one station cannot see revenue data from another.

- Accepts a `?period=daily|weekly|monthly|yearly` query parameter that determines the date range and grouping of the results.
- Queries the `orders` and `order_items` tables, filtering by `station_id` and the selected date range.
- Returns: total revenue, total order count, completed order count, a time-series breakdown for charting (revenue and orders per day or month), and the top-selling products ranked by total units sold and total revenue generated.

### Constants: `dbEnums.ts`

This file is the **single source of truth** for all numeric status codes used in the database. Instead of scattering magic numbers like `3` or `2` throughout the codebase — where they would be meaningless without context — every status code is defined as a named constant here:

```typescript
export const ORDER_STATUS = {
    CONFIRMED: 1,
    PREPARING: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
    CANCELLED: 5,
    RETURNED: 6,
};

export const PAYMENT_STATUS = {
    PENDING: 1,
    VERIFIED: 2,
    REJECTED: 3,
};
```

A developer reading `order_status = ORDER_STATUS.CONFIRMED` immediately understands the intent without needing to look up what `1` means. This file also exports utility functions like `isFinalOrderStatus(status)` (returns `true` if the order is delivered, cancelled, or returned — used to prevent further status transitions) and `hasRole(userRole, requiredRole)` (used in authorization checks).

---

## Client — Deep Dive

### Entry Point: `main.tsx`

The entire React application starts at `main.tsx`. It creates the root React component tree and renders it into the `<div id="root">` element in `index.html`. The application is wrapped in two essential **providers** — components that make shared data available to all components below them in the tree, without having to pass it down as props through every intermediate component.

```typescript
// main.tsx
import axios from "axios";

// Register the auth token interceptor BEFORE the app renders
axios.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("authToken");
        if (token) config.headers.set("Authorization", `Bearer ${token}`);
    } catch {}
    return config;
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>
);
```

The Axios **request interceptor** is registered here, at the very top of the application's lifecycle, before any component renders. An interceptor is a function that runs automatically on every outgoing Axios request. This particular interceptor reads the stored authentication token from `localStorage` and attaches it as an `Authorization: Bearer <token>` header. Because it runs on every request globally, no individual API call in the codebase needs to manually add the header — they all benefit from this interceptor automatically.

The two providers:

1. **`AuthProvider`** — Makes the authenticated user's data available to any component in the application via the `useAuth()` hook. This is the global authentication state.
2. **`RouterProvider`** — Initializes the React Router with the route definitions from `router.tsx`. This enables client-side navigation — clicking a link changes the URL and renders a new page component without a full browser reload.

### Authentication Context: `context/AuthContext.tsx`

React's **Context API** is the mechanism for sharing data across a component tree without manually passing it through every level. `AuthContext` uses this to make the logged-in user available everywhere in the application.

When `AuthProvider` mounts — which happens once when the application first loads — it immediately fires a request to `GET /auth/me`. This endpoint reads the stored token (from either the cookie or the `Authorization` header, which the interceptor has already attached from `localStorage`) and returns the current user's complete profile. If a valid token exists, the user is stored in state and their session is restored seamlessly. If no valid token exists, `user` is set to `null`.

```typescript
useEffect(() => {
    axios
        .get(`${import.meta.env.VITE_API_URL}/auth/me`, { withCredentials: true })
        .then(res => {
            // Store the token in localStorage so the interceptor can use it
            if (res.data.token) localStorage.setItem('authToken', res.data.token);
            setUser(res.data.user);
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
}, []);
```

The `loading` state is critically important. While the `/auth/me` request is in flight, the application does not yet know whether the user is logged in or not. During this window, route guards must not redirect to `/login` — that would break the experience for users who are already logged in but whose session has not been confirmed yet. All route guards check `loading` first and render a spinner until it becomes `false`.

Any component anywhere in the application can call `useAuth()` to access the current state:

```typescript
const { user, loading, setUser } = useAuth();
// user    → the full user object (or null if not logged in)
// loading → true while the initial session check is pending
// setUser → used to update state immediately after login or logout
```

### Routing: `routes/router.tsx`

The routing configuration defines every URL in the frontend application and specifies which component renders at each URL. React Router v7's `createBrowserRouter` is used, which supports the **nested route and layout** pattern — a powerful model where a parent route renders a shell layout component, and child routes render their page content inside that shell via an `<Outlet />` element.

Routes are organized into four groups, each with its own access requirements:

**Public routes (`/`)** — Wrapped in `MainLayout`. No authentication required. Anyone can visit these pages: the landing page, login, signup, forgot password, and reset password. These routes are accessible even when not logged in.

**Admin routes (`/admin/*`)** — Wrapped in `ProtectedRoute role="admin"` and then `AdminLayout`. The `ProtectedRoute` component enforces authentication and role. Any user with `role=admin` or `role=super_admin` passes this check and gains access to the admin section — this is intentional because super admins are station owners who also need to perform day-to-day admin tasks. The `AdminLayout` wraps all admin pages with the sidebar navigation and topbar. The `/admin/settings` sub-route is additionally wrapped in `SuperAdminRoute`, which applies a second, stricter check that only passes for `role=super_admin`, effectively locking the station settings page to the station owner.

**Customer routes (`/customer/*`)** — Wrapped in `ProtectedRoute role="customer"`, then `MaintenanceGuard`, then `CustomerLayout`. After the role check, `MaintenanceGuard` makes an API call to check if the station is in maintenance mode. If it is, the guard renders `MaintenancePage` instead of the customer interface, completely blocking access. This layered guarding means the maintenance check only runs for authenticated customers — it never unnecessarily fires for public pages or admin routes.

**System admin routes (`/sysadmin/*`)** — Wrapped in `ProtectedRoute role="sys_admin"` and then `SystemAdminLayout`. Only accounts with `role=sys_admin` can access these routes.

### Protected Route: `routes/ProtectedRoute.tsx`

`ProtectedRoute` is a **route guard component** — a React component that sits between the router and the actual page component, deciding whether the page should render or the user should be redirected elsewhere.

```typescript
// Simplified logic inside ProtectedRoute
if (loading) return <WaterLoader />
if (!user) return <Navigate to="/login" />
if (!hasRequiredRole(user.role, requiredRole)) return <Navigate to="/login" />
return <Outlet />
```

It receives a `role` prop specifying the minimum role required to access the wrapped routes. The `hasRequiredRole()` function from `dbEnums.ts` handles the role hierarchy — passing `role="admin"` also allows `super_admin` to pass, since super admins are a superset of admins. Passing `role="sys_admin"` exclusively allows only `sys_admin` accounts.

The `<Outlet />` is a React Router element that renders whichever child route matched the current URL. This is the mechanism that makes layout nesting work — the `ProtectedRoute` renders `<Outlet />` only after all checks pass, which causes the child page component to render inside the parent layout.

### Layouts

Layouts are shell components that define the persistent navigation chrome around page content. They use React Router's `<Outlet />` to render the current page inside their structure without needing to know which specific page is active.

- **`MainLayout`** — A minimal wrapper with a light blue background gradient. Provides no navigation — intended for public pages like Login and Landing where the full navigation shell is not appropriate.

- **`AdminLayout`** — A full sidebar navigation rendered on the left (on desktop) with links to Dashboard, Orders, POS, Inventory, and Settings. Includes a notification bell in the topbar with a dropdown notification panel that shows unread counts. Reads the station name using `useStation()` to display it in the sidebar header. Collapses to a hamburger menu on mobile viewports.

- **`CustomerLayout`** — A mobile-first bottom navigation bar fixed to the bottom of the screen, with links to Home, Orders, and Settings. Also includes a notification bell. Optimized for smartphone use, as most customers are expected to access the platform on their phones.

- **`SystemAdminLayout`** — A clean side navigation panel with links to Stations and Logs. Shows the system admin's name. Collapses to a slide-out drawer on small screens.

### Custom Hook: `hooks/useStation.ts`

Custom hooks in React are functions that encapsulate reusable stateful logic. `useStation.ts` abstracts the pattern of fetching a station's data given a `stationId`, returning `{ station, loading, refetch }`.

The `refetch` function uses a state counter called `tick` — incrementing `tick` causes the `useEffect` that fetches station data to re-run, which re-fetches from the API. This is used in `AdminSettings.tsx` after a logo upload or station info update: calling `refetch()` immediately refreshes the displayed station data without requiring the admin to reload the page.

### Pages — Admin

### `admin/AdminDashboard.tsx`

The main overview page for admins and super admins. It provides a snapshot of the station's current operational state:

- **Stats cards** — Today's total orders, today's revenue, pending orders awaiting action, and count of products below minimum stock level.
- **Order status breakdown** — Counts of orders grouped by status, giving an at-a-glance view of how many orders are at each stage.
- **Daily breakdown modal** — A day-by-day revenue table for the currently selected reporting period (daily, weekly, monthly, or yearly).
- **Inventory modal** — A panel showing every product with its current stock quantity, rendered as a progress bar and color-coded by severity: red for critically low (at or below min_stock_level), amber for warning (within 20% above minimum), and green for healthy stock. Products are sorted by critically low first so the most urgent items appear at the top.
- **Refresh button** — Manually re-fetches all dashboard data.

### `admin/AdminCustomerOrder.tsx`

The order management interface — the primary tool for day-to-day station operations. Admins can:

- View all orders placed at their station, with filter tabs for each order status.
- Expand an order to see its full detail: all items with quantities and prices, the customer's name and delivery address, and payment information.
- For GCash orders, view the uploaded receipt image to verify the payment before marking it as verified.
- Advance orders through the status pipeline: Confirmed → Preparing → Out for Delivery → Delivered.
- Approve or reject return requests that customers submit after delivery.
- Cancel an order on behalf of the customer when necessary.

Every status change made here triggers a notification to the relevant customer.

### `admin/AdminInventory.tsx`

Full stock management interface. Admins can see the complete product list with current stock levels and interact with the inventory in three ways:

- **Add stock (restock):** Enter a quantity to add. Creates a `TRANSACTION_TYPE.RESTOCK` record. Used when a new delivery of supplies arrives.
- **Deduct stock (deduction):** Enter a quantity to remove. Creates a `TRANSACTION_TYPE.DEDUCTION` record. Used for manual corrections or write-offs.
- **Adjust stock (adjustment):** Set the quantity to an exact value. Creates a `TRANSACTION_TYPE.ADJUSTMENT` record. Used after a physical count reveals the database quantity is wrong.

Admins can also add new products (with name, price, unit type, and photo) and edit or deactivate existing ones.

### `admin/PointOfSale.tsx`

The walk-in customer sales terminal. Designed for speed — a station staff member should be able to complete a transaction in under 30 seconds.

1. A grid of the station's active products is displayed.
2. Clicking a product adds it to the cart; the quantity can be adjusted inline.
3. The running total is shown.
4. Admin selects payment method: Cash or GCash.
5. Confirming the sale sends `POST /pos/transaction` to the server, which records the transaction and deducts inventory.

### `admin/AdminSettings.tsx`

Station configuration panel — visible only to `super_admin`. This page is the control center for a station owner to maintain their station's public-facing profile:

- Update station name, address, contact number, and GPS coordinates.
- Upload a new station logo image (displayed on the customer-facing station listing).
- Upload a GCash QR code (displayed to customers at checkout when they select GCash payment).
- Create new admin accounts for station staff, setting their email and password.
- Delete existing admin accounts, with a password confirmation to prevent accidental deletion.

### Pages — Customer

### `customer/CustomerOrder.tsx`

The product browsing and order placement page — the core customer experience. The complete order journey from this single page:

1. The customer's assigned station is loaded from their JWT (`station_id`). Products are fetched specifically for that station.
2. The customer browses the product grid and adds items to the cart. Cart state is managed in React local state — no server calls until checkout.
3. The customer selects a payment method: GCash, Cash, Cash on Delivery, or Cash on Pickup.
4. For GCash, an upload prompt appears for the customer to submit a screenshot of their GCash payment as proof.
5. The customer confirms the order. The frontend sends `POST /orders` with all cart items, payment method, and receipt image (if applicable).
6. The server validates stock, creates the order record, deducts inventory, and notifies the admin.
7. An order confirmation message appears on screen. The order is now visible in the customer's dashboard.

### `customer/CustomerDashboard.tsx`

A summary of the customer's recent orders, each displaying the order reference, total amount, current status, and the date it was placed. Provides quick navigation to place a new order and a shortcut to view any order in detail.

### `customer/CustomerSettings.tsx`

Profile management for customers. They can update their display name, delivery address, GPS coordinates (using the embedded Leaflet map for accuracy), and upload a profile picture.

### Pages — System Admin

### `system-admin/SAStations.tsx`

The primary tool for the system administrator. This single page is responsible for the entire network of stations:

- **Station grid** — Every registered station displayed with its current status badge (open / closed / maintenance), contact information, GPS coordinates, and the name of the assigned super admin.
- **New Station button** — Opens a creation modal containing a Leaflet map (for precise GPS pinning), address autocomplete powered by OpenStreetMap Nominatim, fields for station details, and fields for the super admin's credentials. On submission, a single API call creates both the station and the super admin account atomically.
- **Delete station** — A password-confirmed destructive action that cascades to remove all products, inventory records, orders, and admin accounts associated with the station.
- **Maintenance toggle** — A single toggle in the header controls system-wide maintenance mode for ALL stations simultaneously. Because of the severity of this action, it opens a confirmation modal requiring password entry before the change is applied.
- **Maintenance banner** — A persistent amber banner displayed at the top of the page when any station is in maintenance mode, reminding the system admin that customers are currently blocked.

### `system-admin/SALogs.tsx`

A read-only audit log viewer showing the last 200 system events from the `system_logs` table. Each entry shows the event type (color-coded badge), a human-readable description of what happened, the name of the user who triggered it, and the timestamp. Has a "Clear Logs" action with password confirmation that permanently deletes all log entries.

---

## Authentication and Authorization Flow

Understanding the authentication flow is essential for any developer working on this system. Every protected feature depends on this mechanism working correctly.

### Login Flow (Step by Step)

1. The user enters their email and password on `LoginPage.tsx` and submits the form.
2. The frontend sends `POST /auth/login` with `{ email, password }` as the request body.
3. The server queries the `users` table (joined with `admins` and `customers`) for a row matching the email address.
4. If no matching row is found, returns `401 Unauthorized` with the message "No email exists."
5. If a row is found, the server calls `bcrypt.compare(submittedPassword, storedHash)`. bcrypt re-derives the hash from the submitted password and compares it. If they do not match, returns `401 Unauthorized`.
6. If the credentials are valid, the server constructs the JWT payload:
   ```json
   {
     "id": 5,
     "role": "super_admin",
     "station_id": 2
   }
   ```
7. The server signs this payload using `JWT_KEY` and sets it to expire in 7 days.
8. The server sets the signed token as an `httpOnly` cookie:
   ```http
   Set-Cookie: token=eyJ...; HttpOnly; Secure; SameSite=None; Max-Age=604800
   ```
9. The server also returns the token in the response body: `{ Status: "Success", token: "eyJ...", user: { ... } }`.
10. The frontend receives the response. `LoginPage.tsx` stores the token in `localStorage` and sets `axios.defaults.headers.common['Authorization']` for immediate use.
11. `AuthContext.setUser()` is called with the returned user object.
12. React Router redirects the user to their role-appropriate starting page: `/admin/dashboard`, `/customer/dashboard`, or `/sysadmin/stations`.

### Request Authentication Flow (Every Protected Request)

Every subsequent API call after login follows this path:

1. The frontend code calls Axios (e.g. `axios.get('/orders')`).
2. Before the request is sent, the global request interceptor in `main.tsx` runs. It reads the `authToken` from `localStorage` and adds `Authorization: Bearer <token>` to the request headers.
3. The browser also automatically attaches the `token` cookie (because `withCredentials: true` is set in Axios).
4. The request arrives at the Express server.
5. Express matches the route and runs `verifyToken` middleware.
6. `verifyToken` reads the token — first from the cookie, then from the `Authorization` header. It uses whichever is present.
7. `jwt.verify(token, JWT_KEY)` is called. This cryptographically validates that the token was signed by this server's `JWT_KEY` and that it has not expired. If either check fails, it returns `403 Forbidden`.
8. If the token is valid, `req.user` is populated with the decoded payload (`{ id, role, station_id }`).
9. The route handler executes. It uses `req.user.station_id` to scope its database queries so the response only contains data from the correct station.

### Logout Flow

1. The frontend calls `POST /auth/logout`.
2. The server overwrites the `token` cookie with an empty value and `maxAge: 0`, which instructs the browser to immediately delete the cookie.
3. The frontend removes `authToken` from `localStorage`.
4. `setUser(null)` is called in `AuthContext`, clearing the user state.
5. React Router redirects to `/login`.

---

## Role-Based Access Control

**Role-Based Access Control (RBAC)** is the security model that governs what each user is permitted to do. In AquaLasTech, the role is stored as a single `TINYINT` value in the `users.role` column and is embedded in the JWT token. This means the role is checked by the server on every request without a database lookup.

The system defines four levels. Each level is a strict superset or an entirely separate domain from the others — there is no partial overlap that would allow, for example, a customer to see admin-only pages.

### Level 1 — Customer (`role = 1`)

- Can access only the `/customer/*` routes.
- Cannot access any admin, system admin, or other customer's data.
- All product and order queries are scoped to their assigned `station_id`.
- Can place orders, track their order status, upload payment receipts, and request returns after delivery.
- Can only cancel an order while its status is `pending` (waiting for GCash verification). Once an order enters processing, cancellation is locked.
- Blocked from the entire customer interface if their station is in maintenance mode.

### Level 2 — Admin (`role = 2`)

- Can access the `/admin/*` routes via the `ProtectedRoute role="admin"` guard.
- **Station isolation is enforced at the query level, not just the route level.** Every database query in admin-facing routes uses `WHERE station_id = req.user.station_id`. This means even if an admin somehow accessed another station's URL, the server would return empty data because the query filters by their own station ID from the JWT.
- Can manage orders, adjust inventory, and process POS transactions.
- Cannot access `/admin/settings` — the `SuperAdminRoute` component blocks this page for role `admin`.

### Level 3 — Super Admin (`role = 3`)

- Passes the same `ProtectedRoute role="admin"` check that regular admins pass, so they inherit full admin access.
- Also passes the `SuperAdminRoute` check on `/admin/settings`, granting access to station configuration.
- Can create and delete admin accounts for their station.
- Can configure station details, upload logos, and manage GCash QR codes.
- In `settings.routes.ts`, a `super_admin` guard middleware is applied to all settings-modification endpoints. This guard checks `req.user.role === 'super_admin'` and returns `403` if the check fails — providing a server-side enforcement layer that complements the client-side `SuperAdminRoute` component.

### Level 4 — System Admin (`role = 4`)

- Exclusively accesses `/sysadmin/*` routes. Has no access to the admin dashboard or any station-specific management panels.
- Can view and manage every station in the entire network simultaneously.
- Can create entire stations with their super admin accounts in a single operation.
- Can delete stations — a destructive operation that cascades through all related data.
- Can toggle system-wide maintenance mode, affecting all stations at once.
- Can view and clear the global system audit log.
- All endpoints in `sysadmin.routes.ts` are protected by an inline `requireSysAdmin` middleware that returns `403` for any role other than `sys_admin`.

---

## API Endpoints Reference

This section lists every HTTP endpoint exposed by the server. The "Auth" column indicates the authentication and authorization requirement: **None** means no token is needed; **Any** means any valid token (any role); **admin+** means `admin` or `super_admin`; a specific role name means only that exact role.

### Authentication — `/auth`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | /auth/signup | None | Register a new customer account |
| POST | /auth/login | None | Authenticate and receive JWT token |
| POST | /auth/logout | Cookie | Clear the JWT cookie and end session |
| GET | /auth/me | Any | Return the current user's profile |
| PUT | /auth/profile | Any | Update own name and email |
| PUT | /auth/change-password | Any | Change own password |
| POST | /auth/forgot-password | None | Send a password reset email |
| POST | /auth/reset-password | None | Reset password using the emailed token |

### Stations — `/stations`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /stations | Any | List all open stations |
| GET | /stations/:id | Any | Get details of a specific station |
| POST | /stations | super_admin | Create a new station |
| PUT | /stations/:id | admin+ | Update station information |

### Inventory — `/inventory`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /inventory | admin+ | Get all stock levels for the admin's station |
| POST | /inventory/restock | admin+ | Add stock to a product |
| POST | /inventory/deduction | admin+ | Remove stock from a product |
| POST | /inventory/adjustment | admin+ | Set a product's stock to an exact quantity |
| GET | /inventory/transactions | admin+ | View full stock movement history |

### Orders — `/orders`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | /orders | customer | Place a new order |
| GET | /orders | admin or customer | List orders (scoped by the caller's role) |
| GET | /orders/:id | admin or customer | View a specific order in full detail |
| PUT | /orders/:id/status | admin+ | Advance or update the order status |
| PUT | /orders/:id/payment | admin+ | Verify or reject a GCash payment |
| POST | /orders/:id/cancel | customer | Cancel an order (pending GCash only) |
| POST | /orders/:id/return | customer | Submit a return request |
| PUT | /orders/:id/return | admin+ | Approve or reject a return request |

### POS — `/pos`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | /pos/transaction | admin+ | Record a walk-in counter sale |
| GET | /pos/history | admin+ | View POS transaction history for the station |

### Settings — `/settings`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /settings/maintenance-status | Any | Check if a station is currently in maintenance |
| PUT | /settings/station/:id | super_admin | Update station name, address, contact |
| POST | /settings/station/:id/upload-logo | super_admin | Upload a station logo image |
| POST | /settings/station/:id/upload-qr | super_admin | Upload a GCash QR code image |
| GET | /settings/admins | super_admin | List all admin accounts for the station |
| DELETE | /settings/admins/:id | super_admin | Delete an admin account |
| POST | /settings/create-admin | super_admin | Create a new admin account |

### Customer — `/customer`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| PUT | /customer/profile | customer | Update name, address, and location |
| PUT | /customer/password | customer | Change account password |
| POST | /customer/avatar | customer | Upload a profile picture |

### Reports — `/reports`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /reports/summary | admin+ | Sales summary for daily, weekly, monthly, or yearly periods |

### System Admin — `/sysadmin`

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | /sysadmin/stations | sys_admin | All stations with their super admin info |
| POST | /sysadmin/stations | sys_admin | Create a new station and super admin account |
| DELETE | /sysadmin/stations/:id | sys_admin | Delete a station and all its data |
| PUT | /sysadmin/maintenance | sys_admin | Toggle system-wide maintenance mode |
| GET | /sysadmin/logs | sys_admin | View the audit log |
| DELETE | /sysadmin/logs | sys_admin | Clear all audit log entries |

---

## Core Feature Walkthroughs

These walkthroughs trace the complete path of a user action through every layer of the system — from the user's click to the database write and back to the screen. Reading these alongside the relevant source files is the fastest way to build a comprehensive mental model of how the system works.

### Customer Places an Order

1. The customer opens the application in their browser. `AuthContext` fires `GET /auth/me`. The server reads the JWT from the cookie or `Authorization` header, validates it, and returns the user's profile including their `station_id`. This is stored in `AuthContext`.

2. Before the customer dashboard renders, `MaintenanceGuard` calls `GET /settings/maintenance-status?station_id=<id>`. If the station is in maintenance, the customer sees `MaintenancePage` and cannot proceed. If not, the customer dashboard renders normally.

3. The customer navigates to the Order page (`CustomerOrder.tsx`). The page fetches products for their station via `GET /stations/:id/products`. Products are displayed in a grid.

4. The customer clicks on products to add them to the cart. Cart state is purely client-side — no API calls happen during this step. The cart is a React state object (`{ productId: quantity }`).

5. The customer selects a payment method. If GCash is selected, a file upload prompt appears asking for a screenshot of the payment transfer.

6. The customer clicks "Place Order." The frontend sends `POST /orders` with the cart items, payment method, delivery address, and receipt image (if GCash).

7. On the server, `order.routes.ts` handles the request. It verifies stock availability for each item. If any item is out of stock, it returns an error. If all items are available, it:
   - Creates the `orders` record.
   - Inserts one `order_items` row per product.
   - Deducts the quantities from `inventory` for each item.
   - Creates an `inventory_transactions` record for each deduction.
   - If any product's new quantity is below `min_stock_level`, creates a `NOTIFICATION_TYPE.INVENTORY_ALERT` for the admin.
   - Creates a `NOTIFICATION_TYPE.SYSTEM_MESSAGE` for the admin informing them of the new order.

8. The response returns the created order's details. The frontend displays a confirmation screen with the order reference number.

### Admin Processes an Order

1. The admin is viewing `AdminCustomerOrder.tsx`. The notification bell shows an unread notification count. The admin clicks the bell and sees "New order received."

2. The admin opens the Orders tab filtered to "Confirmed." The new order appears. The admin clicks it to expand the details — items, quantities, customer delivery address, and payment information.

3. For a GCash order, the admin sees a "View Receipt" button. They click it, the receipt image (stored on Cloudinary) opens in a lightbox. The admin compares the receipt to the order total.

4. The admin clicks "Verify Payment." The frontend sends `PUT /orders/:id/payment` with `{ payment_status: 2 }`. The server updates both `payments.payment_status` and creates a `NOTIFICATION_TYPE.PAYMENT_UPDATE` notification for the customer.

5. The admin updates the order status to "Preparing" via `PUT /orders/:id/status`. Another notification is sent to the customer.

6. When the delivery is dispatched, the admin sets "Out for Delivery." When received, the admin sets "Delivered." Each transition generates a customer notification.

### System Admin Enables Maintenance Mode

1. The system admin is on `SAStations.tsx`. The maintenance toggle in the header shows "Off."

2. The system admin clicks the toggle. A confirmation modal opens with an amber warning banner reading "Enable Maintenance Mode?" and a description explaining that all customers will be blocked from placing orders.

3. The system admin enters their password in the confirmation field and clicks "Enable Maintenance."

4. The frontend sends `PUT /sysadmin/maintenance` with `{ maintenance: true, password: "..." }`.

5. On the server, `sysadmin.routes.ts` receives the request. It fetches the system admin's password hash and runs `bcrypt.compare(submittedPassword, hash)`. If the password is incorrect, it returns `401`. If correct, it runs: `UPDATE stations SET status = 3 WHERE 1=1` — setting every station's status to `MAINTENANCE` in a single query.

6. It then inserts a `system_logs` entry: "System-wide maintenance mode enabled by [admin name]."

7. The server returns success. The frontend re-fetches station data and the toggle switches to "On." A maintenance banner appears at the top of the page.

8. From this point, any customer who opens the application or navigates to `/customer/*` will have `MaintenanceGuard` call `GET /settings/maintenance-status`, receive `{ is_maintenance: true }`, and be redirected to `MaintenancePage` — a full-screen maintenance notice — instead of their dashboard.

---

## Maintenance Mode System

The maintenance mode system spans four files that work in coordination. Understanding this system is also a useful example of how the architecture separates concerns across the full stack.

### 1. `sysadmin.routes.ts` — Toggle endpoint

`PUT /sysadmin/maintenance` is the write endpoint. It performs four actions in sequence: validates the system admin's password (a secondary confirmation to prevent accidental activation), executes the bulk `UPDATE stations SET status = ?`, logs the event to `system_logs`, and returns a success response. The entire operation is synchronous — by the time the response is returned, every station in the database has been updated.

### 2. `settings.routes.ts` — Status check endpoint

`GET /settings/maintenance-status` is the read endpoint. It accepts a `station_id` query parameter and returns `{ is_maintenance: boolean, status: number }`. This endpoint is intentionally placed **before** the `super_admin` guard middleware in the route file, which means it is accessible to any authenticated user — customers, admins, and super admins alike. This accessibility is required because `MaintenanceGuard` calls it for customers, and customers do not have `super_admin` role.

### 3. `MaintenanceGuard.tsx` — Frontend gate

`MaintenanceGuard` is a React component that wraps the entire customer route group. When it mounts, it calls the status endpoint for the customer's station. While the request is pending, it renders nothing (a blank screen), preventing a flash of the customer UI before the maintenance status is known. If maintenance is active, it renders `MaintenancePage`. If not, it renders `children` — the normal customer interface. This guard runs on every navigation into the customer section, so even if a customer was already logged in when maintenance was enabled, they will be blocked the next time they interact with a customer route.

### 4. `MaintenancePage.tsx` — Customer-facing screen

A branded maintenance notice page with an animated water-drop-with-wrench SVG icon, a "We're temporarily down for maintenance" message, and a "Back to Home" button that navigates to the landing page. The page uses a dark navy gradient background with CSS-animated floating bubble elements consistent with the application's water theme.

---

## File Upload System

All file uploads in AquaLasTech go through Cloudinary — a cloud-based media management service — rather than being stored on the server's local filesystem. This is a critical architectural requirement for deployment: cloud hosting platforms like Render use **ephemeral filesystems**, meaning any file written to disk is deleted when the server restarts or redeploys. Cloudinary solves this by storing images permanently in the cloud and returning a stable HTTPS URL that the application saves to the database.

The upload mechanism is built on two libraries working together: **Multer** (a Node.js middleware that parses multipart/form-data request bodies — the format browsers use to upload files) and **multer-storage-cloudinary** (a Multer storage engine that, instead of writing files to disk, streams them directly to Cloudinary and returns the resulting URL).

A shared factory function in `server/src/config/cloudinary.ts` creates pre-configured Multer upload instances for each upload type:

```typescript
export function createUpload(folder: string) {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: { folder: `aqualastech/${folder}` } as any
    });
    return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
}
```

Each route that accepts file uploads calls `createUpload('folder-name')` to get a Multer instance scoped to the appropriate Cloudinary folder. When the upload completes, `req.file.path` contains the full Cloudinary HTTPS URL, which is saved to the relevant database column.

### Station Logos

Managed in `settings.routes.ts`. When a super admin uploads a new logo, Multer streams it to the `aqualastech/stations/` folder on Cloudinary. The returned URL is written to `stations.image_path`. Only image MIME types are accepted; file size is capped at 5MB.

### GCash QR Codes

Saved to the `aqualastech/qrcodes/` folder. The URL is written to `stations.qr_code_path`. At checkout, when a customer selects GCash payment, the frontend fetches the station's `qr_code_path` and displays the QR image alongside the payment instructions.

### Product Images

Managed in `inventory.routes.ts`. Each product can have one photo. The URL is stored in `products.image_path` and displayed in the product catalog grid for both customer and admin views.

### GCash Payment Receipts

Managed in `order.routes.ts`. When a customer uploads their payment receipt at checkout, the file is streamed to `aqualastech/receipts/`. The URL is stored in `payments.receipt_path`. Admins view this image when verifying the payment.

### Profile Pictures

Managed in `customer.routes.ts`. Users upload a profile avatar. The URL is stored in `users.profile_picture` and displayed in the topbar of the customer and admin interfaces.

**How the frontend renders Cloudinary images:**

Because Cloudinary URLs are complete HTTPS addresses, the frontend detects whether an image path starts with `http` and renders it directly, without prepending the API server's base URL:

```typescript
// If the path is already a full URL (Cloudinary), use it directly
const imageSrc = imagePath.startsWith('http')
    ? imagePath
    : `${import.meta.env.VITE_API_URL}${imagePath}`;
```

---

## Notification System

Notifications are the system's internal messaging layer — they inform users of events that happened elsewhere without requiring them to refresh a page or check manually.

### How Notifications Are Created

Notifications are created server-side as a side effect of business operations. The server creates a notification row in the `notifications` table targeted at a specific `user_id`. This happens automatically — the user receiving the notification takes no action to trigger it.

| Triggering Event | Recipient | Notification Type |
| :--- | :--- | :--- |
| Customer places a new order | Admin of that station | System message (type 4) |
| Admin changes order status | The ordering customer | Order update (type 1) |
| Admin verifies a GCash payment | The ordering customer | Payment update (type 2) |
| Admin rejects a GCash payment | The ordering customer | Payment update (type 2) |
| Any stock deduction drops below min_stock_level | Admin of that station | Inventory alert (type 3) |
| Customer submits a return request | Admin of that station | System message (type 4) |
| Admin approves or rejects a return | The requesting customer | Order update (type 1) |

### How Notifications Are Read

Both `AdminLayout` and `CustomerLayout` include a notification bell icon in their header. On mount, each layout fetches the user's unread notification count. A red badge on the bell shows this count.

The admin layout polls for notification types 3 and 4 (inventory alerts and system messages). The customer layout polls for types 1 and 2 (order updates and payment updates). This separation prevents cross-contamination — customers never see inventory alerts, and admins never see customer payment notifications.

Clicking the bell opens a dropdown panel listing recent notifications in reverse-chronological order. Each notification shows a time-ago label (e.g. "3 minutes ago") and is visually differentiated between unread and read. Clicking "Mark all read" sends a bulk update request to set all unread notifications for that user to `is_read = 1`.

---

## Reports and Analytics

The reports system provides aggregated sales data for the admin dashboard. It is built entirely on SQL aggregation queries against the `orders` and `order_items` tables, scoped always to `req.user.station_id` from the JWT.

### Reporting Periods

The `GET /reports/summary?period=<period>` endpoint accepts four period values, each producing a different date range and grouping:

- `daily` — The current day, broken down hour by hour (or in smaller intervals).
- `weekly` — The last 7 days, with one data point per day.
- `monthly` — The last 30 days, with one data point per day.
- `yearly` — The last 12 months, with one data point per month.

### Data Returned

Each report response includes:

- **Total revenue** — Sum of `total_amount` for all completed orders in the period.
- **Total order count** — Number of orders placed in the period.
- **Completed order count** — Number of orders that reached `status = DELIVERED`.
- **Time-series breakdown** — An array of `{ date, revenue, order_count }` objects used to draw the revenue chart in `AdminDashboard.tsx`.
- **Best-selling products** — A ranked list of products by total units sold and total revenue generated.

### Inventory Data

The "Current Inventory Levels" modal in `AdminDashboard.tsx` fetches inventory data separately from the reports endpoint — directly from `GET /inventory`. This is intentional: inventory data is real-time and not tied to a time period. It shows the current stock quantity for every product, color-coded by severity (red = at or below minimum, amber = close to minimum, green = healthy), and sorted with critically low items at the top.

---

## Point of Sale System

The POS system (`PointOfSale.tsx` + `pos.routes.ts`) serves a distinct use case from the online order system: a customer who walks directly into the station and purchases products over the counter, without using the app at all.

### Why a Separate POS Module?

Regular customer orders require a customer account, a delivery address, and a multi-step fulfillment workflow. A walk-in counter sale needs none of that — the customer is physically present, pays immediately, and takes the product with them. Building a separate POS module for this use case avoids burdening the counter staff with the full order management workflow.

### POS Transaction Flow

1. The admin opens `PointOfSale.tsx`. The product grid for their station loads.
2. The admin clicks products to build the customer's cart. Quantities are adjustable inline with `+` and `−` buttons.
3. The running total is displayed prominently.
4. The admin selects the payment method: Cash or GCash.
5. The admin confirms the transaction. `POST /pos/transaction` is sent to the server with the cart, payment method, and the admin's identity (from `req.user.id`).
6. The server creates a `pos_transactions` record and deducts the quantities from `inventory`, creating `inventory_transactions` records for each deduction. If any product's stock drops below `min_stock_level`, a notification is automatically dispatched to the admin.
7. The transaction is confirmed on screen. The cart resets to empty.

POS transactions are included in the `reports.routes.ts` aggregations, so walk-in revenue appears in the same admin dashboard charts as online order revenue.

---

## Environment Variables Reference

Environment variables are configuration values that exist outside the source code, loaded at runtime from a `.env` file (in development) or from the hosting platform's settings panel (in production). This pattern means the same codebase can be deployed in different environments with different databases, secret keys, and external service accounts simply by changing the environment variables.

### Server `.env`

| Variable | Example Value | Description |
| :--- | :--- | :--- |
| PORT | 8080 | The port number the Express server listens on |
| NODE_ENV | production | Set to `production` for deployment. Controls cookie security policy (SameSite=None and Secure) and disables development-only middleware. |
| DB_HOST | 127.0.0.1 | Hostname or IP address of the MySQL server |
| DB_PORT | 3306 | MySQL connection port (default 3306, Aiven uses a different port) |
| DB_USER | root | MySQL username |
| DB_PASSWORD | yourpassword | MySQL password |
| DB_NAME | aqualastech | Name of the MySQL database |
| DB_SSL | true | Set to `true` to enable SSL for the database connection (required for cloud-hosted databases like Aiven) |
| JWT_KEY | a_long_random_string | The secret used to sign and verify JWT tokens. Must be kept confidential — anyone with this key can forge valid tokens. |
| CLIENT_URL | http://localhost:5173 | The exact origin of the frontend application. Used in the CORS configuration to whitelist requests from this origin only. Must not have a trailing slash. |
| CLOUDINARY_CLOUD_NAME | my_cloud | The Cloudinary account's cloud name, found in the Cloudinary dashboard |
| CLOUDINARY_API_KEY | 123456789012345 | The Cloudinary API key |
| CLOUDINARY_API_SECRET | abc123... | The Cloudinary API secret — treat this like a password |
| MAIL_USER | email@gmail.com | The Gmail address Nodemailer sends password reset emails from |
| MAIL_PASS | abcd efgh ijkl mnop | A Gmail App Password (16-character code, not the account password) |
| MAIL_FROM | AquaLasTech \<email@gmail.com\> | The display name and address that appears in the "From:" field of sent emails |

### Client `.env`

| Variable | Example Value | Description |
| :--- | :--- | :--- |
| VITE_API_URL | http://localhost:8080 | The base URL of the backend API server. All Axios requests are made relative to this URL. |
| VITE_FB_PAGE_URL | https://facebook.com/... | URL of the station's Facebook page, linked on the landing page |
| VITE_CONTACT_EMAIL | info@aqualas.com | Contact email address displayed on the landing page |
| VITE_CONTACT_PHONE | 09XXXXXXXXX | Contact phone number displayed on the landing page |

> **Security note:** All `VITE_*` variables are embedded into the JavaScript bundle at build time. This means they are readable by anyone who opens the browser developer tools and inspects the bundle. Never put secrets — database passwords, JWT keys, API secrets — in the client `.env`. These belong exclusively in the server `.env`.

---

## Enum Constants Reference

All numeric status codes stored in the database are defined as named constants in `server/src/constants/dbEnums.ts`. Using named constants instead of raw numbers throughout the codebase makes the code self-documenting — `ORDER_STATUS.CONFIRMED` is immediately understandable, whereas `1` requires context.

### User Roles (`users.role`)

| Constant | Value | Who it represents |
| :--- | :--- | :--- |
| ROLE.CUSTOMER | 1 | Customer accounts — access the customer dashboard only |
| ROLE.ADMIN | 2 | Station staff accounts — access the admin dashboard |
| ROLE.SUPER_ADMIN | 3 | Station owner accounts — admin access plus station settings |
| ROLE.SYS_ADMIN | 4 | Platform administrator — system-wide controls |

### Station Status (`stations.status`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| STATION_STATUS.OPEN | 1 | Station is operating normally |
| STATION_STATUS.CLOSED | 2 | Station is temporarily closed |
| STATION_STATUS.MAINTENANCE | 3 | System-wide maintenance is active; customers are blocked |

### Order Status (`orders.order_status`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| ORDER_STATUS.CONFIRMED | 1 | Order received and confirmed, awaiting preparation |
| ORDER_STATUS.PREPARING | 2 | Station is preparing the order |
| ORDER_STATUS.OUT_FOR_DELIVERY | 3 | Order has been dispatched and is en route |
| ORDER_STATUS.DELIVERED | 4 | Order was successfully delivered |
| ORDER_STATUS.CANCELLED | 5 | Order was cancelled before delivery |
| ORDER_STATUS.RETURNED | 6 | Order was returned after delivery |

### Payment Mode (`orders.payment_mode`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| PAYMENT_MODE.GCASH | 1 | Customer paid via GCash digital transfer |
| PAYMENT_MODE.CASH | 2 | Customer will pay upfront in cash |
| PAYMENT_MODE.CASH_ON_DELIVERY | 3 | Customer pays cash when the order arrives |
| PAYMENT_MODE.CASH_ON_PICKUP | 4 | Customer pays cash when collecting at the station |

### Payment Status (`payments.payment_status`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| PAYMENT_STATUS.PENDING | 1 | GCash payment uploaded, awaiting admin review |
| PAYMENT_STATUS.VERIFIED | 2 | Admin confirmed the payment is valid |
| PAYMENT_STATUS.REJECTED | 3 | Admin rejected the payment (insufficient amount, wrong recipient, etc.) |

### Inventory Transaction Type (`inventory_transactions.transaction_type`)

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| TRANSACTION_TYPE.RESTOCK | 1 | Stock was added (new supply received) |
| TRANSACTION_TYPE.DEDUCTION | 2 | Stock was removed (order fulfilled or POS sale) |
| TRANSACTION_TYPE.ADJUSTMENT | 3 | Stock was set to an exact value (after a physical count) |

### Notification Type (`notifications.notification_type`)

| Constant | Value | Meaning | Recipient |
| :--- | :--- | :--- | :--- |
| NOTIFICATION_TYPE.ORDER_UPDATE | 1 | An order's status changed | Customer |
| NOTIFICATION_TYPE.PAYMENT_UPDATE | 2 | A payment was verified or rejected | Customer |
| NOTIFICATION_TYPE.INVENTORY_ALERT | 3 | Stock fell below the minimum level | Admin |
| NOTIFICATION_TYPE.SYSTEM_MESSAGE | 4 | A new order, cancellation, or return request | Admin |

### System Log Event Types (`system_logs.event_type`)

These are stored as VARCHAR strings rather than TINYINT values because they are human-readable audit labels, not status codes that the application logic needs to compare programmatically.

| Value | When it is created |
| :--- | :--- |
| login | A user successfully authenticates |
| logout | A user ends their session |
| station_created | System admin creates a new station |
| station_updated | Station details are modified |
| station_deleted | System admin deletes a station |
| user_created | A new admin account is created |
| user_updated | An account's details are changed |
| user_deleted | An account is deleted |
| maintenance_on | System-wide maintenance mode is enabled |
| maintenance_off | System-wide maintenance mode is disabled |
| logs_cleared | The system admin clears the audit log |
| order_created | A customer places a new order |
| order_updated | An order's status is changed |

---

*This document describes the complete technical structure of AquaLasTech as of April 2026. For changes made after this date, refer to the git commit history (`git log --oneline`) and the current state of the source files, which are always the authoritative reference.*
