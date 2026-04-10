# AquaLasTech — System Documentation

> This document is written so that anyone — even someone with no prior coding experience — can read it from start to finish and walk away with a clear understanding of how this entire system works. Every concept is explained in plain language before any code is shown. Technical words are always defined the first time they appear. At the end of this document is a hands-on exercise that guides you through building a simple version of this system yourself, using the exact same tools and setup.

---

### Table of Contents

1. [What Is AquaLasTech?](#what-is-aqualastech)
2. [How the System Is Structured](#how-the-system-is-structured)
3. [The Technology Stack — What Each Tool Does and Why](#the-technology-stack--what-each-tool-does-and-why)
4. [How the Three Layers Talk to Each Other](#how-the-three-layers-talk-to-each-other)
5. [Project Folder Structure](#project-folder-structure)
6. [The Database — How Data Is Stored](#the-database--how-data-is-stored)
7. [The Server — Every File Explained](#the-server--every-file-explained)
8. [The Client — Every File Explained](#the-client--every-file-explained)
9. [How Login and Identity Work](#how-login-and-identity-work)
10. [Who Can Do What — Roles and Permissions](#who-can-do-what--roles-and-permissions)
11. [All API Endpoints](#all-api-endpoints)
12. [Core Features — How They Actually Work](#core-features--how-they-actually-work)
13. [The Notification System](#the-notification-system)
14. [The Reports System](#the-reports-system)
15. [The Point of Sale System](#the-point-of-sale-system)
16. [File Uploads and Images](#file-uploads-and-images)
17. [Maintenance Mode](#maintenance-mode)
18. [Environment Variables](#environment-variables)
19. [Status Code Reference](#status-code-reference)
20. [Deployment Guide](#deployment-guide)
21. [Beginner Exercise — Build Your Own Mini Version](#beginner-exercise--build-your-own-mini-version)

---

### What Is AquaLasTech?

AquaLasTech is a web application — a program that runs inside a browser — built to digitize the daily operations of water refilling stations. Before a system like this existed, station owners took orders by phone, wrote inventory levels on paper, and had no way to see their sales data without manually counting receipts. AquaLasTech replaces all of that with one platform that works on any device.

The system serves four types of people, called **roles**:

- **Customer** — a person who buys water. They browse products, place orders, pay online or with cash, and track their order in real time.
- **Staff** — the station employee who processes orders, manages stock, verifies payments, and handles walk-in customers using the built-in cashier terminal.
- **Store Owner** — the station owner. They can do everything Staff can do, plus configure the station's details: name, address, logo, GCash QR code, and which staff accounts belong to their station.
- **System Admin** — the platform operator who manages all stations across the entire network. They can create stations, delete stations, and trigger a system-wide maintenance mode.

---

### How the System Is Structured

Think of this system like a restaurant. The **customer** sits at a table and sees only the menu (the frontend). The **kitchen** (the server/backend) receives the order, processes it, and sends the food back. The **pantry** (the database) is where all the ingredients — meaning all the data — are stored.

These three parts have a technical name: a **three-tier architecture**.

```
BROWSER (what the user sees)
    ↕  sends requests and receives responses
SERVER (the brain — processes all logic)
    ↕  reads and writes data
DATABASE (the storage — holds everything permanently)
```

Each part has exactly one job:
- The **browser** shows the user interface and collects input from the user.
- The **server** decides what the user is allowed to do, runs the logic, and talks to the database.
- The **database** stores everything permanently — users, orders, inventory, payments, notifications.

The browser and server communicate through **HTTP requests** — the same technology that loads a web page. When a customer clicks "Place Order," the browser sends a message to the server. The server processes it, saves the order to the database, and sends a response back. The browser then updates what the customer sees.

---

### The Technology Stack — What Each Tool Does and Why

A **technology stack** is the collection of tools used to build a system. Every tool has a specific job.

#### The Language: TypeScript

Both the server and the browser code are written in **TypeScript**. TypeScript is an extension of JavaScript — the language that runs in browsers and on servers. The key difference is that TypeScript requires you to say what type of data a variable holds: a number, a piece of text, a list, or a more complex object. This catches mistakes early. For example, if a function expects a number and you accidentally pass text, TypeScript will warn you before the program even runs.

#### Backend (Server) Tools

| Tool | Plain Language Explanation |
| :--- | :--- |
| Node.js | Lets JavaScript run on a server, not just in a browser |
| Express.js | A framework that makes it easy to define what the server should do when it receives different types of requests |
| MySQL 2 | The tool that lets the server read and write data in the MySQL database |
| bcrypt | Takes a plain password and converts it into a scrambled string. The original password can never be recovered from the scrambled version — this is called hashing |
| JSON Web Tokens (JWT) | A small, signed piece of text that proves who you are after you log in. It works like a wristband at an event — you show it to get access |
| Multer | Handles file uploads — when a user submits a photo, Multer intercepts it before it reaches the main logic |
| Cloudinary | A cloud service where all uploaded images are stored permanently. Images uploaded here can be viewed from anywhere in the world via a URL |
| Nodemailer | Sends emails — used for password reset links |
| Helmet | Adds security headers to every server response to protect against common web attacks |
| CORS | Controls which websites are allowed to talk to this server. Without this, any website on the internet could send requests to the server |
| dotenv | Reads a secret configuration file (.env) and makes its values available to the server code |

#### Frontend (Browser) Tools

| Tool | Plain Language Explanation |
| :--- | :--- |
| React | A library for building user interfaces. Instead of writing one giant HTML page, you build small reusable pieces called components — a button, a card, a form — and compose them together |
| Vite | The tool that takes your React code and turns it into files a browser can understand. It also runs a local development server with instant refresh on save |
| React Router | Handles navigation inside the app. When you click "Orders," the URL changes and the correct page component is shown — without the browser reloading the entire page |
| Axios | The tool the browser uses to send HTTP requests to the server. Think of it as the messenger between the frontend and backend |
| TailwindCSS | A way of styling the app by adding class names directly to elements. Instead of writing a separate CSS file, you write `bg-blue-500 text-white rounded-lg` directly in the component |
| Leaflet | An interactive map library. Used in the customer settings page to let users drop a pin on their location |

#### Database

| Tool | Plain Language Explanation |
| :--- | :--- |
| MySQL | A relational database. Data is stored in tables, like spreadsheets. Each table has rows (individual records) and columns (fields). Tables can be linked to each other — for example, an order row links to a customer row and a station row |

---

### How the Three Layers Talk to Each Other

This is the most important concept to understand. Every action in the app follows this exact path:

```
1. User does something in the browser (clicks a button, submits a form)
        ↓
2. The browser sends an HTTP request to the server
   (a message that says: "here is who I am, here is what I want")
        ↓
3. The server checks: is this person logged in? are they allowed to do this?
        ↓
4. The server runs the logic (validate data, calculate totals, check inventory)
        ↓
5. The server reads or writes to the database
        ↓
6. The server sends a response back to the browser (success or error + data)
        ↓
7. The browser updates what the user sees based on the response
```

#### A Concrete Example: Customer Places an Order

1. Customer fills in their order form and taps "Place Order"
2. The browser collects all the form data and sends it to `POST /customer/orders` on the server
3. The server checks the JWT (the identity wristband) — is this a real logged-in customer?
4. The server checks inventory — does each product have enough stock?
5. The server saves a new row in the `orders` table, saves rows in `order_items`, deducts quantities from `inventory`, and saves a row in `payments`
6. The server sends back `{ message: "Order placed", order_id: 42 }`
7. The browser shows the customer a success screen and redirects to My Orders

#### What Is an HTTP Request?

An HTTP request is a structured message from the browser to the server. It has:

- A **method** — what kind of action: GET (fetch data), POST (create something), PUT (update something), DELETE (remove something)
- A **path** — the address on the server: `/orders`, `/auth/login`, `/inventory`
- **Headers** — extra information like identity: `Authorization: Bearer eyJ...`
- A **body** — the data being sent, if any: `{ email: "user@email.com", password: "..." }`

The server reads all of this, processes it, and sends back a **response** with a status code (200 = success, 400 = bad request, 401 = not logged in, 403 = not allowed, 404 = not found, 500 = server error) and usually some JSON data.

#### What Is JSON?

JSON is a text format for passing data between the browser and server. It looks like this:

```json
{
    "order_id": 42,
    "customer_name": "Juan dela Cruz",
    "total_amount": 150.00,
    "order_status": "confirmed"
}
```

The server sends JSON. The browser receives it and uses the data to update the screen.

---

### Project Folder Structure

The project is a **monorepo** — one repository that contains two completely independent sub-projects: `client` (the browser app) and `server` (the backend). They have separate dependencies and are deployed to separate hosting services.

```
AquaLasTech/
├── client/                  ← Everything the browser runs
│   ├── public/              ← Static files served as-is (favicon, manifest)
│   ├── src/                 ← All React source code
│   │   ├── assets/          ← Images and fonts bundled into the app
│   │   ├── components/      ← Reusable UI pieces (SuperAdminRoute, MaintenanceGuard)
│   │   ├── context/         ← Global state shared across all pages (AuthContext)
│   │   ├── hooks/           ← Reusable logic pieces (useStation)
│   │   ├── layout/          ← Page wrappers with sidebar/topbar (AdminLayout, CustomerLayout)
│   │   ├── pages/           ← One file per page of the app
│   │   │   ├── admin/       ← Pages only admins see
│   │   │   ├── customer/    ← Pages only customers see
│   │   │   ├── sysadmin/    ← Pages only system admins see
│   │   │   └── public/      ← Login, signup, landing, maintenance pages
│   │   ├── routes/          ← Defines which URL shows which page
│   │   ├── main.tsx         ← Entry point — where React starts
│   │   └── index.css        ← Global styles
│   ├── index.html           ← The single HTML file the browser loads
│   ├── package.json         ← Client dependencies and scripts
│   └── vite.config.ts       ← Build tool configuration
│
└── server/
    ├── src/
    │   ├── config/          ← Database connection, Cloudinary setup
    │   ├── constants/       ← Shared numeric codes (status values, role numbers)
    │   ├── middleware/       ← Code that runs on every request before the main logic
    │   ├── routes/          ← One file per feature area (orders, inventory, auth...)
    │   ├── scripts/         ← One-time utility scripts (image migration)
    │   ├── app.ts           ← Assembles the Express server
    │   └── server.ts        ← Starts the server on a port
    ├── package.json         ← Server dependencies and scripts
    └── tsconfig.json        ← TypeScript configuration
```

---

### The Database — How Data Is Stored

The database is a collection of **tables**. Think of each table as a spreadsheet tab. Each row is one record. Each column is one field. Tables are connected to each other through **foreign keys** — a column in one table that holds the ID of a row in another table.

#### How Tables Connect

```
users ──────────────── admins (one user can be one admin)
  │
  └──────────────────── customers (one user can be one customer)
  │
  └──────────────────── orders (one user places many orders)
                            │
                            ├── order_items (one order has many items)
                            │       │
                            │       └── products (each item is one product)
                            │               │
                            │               └── inventory (each product has stock)
                            │
                            ├── payments (one order has one payment)
                            └── order_returns (one order can have one return request)
```

#### Table Reference

##### `users` — Every account in the system

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| user_id | Number | Unique ID for this user |
| full_name | Text | The user's full name |
| email | Text | Email address — must be unique |
| password_hash | Text | The scrambled version of their password |
| role | Number | 1=customer, 2=staff, 3=store owner, 4=system admin |
| phone_number | Text | Optional phone number |
| profile_picture | Text | URL of their profile photo stored in Cloudinary |
| is_active | Yes/No | Whether this account is active |
| deleted_at | Date/Time | If set, this account has been soft-deleted |

##### `stations` — Each water refilling station

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| station_id | Number | Unique ID for this station |
| station_name | Text | The name of the station |
| address | Text | Street address |
| latitude / longitude | Decimal | GPS coordinates for map display |
| image_path | Text | URL of the station logo in Cloudinary |
| qr_code_path | Text | URL of the GCash QR code image |
| status | Number | 1=open, 2=closed, 3=maintenance |

##### `orders` — Every order placed

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| order_id | Number | Unique ID |
| order_reference | Text | Human-readable code like AQL-20260410-X3K9P |
| user_id | Number | Who placed this order (links to users table) |
| station_id | Number | Which station this order belongs to (links to stations table) |
| order_status | Number | 1=confirmed, 2=preparing, 3=out for delivery, 4=delivered, 5=cancelled, 6=returned |
| payment_mode | Number | 1=gcash, 2=cash, 3=cash on delivery, 4=cash on pickup |
| total_amount | Decimal | The total cost of the order |
| hidden_at | Date/Time | If set, this order is hidden from the list but kept for reports |

##### `order_items` — The products inside each order

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| order_item_id | Number | Unique ID |
| order_id | Number | Which order this item belongs to |
| product_id | Number | Which product was ordered |
| quantity | Number | How many units |
| price_snapshot | Decimal | The price at the time of ordering — saved so price changes don't affect past orders |

##### `products` — Items available for sale

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| product_id | Number | Unique ID |
| station_id | Number | Which station sells this product |
| product_name | Text | Name of the product |
| price | Decimal | Selling price |
| unit | Text | e.g. "5 gallons", "1 slim" |
| is_active | Yes/No | Whether this product is visible to customers |
| image_url | Text | Product photo URL from Cloudinary |

##### `inventory` — Stock levels per product per station

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| inventory_id | Number | Unique ID |
| product_id | Number | Which product |
| station_id | Number | Which station |
| quantity | Number | Current stock count |
| min_stock_level | Number | Alert threshold — when stock falls below this, admins are notified |

##### `payments` — Payment record for each order

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| payment_id | Number | Unique ID |
| order_id | Number | Which order this payment is for |
| payment_type | Number | Same values as order.payment_mode |
| payment_status | Number | 1=pending, 2=verified, 3=rejected |
| proof_image_path | Text | URL of the GCash receipt image |

##### `notifications` — Messages sent to users

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| notification_id | Number | Unique ID |
| user_id | Number | Who receives this notification |
| station_id | Number | Which station it relates to |
| message | Text | The notification text |
| notification_type | Number | 1=order update, 2=payment update, 3=inventory alert, 4=system message |
| is_read | Yes/No | Whether the user has read it |

##### `admins` — Links user accounts to stations with admin roles

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| id | Number | Unique ID |
| user_id | Number | Which user account |
| station_id | Number | Which station they manage |

##### `pos_transactions` — Walk-in sales from the Point of Sale terminal

| Column | Type | What It Stores |
| :--- | :--- | :--- |
| transaction_id | Number | Unique ID |
| order_id | Number | The order this POS sale created |
| station_id | Number | Which station processed this sale |
| processed_by | Number | Which admin processed it |
| total_amount | Decimal | Total sale amount |
| payment_method | Number | 1=cash, 2=gcash |

#### Why Numbers Instead of Words for Status?

Storing the word "confirmed" takes 9 bytes of storage. Storing the number 1 takes 1 byte. Across millions of orders, this adds up. The server converts the number back to a readable word before sending it to the browser, so the user always sees "Confirmed" — never a raw number.

---

### The Server — Every File Explained

#### `server.ts` — The Starting Point

This is the first file that runs when the server starts. It imports the assembled Express app from `app.ts` and tells it to listen on a port number — the "door" the server opens to accept incoming requests.

```typescript
import app from './app.js'
const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

When you run `npm run dev`, Node.js executes this file. Port 8080 means the server is reachable at `http://localhost:8080` during development.

#### `app.ts` — Assembling the Server

This file creates the Express application and plugs in all the pieces. Think of it as the control panel. Middleware is registered here — middleware is code that runs on every incoming request before it reaches the specific route handler.

```typescript
app.use(helmet())           // Security headers on every response
app.use(cors({ origin }))   // Only accept requests from the known frontend URL
app.use(cookieParser())     // Read cookies from the request
app.use(express.json())     // Parse JSON bodies so req.body is usable

app.use('/auth', authRoutes)
app.use('/orders', orderRoutes)
app.use('/inventory', inventoryRoutes)
// ... all other route files
```

The order matters. `cookieParser()` must run before any route that reads cookies. `express.json()` must run before any route that reads the request body.

#### `config/db.ts` — The Database Connection

This file creates one shared connection pool to the MySQL database. A **connection pool** is a set of reusable database connections that are kept open rather than opened and closed for every request — opening a database connection is slow, so reusing them is much faster.

```typescript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
})
```

SSL (Secure Sockets Layer) is enabled for the cloud database on Aiven to encrypt the connection so data cannot be intercepted in transit.

Every route file calls `connectToDatabase()` to get this shared pool and then runs SQL queries through it.

#### `config/cloudinary.ts` — Image Upload Setup

Cloudinary is the cloud service where all images are stored. This file configures the connection to Cloudinary using API credentials from the `.env` file and exports a factory function that creates an upload handler for a specific folder.

```typescript
export function createUpload(folder: string) {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: { folder: `aqualastech/${folder}`, allowed_formats: ['jpg','png','webp'] }
    })
    return multer({ storage })
}
```

When a route needs to handle an image upload, it calls `createUpload('receipts')` to get a Multer middleware configured to stream files directly to the `aqualastech/receipts` folder on Cloudinary. The file never touches the server's disk.

#### `constants/dbEnums.ts` — All Numeric Codes in One Place

Instead of scattering magic numbers like `1`, `2`, `3` throughout the code, they are all defined here with readable names.

```typescript
export const ORDER_STATUS = {
    CONFIRMED: 1,
    PREPARING: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
    CANCELLED: 5,
    RETURNED: 6,
}

export const PAYMENT_STATUS = {
    PENDING: 1,
    VERIFIED: 2,
    REJECTED: 3,
}
```

Every route file imports these constants. This means if the number for "delivered" ever needed to change, you change it in one place and every route immediately uses the new value.

#### `middleware/verifyToken.middleware.ts` — The Identity Check

This middleware runs on every protected route. It reads the JWT from either the cookie or the Authorization header, verifies it is genuine and not expired, and attaches the decoded user information to the request so the route handler can use it.

**What is a JWT?** After you log in, the server creates a small signed text string called a JSON Web Token. It contains your user ID, your role, and your station ID, all encoded and signed with a secret key. Because it is signed, any tampering makes the signature invalid. The server does not store this token — it just verifies the signature when it arrives.

```typescript
// The token carries: { id: 14, role: "super_admin", station_id: 3 }
// Any route that calls verifyToken can then read:
req.user.id          // 14
req.user.role        // "super_admin"
req.user.station_id  // 3
```

If the token is missing, expired, or tampered with, the server immediately responds with `401 Unauthorized` and the route handler never runs.

#### `routes/auth.routes.ts` — Login, Logout, and Passwords

Handles all account-related actions.

**Login flow:**
1. Receive email and password
2. Find the user in the database by email
3. Use bcrypt to compare the submitted password against the stored hash — bcrypt can check if a password matches a hash without ever reversing the hash
4. If they match, create a JWT with the user's ID, role, and station_id
5. Set the JWT as a cookie and also return it in the response body

**Why two copies of the token?** Because iOS Safari blocks cookies sent between different domains. The frontend is on Vercel, the backend is on Render — different domains. The cookie works on desktop browsers; the body token (stored in localStorage and sent as an Authorization header) works on iOS. Both paths are verified by `verifyToken`.

#### `routes/order.routes.ts` — The Order Lifecycle

This is the most complex route file. It handles every state an order passes through.

**When a new order arrives:**
- All items are checked against inventory — if any item has insufficient stock, the entire request is rejected
- The order, items, and payment are saved in a single database transaction (meaning if any step fails, none of them are saved)
- Inventory quantities are deducted immediately
- The station admins receive a notification

**Payment status at placement:**
- GCash → pending (admin must verify the uploaded receipt)
- Cash on Delivery → pending (payment not yet collected)
- Cash on Pickup → pending (payment not yet collected)
- Cash upfront → verified immediately

**When delivery is confirmed:**
- The server automatically marks COD and COP payments as verified (cash has been collected)
- GCash requires separate manual verification

**When GCash is rejected:**
- The order is automatically cancelled
- Stock is restored to inventory
- The customer is notified

**Soft delete:** When an admin deletes orders from the history view, the row is not actually removed from the database. Instead, a `hidden_at` timestamp is set. The order list query filters out rows where `hidden_at` is not null. Reports never filter by `hidden_at` — so deleted orders still count in all sales figures.

#### `routes/customer.routes.ts` — Customer-Side Actions

Handles order placement from the customer's perspective, profile management, and customer-initiated cancellations.

When a customer cancels an order, the server:
1. Verifies the order is still in `confirmed` status (the only cancellable state)
2. Sets the order status to cancelled
3. Restores all item quantities back to inventory
4. Notifies the customer
5. Notifies all station admins

#### `routes/pos.routes.ts` — Walk-In Sales Terminal

The Point of Sale handles customers who come to the station in person. No customer account is needed. The staff enters the items, the customer's name, and the payment method.

The system maps the two form inputs into the correct payment mode:
- GCash → `gcash`
- Cash + Delivery → `cash_on_delivery` (pending payment)
- Cash + Pickup → `cash_on_pickup` (verified immediately — paid at counter)

#### `routes/inventory.routes.ts` — Stock Management

Three operations change stock levels:
- **Restock** — adds quantity (new stock arrived)
- **Deduction** — subtracts quantity (manual correction)
- **Adjustment** — sets quantity to an exact number (reconciliation after a physical count)

Every change is recorded in `inventory_transactions` for a full audit trail. After every change, if the new quantity is below `min_stock_level`, an inventory alert notification is sent to all admins of that station.

#### `routes/reports.routes.ts` — Sales Analytics

Accepts a `period` parameter (daily, weekly, monthly, annually) and returns aggregated sales data scoped to the admin's station. The queries use `DATE_FORMAT` and `GROUP BY` to bucket orders into the correct time periods.

Reports intentionally include soft-deleted orders — deleting from the order list view should never alter financial history.

#### `routes/settings.routes.ts` — Station Configuration

Store Owners can update their station details, upload a logo, upload a GCash QR code, create staff accounts, and delete staff accounts (password required for deletion).

There is also one endpoint accessible to all users — `GET /settings/maintenance-status` — which reads the station's current status so the frontend can show or hide the maintenance page.

#### `routes/sysadmin.routes.ts` — Platform-Wide Administration

Only System Admins can access these routes. Handles creation and deletion of stations, the maintenance mode toggle (updates all stations simultaneously), and viewing the system audit log.

---

### The Client — Every File Explained

#### `main.tsx` — Where React Starts

This is the entry point of the frontend. Two important things happen here:

**1. An Axios interceptor is registered.** An interceptor is a function that runs automatically before every HTTP request the app sends. This one reads the JWT from localStorage and adds it to the request as an Authorization header — so every request the app makes automatically identifies the logged-in user.

```typescript
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken")
    if (token) config.headers.set("Authorization", `Bearer ${token}`)
    return config
})
```

**2. The app is rendered.** React is told to take over a `<div id="root">` in the HTML file and render the full application inside it.

#### `context/AuthContext.tsx` — The Global Login State

React **context** is a way to share data across all components in the app without passing it through every level manually. `AuthContext` holds the logged-in user's information.

When a component anywhere in the app calls `useAuth()`, it gets access to:
- `user` — the logged-in user's data (or `null` if not logged in)
- `login(userData)` — a function to set the logged-in user
- `logout()` — a function to clear the session

On page load, the context automatically calls `GET /auth/me` to restore the session. The server reads the JWT, verifies it, and returns the user's data. This is why you stay logged in even after refreshing the browser.

#### `routes/router.tsx` — Page Routing

This file defines which URL shows which page component. React Router intercepts navigation (clicking links, typing URLs) and renders the matching component without reloading the browser.

```
/                   → LandingPage
/login              → LoginPage
/signup             → SignupPage
/admin/orders       → AdminCustomerOrder (admin only)
/customer/orders    → CustomerOrder (customer only)
/sysadmin/stations  → SAStations (system admin only)
```

#### `routes/ProtectedRoute.tsx` — The Page Guard

Before showing a protected page, this component checks the user's role. If the role does not match what the route requires, the user is redirected to the login page. This prevents a customer from navigating to `/admin/orders` by typing it in the URL.

#### `components/MaintenanceGuard.tsx` — Maintenance Check

This component wraps the entire customer interface. On every page load, it calls `GET /settings/maintenance-status`. If the station is under maintenance, it shows the maintenance page instead of the normal interface — customers cannot bypass this by navigating to a different URL.

#### `hooks/useStation.ts` — Station Data with Refresh

A custom hook that fetches the current station's data. It exposes a `tick` counter that other components can increment to force a data refresh without reloading the page.

#### `layout/AdminLayout.tsx` — The Admin Shell

The persistent sidebar and top bar that wraps every admin page. Shows the station name, the logged-in user's name, their role badge (Store Owner or Staff), and navigation links. The logo and station logo are loaded from Cloudinary URLs stored in the database.

#### `layout/CustomerLayout.tsx` — The Customer Shell

The navigation bar at the top and bottom of the customer interface. Includes links to Order, My Orders, Notifications, and Settings.

#### Admin Pages

| File | What It Does |
| :--- | :--- |
| `AdminCustomerOrder.tsx` | Order list with filters, status updates, payment verification, return management, and history view with password-protected bulk delete |
| `AdminDashboard.tsx` | KPI cards (revenue, orders, cancelled, returned), period charts, top products, and the inventory modal |
| `AdminInventory.tsx` | Product management and stock level controls (restock, deduction, adjustment) |
| `PointOfSale.tsx` | Walk-in cashier terminal with cart, payment selection, and receipt printing |
| `AdminSettings.tsx` | Station configuration, logo upload, GCash QR upload, staff account management |

#### Customer Pages

| File | What It Does |
| :--- | :--- |
| `CustomerOrder.tsx` | Station selection, product catalog, cart, checkout, My Orders with status timeline, return requests, and order cancellation |
| `CustomerNotification.tsx` | Real-time notification list with read/unread state |
| `CustomerSettings.tsx` | Profile editing, address and map pin, password change, profile picture upload |

#### System Admin Pages

| File | What It Does |
| :--- | :--- |
| `SAStations.tsx` | All stations overview with stats, create/delete station, maintenance toggle |
| `SALogs.tsx` | System audit log viewer |

---

### How Login and Identity Work

This section walks through exactly what happens when a user logs in and how the system knows who they are on every subsequent request.

#### Step 1 — Login

The user fills in their email and password and clicks Log In. The browser sends:

```
POST /auth/login
Body: { email: "user@email.com", password: "mysecret" }
```

The server finds the user record in the database. It uses bcrypt to check if the submitted password matches the stored hash. If it matches, the server creates a JWT containing:

```json
{ "id": 14, "role": "super_admin", "station_id": 3 }
```

This token is signed with a secret key only the server knows. The server sends it back in two ways: as a cookie (for desktop browsers) and in the response body (for iOS, which blocks cross-site cookies).

#### Step 2 — Storing the Token

The frontend receives the token in the response body and saves it to `localStorage` — a small storage area in the browser that persists until the user logs out.

#### Step 3 — Every Request After Login

Before every HTTP request, the Axios interceptor reads the token from localStorage and adds it to the request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The server's `verifyToken` middleware reads this header, verifies the signature, and extracts the user's ID, role, and station_id. The route handler then uses this information to decide what data to return.

#### Step 4 — Logout

The server clears the cookie. The frontend deletes the token from localStorage and resets the auth context to null. The next page load finds no token and shows the login page.

---

### Who Can Do What — Roles and Permissions

Access control works at three levels:

**Level 1 — Frontend route guards.** `ProtectedRoute` checks the role before rendering a page. A customer cannot even see the admin pages.

**Level 2 — Backend middleware.** Route files use role-checking middleware like `requireSuperAdmin` before certain endpoints. Even if someone crafted a raw HTTP request to an admin endpoint, the server rejects it if the JWT does not contain the right role.

**Level 3 — Database scoping.** Every query that returns station data includes `WHERE station_id = ?` using the station_id from the JWT. An admin from Station A cannot see Station B's data even if they somehow had admin access, because the query is hardcoded to their station.

#### Role Reference

| Role | Number in DB | What They Can Access |
| :--- | :--- | :--- |
| Customer | 1 | Customer pages only — orders, notifications, settings |
| Staff | 2 | Admin pages — orders, inventory, POS, dashboard |
| Store Owner | 3 | All Staff access plus station settings and staff management |
| System Admin | 4 | System admin pages — all stations, maintenance, audit logs |

---

### All API Endpoints

An **endpoint** is a specific address on the server that accepts requests. The format is: `METHOD /path`.

#### Authentication — `/auth`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| POST | /auth/login | Anyone | Log in — returns JWT |
| POST | /auth/signup | Anyone | Create a customer account |
| POST | /auth/logout | Logged in | Clear the session cookie |
| GET | /auth/me | Logged in | Return current user data; refresh token |
| PUT | /auth/change-password | Logged in | Update password |
| POST | /auth/forgot-password | Anyone | Send reset link by email |
| POST | /auth/reset-password | Anyone | Apply a new password via reset token |

#### Orders — `/orders`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| GET | /orders | Staff+ | List orders for the station |
| GET | /orders/:id | Staff+ | Single order with all items |
| PUT | /orders/:id/status | Staff+ | Advance order status |
| PUT | /orders/:id/payment | Staff+ | Verify or reject a GCash payment |
| POST | /orders/verify-password | Staff+ | Verify admin password before bulk delete |
| PUT | /orders/:id/return | Staff+ | Approve or reject a return |
| DELETE | /orders/history | Staff+ | Soft-delete all history orders |
| DELETE | /orders/:id | Staff+ | Soft-delete one order |

#### Customer — `/customer`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| POST | /customer/orders | Customer | Place a new order |
| GET | /customer/orders | Customer | View own orders |
| PUT | /customer/orders/:id/cancel | Customer | Cancel a confirmed order |
| POST | /customer/orders/:id/return | Customer | Request a return |
| GET | /customer/products/:station_id | Customer | Browse products at a station |
| PUT | /customer/profile | Customer | Update name and address |
| PUT | /customer/password | Customer | Change password |
| POST | /customer/avatar | Customer | Upload profile picture |

#### Inventory — `/inventory`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| GET | /inventory | Staff+ | Current stock levels |
| POST | /inventory/restock | Staff+ | Add stock |
| POST | /inventory/deduction | Staff+ | Remove stock |
| POST | /inventory/adjustment | Staff+ | Set exact stock value |
| GET | /inventory/transactions | Staff+ | Full stock movement history |

#### Settings — `/settings`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| GET | /settings/maintenance-status | Anyone logged in | Check if station is in maintenance |
| PUT | /settings/station/:id | Store Owner | Update station details |
| POST | /settings/station/:id/upload-logo | Store Owner | Upload station logo |
| POST | /settings/station/:id/upload-qr | Store Owner | Upload GCash QR code |
| GET | /settings/admins | Store Owner | List staff accounts |
| POST | /settings/create-admin | Store Owner | Create a staff account |
| DELETE | /settings/admins/:id | Store Owner | Delete a staff account (password required) |

#### POS — `/pos`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| POST | /pos/transaction | Staff+ | Process a walk-in sale |
| POST | /pos/upload-receipt | Staff+ | Upload a GCash receipt for a POS sale |
| GET | /pos/transactions | Staff+ | View POS transaction history |

#### Reports — `/reports`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| GET | /reports/summary | Staff+ | Sales summary by period |
| GET | /reports/day/:date | Staff+ | Full order breakdown for one day |

#### System Admin — `/sysadmin`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| GET | /sysadmin/stations | System Admin | All stations |
| POST | /sysadmin/stations | System Admin | Create a station and store owner account |
| DELETE | /sysadmin/stations/:id | System Admin | Delete a station (password required) |
| PUT | /sysadmin/maintenance | System Admin | Toggle maintenance mode for all stations |
| GET | /sysadmin/logs | System Admin | View audit logs |

---

### Core Features — How They Actually Work

#### A Customer Places an Order

1. The customer browses products on the `CustomerOrder.tsx` page. Products are fetched from `GET /customer/products/:station_id`.
2. Items are added to a cart. The cart is stored in React state — it exists only in the browser's memory and is not saved to the server until checkout.
3. The customer selects a payment method and taps Place Order.
4. The browser sends `POST /customer/orders` with the cart items, total, payment mode, and an optional GCash receipt photo.
5. The server validates the JWT, checks inventory stock, saves the order, deducts inventory, saves the payment record, and notifies the admins.
6. The browser shows a confirmation and redirects to My Orders.

#### An Admin Processes an Order

1. The admin sees a notification: "New order received."
2. In `AdminCustomerOrder.tsx`, the new order appears in the Active tab.
3. For GCash: the admin reviews the receipt image and clicks Verify Payment → `PUT /orders/:id/payment`.
4. For COD/COP: no payment verification needed — it is automatically verified when delivered.
5. The admin advances the order status: Confirmed → Preparing → Out for Delivery → Delivered → `PUT /orders/:id/status`.
6. The customer receives a notification at each status change.

#### A Customer Cancels an Order

1. In My Orders, the customer sees a "Can still cancel" hint below confirmed orders.
2. They tap the order, then tap "Cancel Order" and provide a reason.
3. The browser sends `PUT /customer/orders/:id/cancel`.
4. The server cancels the order, restores inventory, notifies the customer, and notifies all station admins.

---

### The Notification System

Notifications are created server-side and stored in the `notifications` table. They are never created by the browser.

Every significant event creates a notification row in the database, targeted at a specific `user_id`. The recipient sees it in the notification bell. Notifications are marked as read when the user opens the notification panel.

| Event | Who Gets Notified |
| :--- | :--- |
| Customer places an order | All station admins |
| Admin updates order status | The customer |
| Admin verifies GCash payment | The customer |
| Admin rejects GCash payment (auto-cancels) | The customer |
| Customer cancels an order | All station admins + the customer |
| Stock falls below minimum level | All station admins |
| Return request submitted | All station admins |
| Return approved or rejected | The customer |

---

### The Reports System

The dashboard shows sales data aggregated over a selected time period.

| Period | Data Range | How Orders Are Grouped |
| :--- | :--- | :--- |
| Daily | Last 30 days | One data point per day |
| Weekly | Last 12 weeks | One data point per week |
| Monthly | Last 12 months | One data point per month |
| Annually | Last 5 years | One data point per year |

**Total Revenue** counts all non-cancelled, non-returned orders. The sub-label "from delivered orders" shows only the subset that has been fully delivered — the revenue that has definitively been collected and fulfilled.

**Reports are never affected by deleting orders from the history view.** Deleting only sets `hidden_at` on the order row. The reports queries do not filter by `hidden_at`. This is intentional — the financial record must never change just because an admin cleaned up the display.

---

### The Point of Sale System

The POS is a cashier terminal built into the admin panel for processing walk-in customers who do not have an account.

The staff selects products from a grid, adjusts quantities, enters the customer's name and address (for delivery), selects cash or GCash, and selects pickup or delivery. The system creates a full order in the database, deducts inventory, and can print a receipt.

Payment mode assignment:
- GCash → gcash
- Cash + Pickup → cash_on_pickup (verified immediately — paid at counter)
- Cash + Delivery → cash_on_delivery (pending — payment collected on arrival)

---

### File Uploads and Images

All images are stored on **Cloudinary** — a cloud image hosting service. The server never saves image files to its own disk, because cloud hosting services like Render have temporary file systems — files saved locally are deleted when the server restarts.

When an image is uploaded:
1. The browser sends the file as part of a form submission
2. Multer intercepts the file before it reaches the route handler
3. CloudinaryStorage streams the file directly to Cloudinary's servers
4. Cloudinary returns a permanent URL
5. The route handler saves that URL to the database
6. The browser loads the image directly from the Cloudinary URL

Images stored:
- Station logos → `aqualastech/stations/`
- GCash QR codes → `aqualastech/qrcodes/`
- Product images → `aqualastech/products/`
- GCash receipts → `aqualastech/receipts/`
- Profile pictures → `aqualastech/avatars/`

---

### Maintenance Mode

When a System Admin enables maintenance mode, a single SQL statement updates all station rows to `status = 3`. Every customer page is wrapped in `MaintenanceGuard.tsx`, which calls `GET /settings/maintenance-status` on load. If the response says maintenance is active, the maintenance page is shown and the normal interface is completely hidden. No URL trick can bypass this because the check happens inside the component, not just at the route level.

---

### Environment Variables

Environment variables are secret configuration values that are never written directly in the code and never committed to version control. They are stored in a `.env` file on the developer's machine and in the hosting platform's settings for production.

#### Server (`server/.env`)

| Variable | What It Is |
| :--- | :--- |
| PORT | The port number the server listens on |
| DB_HOST | The address of the MySQL database server |
| DB_PORT | The port of the database |
| DB_USER | Database username |
| DB_PASSWORD | Database password |
| DB_NAME | The name of the database |
| DB_SSL | Set to `true` for cloud databases that require encrypted connections |
| JWT_KEY | The secret used to sign tokens — must never change in production |
| CLIENT_URL | The URL of the frontend — used to allow CORS requests |
| MAIL_USER | Gmail address for sending password reset emails |
| MAIL_PASS | Gmail App Password (not the regular password) |
| CLOUDINARY_CLOUD_NAME | From the Cloudinary dashboard |
| CLOUDINARY_API_KEY | From the Cloudinary dashboard |
| CLOUDINARY_API_SECRET | From the Cloudinary dashboard |

#### Client (`client/.env`)

| Variable | What It Is |
| :--- | :--- |
| VITE_API_URL | The full URL of the backend server |
| VITE_FB_PAGE_URL | Facebook page URL shown on the landing page |
| VITE_CONTACT_EMAIL | Contact email shown on the landing page |
| VITE_CONTACT_PHONE | Contact phone shown on the landing page |

> All client variables must start with `VITE_`. Vite bakes them into the JavaScript bundle at build time — they become part of the code the browser downloads. Never put secret values (passwords, API keys) in client environment variables.

---

### Status Code Reference

#### Order Status

| Number | Name | Meaning |
| :--- | :--- | :--- |
| 1 | Confirmed | Order received, awaiting processing |
| 2 | Preparing | Being prepared at the station |
| 3 | Out for Delivery | On the way to the customer |
| 4 | Delivered | Completed successfully |
| 5 | Cancelled | Cancelled by customer or admin |
| 6 | Returned | Customer returned the order |

#### Payment Status

| Number | Name | Meaning |
| :--- | :--- | :--- |
| 1 | Pending | Not yet collected or verified |
| 2 | Verified | Payment confirmed |
| 3 | Rejected | GCash receipt rejected — order auto-cancelled |

#### Payment Mode

| Number | Name | Initial Payment Status |
| :--- | :--- | :--- |
| 1 | GCash | Pending (admin verifies receipt) |
| 2 | Cash | Verified (paid at placement) |
| 3 | Cash on Delivery | Pending (paid at door) |
| 4 | Cash on Pickup | Pending (paid at station) |

---

### Deployment Guide

#### What Goes Where

| Part | Hosting Service | Trigger |
| :--- | :--- | :--- |
| Frontend (React) | Vercel | Auto-deploys when `main` branch is pushed |
| Backend (Express) | Render | Auto-deploys when `final` branch is pushed |
| Database (MySQL) | Aiven | Always running, no deployment needed |

#### Step 1 — Set Up the Database on Aiven

1. Create an account at aiven.io
2. Create a new MySQL service
3. Copy the connection details (host, port, user, password, database name)
4. Run your SQL schema file to create all tables

#### Step 2 — Deploy the Backend on Render

1. Create an account at render.com
2. Create a new Web Service, connect your GitHub repository
3. Set the root directory to `server`, build command to `npm install && npm run build`, start command to `npm start`
4. Add all server environment variables in the Render dashboard
5. Deploy — Render gives you a URL like `https://aqualastech.onrender.com`

#### Step 3 — Deploy the Frontend on Vercel

1. Create an account at vercel.com
2. Import your GitHub repository
3. Set the root directory to `client`
4. Add all client environment variables including `VITE_API_URL` pointing to your Render URL
5. Deploy — Vercel gives you a URL like `https://aqualastech.vercel.app`

#### Pushing Updates

```bash
git add .
git commit -m "describe your change"
git push origin final          # updates Render (backend)
git push origin final:main     # updates Vercel (frontend)
```

---

### Beginner Exercise — Build Your Own Mini Version

This exercise guides you through building a simple task management system using the exact same tools and structure as AquaLasTech. By the end you will have a working full-stack app with a database, a backend API, and a frontend — all connected together.

The system you will build: **a simple To-Do list** where users can log in, create tasks, mark them complete, and delete them.

#### What You Will Need

- Node.js installed (download from nodejs.org)
- A code editor (VS Code is recommended — download from code.visualstudio.com)
- A MySQL database (XAMPP for local, or a free account on Aiven for cloud)
- A terminal (the built-in terminal in VS Code works fine)

---

#### Part 1 — Set Up the Database

Open your MySQL tool (phpMyAdmin if using XAMPP, or the Aiven query console) and run this SQL to create the database and tables:

```sql
CREATE DATABASE todo_app;
USE todo_app;

CREATE TABLE users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    task_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    is_done TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

This creates two tables. `users` stores accounts. `tasks` stores tasks, and each task belongs to a user (the `user_id` foreign key links them).

---

#### Part 2 — Build the Backend

Open your terminal and run these commands:

```bash
mkdir todo-server
cd todo-server
npm init -y
npm install express mysql2 bcrypt jsonwebtoken dotenv cors cookie-parser
npm install -D typescript tsx @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors @types/cookie-parser
npx tsc --init
```

Create a file called `src/server.ts`:

```typescript
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

dotenv.config()

const app = express()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Database connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

const JWT_KEY = process.env.JWT_KEY as string

// Middleware: check if user is logged in
function verifyToken(req: any, res: any, next: any) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Not logged in' })
    try {
        req.user = jwt.verify(token, JWT_KEY)
        next()
    } catch {
        res.status(401).json({ message: 'Session expired' })
    }
}

// SIGNUP
app.post('/auth/signup', async (req, res) => {
    const { full_name, email, password } = req.body
    if (!full_name || !email || !password)
        return res.status(400).json({ message: 'All fields required' })
    const hash = await bcrypt.hash(password, 10)
    const [result]: any = await db.query(
        'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
        [full_name, email, hash]
    )
    res.status(201).json({ message: 'Account created', user_id: result.insertId })
})

// LOGIN
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email])
    if (!rows.length) return res.status(401).json({ message: 'Invalid email or password' })
    const user = rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(401).json({ message: 'Invalid email or password' })
    const token = jwt.sign({ id: user.user_id, name: user.full_name }, JWT_KEY, { expiresIn: '7d' })
    res.cookie('token', token, { httpOnly: true })
    res.json({ token, user: { id: user.user_id, name: user.full_name, email: user.email } })
})

// LOGOUT
app.post('/auth/logout', (req, res) => {
    res.clearCookie('token')
    res.json({ message: 'Logged out' })
})

// GET ALL TASKS (for the logged-in user only)
app.get('/tasks', verifyToken, async (req: any, res) => {
    const [rows]: any = await db.query(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
    )
    res.json(rows)
})

// CREATE A TASK
app.post('/tasks', verifyToken, async (req: any, res) => {
    const { title } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' })
    const [result]: any = await db.query(
        'INSERT INTO tasks (user_id, title) VALUES (?, ?)',
        [req.user.id, title.trim()]
    )
    res.status(201).json({ message: 'Task created', task_id: result.insertId })
})

// MARK TASK AS DONE / UNDONE
app.put('/tasks/:id', verifyToken, async (req: any, res) => {
    const { id } = req.params
    const { is_done } = req.body
    await db.query(
        'UPDATE tasks SET is_done = ? WHERE task_id = ? AND user_id = ?',
        [is_done ? 1 : 0, id, req.user.id]
    )
    res.json({ message: 'Task updated' })
})

// DELETE A TASK
app.delete('/tasks/:id', verifyToken, async (req: any, res) => {
    const { id } = req.params
    await db.query('DELETE FROM tasks WHERE task_id = ? AND user_id = ?', [id, req.user.id])
    res.json({ message: 'Task deleted' })
})

app.listen(8080, () => console.log('Server running at http://localhost:8080'))
```

Create a `.env` file in the `todo-server` folder:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=todo_app
JWT_KEY=make_this_a_long_random_string
```

Add this to `package.json` scripts:

```json
"scripts": {
    "dev": "tsx watch src/server.ts"
}
```

Run the server:

```bash
npm run dev
```

You should see: `Server running at http://localhost:8080`

---

#### Part 3 — Build the Frontend

Open a new terminal window and run:

```bash
npm create vite@latest todo-client -- --template react-ts
cd todo-client
npm install
npm install axios react-router-dom
```

Replace the contents of `src/main.tsx` with:

```typescript
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import axios from 'axios'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import TasksPage from './pages/TasksPage'

axios.defaults.baseURL = 'http://localhost:8080'
axios.defaults.withCredentials = true

// Also send token from localStorage as Authorization header
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    return config
})

const router = createBrowserRouter([
    { path: '/', element: <TasksPage /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/signup', element: <SignupPage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
    <RouterProvider router={router} />
)
```

Create `src/pages/SignupPage.tsx`:

```typescript
import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function SignupPage() {
    const [form, setForm] = useState({ full_name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await axios.post('/auth/signup', form)
            navigate('/login')
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Signup failed')
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
            <h2>Create Account</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div><input placeholder="Full name" value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 8 }} /></div>
                <div><input placeholder="Email" type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 8 }} /></div>
                <div><input placeholder="Password" type="password" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 8 }} /></div>
                <button type="submit" style={{ width: '100%', padding: 10 }}>Sign Up</button>
            </form>
            <p>Already have an account? <a href="/login">Log in</a></p>
        </div>
    )
}
```

Create `src/pages/LoginPage.tsx`:

```typescript
import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await axios.post('/auth/login', form)
            localStorage.setItem('token', res.data.token)
            navigate('/')
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Login failed')
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
            <h2>Log In</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div><input placeholder="Email" type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 8 }} /></div>
                <div><input placeholder="Password" type="password" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 8 }} /></div>
                <button type="submit" style={{ width: '100%', padding: 10 }}>Log In</button>
            </form>
            <p>No account? <a href="/signup">Sign up</a></p>
        </div>
    )
}
```

Create `src/pages/TasksPage.tsx`:

```typescript
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

interface Task {
    task_id: number
    title: string
    is_done: number
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [newTitle, setNewTitle] = useState('')
    const navigate = useNavigate()

    const fetchTasks = async () => {
        try {
            const res = await axios.get('/tasks')
            setTasks(res.data)
        } catch {
            navigate('/login')
        }
    }

    useEffect(() => { fetchTasks() }, [])

    const addTask = async () => {
        if (!newTitle.trim()) return
        await axios.post('/tasks', { title: newTitle })
        setNewTitle('')
        fetchTasks()
    }

    const toggleTask = async (task: Task) => {
        await axios.put(`/tasks/${task.task_id}`, { is_done: !task.is_done })
        fetchTasks()
    }

    const deleteTask = async (id: number) => {
        await axios.delete(`/tasks/${id}`)
        fetchTasks()
    }

    const logout = async () => {
        await axios.post('/auth/logout')
        localStorage.removeItem('token')
        navigate('/login')
    }

    return (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>My Tasks</h2>
                <button onClick={logout}>Log out</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="New task..." style={{ flex: 1, padding: 8 }}
                    onKeyDown={e => e.key === 'Enter' && addTask()} />
                <button onClick={addTask} style={{ padding: '8px 16px' }}>Add</button>
            </div>
            {tasks.map(task => (
                <div key={task.task_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
                    <input type="checkbox" checked={!!task.is_done} onChange={() => toggleTask(task)} />
                    <span style={{ flex: 1, textDecoration: task.is_done ? 'line-through' : 'none', color: task.is_done ? '#aaa' : '#000' }}>
                        {task.title}
                    </span>
                    <button onClick={() => deleteTask(task.task_id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </div>
            ))}
            {tasks.length === 0 && <p style={{ color: '#aaa', textAlign: 'center' }}>No tasks yet. Add one above.</p>}
        </div>
    )
}
```

Run the frontend:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

#### What You Just Built — And How It Mirrors AquaLasTech

| AquaLasTech | Your To-Do App | Concept |
| :--- | :--- | :--- |
| Customer login | User login | Authentication |
| Orders table | Tasks table | The main data table |
| order.user_id foreign key | task.user_id foreign key | Linking data across tables |
| verifyToken middleware | verifyToken function | Identity check on every request |
| JWT in cookie + localStorage | JWT in cookie + localStorage | Dual-token strategy |
| GET /orders | GET /tasks | Fetching records |
| POST /customer/orders | POST /tasks | Creating records |
| PUT /orders/:id/status | PUT /tasks/:id | Updating records |
| DELETE /orders/:id | DELETE /tasks/:id | Removing records |
| AuthContext | localStorage token check | Keeping the user logged in |
| Axios interceptor | Axios interceptor | Automatic token attachment |

Every pattern in this exercise is the same pattern used in the real system. The only difference is scale — AquaLasTech has more tables, more routes, more roles, and more features, but every one of them follows this same structure.

---

*AquaLasTech — Built for water stations, designed for people.*
