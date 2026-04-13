<style>
  p, li, td, th, blockquote, .callout-content { font-size: 10pt; }
  h3 { font-size: 15pt; }
  h4 { font-size: 13pt; }
  h5 { font-size: 11pt; }
  code, pre, .cm-s-obsidian { font-size: 9pt; }
</style>

# AquaLasTech: System Documentation

> This document is written so that anyone can read it from start to finish and walk away with a clear understanding of how this entire system works. Every concept is explained in plain language before any code is shown. Technical words are always defined the first time they appear. At the end of this document is a hands-on exercise that guides you through building a simple version of this system yourself, using the exact same tools and setup.


### Table of Contents

1. [What Is AquaLasTech?](#what-is-aqualastech)
2. [How the System Is Structured](#how-the-system-is-structured)
3. [The Technology Stack: What Each Tool Does and Why](#the-technology-stack-what-each-tool-does-and-why)
4. [How the Three Layers Talk to Each Other](#how-the-three-layers-talk-to-each-other)
5. [Project Folder Structure](#project-folder-structure)
6. [The Database: How Data Is Stored](#the-database-how-data-is-stored)
7. [The Server: Every File Explained](#the-server-every-file-explained)
8. [The Client: Every File Explained](#the-client-every-file-explained)
9. [How Login and Identity Work](#how-login-and-identity-work)
10. [Who Can Do What: Roles and Permissions](#who-can-do-what-roles-and-permissions)
11. [All API Endpoints](#all-api-endpoints)
12. [Core Features: How They Actually Work](#core-features-how-they-actually-work)
13. [The Notification System](#the-notification-system)
14. [The Reports System](#the-reports-system)
15. [The Point of Sale System](#the-point-of-sale-system)
16. [File Uploads and Images](#file-uploads-and-images)
17. [Maintenance Mode](#maintenance-mode)
18. [Environment Variables](#environment-variables)
19. [Status Code Reference](#status-code-reference)
20. [Deployment Guide](#deployment-guide)
21. [Beginner Exercise: Build Your Own Mini Version](#beginner-exercise-build-your-own-mini-version)
22. [Glossary: All Terms Used in This Project](#glossary-all-terms-used-in-this-project)
23. [Security Architecture: Every Protection and Why](#security-architecture-every-protection-and-why)
24. [Technology Stack Rationale: Why Each Tool Was Chosen](#technology-stack-rationale-why-each-tool-was-chosen)
25. [Mastering the Codebase: How to Trace Any Feature](#mastering-the-codebase-how-to-trace-any-feature)
26. [Feature Deep-Dives: Recent Additions Explained](#feature-deep-dives-recent-additions-explained)




### 1. What Is AquaLasTech?

AquaLasTech is a web application — a program that runs inside a browser — built to digitize the daily operations of water refilling stations. Before a system like this existed, station owners took orders by phone, wrote inventory levels on paper, and had no way to see their sales data without manually counting receipts. AquaLasTech replaces all of that with one platform that works on any device.

The system serves four types of people, called **roles**:

- **Customer** — a person who buys water containers. They browse products, place orders, pay online or with cash, and track their order in real time.
- **Staff** — the station employee who processes orders, manages stock, verifies payments, and handles walk-in customers using the built-in cashier terminal.
- **Store Owner** — the station owner. They can do everything Staff can do, plus view the sales and revenue report and configure the station's details: name, address, logo, GCash QR code, and which staff accounts belong to their station.
- **System Admin** — the platform operator who manages all stations across the entire network. They can create stations, delete stations, and trigger a system-wide maintenance mode.

### 2. How the System Is Structured

Think of this system like a restaurant. The **customer** sits at a table and sees only the menu (the frontend). The **kitchen** (the server/backend) receives the order, processes it, and sends the food back. The **pantry** (the database) is where all the ingredients, meaning all the data are stored.

These three parts have a technical name: a **three-tier architecture**.

```
BROWSER (what the user sees)
    ↕  sends requests and receives responses
SERVER (the brain which processes all logic)
    ↕  reads and writes data
DATABASE (the storage which holds everything permanently)
```

Each part has exactly one job:
- The **browser** shows the user interface and collects input from the user.
- The **server** decides what the user is allowed to do, runs the logic, and talks to the database.
- The **database** stores everything permanently (users, orders, inventory, payments, notifications).

The browser and server communicate through **HTTP requests**, the same technology that loads a web page. When a customer clicks "Place Order," the browser sends a message to the server. The server processes it, saves the order to the database, and sends a response back. The browser then updates what the customer sees.

---

### 3. The Technology Stack: What Each Tool Does and Why

A **technology stack** is the collection of tools used to build a system. Every tool has a specific job.

#### 3.1 The Language: TypeScript

Both the server and the browser code are written in **TypeScript**. TypeScript is an extension of JavaScript which is the language that runs in browsers and on servers. The key difference is that TypeScript requires you to say what type of data a variable holds: a number, a piece of text, a list, or a more complex object. This catches mistakes early. For example, if a function expects a number and you accidentally pass text, TypeScript will warn you before the program even runs.

#### 3.2 Backend (Server) Tools

| Tool                  | Plain Language Explanation                                                                                                                                      |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js               | Lets JavaScript run on a server, not just in a browser                                                                                                          |
| Express.js            | A framework that makes it easy to define what the server should do when it receives different types of requests                                                 |
| MySQL 2               | The tool that lets the server read and write data in the MySQL database                                                                                         |
| bcrypt                | Takes a plain password and converts it into a scrambled string. The original password can never be recovered from the scrambled version, this is called hashing |
| JSON Web Tokens (JWT) | A small, signed piece of text that proves who you are after you log in. It works like a wristband at an event, you show it to get access                        |
| Multer                | Handles file uploads when a user submits a photo, Multer intercepts it before it reaches the main logic                                                         |
| Cloudinary            | A cloud service where all uploaded images are stored permanently. Images uploaded here can be viewed from anywhere in the world via a URL                       |
| Nodemailer            | Sends emails, used for password reset links                                                                                                                     |
| Helmet                | Adds security headers to every server response to protect against common web attacks                                                                            |
| CORS                  | Controls which websites are allowed to talk to this server. Without this, any website on the internet could send requests to the server                         |
| dotenv                | Reads a secret configuration file (.env) and makes its values available to the server code                                                                      |

#### 3.3 Frontend (Browser) Tools

| Tool         | Plain Language Explanation                                                                                                                                                                  |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React        | A library for building user interfaces. Instead of writing one giant HTML page, you build small reusable pieces called components (a button, a card, a form), and compose them together     |
| Vite         | The tool that takes your React code and turns it into files a browser can understand. It also runs a local development server with instant refresh on save                                  |
| React Router | Handles navigation inside the app. When you click "Orders," the URL changes and the correct page component is shown, without the browser reloading the entire page                          |
| Axios        | The tool the browser uses to send HTTP requests to the server. Think of it as the messenger between the frontend and backend                                                                |
| TailwindCSS  | A way of styling the app by adding class names directly to elements. Instead of writing a separate CSS file, you write `bg-blue-500 text-white rounded-lg` directly in the react component. |
| Leaflet      | An interactive map library. Used in the customer settings page to let users drop a pin on their location                                                                                    |

#### 3.4 Database

| Tool  | Plain Language Explanation                                                                                                                                                                                                                 |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MySQL | A relational database. Data is stored in tables, like spreadsheets. Each table has rows (individual records) and columns (fields). Tables can be linked to each other, for example, an order row links to a customer row and a station row |

### 4. How the Three Layers Talk to Each Other

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

#### 4.1 A Concrete Example: Customer Places an Order

1. Customer fills in their order form and taps "Place Order"
2. The browser collects all the form data and sends it to `POST /customer/orders` on the server
3. The server checks the JWT (the identity wristband), is this a real logged-in customer?
4. The server checks inventory, does each product have enough stock?
5. The server saves a new row in the `orders` table, saves rows in `order_items`, deducts quantities from `inventory`, and saves a row in `payments`
6. The server sends back `{ message: "Order placed", order_id: 42 }`
7. The browser shows the customer a success screen and redirects to My Orders

#### 4.2 What Is an HTTP Request?

An HTTP request is a structured message from the browser to the server. It has:

- A **method** — what kind of action: GET (fetch data), POST (create something), PUT (update something), DELETE (remove something)
- A **path** — the address on the server: `/orders`, `/auth/login`, `/inventory`
- **Headers** — extra information like identity: `Authorization: Bearer eyJ...`
- A **body** — the data being sent, if any: `{ email: "user@email.com", password: "..." }`

The server reads all of this, processes it, and sends back a **response** with a status code (200 = success, 400 = bad request, 401 = not logged in, 403 = not allowed, 404 = not found, 500 = server error) and usually some JSON data.

#### 4.3 What Is JSON?
Javascript Object Notation (JSON) is a text format for passing data between the browser and server. It looks like this:

```json
{
    "order_id": 42,
    "customer_name": "Juan dela Cruz",
    "total_amount": 150.00,
    "order_status": "confirmed"
}
```

The server sends JSON. The browser receives it and uses the data to update the screen.

### 5. Project Folder Structure

The project is a **monorepo**, one repository that contains two completely independent sub-projects: `client` (the browser app) and `server` (the backend). They have separate dependencies and are deployed to separate hosting services.

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

### 6. The Database: How Data Is Stored

The database is a collection of **tables**. Think of each table as a spreadsheet tab. Each row is one record. Each column is one field. Tables are connected to each other through **foreign keys** — a column in one table that holds the ID of a row in another table.

#### 6.1 How Tables Connect

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

#### 6.2 Table Reference

##### 6.2.1 `users`: Every account in the system

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

##### 6.2.2 `stations`: Each water refilling station

| Column               | Type    | What It Stores                        |
| :------------------- | :------ | :------------------------------------ |
| station_id           | Number  | Unique ID for this station            |
| station_name         | Text    | The name of the station               |
| address              | Text    | Street address                        |
| latitude / longitude | Decimal | GPS coordinates for map display       |
| image_path           | Text    | URL of the station logo in Cloudinary |
| qr_code_path         | Text    | URL of the GCash QR code image        |
| status               | Number  | 1=open, 2=closed, 3=maintenance       |

##### 6.2.3`orders`: Every order placed

| Column          | Type      | What It Stores                                                                     |
| :-------------- | :-------- | :--------------------------------------------------------------------------------- |
| order_id        | Number    | Unique ID                                                                          |
| order_reference | Text      | Human-readable code like AQL-20260410-X3K9P                                        |
| user_id         | Number    | Who placed this order (links to users table)                                       |
| station_id      | Number    | Which station this order belongs to (links to stations table)                      |
| order_status    | Number    | 1=confirmed, 2=preparing, 3=out for delivery, 4=delivered, 5=cancelled, 6=returned |
| payment_mode    | Number    | 1=gcash, 2=cash, 3=cash on delivery, 4=cash on pickup                              |
| total_amount    | Decimal   | The total cost of the order                                                        |
| hidden_at       | Date/Time | If set, this order is hidden from the list but kept for reports                    |

##### 6.2.4`order_items`: The products inside each order

| Column         | Type    | What It Stores                                                                      |
| :------------- | :------ | :---------------------------------------------------------------------------------- |
| order_item_id  | Number  | Unique ID                                                                           |
| order_id       | Number  | Which order this item belongs to                                                    |
| product_id     | Number  | Which product was ordered                                                           |
| quantity       | Number  | How many units                                                                      |
| price_snapshot | Decimal | The price at the time of ordering — saved so price changes don't affect past orders |

##### 6.2.5 `products`: Items available for sale

| Column       | Type    | What It Stores                               |
| :----------- | :------ | :------------------------------------------- |
| product_id   | Number  | Unique ID                                    |
| station_id   | Number  | Which station sells this product             |
| product_name | Text    | Name of the product                          |
| price        | Decimal | Selling price                                |
| unit         | Text    | e.g. "5 gallons", "1 slim"                   |
| is_active    | Yes/No  | Whether this product is visible to customers |
| image_url    | Text    | Product photo URL from Cloudinary            |

##### 6.2.6 `inventory`: Stock levels per product per station

| Column          | Type   | What It Stores                                                     |
| :-------------- | :----- | :----------------------------------------------------------------- |
| inventory_id    | Number | Unique ID                                                          |
| product_id      | Number | Which product                                                      |
| station_id      | Number | Which station                                                      |
| quantity        | Number | Current stock count                                                |
| min_stock_level | Number | Alert threshold — when stock falls below this, admins are notified |

##### 6.2.7 `payments`: Payment record for each order

| Column           | Type   | What It Stores                    |
| :--------------- | :----- | :-------------------------------- |
| payment_id       | Number | Unique ID                         |
| order_id         | Number | Which order this payment is for   |
| payment_type     | Number | Same values as order.payment_mode |
| payment_status   | Number | 1=pending, 2=verified, 3=rejected |
| proof_image_path | Text   | URL of the GCash receipt image    |

##### 6.2.8 `notifications`: Messages sent to users

| Column            | Type   | What It Stores                                                        |
| :---------------- | :----- | :-------------------------------------------------------------------- |
| notification_id   | Number | Unique ID                                                             |
| user_id           | Number | Who receives this notification                                        |
| station_id        | Number | Which station it relates to                                           |
| message           | Text   | The notification text                                                 |
| notification_type | Number | 1=order update, 2=payment update, 3=inventory alert, 4=system message |
| is_read           | Yes/No | Whether the user has read it                                          |

##### 6.2.9 `admins`: Links user accounts to stations with admin roles

| Column     | Type   | What It Stores            |
| :--------- | :----- | :------------------------ |
| id         | Number | Unique ID                 |
| user_id    | Number | Which user account        |
| station_id | Number | Which station they manage |

##### 6.2.10 `pos_transactions`: Walk-in sales from the Point of Sale terminal

| Column         | Type    | What It Stores                    |
| :------------- | :------ | :-------------------------------- |
| transaction_id | Number  | Unique ID                         |
| order_id       | Number  | The order this POS sale created   |
| station_id     | Number  | Which station processed this sale |
| processed_by   | Number  | Which admin processed it          |
| total_amount   | Decimal | Total sale amount                 |
| payment_method | Number  | 1=cash, 2=gcash                   |

#### 6.3 Why Numbers Instead of Words for Status?

Storing the word "confirmed" takes 9 bytes of storage. Storing the number 1 takes 1 byte. Across millions of orders, this adds up. The server converts the number back to a readable word before sending it to the browser, so the user always sees "Confirmed" — never a raw number.

---

### 7. The Server: Every File Explained

#### 7.1 `server.ts`: The Starting Point

This is the first file that runs when the server starts. It imports the assembled Express app from `app.ts` and tells it to listen on a port number — the "door" the server opens to accept incoming requests.

```typescript
import app from './app.js'
const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

When you run `npm run dev`, Node.js executes this file. Port 8080 means the server is reachable at `http://localhost:8080` during development.

#### 7.1 `app.ts`: Assembling the Server

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

#### 7.2 `config/db.ts`: The Database Connection

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

#### 7.3 `config/cloudinary.ts`: Image Upload Setup

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

#### 7.4 `constants/dbEnums.ts`: All Numeric Codes in One Place

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

#### 7.5 `middleware/verifyToken.middleware.ts`:  The Identity Check

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

#### 7.6 `routes/auth.routes.ts`: Login, Logout, and Passwords

Handles all account-related actions.

**Login flow:**
1. Receive email and password
2. Find the user in the database by email
3. Use bcrypt to compare the submitted password against the stored hash — bcrypt can check if a password matches a hash without ever reversing the hash
4. If they match, create a JWT with the user's ID, role, and station_id
5. Set the JWT as a cookie and also return it in the response body

#### 7.7 `routes/order.routes.ts`: The Order Lifecycle

This is the most complex route file. It handles every state an order passes through.

**When a new order arrives:**
- All items are checked against inventory, if any item has insufficient stock, the entire request is rejected
- The order, items, and payment are saved in a single database transaction (meaning if any step fails, none of them are saved)
- Inventory quantities are deducted immediately
- The station admins receive a notification

**Payment status at placement:**
- GCash → pending (admin must verify the uploaded receipt)
- Cash on Delivery → pending (payment not yet collected)
- Cash on Pickup → pending (payment not yet collected)


**When delivery is confirmed:**
- The server automatically marks COD and COP payments as verified (cash has been collected)
- GCash requires separate manual verification

**When GCash is rejected:**
- The order is automatically cancelled
- Stock is restored to inventory
- The customer is notified

**Soft delete:** When an admin deletes orders from the history view, the row is not actually removed from the database. Instead, a `hidden_at` timestamp is set. The order list query filters out rows where `hidden_at` is not null. Reports never filter by `hidden_at`, so deleted orders still count in all sales figures.

#### 7.8  `routes/customer.routes.ts`: Customer-Side Actions

Handles order placement from the customer's perspective, profile management, and customer-initiated cancellations.

When a customer cancels an order, the server:
1. Verifies the order is still in `confirmed` status (the only cancellable state)
2. Sets the order status to cancelled
3. Restores all item quantities back to inventory
4. Notifies the customer
5. Notifies all station admins

#### 7.9 `routes/pos.routes.ts`: Walk-In Sales Terminal

The Point of Sale handles customers who come to the station in person. No customer account is needed. The staff enters the items, the customer's name, and the payment method.

The system maps the two form inputs into the correct payment mode:
- GCash → `gcash`
- Cash + Delivery → `cash_on_delivery` (pending payment)
- Cash + Pickup → `cash_on_pickup` (verified immediately, paid at counter)

#### 7.10 `routes/inventory.routes.ts`: Stock Management

Three operations change stock levels:
- **Restock** — adds quantity (new stock arrived)
- **Deduction** — subtracts quantity (manual correction)
- **Adjustment** — sets quantity to an exact number (reconciliation after a physical count)

Every change is recorded in `inventory_transactions` for a full audit trail. After every change, if the new quantity is below `min_stock_level`, an inventory alert notification is sent to all admins of that station.

#### 7.11`routes/reports.routes.ts`: Sales Analytics

Accepts a `period` parameter (daily, weekly, monthly, annually) and returns aggregated sales data scoped to the admin's station. The queries use `DATE_FORMAT` and `GROUP BY` to bucket orders into the correct time periods.

Reports intentionally include soft-deleted orders, deleting from the order list view should never alter financial history.

#### 7.12 `routes/settings.routes.ts`: Station Configuration

Store Owners can update their station details, upload a logo, upload a GCash QR code, create staff accounts, and delete staff accounts (password required for deletion).

There is also one endpoint accessible to all users, `GET /settings/maintenance-status`,  which reads the station's current status so the frontend can show or hide the maintenance page.

#### 7.13 `routes/sysadmin.routes.ts`: Platform-Wide Administration

Only System Admins can access these routes. Handles creation and deletion of stations, the maintenance mode toggle (updates all stations simultaneously), and viewing the system audit log.

---

### 8. The Client: Every File Explained

#### 8.1 `main.tsx`: Where React Starts

This is the entry point of the frontend. Two important things happen here:

**1. An Axios interceptor is registered.** An interceptor is a function that runs automatically before every HTTP request the app sends. This one reads the JWT from localStorage and adds it to the request as an Authorization header, so every request the app makes automatically identifies the logged-in user.

```typescript
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken")
    if (token) config.headers.set("Authorization", `Bearer ${token}`)
    return config
})
```

**2. The app is rendered.** React is told to take over a `<div id="root">` in the HTML file and render the full application inside it.

#### 8.2 `context/AuthContext.tsx`: The Global Login State

React **context** is a way to share data across all components in the app without passing it through every level manually. `AuthContext` holds the logged-in user's information.

When a component anywhere in the app calls `useAuth()`, it gets access to:
- `user` — the logged-in user's data (or `null` if not logged in)
- `login(userData)` — a function to set the logged-in user
- `logout()` — a function to clear the session

On page load, the context automatically calls `GET /auth/me` to restore the session. The server reads the JWT, verifies it, and returns the user's data. This is why you stay logged in even after refreshing the browser.

#### 8.3 `routes/router.tsx`: Page Routing

This file defines which URL shows which page component. React Router intercepts navigation (clicking links, typing URLs) and renders the matching component without reloading the browser.

```
/                   → LandingPage
/login              → LoginPage
/signup             → SignupPage
/admin/orders       → AdminCustomerOrder (admin only)
/customer/orders    → CustomerOrder (customer only)
/sysadmin/stations  → SAStations (system admin only)
```

#### 8.4 `routes/ProtectedRoute.tsx`: The Page Guard

Before showing a protected page, this component checks the user's role. If the role does not match what the route requires, the user is redirected to the login page. This prevents a customer from navigating to `/admin/orders` by just typing it in the URL.

#### 8.5 `components/MaintenanceGuard.tsx`: Maintenance Check

This component wraps the entire customer interface. On every page load, it calls `GET /settings/maintenance-status`. If the station is under maintenance, it shows the maintenance page instead of the normal interface, customers cannot bypass this by navigating to a different URL.

#### 8.6 `hooks/useStation.ts`: Station Data with Refresh

A custom hook that fetches the current station's data. It exposes a `tick` counter that other components can increment to force a data refresh without reloading the page.

#### 8.7 `layout/AdminLayout.tsx`: The Admin Shell

The persistent sidebar and top bar that wraps every admin page. Shows the station name, the logged-in user's name, their role badge (Store Owner or Staff), and navigation links. The logo and station logo are loaded from Cloudinary URLs stored in the database.

#### 8.8 `layout/CustomerLayout.tsx`: The Customer Shell

The navigation bar at the top and bottom of the customer interface. Includes links to Order, My Orders, Notifications, and Settings.

#### 8.9 Admin Pages

| File | What It Does |
| :--- | :--- |
| `AdminCustomerOrder.tsx` | Order list with filters, status updates, payment verification, return management, and history view with password-protected bulk delete |
| `AdminDashboard.tsx` | KPI cards (revenue, orders, cancelled, returned), period charts, top products, and the inventory modal |
| `AdminInventory.tsx` | Product management and stock level controls (restock, deduction, adjustment) |
| `PointOfSale.tsx` | Walk-in cashier terminal with cart, payment selection, and receipt printing |
| `AdminSettings.tsx` | Station configuration, logo upload, GCash QR upload, staff account management |

#### 8.10 Customer Pages

| File | What It Does |
| :--- | :--- |
| `CustomerOrder.tsx` | Station selection, product catalog, cart, checkout, My Orders with status timeline, return requests, and order cancellation |
| `CustomerNotification.tsx` | Real-time notification list with read/unread state |
| `CustomerSettings.tsx` | Profile editing, address and map pin, password change, profile picture upload |

#### 8.11 System Admin Pages

| File | What It Does |
| :--- | :--- |
| `SAStations.tsx` | All stations overview with stats, create/delete station, maintenance toggle |
| `SALogs.tsx` | System audit log viewer |

---

### 9. How Login and Identity Work

This section walks through exactly what happens when a user logs in and how the system knows who they are on every subsequent request.

#### Step 1: Login

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

#### Step 2: Storing the Token

The frontend receives the token in the response body and saves it to `localStorage` which is a small storage area in the browser that persists until the user logs out.

#### Step 3: Every Request After Login

Before every HTTP request, the Axios interceptor reads the token from localStorage and adds it to the request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The server's `verifyToken` middleware reads this header, verifies the signature, and extracts the user's ID, role, and station_id. The route handler then uses this information to decide what data to return.

#### Step 4: Logout

The server clears the cookie. The frontend deletes the token from localStorage and resets the auth context to null. The next page load finds no token and shows the login page.

### 10. Who Can Do What: Roles and Permissions

Access control works at three levels:

**Level 1 — Frontend route guards.** `ProtectedRoute` checks the role before rendering a page. A customer cannot even see the admin pages.

**Level 2 — Backend middleware.** Route files use role-checking middleware like `requireSuperAdmin` before certain endpoints. Even if someone crafted a raw HTTP request to an admin endpoint, the server rejects it if the JWT does not contain the right role.

**Level 3 — Database scoping.** Every query that returns station data includes `WHERE station_id = ?` using the station_id from the JWT. An admin from Station A cannot see Station B's data even if they somehow had admin access, because the query is hardcoded to their station.

#### 10.1 Role Reference

| Role         | Number in DB | What They Can Access                                                                |
| :----------- | :----------- | :---------------------------------------------------------------------------------- |
| Customer     | 1            | Customer pages only  (orders, notifications, settings)                              |
| Staff        | 2            | Admin pages (orders, inventory, POS)                                                |
| Store Owner  | 3            | All Staff access plus sales report dashboard, station settings and staff management |
| System Admin | 4            | System admin pages  (all stations, maintenance, audit logs)                         |

### 11. All API Endpoints

An **endpoint** is a specific address on the server that accepts requests. The format is: `METHOD /path`
#### 11.1 Authentication: `/auth`

| Method | Path                  | Who Can Use It | What It Does                            |
| :----- | :-------------------- | :------------- | :-------------------------------------- |
| POST   | /auth/login           | Anyone         | Log in, returns JWT                     |
| POST   | /auth/signup          | Anyone         | Create a customer account               |
| POST   | /auth/logout          | Logged in      | Clear the session cookie                |
| GET    | /auth/me              | Logged in      | Return current user data; refresh token |
| PUT    | /auth/change-password | Logged in      | Update password                         |
| POST   | /auth/forgot-password | Anyone         | Send reset link by email                |
| POST   | /auth/reset-password  | Anyone         | Apply a new password via reset token    |

#### 11.2 Orders: `/orders`

| Method | Path                    | Who Can Use It     | What It Does                             |
| :----- | :---------------------- | :----------------- | :--------------------------------------- |
| GET    | /orders                 | Staff, Store Owner | List orders for the station              |
| GET    | /orders/:id             | Staff, Store Owner | Single order with all items              |
| PUT    | /orders/:id/status      | Staff, Store Owner | Advance order status                     |
| PUT    | /orders/:id/payment     | Staff, Store Owner | Verify or reject a GCash payment         |
| POST   | /orders/verify-password | Staff, Store Owner | Verify admin password before bulk delete |
| PUT    | /orders/:id/return      | Staff, Store Owner | Approve or reject a return               |
| DELETE | /orders/history         | Staff, Store Owner | Soft-delete all history orders           |
| DELETE | /orders/:id             | Staff, Store Owner | Soft-delete one order                    |

#### 11.3 Customer: `/customer`

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

#### 11.4 Inventory: `/inventory`

| Method | Path                    | Who Can Use It     | What It Does                |
| :----- | :---------------------- | :----------------- | :-------------------------- |
| GET    | /inventory              | Staff, Store Owner | Current stock levels        |
| POST   | /inventory/restock      | Staff, Store Owner | Add stock                   |
| POST   | /inventory/deduction    | Staff, Store Owner | Remove stock                |
| POST   | /inventory/adjustment   | Staff, Store Owner | Set exact stock value       |
| GET    | /inventory/transactions | Staff, Store Owner | Full stock movement history |

#### 11.5 Settings: `/settings`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| GET | /settings/maintenance-status | Anyone logged in | Check if station is in maintenance |
| PUT | /settings/station/:id | Store Owner | Update station details |
| POST | /settings/station/:id/upload-logo | Store Owner | Upload station logo |
| POST | /settings/station/:id/upload-qr | Store Owner | Upload GCash QR code |
| GET | /settings/admins | Store Owner | List staff accounts |
| POST | /settings/create-admin | Store Owner | Create a staff account |
| DELETE | /settings/admins/:id | Store Owner | Delete a staff account (password required) |

#### 11.6 POS: `/pos`

| Method | Path                | Who Can Use It      | What It Does                          |
| :----- | :------------------ | :------------------ | :------------------------------------ |
| POST   | /pos/transaction    | Staff,, Store Owner | Process a walk-in sale                |
| POST   | /pos/upload-receipt | Staff,, Store Owner | Upload a GCash receipt for a POS sale |
| GET    | /pos/transactions   | Staff,, Store Owner | View POS transaction history          |

#### 11.7 Reports: `/reports`

| Method | Path               | Who Can Use It | What It Does                     |
| :----- | :----------------- | :------------- | :------------------------------- |
| GET    | /reports/summary   | Store Owner    | Sales summary by period          |
| GET    | /reports/day/:date | Store Owner    | Full order breakdown for one day |

#### 11.8 System Admin:`/sysadmin`

| Method | Path | Who Can Use It | What It Does |
| :--- | :--- | :--- | :--- |
| GET | /sysadmin/stations | System Admin | All stations |
| POST | /sysadmin/stations | System Admin | Create a station and store owner account |
| DELETE | /sysadmin/stations/:id | System Admin | Delete a station (password required) |
| PUT | /sysadmin/maintenance | System Admin | Toggle maintenance mode for all stations |
| GET | /sysadmin/logs | System Admin | View audit logs |


### 12. Core Features: How They Actually Work

#### 12.1 Customer Places an Order

1. The customer browses products on the `CustomerOrder.tsx` page. Products are fetched from `GET /customer/products/:station_id`.
2. Items are added to a cart. The cart is stored in React state, it exists only in the browser's memory and is not saved to the server until checkout.
3. The customer selects a payment method and taps Place Order.
4. The browser sends `POST /customer/orders` with the cart items, total, payment mode, and an optional GCash receipt photo.
5. The server validates the JWT, checks inventory stock, saves the order, deducts inventory, saves the payment record, and notifies the admins.
6. The browser shows a confirmation and redirects to My Orders.

#### 12.2 Admin Processes an Order

1. The admin sees a notification: "New order received."
2. In `AdminCustomerOrder.tsx`, the new order appears in the Active tab.
3. For GCash: the admin reviews the receipt image and clicks Verify Payment → `PUT /orders/:id/payment`.
4. For COD/COP: no payment verification needed, it is automatically verified when delivered.
5. The admin advances the order status: Confirmed → Preparing → Out for Delivery → Delivered → `PUT /orders/:id/status`.
6. The customer receives a notification at each status change.

#### 12.3 Customer Cancels an Order

1. In "My Orders", the customer sees a "Can still cancel" hint below confirmed orders.
2. They tap the order, then tap "Cancel Order" and provide a reason.
3. The browser sends `PUT /customer/orders/:id/cancel`.
4. The server cancels the order, restores inventory, notifies the customer, and notifies all station admins.

---

### 13. The Notification System

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


### 14. The Reports System

The dashboard shows sales data aggregated over a selected time period.

| Period | Data Range | How Orders Are Grouped |
| :--- | :--- | :--- |
| Daily | Last 30 days | One data point per day |
| Weekly | Last 12 weeks | One data point per week |
| Monthly | Last 12 months | One data point per month |
| Annually | Last 5 years | One data point per year |

**Total Revenue** counts all non-cancelled, non-returned orders. The sub-label "from delivered orders" shows only the subset that has been fully delivered, the revenue that has definitively been collected and fulfilled.

**Reports are never affected by deleting orders from the history view.** Deleting only sets `hidden_at` on the order row. The reports queries do not filter by `hidden_at`. This is intentional , the financial record must never change just because an admin cleaned up the display.


### 15. The Point of Sale System

The POS is a cashier terminal built into the admin panel for processing walk-in customers who do not have an account.

The staff selects products from a grid, adjusts quantities, enters the customer's name and address (for delivery), selects cash or GCash, and selects pickup or delivery. The system creates a full order in the database, deducts inventory, and can print a receipt.

Payment mode assignment:
- GCash → gcash
- Cash + Pickup → cash_on_pickup (verified immediately — paid at counter)
- Cash + Delivery → cash_on_delivery (pending — payment collected on arrival)


### 16. File Uploads and Images

All images are stored on **Cloudinary**, a cloud image hosting service. The server never saves image files to its own disk, because cloud hosting services like Render have temporary file systems, files saved locally are deleted when the server restarts.

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

### 17. Maintenance Mode

When a System Admin enables maintenance mode, a single SQL statement updates all station rows to `status = 3`. Every customer page is wrapped in `MaintenanceGuard.tsx`, which calls `GET /settings/maintenance-status` on load. If the response says maintenance is active, the maintenance page is shown and the normal interface is completely hidden. No URL trick can bypass this because the check happens inside the component, not just at the route level.

### 18. Environment Variables

Environment variables are secret configuration values that are never written directly in the code and never committed to version control. They are stored in a `.env` file on the developer's machine and in the hosting platform's settings for production.

#### 18.1 Server (`server/.env`)

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

#### 18.2 Client (`client/.env`)

| Variable | What It Is |
| :--- | :--- |
| VITE_API_URL | The full URL of the backend server |
| VITE_FB_PAGE_URL | Facebook page URL shown on the landing page |
| VITE_CONTACT_EMAIL | Contact email shown on the landing page |
| VITE_CONTACT_PHONE | Contact phone shown on the landing page |

> All client variables must start with `VITE_`. Vite bakes them into the JavaScript bundle at build time, they become part of the code the browser downloads. Never put secret values (passwords, API keys) in client environment variables.

---

### 19. Status Code Reference
#### 19.1 Order Status

| Number | Name | Meaning |
| :--- | :--- | :--- |
| 1 | Confirmed | Order received, awaiting processing |
| 2 | Preparing | Being prepared at the station |
| 3 | Out for Delivery | On the way to the customer |
| 4 | Delivered | Completed successfully |
| 5 | Cancelled | Cancelled by customer or admin |
| 6 | Returned | Customer returned the order |

#### 19.2 Payment Status

| Number | Name | Meaning |
| :--- | :--- | :--- |
| 1 | Pending | Not yet collected or verified |
| 2 | Verified | Payment confirmed |
| 3 | Rejected | GCash receipt rejected — order auto-cancelled |

#### 19.3 Payment Mode

| Number | Name | Initial Payment Status |
| :--- | :--- | :--- |
| 1 | GCash | Pending (admin verifies receipt) |
| 2 | Cash | Verified (paid at placement) |
| 3 | Cash on Delivery | Pending (paid at door) |
| 4 | Cash on Pickup | Pending (paid at station) |



### 20. Deployment Guide

#### 20.1 What Goes Where

| Part | Hosting Service | Trigger |
| :--- | :--- | :--- |
| Frontend (React) | Vercel | Auto-deploys when `main` branch is pushed |
| Backend (Express) | Render | Auto-deploys when `final` branch is pushed |
| Database (MySQL) | Aiven | Always running, no deployment needed |

#### Step 1: Set Up the Database on Aiven

1. Create an account at aiven.io
2. Create a new MySQL service
3. Copy the connection details (host, port, user, password, database name)
4. Run your SQL schema file to create all tables

#### Step 2: Deploy the Backend on Render

1. Create an account at render.com
2. Create a new Web Service, connect your GitHub repository
3. Set the root directory to `server`, build command to `npm install && npm run build`, start command to `npm start`
4. Add all server environment variables in the Render dashboard
5. Deploy — Render gives you a URL like `https://aqualastech.onrender.com`

#### Step 3: Deploy the Frontend on Vercel

1. Create an account at vercel.com
2. Import your GitHub repository
3. Set the root directory to `client`
4. Add all client environment variables including `VITE_API_URL` pointing to your Render URL
5. Deploy — Vercel gives you a URL like `https://aqualastech.vercel.app`

#### 20.2 Pushing Updates

```bash
git add .
git commit -m "describe your change"
git push origin final          # updates Render (backend)
git push origin final:main     # updates Vercel (frontend)
```



### 21. Beginner Exercise: Build Your Own Mini Version

This exercise guides you through building a simple task management system using the exact same tools and structure as AquaLasTech. By the end you will have a working full-stack app with a database, a backend API, and a frontend all connected together.

The system you will build: **a simple To-Do list** where users can log in, create tasks, mark them complete, and delete them.

#### 21.1 What You Will Need

- Node.js (the tool that runs JavaScript on your computer, outside the browser)
- A code editor (VS Code is recommended)
- XAMPP (a program that runs a local MySQL database on your machine)
- A terminal (the built-in terminal in VS Code works fine)



#### Step 0: Install Everything First

Follow these steps in order before writing any code.

##### Install Node.js

1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS** version (the one labeled "Recommended For Most Users")
3. Run the installer and follow the prompts — leave all default settings as they are
4. To confirm it installed correctly, open a terminal and type:
   ```bash
   node -v
   ```
   You should see a version number like `v20.11.0`. If you do, Node.js is ready.

##### Install VS Code

1. Go to [code.visualstudio.com](https://code.visualstudio.com)
2. Download the installer for your operating system (Windows, Mac, or Linux)
3. Run the installer — leave all default settings
4. After installation, open VS Code. You will use the built-in terminal by going to **Terminal → New Terminal** in the menu bar

##### Install XAMPP (for Local MySQL Database)

XAMPP is a free program that gives you a MySQL database running on your own computer. You do not need an internet connection.

1. Go to [apachefriends.org](https://www.apachefriends.org)
2. Download **XAMPP** for your operating system
3. Run the installer. When asked which components to install, make sure **MySQL** and **phpMyAdmin** are checked. You do not need Apache if you prefer, but having it does not cause problems
4. After installation, open the **XAMPP Control Panel**
5. Click **Start** next to **MySQL** — the status will turn green when it is running
6. Click **Admin** next to MySQL to open **phpMyAdmin** in your browser. This is the visual database tool where you will create tables and run SQL queries
7. By default, the MySQL username is `root` and the password is empty (no password)

---

#### Part 1: Set Up the Database

Open phpMyAdmin in your browser (click **Admin** in the XAMPP Control Panel next to MySQL), click the **SQL** tab at the top, paste the code below, and click **Go**:

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

#### Part 2: Build the Backend

The backend is the server that sits between the browser and the database. The browser never talks to the database directly. Every action, whether creating an account, logging in, fetching tasks, or deleting one, goes through the server first. The server checks who you are, decides if you are allowed, runs the logic, and talks to the database on your behalf.

Open your terminal and run these commands to create the project folder and install all the tools:

```bash
# Create a new folder for the server
mkdir todo-server
cd todo-server

# Initialize a Node.js project (creates package.json)
npm init -y

# Install the tools the server needs to run
npm install express mysql2 bcrypt jsonwebtoken dotenv cors cookie-parser

# Install TypeScript and type definitions (used only during development, not in production)
npm install -D typescript tsx @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors @types/cookie-parser

# or
npm install -D typescript tsx @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors @types/cookie-parser


# Generate a TypeScript configuration file
npx tsc --init
```

Create a folder called `src` inside `todo-server`, then create a file called `src/server.ts`. This one file is the entire backend. Read the explanations below before you start writing it.

**How this file is organized:**

1. **Imports** — bring in the tools (Express, MySQL, bcrypt, etc.)
2. **Middleware setup** — tell Express to allow cross-origin requests, parse JSON from requests, and read cookies
3. **Database connection** — create a pool of reusable database connections
4. **verifyToken function** — a reusable check that runs before any protected route to confirm the user is logged in
5. **Auth routes** — signup, login, logout
6. **Task routes** — create, read, update, delete tasks (these are the CRUD operations)
7. **Start listening** — tell the server to open a port and wait for requests

```typescript
// ─── IMPORTS ───────────────────────────────────────────────────────────────
// Each import brings in a specific tool or library.
// 'express' is the framework that handles incoming requests and routes.
// 'cors' allows the browser (running on port 5173) to talk to this server (port 8080).
// 'cookieParser' lets the server read cookies attached to requests.
// 'dotenv' reads the .env file and makes variables like DB_HOST available in the code.
// 'mysql2/promise' is the driver that connects to MySQL and runs SQL queries.
// 'bcrypt' hashes passwords so the original can never be recovered.
// 'jsonwebtoken' creates and verifies the signed identity token (JWT).
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// Load values from the .env file into process.env
dotenv.config()

// ─── EXPRESS APP SETUP ──────────────────────────────────────────────────────
// Create the Express application. Think of this as turning on the server machine.
const app = express()

// Allow requests from the frontend URL (http://localhost:5173 is where Vite runs).
// 'credentials: true' allows cookies to be sent along with requests.
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

// Parse incoming request bodies that contain JSON data.
// Without this, req.body would always be undefined.
app.use(express.json())

// Parse cookies from incoming requests.
// Without this, req.cookies would always be empty.
app.use(cookieParser())

// ─── DATABASE CONNECTION ────────────────────────────────────────────────────
// A connection pool keeps several database connections open and reuses them.
// Opening a fresh database connection for every request is slow.
// The pool manages this automatically — you just call db.query() and it handles the rest.
const db = mysql.createPool({
    host: process.env.DB_HOST,       // The address of the MySQL server (localhost for XAMPP)
    user: process.env.DB_USER,       // MySQL username (root for XAMPP)
    password: process.env.DB_PASSWORD, // MySQL password (empty for XAMPP by default)
    database: process.env.DB_NAME,   // The database name (todo_app)
})

// Read the JWT secret key from .env. This string is used to sign and verify tokens.
// If this key changes, all existing tokens become invalid.
const JWT_KEY = process.env.JWT_KEY as string

// ─── VERIFY TOKEN MIDDLEWARE ────────────────────────────────────────────────
// This is a guard function that runs before any protected route.
// It checks whether the request includes a valid JWT.
// If no token is found, or the token is invalid or expired, the request is rejected
// and the route handler below never runs.
// If the token is valid, the decoded user data (id, name) is attached to req.user
// so the route handler can use it.
function verifyToken(req: any, res: any, next: any) {
    // Look for the token in two places: a cookie (for browsers) or the Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Not logged in' })
    try {
        // jwt.verify checks the signature. If tampered or expired, it throws an error.
        req.user = jwt.verify(token, JWT_KEY)
        // next() tells Express to continue to the actual route handler
        next()
    } catch {
        res.status(401).json({ message: 'Session expired' })
    }
}

// ─── SIGNUP ─────────────────────────────────────────────────────────────────
// When a user submits the signup form, this route receives their name, email, and password.
// The password is NEVER stored as plain text. bcrypt.hash() converts it into a
// scrambled, one-way string. Even if someone reads the database, they cannot recover
// the original password from the hash.
// The number 10 is the "salt rounds" — how many times the hashing algorithm runs.
// More rounds = harder to crack, but slightly slower.
app.post('/auth/signup', async (req, res) => {
    const { full_name, email, password } = req.body
    if (!full_name || !email || !password)
        return res.status(400).json({ message: 'All fields required' })
    const hash = await bcrypt.hash(password, 10)
    const [result]: any = await db.query(
        'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
        [full_name, email, hash]
    )
    // 201 means "Created" — a new resource was successfully created
    res.status(201).json({ message: 'Account created', user_id: result.insertId })
})

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// When a user submits the login form, this route:
// 1. Looks up their account in the database by email
// 2. Uses bcrypt.compare() to check if the submitted password matches the stored hash
//    (bcrypt can verify without reversing the hash — that is the point of hashing)
// 3. If it matches, creates a JWT containing the user's ID and name
// 4. Sends the token back both as a cookie and in the response body
//    (cookie for the browser, body for the frontend to save in localStorage)
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email])
    if (!rows.length) return res.status(401).json({ message: 'Invalid email or password' })
    const user = rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(401).json({ message: 'Invalid email or password' })
    // jwt.sign() creates a signed token. '7d' means it expires after 7 days.
    const token = jwt.sign({ id: user.user_id, name: user.full_name }, JWT_KEY, { expiresIn: '7d' })
    // httpOnly: true means JavaScript in the browser cannot read this cookie.
    // This protects against XSS attacks.
    res.cookie('token', token, { httpOnly: true })
    res.json({ token, user: { id: user.user_id, name: user.full_name, email: user.email } })
})

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
// Clears the cookie on the browser side.
// The frontend will also delete the token from localStorage after calling this.
app.post('/auth/logout', (req, res) => {
    res.clearCookie('token')
    res.json({ message: 'Logged out' })
})

// ─── GET ALL TASKS ───────────────────────────────────────────────────────────
// Notice 'verifyToken' is the second argument before the route handler.
// This means verifyToken runs first. If the user is not logged in, the request
// stops there. If they are logged in, req.user is available with their ID.
// The query filters by user_id so a user can only ever see their own tasks.
app.get('/tasks', verifyToken, async (req: any, res) => {
    const [rows]: any = await db.query(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
    )
    res.json(rows)
})

// ─── CREATE A TASK ────────────────────────────────────────────────────────────
// Receives the task title from the request body.
// .trim() removes leading and trailing spaces.
// The user_id is taken from the token (req.user.id), not from the request body.
// This means a user cannot create tasks on behalf of someone else,
// even if they try to send a different user_id in the body.
app.post('/tasks', verifyToken, async (req: any, res) => {
    const { title } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' })
    const [result]: any = await db.query(
        'INSERT INTO tasks (user_id, title) VALUES (?, ?)',
        [req.user.id, title.trim()]
    )
    res.status(201).json({ message: 'Task created', task_id: result.insertId })
})

// ─── MARK TASK AS DONE OR UNDONE ────────────────────────────────────────────
// ':id' in the path is a URL parameter. If the request is PUT /tasks/5,
// then req.params.id is '5'.
// The WHERE clause includes 'AND user_id = ?' to make sure a user can only
// update their own tasks. Without this, any logged-in user could update anyone's task.
app.put('/tasks/:id', verifyToken, async (req: any, res) => {
    const { id } = req.params
    const { is_done } = req.body
    await db.query(
        'UPDATE tasks SET is_done = ? WHERE task_id = ? AND user_id = ?',
        [is_done ? 1 : 0, id, req.user.id]
    )
    res.json({ message: 'Task updated' })
})

// ─── DELETE A TASK ────────────────────────────────────────────────────────────
// Same pattern: the WHERE clause includes user_id so you can only delete your own tasks.
app.delete('/tasks/:id', verifyToken, async (req: any, res) => {
    const { id } = req.params
    await db.query('DELETE FROM tasks WHERE task_id = ? AND user_id = ?', [id, req.user.id])
    res.json({ message: 'Task deleted' })
})

// ─── START THE SERVER ─────────────────────────────────────────────────────────
// Tell Express to listen on port 8080. Once this runs, the server is live
// and waiting for requests at http://localhost:8080
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

> If you are using XAMPP, the default username is `root` and the password is blank (leave `DB_PASSWORD` empty). If you set a password in phpMyAdmin, enter it here.

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

#### Part 3: Build the Frontend

The frontend is what the user sees and interacts with in the browser. It is built with React, which lets you break the interface into small, reusable pieces called components. Each page (Login, Signup, Tasks) is its own component. When the user navigates between pages, React swaps the component being shown without reloading the entire browser tab.

The frontend communicates with the backend through HTTP requests sent using Axios. Every request to a protected route automatically includes the JWT so the server knows who is sending it.

Open a new terminal window (keep the backend terminal open and running) and run:

```bash
# Create a new React + TypeScript project using Vite
npm create vite@latest todo-client -- --template react-ts

cd todo-client

# Install the default dependencies Vite created
npm install

# Install Axios (for sending HTTP requests) and React Router (for navigation)
npm install axios react-router-dom
```

**`src/main.tsx` is the entry point of the frontend.** This is the very first file React reads. It does two things before rendering anything:

1. It sets up Axios so that every HTTP request goes to the backend at `http://localhost:8080`. Instead of writing the full URL every time (`http://localhost:8080/tasks`), you just write `/tasks`.
2. It registers an interceptor. An interceptor is a function that runs automatically before every request. This one reads the JWT from localStorage and adds it to every outgoing request as an `Authorization` header. This is why you do not need to manually include the token on every request — it happens automatically, every time.

After setup, it defines the routes: which URL shows which page component. React Router handles navigation. When you click a link or call `navigate('/login')`, the URL in the browser changes and the matching component is rendered, without a full page reload.

Replace the contents of `src/main.tsx` with:

```typescript
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import axios from 'axios'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import TasksPage from './pages/TasksPage'

// Tell Axios where the backend server is. Every request will go to this base URL.
axios.defaults.baseURL = 'http://localhost:8080'
// Allow cookies to be sent with cross-origin requests.
axios.defaults.withCredentials = true

// This interceptor runs before EVERY Axios request this app makes.
// It reads the JWT from localStorage and attaches it as an Authorization header.
// This is how the server knows which user is sending the request.
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    return config
})

// Define the routes. Each path maps to a component.
// React Router watches the browser URL and renders the matching component.
const router = createBrowserRouter([
    { path: '/', element: <TasksPage /> },       // The task list (protected)
    { path: '/login', element: <LoginPage /> },   // The login form
    { path: '/signup', element: <SignupPage /> },  // The signup form
])

// Mount the React app inside the <div id="root"> element in index.html.
ReactDOM.createRoot(document.getElementById('root')!).render(
    <RouterProvider router={router} />
)
```

**`src/pages/SignupPage.tsx`** is the signup form. It holds the form data in React state using `useState`. When the user types, the state updates. When the form is submitted, Axios sends the data to `POST /auth/signup` on the server. If successful, the user is navigated to the login page. If the server returns an error (like "email already taken"), it is displayed below the form.

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

**`src/pages/LoginPage.tsx`** works the same way as SignupPage but sends to `POST /auth/login`. When the server responds with a token, the frontend saves it to `localStorage` so it persists across page refreshes. It then navigates the user to `/` where the tasks are.

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

**`src/pages/TasksPage.tsx`** is the main page of the app. When it first loads, it calls `fetchTasks()` inside a `useEffect` hook. A `useEffect` with an empty dependency array (`[]`) runs once when the component mounts on screen — this is the standard way to load data when a page opens. If the server rejects the request (the user is not logged in), it redirects to `/login`.

The tasks are stored in React state as an array. Every time the user adds, toggles, or deletes a task, the frontend calls `fetchTasks()` again to refresh the list from the server. This keeps the UI in sync with the database.

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

#### 21.2 What You Just Built: And How It Mirrors AquaLasTech

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



### 22 Glossary: All Terms Used in This Project

This section defines every technical term used throughout this document. Definitions are written for someone reading about these concepts for the first time.


**API (Application Programming Interface)**
A set of rules that allows two programs to communicate. In this project, the API is the collection of routes on the server (like `POST /auth/login` or `GET /tasks`) that the frontend uses to send and receive data. Think of it as a menu of actions the server is willing to perform.

**async / await**
A way to write code that waits for a slow operation (like a database query or a network request) to finish before moving to the next line. Without it, the code would skip past the query before the result arrived. The word `async` marks a function as one that contains waiting operations. The word `await` is placed before the slow operation to pause execution until it completes.

**Authentication**
The process of proving who you are. In this system, you authenticate by submitting your email and password. The server checks them and, if correct, issues a token that acts as your identity proof.

**Authorization**
The process of deciding what you are allowed to do. After you are authenticated (identity confirmed), authorization determines your permissions. In AquaLasTech, a Customer is authorized to place orders but not to view the admin panel. The distinction: authentication says "you are Ian," authorization says "Ian can do X but not Y."

**Axios**
A JavaScript library used in the frontend to send HTTP requests to the server. It handles the low-level details of forming the request and parsing the response. It also supports interceptors (see below).


**Backend**
The part of the system that runs on the server, not in the browser. It contains the business logic, communicates with the database, enforces permissions, and sends responses. In this project, the backend is an Express.js application written in TypeScript running on Node.js.

**bcrypt**
A password hashing tool. When a user creates an account, their password is passed through bcrypt which produces a long scrambled string called a hash. The original password is not stored anywhere. When the user logs in again, bcrypt can verify if a submitted password matches the stored hash without ever reversing the hash. This means even if the database is leaked, the actual passwords remain protected.

**Body (HTTP)**
The data included inside an HTTP request or response. When a user submits a signup form, the form values (name, email, password) are sent in the request body as JSON. The server reads `req.body` to access this data.

**Build**
The process of converting source code written in TypeScript and React into files the browser can actually run. Vite handles this. The output is plain JavaScript and CSS files. The command `npm run build` produces these files in a `dist` folder.

**Bundle**
The single (or small group of) JavaScript files produced by the build process. Vite combines all the separate source files into an optimized bundle that loads efficiently in the browser.


**Cloudinary**
A cloud service that stores and serves images. When a user uploads a profile photo, station logo, or GCash receipt, the file is sent directly to Cloudinary. Cloudinary returns a permanent URL (a web address) for that image. The server saves this URL in the database. The browser then loads images directly from Cloudinary, not from the application server.

**Column**
A field in a database table. Every row in a table has the same set of columns. For example, the `users` table has columns: `user_id`, `full_name`, `email`, `password_hash`, `role`. Each column stores one specific type of information.

**Component (React)**
A reusable piece of the user interface written as a TypeScript function. A button, a form, a page, a modal, or a layout wrapper can all be components. Components can be combined to build complex interfaces. For example, the `AdminLayout` component wraps every admin page and provides the sidebar and header.

**Connection Pool**
A set of database connections that stay open and ready to be reused. Opening a new database connection every time a request arrives is slow. A pool keeps several connections open and hands one out when a query needs to run, then returns it to the pool when done. MySQL2's `createPool()` manages this automatically.

**Context (React)**
A built-in React feature that makes data available to every component in the application without passing it manually through each level. `AuthContext` in this project holds the logged-in user's information. Any component anywhere in the app can read the current user by calling `useAuth()`.

**Cookie**
A small piece of data that the server stores on the browser. Unlike localStorage, cookies are automatically sent with every request to the same domain. In this project, the JWT is stored as an `httpOnly` cookie (which JavaScript cannot read, protecting it from theft) and also in localStorage (for iOS compatibility).

**CORS (Cross-Origin Resource Sharing)**
A browser security rule that blocks requests from one website to a different website. Since the frontend runs on `localhost:5173` and the backend runs on `localhost:8080`, they are technically different origins. CORS configuration on the server tells the browser it is safe to allow requests from the frontend's address.

**CRUD**
An acronym for the four fundamental database operations: Create (INSERT), Read (SELECT), Update (UPDATE), Delete (DELETE). Every data-driven feature in this project is built from some combination of these four operations.


**Database**
A structured system for storing data permanently. Even if the server restarts or crashes, data in the database survives. In this project, MySQL is used. Data is organized into tables (like spreadsheets), and tables are linked to each other through foreign keys.

**Deployment**
The process of making the application accessible to users on the internet. This project deploys the frontend to Vercel, the backend to Render, and uses Aiven for the database.

**dotenv**
A tool that reads a file called `.env` and makes its contents available as environment variables in the code. It keeps sensitive values (database passwords, API keys) out of the source code and out of version control.


**Endpoint**
A specific URL on the server that accepts a particular type of request. For example, `POST /auth/login` is an endpoint that accepts login requests. `GET /tasks` is an endpoint that returns the task list. Together, all endpoints form the API.

**Environment Variable**
A named configuration value stored outside the code. Instead of writing `password: "mysecret123"` directly in the code (which would be visible to anyone who reads the file), you write `password: process.env.DB_PASSWORD` and store the actual value in a `.env` file that is never shared or committed to version control.

**Express.js**
A framework built on top of Node.js that makes it easier to define routes, apply middleware, and handle HTTP requests and responses. Without Express, you would need to write the low-level HTTP parsing code yourself.


**Foreign Key**
A column in one table that stores the ID of a row in another table. This creates a link between tables. For example, the `tasks` table has a `user_id` column that stores the ID of the user who created the task. This links each task to its owner in the `users` table.

**Frontend**
The part of the system that runs in the browser. It is what the user sees and interacts with. In this project, the frontend is a React application built with Vite. It communicates with the backend by sending HTTP requests through Axios.


**Hash / Hashing**
A one-way mathematical transformation of data. Hashing takes an input (like a password) and produces a fixed-length scrambled output. The same input always produces the same hash. But you cannot reverse the process to get the original input from the hash. Bcrypt is the hashing algorithm used in this project for passwords.

**Headers (HTTP)**
Extra information sent alongside an HTTP request or response. In this project, the `Authorization` header carries the JWT token: `Authorization: Bearer eyJ...`. The server's middleware reads this header to identify the user.

**Helmet**
An Express middleware that sets security-related HTTP response headers. It protects against common attacks like clickjacking, cross-site scripting injection through MIME-type sniffing, and others, by configuring the browser's built-in security features.

**Hook (React)**
A built-in React function that adds functionality to a component. The most common ones used in this project are `useState` (stores a value that, when changed, causes the component to re-render) and `useEffect` (runs code after the component renders, used for fetching data). Custom hooks like `useStation` package reusable logic into a single function.

**HTTP (HyperText Transfer Protocol)**
The communication standard used between browsers and web servers. Every time a user interacts with the app — loading a page, submitting a form, clicking a button — an HTTP request is sent to the server and an HTTP response comes back.

**HTTP Status Code**
A number included in every HTTP response that tells the browser whether the request succeeded. Common codes: 200 = OK, 201 = Created, 400 = Bad Request (client sent wrong data), 401 = Unauthorized (not logged in), 403 = Forbidden (logged in but not allowed), 404 = Not Found, 500 = Server Error.


**Interceptor (Axios)**
A function that runs automatically before every request (or after every response) that Axios makes. In this project, a request interceptor reads the JWT from localStorage and attaches it to every outgoing request as an Authorization header. This means the token is included automatically and does not need to be added manually each time.

**Interface (TypeScript)**
A TypeScript definition that describes the shape of a data object — what fields it has and what type each field is. For example, `interface Task { task_id: number; title: string; is_done: number }` means any variable typed as `Task` must have those three fields with those types.


**JavaScript**
The programming language that runs in web browsers. It is also the language Node.js uses to run server-side code. TypeScript is a superset of JavaScript — all valid JavaScript is valid TypeScript, but TypeScript adds type checking on top.

**JSON (JavaScript Object Notation)**
A standard text format for sending structured data between a browser and a server. It looks like: `{ "name": "Juan", "age": 25 }`. The server sends JSON responses. The browser receives them and reads the values. Express parses incoming JSON bodies automatically when `app.use(express.json())` is set up.

**JWT (JSON Web Token)**
A small signed text string that proves who a user is after they log in. It contains a payload (user ID, role, station ID) encoded as base64, plus a cryptographic signature that proves the payload was not tampered with. The server creates it at login. On every subsequent request, the browser sends it back. The server verifies the signature and trusts the payload. No session storage is needed on the server side.


**Leaflet**
An open-source JavaScript library for interactive maps. Used in the customer settings page to let users drop a pin on their delivery location. The pin coordinates (latitude and longitude) are saved to the database.

**localhost**
A special address that means "this computer." When you run the server on your machine, it is accessible at `http://localhost:8080`. Only your machine can reach it — it is not on the internet.

**localStorage**
A storage area in the browser that persists data even after the browser is closed. Unlike cookies, localStorage values are not automatically sent with HTTP requests. In this project, the JWT is stored in localStorage so the Axios interceptor can read it and add it to request headers manually.


**Middleware**
A function that runs on every incoming request before the route handler. Middleware can modify the request, check conditions, or stop the request entirely. Examples: `express.json()` parses request bodies; `verifyToken` checks for a valid JWT; `helmet()` adds security headers. Middleware is the mechanism that makes cross-cutting concerns (security, parsing, logging) apply to all routes without repeating code in each route.

**Monorepo**
A single version control repository that contains multiple separate projects. In AquaLasTech, the `client` folder and the `server` folder are two independent applications that happen to live in the same repository. This makes it easier to manage them together.

**Multer**
An Express middleware for handling file uploads. When a user submits a form that includes an image, Multer intercepts the file before it reaches the route handler. In this project, Multer is configured to hand the file directly to Cloudinary instead of saving it to disk.

**MySQL**
A relational database management system. Data is stored in tables. Tables can be related to each other. SQL (Structured Query Language) is used to interact with it — for example, `SELECT * FROM tasks WHERE user_id = 5` fetches all tasks belonging to user 5.

**Node.js**
A runtime environment that lets JavaScript run on a server, outside of a browser. Before Node.js, JavaScript could only run inside browsers. Node.js made it possible to use JavaScript for backend development.

**Nodemailer**
A Node.js library for sending emails. Used in this project for the password reset feature — it sends a reset link to the user's email address.

**npm (Node Package Manager)**
The tool that installs JavaScript libraries (packages) and manages project dependencies. When you run `npm install express`, npm downloads the Express library and saves it in the `node_modules` folder. The `package.json` file lists all the packages a project depends on.


**package.json**
A configuration file in every Node.js project that lists the project name, version, all dependencies (libraries needed to run), dev dependencies (libraries only needed during development), and scripts (commands like `npm run dev` or `npm run build`).

**Payload (JWT)**
The data encoded inside a JWT. In this project, the payload contains `{ id, role, station_id }`. The server reads this after verifying the token to know who is making the request and what they are allowed to do.

**Polling**
A technique where the browser repeatedly asks the server for updates at fixed intervals. In this project, the admin order list refreshes every 30 seconds by re-sending the same request. This is simpler than WebSockets but means updates are never instant — there is always up to a 30-second delay.

**Port**
A number that identifies a specific communication channel on a computer. A server can run on any port. Port 8080 is commonly used for development backends. Port 5173 is the default for Vite. Port 3306 is the default for MySQL. When you write `http://localhost:8080`, the `:8080` tells the computer which port to connect to.

**Primary Key**
A column in a database table that uniquely identifies each row. No two rows can have the same primary key value. In this project, every table has a primary key named after the table (e.g., `user_id`, `task_id`, `order_id`). Primary keys are typically auto-incrementing integers that the database assigns automatically.

**Promise**
A JavaScript object that represents the eventual result of an asynchronous operation. A promise is either pending (still waiting), fulfilled (completed successfully), or rejected (failed). `async/await` is a cleaner way to work with promises without writing `.then()` chains.

**Props (React)**
Short for properties. Data passed from a parent component to a child component. For example, a `Button` component might accept a `label` prop and an `onClick` prop. Props are how components communicate downward through the component tree.

**PWA (Progressive Web App)**
A web application that can be installed on a device and behaves like a native app. AquaLasTech can be installed from Chrome on Android. The `site.webmanifest` file defines the app name, icons, and splash screen colors. When the user opens the installed app, it shows an icon and a splash screen before loading.


**React**
A JavaScript library for building user interfaces. React breaks the UI into components. When data (state) changes, React automatically re-renders only the parts of the interface that depend on that data. The key idea is that the UI is a function of the data: change the data, the UI updates.

**React Router**
A library that handles navigation inside a React app. It maps URL paths to components. When the user navigates to `/login`, React Router renders the `LoginPage` component without reloading the browser tab. The URL in the browser changes, but the page does not fully reload.

**Render (hosting)**
A cloud hosting platform where the backend server is deployed. When code is pushed to the correct git branch, Render automatically rebuilds and redeploys the server.

**Repository**
A folder tracked by version control software (Git). It contains the complete history of every file change, every commit, and every branch. AquaLasTech's repository is hosted on GitHub.

**Role**
A label assigned to a user account that determines what they are allowed to do. AquaLasTech has four roles: Customer (1), Staff (2), Store Owner (3), System Admin (4). The role is stored in the database and included in the JWT so the server can check it on every request.

**Route**
In the backend: a specific combination of HTTP method and path that the server responds to (e.g., `GET /tasks` or `POST /auth/login`). In the frontend: a mapping from a URL to a React component (e.g., `/login` shows `LoginPage`).

**Row**
A single record in a database table. A row in the `users` table represents one user account. A row in the `tasks` table represents one task.


**Salt Rounds (bcrypt)**
A number that controls how many times bcrypt runs its hashing algorithm internally. A value of 10 means the algorithm runs 2^10 = 1024 times. Higher values are more secure but take longer. 10 is a standard starting value that balances security and speed.

**Soft Delete**
Marking a record as deleted without actually removing it from the database. In AquaLasTech, when an admin "deletes" an order from the history view, the `hidden_at` column is set to the current timestamp. The order still exists in the database and is still counted in all reports. The display query just filters out rows where `hidden_at` is not null.

**SQL (Structured Query Language)**
The language used to interact with relational databases. The four core operations: `SELECT` (read data), `INSERT` (add a row), `UPDATE` (change a row), `DELETE` (remove a row). SQL queries are what the server sends to MySQL whenever it needs to read or write data.

**SSL (Secure Sockets Layer)**
An encryption protocol for protecting data in transit. When the server connects to the cloud database on Aiven, SSL encrypts the connection so data cannot be intercepted. In modern usage, the term TLS (Transport Layer Security) is technically more accurate, but SSL is commonly used for both.

**State (React)**
Data stored inside a component that, when changed, causes the component to re-render and update the UI. `useState` is the hook used to create state. For example, `const [tasks, setTasks] = useState([])` creates a `tasks` variable and a `setTasks` function. Calling `setTasks(newList)` updates the variable and causes the component to re-render with the new list.

**Station**
A water refilling station registered in the system. Each station has its own products, inventory, admins, orders, and settings. All data is scoped to a station — an admin of Station A cannot see Station B's data.


**Table**
A collection of rows and columns in a relational database. Each table represents one type of data. The `users` table stores users. The `orders` table stores orders. Tables are linked through foreign keys.

**TailwindCSS**
A CSS framework that provides utility classes you apply directly in the HTML (or JSX). Instead of writing a separate CSS file with custom class names, you write class names like `bg-blue-500 text-white rounded-lg px-4 py-2` directly on the element. Tailwind converts these into the corresponding CSS at build time.

**TINYINT**
A MySQL data type that stores a small integer (0 to 255 using 1 byte). AquaLasTech uses TINYINT to store status codes and role numbers instead of text strings, because numbers are more storage-efficient and faster to compare.

**Token**
A piece of data that proves identity or grants access. In this project, the JWT is the token. After login, the token is stored in the browser and sent with every request so the server knows who is making it.

**tsconfig.json**
The TypeScript configuration file. It tells the TypeScript compiler what version of JavaScript to output, which folders to include, what strictness rules to apply, and other settings. `npx tsc --init` generates a default version of this file.

**TypeScript**
A superset of JavaScript that adds static type checking. You declare what type each variable holds (number, string, object with specific fields), and TypeScript warns you at compile time if you use them incorrectly. TypeScript code is compiled into regular JavaScript before it runs.


**useEffect (React Hook)**
A hook that runs code after a component renders. Commonly used to fetch data when a page loads. An empty dependency array (`[]`) means "run this once when the component first appears on screen." Adding variables to the array means "run this again whenever those variables change."

**useState (React Hook)**
A hook that creates a reactive variable. When you call the setter function, React re-renders the component with the new value. This is how the UI stays in sync with the data — changing the state triggers a visual update automatically.


**Vercel**
A cloud hosting platform for frontend applications. When code is pushed to the `main` branch, Vercel automatically builds the React app with Vite and deploys it to a public URL.

**Vite**
A build tool and development server for frontend JavaScript projects. It converts TypeScript and React code into browser-compatible files. During development, it runs a local server with instant hot-reload on save. For production, it bundles and optimizes the code.

**VARCHAR**
A MySQL data type for variable-length text. `VARCHAR(100)` stores up to 100 characters. Unlike `TEXT`, which can store arbitrary amounts of text, VARCHAR has a defined limit that makes queries and indexing more efficient.


**WebSocket**
A communication protocol that keeps a persistent connection open between the browser and server, allowing the server to push updates to the browser instantly without the browser asking first. AquaLasTech uses polling (repeated requests on a timer) instead of WebSockets for simplicity. Real-time order updates currently have up to a 30-second delay.


**XSS (Cross-Site Scripting)**
A type of attack where malicious JavaScript is injected into a web page and executed in another user's browser. Storing the JWT as an `httpOnly` cookie instead of in regular localStorage protects against this, because `httpOnly` cookies cannot be accessed by JavaScript — only by the browser itself when sending requests.

---

### 23. Security Architecture: Every Protection and Why

Security in AquaLasTech is not a single feature — it is a set of overlapping layers. If one layer is bypassed, the next one still blocks the attacker. This section explains every protection in the system, what it defends against, and where the code lives.

#### 23.1 Password Hashing with bcrypt

**What it protects:** If the database is ever leaked, attackers cannot recover user passwords.

**How it works:** When a user creates an account, their password is passed through bcrypt before being stored. Bcrypt performs a one-way mathematical transformation called hashing. The result (the hash) looks like `$2b$10$XK...` — a long scrambled string with no relationship to the original password. The original can never be recovered from the hash.

When the user logs in, bcrypt compares the submitted password against the stored hash. Internally, it runs the same transformation on the submitted password and checks if the result matches the stored hash. No reversal happens.

The number `10` in `bcrypt.hash(password, 10)` is the **salt rounds** — how many times the algorithm iterates. This makes brute-force attacks slow even with powerful hardware.

**Where in the code:**
- Hash on signup: `server/src/routes/auth.routes.ts` — `bcrypt.hash(password, 10)`
- Verify on login: `server/src/routes/auth.routes.ts` — `bcrypt.compare(password, user.password_hash)`

**What would happen without it:** A single database leak would expose every user's password in plain text.

#### 23.2 JWT Identity Tokens

**What it protects:** Prevents users from impersonating each other or forging their identity.

**How it works:** After a successful login, the server creates a JSON Web Token (JWT) using a secret key only the server knows. The token contains the user's ID, role, and station_id. The token is signed — any modification to the payload (like changing `role: "customer"` to `role: "admin"`) breaks the signature, and the server immediately rejects it.

The server never stores sessions. It simply verifies the signature on every incoming request. If the signature is valid, it trusts the payload.

```json
// Payload inside the JWT (visible but cannot be forged without the secret):
{ "id": 14, "role": "super_admin", "station_id": 3, "iat": 1713000000, "exp": 1713604800 }
```

**Expiry:** Tokens expire after 7 days. After that, the user must log in again. This limits the damage window if a token is stolen.

**Where in the code:**
- Token creation: `server/src/routes/auth.routes.ts` — `jwt.sign({ id, role, station_id }, JWT_KEY, { expiresIn: '7d' })`
- Token verification: `server/src/middleware/verifyToken.middleware.ts` — `jwt.verify(token, JWT_KEY)`

#### 23.3 Dual-Token Strategy for iOS Safari

**What it protects:** iOS Safari blocks third-party cookies, which breaks the standard cookie-based session for users on iPhones using the web app.

**How it works:** The server sends the JWT in two places at login:
1. As an `httpOnly` cookie (for desktop browsers — cannot be read by JavaScript, protects against XSS)
2. In the response body as a plain string (for iOS — the frontend saves this to `localStorage`)

The `verifyToken` middleware checks both places on every request:

```typescript
const token = req.cookies.token || req.headers.authorization?.split(' ')[1]
```

On desktop, the cookie is sent automatically. On iOS, the Axios interceptor reads the token from localStorage and attaches it as an `Authorization: Bearer ...` header. Both paths lead to the same verification logic.

**Where in the code:**
- Sending both: `server/src/routes/auth.routes.ts` — `res.cookie(...)` + `res.json({ token, ... })`
- Reading both: `server/src/middleware/verifyToken.middleware.ts`
- Axios interceptor (iOS path): `client/src/main.tsx`

#### 23.4 Parameterized Queries (SQL Injection Prevention)

**What it protects:** SQL injection — an attack where a malicious user puts SQL code into a form field to manipulate the database query.

**The attack example:** If a login query were written as:
```sql
SELECT * FROM users WHERE email = '${email}'
```
...and the user typed `' OR '1'='1` as their email, the query would become:
```sql
SELECT * FROM users WHERE email = '' OR '1'='1'
```
This would match every user in the database and log the attacker in as the first user.

**How it works:** Every query in this codebase uses parameterized queries with `?` placeholders:
```typescript
db.query('SELECT * FROM users WHERE email = ?', [email])
```
The `mysql2` driver sends the SQL string and the values to MySQL separately. MySQL treats the values as pure data — never as SQL code. No matter what the user types into `email`, it cannot change the structure of the query.

**Where in the code:** Every route file. Every single database query uses `?` placeholders. There are no string-concatenated queries anywhere in the codebase.

**What would happen without it:** A single exposed field could give an attacker full control of the database.

#### 23.5 Role-Based Access Control (Three Layers)

**What it protects:** Prevents users from accessing pages or actions they are not authorized for.

**Layer 1 — Frontend route guards:**
`ProtectedRoute.tsx` checks the user's role before rendering a page. A customer who navigates to `/admin/orders` is redirected to the login page. This is a UX safeguard, not a security guarantee — anyone could forge a request directly.

**Layer 2 — Backend middleware:**
Every admin route is protected by middleware that checks the role inside the JWT. Even if a customer crafts a raw HTTP request (using curl or Postman) to `GET /orders`, the server reads their JWT, finds `role: "customer"`, and responds with `403 Forbidden`. The route handler never runs.

```typescript
// In role.middleware.ts:
export function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin')
        return res.status(403).json({ message: 'Forbidden' })
    next()
}
```

**Layer 3 — Station scoping in every query:**
Even if an attacker had an admin JWT from Station A, they cannot read Station B's data because every query is scoped:

```typescript
// The station_id comes from the JWT — the attacker cannot change it
db.query('SELECT * FROM orders WHERE station_id = ?', [req.user.station_id])
```

This means three separate controls must all fail for data from another station to be exposed.

**Where in the code:**
- Frontend: `client/src/routes/ProtectedRoute.tsx`
- Backend role middleware: `server/src/middleware/role.middleware.ts`
- Station scoping: every query in every route file

#### 23.6 CORS (Cross-Origin Resource Sharing)

**What it protects:** Prevents malicious websites from sending requests to the server on behalf of a logged-in user.

**How it works:** Browsers enforce a rule: code running on `evil.com` cannot send requests to `api.aqualastech.onrender.com` unless the server explicitly allows it. The CORS configuration in `app.ts` only allows the known frontend URL:

```typescript
app.use(cors({
    origin: process.env.CLIENT_URL,  // Only the real frontend
    credentials: true                // Allow cookies
}))
```

If a request comes from any other origin, the browser blocks it before it reaches the server (for simple requests) or the server responds without the required headers (for complex requests), and the browser discards the response.

**Where in the code:** `server/src/app.ts`

**What would happen without it:** Any website could send authenticated requests to the API using the victim's session.

#### 23.7 Helmet Security Headers

**What it protects:** A collection of browser-level attacks including clickjacking, MIME-type confusion, and others.

**How it works:** `app.use(helmet())` sets several HTTP response headers that instruct the browser to enable its built-in security features:

| Header | What It Does |
| :--- | :--- |
| `X-Frame-Options: DENY` | Prevents the app from being embedded in an iframe (blocks clickjacking) |
| `X-Content-Type-Options: nosniff` | Forces the browser to respect the declared content type (blocks MIME sniffing attacks) |
| `Referrer-Policy` | Controls how much URL information is shared with external sites |
| `X-DNS-Prefetch-Control` | Prevents DNS prefetching that could leak browsed URLs |

**Where in the code:** `server/src/app.ts` — first middleware registered

#### 23.8 Password-Gated Destructive Actions

**What it protects:** Prevents an attacker with an active admin session (for example, someone who grabbed an unattended laptop) from destroying data.

**How it works:** Bulk-deleting order history and deleting staff accounts both require the currently logged-in admin to re-enter their password before the action executes. The server verifies the password against the stored hash using bcrypt before proceeding.

```typescript
// In order.routes.ts — before bulk delete:
const match = await bcrypt.compare(password, admin.password_hash)
if (!match) return res.status(403).json({ message: 'Incorrect password' })
```

This means physical access to an unlocked admin session is not enough to destroy data — the attacker must also know the password.

**Where in the code:**
- Order bulk delete: `server/src/routes/order.routes.ts` — `POST /orders/verify-password`
- Staff account delete: `server/src/routes/settings.routes.ts` — `DELETE /settings/admins/:id`

#### 23.9 Soft Deletes (Audit Trail Preservation)

**What it protects:** Accidental or malicious erasure of financial history.

**How it works:** When an admin "deletes" orders from the history view, the rows are not removed. A `hidden_at` timestamp is set. The order list query filters out these rows, so they disappear from the display. But the reports queries do not apply this filter — every order, including "deleted" ones, is always counted in sales figures.

This means even if an admin tries to manipulate revenue figures by deleting orders, the reports still show the real numbers.

**Where in the code:**
- Setting hidden_at: `server/src/routes/order.routes.ts` — `DELETE /orders/history` and `DELETE /orders/:id`
- Reports ignoring hidden_at: `server/src/routes/reports.routes.ts` — queries do not include `hidden_at IS NULL`

#### 23.10 SSL/TLS on the Database Connection

**What it protects:** Data being intercepted in transit between the server and the cloud database.

**How it works:** The database runs on Aiven, a cloud service in a different physical location from the server on Render. All traffic between them travels over the public internet. Without encryption, this traffic could be intercepted. The connection is configured with SSL:

```typescript
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
```

`rejectUnauthorized: false` is used because Aiven uses a self-signed certificate. This still encrypts the connection — it only skips the certificate authority check, which is acceptable for a known, controlled cloud service.

**Where in the code:** `server/src/config/db.ts`

---

### 24. Technology Stack Rationale: Why Each Tool Was Chosen

Every tool in this project was chosen for a specific reason. Understanding the reasoning helps you make the right decisions when the project evolves.

#### 24.1 Why TypeScript instead of plain JavaScript?

TypeScript catches entire categories of bugs before the code ever runs. In a full-stack app with many data shapes (orders, products, payments, users), it is easy to accidentally pass a string where a number is expected, or to access a property that does not exist. TypeScript turns these runtime surprises into compile-time errors you see while writing code.

The overhead is small: you write type annotations, you run `tsc` before deploying. The payoff is large: the number of "undefined is not a function" and "cannot read property of null" crashes drops dramatically.

#### 24.2 Why Node.js + Express for the backend?

**Node.js:** The same language (JavaScript/TypeScript) runs on both the frontend and backend. The team only needs to know one language. Types, interfaces, and constants can be shared across both sides without translation. For a small team building a full-stack product, this is a significant productivity advantage.

**Express:** It is minimal by design — it gives you routing, middleware, and request/response handling and nothing else. You are not forced into a specific folder structure, ORM, or architectural pattern. This makes it easy to understand exactly what is happening at every step, which is important for a learning team. More opinionated frameworks (NestJS, AdonisJS) add abstractions that help at scale but obscure how the system works when you are starting out.

#### 24.3 Why React for the frontend?

React's component model matches the way this app is built: a sidebar, a top bar, a list of order cards, a modal, a payment badge — these are all independent, reusable pieces. React makes it natural to build each one in isolation and compose them.

React's state model (`useState`, `useEffect`) is the right level of complexity for this app. It is more powerful than manipulating the DOM directly and less complicated than full state management libraries (Redux, Zustand). The team can learn React's core and build everything this app needs without additional tools.

#### 24.4 Why Vite instead of Create React App?

Create React App (CRA) was the standard for years but is now unmaintained. Vite starts the development server instantly and applies changes on save in milliseconds — compare this to CRA's 5-30 second rebuilds. For day-to-day development, this difference matters. Vite also produces smaller, faster production builds.

#### 24.5 Why MySQL instead of MongoDB?

This application's data is relational by nature. An order has many items. Each item references a product. Each product belongs to a station. Each station has many admins. These relationships are native to relational databases — you can join tables, enforce foreign key constraints, and write complex aggregation queries (the reports feature) cleanly in SQL.

MongoDB (a document database) would require embedding this relational data inside documents or maintaining references manually. The mismatch would add complexity without benefit. SQL is also the language most familiar to the widest range of developers — anyone who can read SQL can immediately understand what the queries are doing.

#### 24.6 Why Aiven for the database?

Aiven provides managed MySQL in the cloud with automatic backups, monitoring, and SSL encryption. The free tier supports the current data volume (hundreds of orders, dozens of products, small user base). The alternative — running MySQL on a VPS — would require setting up backups, monitoring, and security updates manually, which is unnecessary operational overhead for a product at this stage.

#### 24.7 Why Render for the backend?

Render auto-deploys when a branch is pushed to GitHub. Zero-downtime deploys, automatic HTTPS, free SSL certificates, and a simple environment variable manager are all included. The free tier is sufficient for demo and early production traffic, and scaling up is a click away. The main tradeoff is a 50-second cold start on the free tier when the server is idle — this is acceptable for a demo and solved by upgrading the plan for production.

#### 24.8 Why Vercel for the frontend?

Vercel is purpose-built for frontend frameworks, especially React + Vite. It deploys in under a minute, serves the app from a global CDN (content delivery network — servers near the user), handles automatic HTTPS, and supports preview deployments for every branch. For a React app, Vercel is the zero-config choice.

The frontend and backend are deployed separately because they scale independently. The frontend is static files — once deployed, the same files serve every user with no server computation. The backend handles real-time computation and database access. Deploying them separately means frontend performance is not limited by backend capacity.

#### 24.9 Why Cloudinary for images?

When a server restarts on Render (which happens on every deploy), its local filesystem is wiped. Any files saved to the server's disk are gone. Cloudinary solves this by storing images in the cloud permanently, outside the server's lifecycle. The server only stores the URL.

Additionally, Cloudinary serves images through a CDN, automatically optimizes image sizes for different devices, and can transform images on-the-fly (resize, compress, change format). The free tier supports the current image volume.

#### 24.10 Why Axios instead of the built-in `fetch`?

`fetch` is built into modern browsers and works well for simple requests. Axios adds:
- **Interceptors** — the ability to run code before every request (adding the auth token) or after every response (handling 401 errors globally). `fetch` requires manual wrappers for this.
- **Automatic JSON parsing** — `axios.get('/users')` returns parsed JSON directly. `fetch` requires an extra `.json()` call.
- **Better error handling** — Axios throws on non-2xx responses. `fetch` only throws on network failures, so you must check `response.ok` manually.
- **Consistent API** — the same API works in Node.js and the browser, useful if you ever run code in both environments.

#### 24.11 Why TailwindCSS instead of plain CSS or another framework?

TailwindCSS keeps styles co-located with the component they apply to. You never need to switch between a `.tsx` file and a `.css` file to understand what an element looks like. There is no dead CSS — if a component is deleted, its styles are deleted with it. Every Tailwind class corresponds directly to a CSS property, so you can read the class names and immediately know the visual result (`text-white` = white text, `rounded-lg` = large border radius).

The tradeoff is longer class strings in JSX. The benefit is zero naming conflicts, no specificity issues, and no stylesheet maintenance.

#### 24.12 Why Nodemailer + Gmail for password reset?

The password reset feature needs to send one email type (the reset link). A full email service (SendGrid, Mailgun) is overkill for this volume. Nodemailer with a Gmail App Password requires zero additional accounts or API keys beyond what the team already has. For higher volumes, swapping Nodemailer for a proper email service is a small change in `auth.routes.ts`.

#### 24.13 Why Leaflet for maps?

Leaflet is the most widely-used open-source JavaScript mapping library. It is free with no API key required (using OpenStreetMap tiles). Google Maps requires billing information even for low usage. For a single use case — letting customers drop a pin on their delivery location — Leaflet is the simplest, cheapest, and most reliable option.

---

### 25. Mastering the Codebase: How to Trace Any Feature

The fastest way to understand this codebase is to pick a feature and follow it through every layer. This section teaches you the reading pattern — once you can trace one feature completely, you can trace any of them.

#### 25.1 The Reading Pattern

Every feature follows the same path:

```
User action in browser
  → client/src/pages/*/PageName.tsx          (what the user sees, what triggers the request)
  → client/src/main.tsx (Axios interceptor)  (adds the auth token automatically)
  → server/src/app.ts                        (routes the request to the right file)
  → server/src/middleware/verifyToken.ts     (checks identity)
  → server/src/middleware/role.middleware.ts (checks permission)
  → server/src/routes/feature.routes.ts      (the main logic)
  → server/src/config/db.ts                  (the database query)
  → response flows back up the same chain
```

Apply this pattern to any feature. Start from the button the user clicks. End at the SQL query.

#### 25.2 Worked Example: Admin Approves a Return

Let us trace exactly what happens when an admin clicks "Approve" on a return request.

**Step 1 — Find the button in the frontend.**
Open `client/src/pages/admin/AdminCustomerOrder.tsx`. Search for "Approve". You will find a button inside the `ReturnModal` component that calls something like `handleReturnAction('approved')`.

**Step 2 — Find the function that sends the request.**
`handleReturnAction` calls:
```typescript
axios.put(`${API}/orders/${selectedOrder.order_id}/return`, { action: 'approved' })
```
This is a `PUT` request to `/orders/:id/return`.

**Step 3 — Find the route on the server.**
Open `server/src/app.ts`. Find where `/orders` is mounted:
```typescript
app.use('/orders', orderRoutes)
```
Open `server/src/routes/order.routes.ts`. Search for `'/return'`. You will find:
```typescript
router.put('/:id/return', verifyToken, requireAdmin, async (req, res) => { ... })
```

**Step 4 — Read the middleware that runs first.**
`verifyToken` confirms the request includes a valid JWT. `requireAdmin` confirms the role is Staff or Store Owner. Both must pass or the route handler never runs.

**Step 5 — Read the route logic.**
Inside the handler:
- It reads `req.params.id` (the order ID) and `req.body.action` ("approved" or "rejected")
- If approved: it sets `order_status = 6` (returned) and deducts the `refund_amount` from `total_amount`
- It sets `return_status = 'approved'` in `order_returns`
- It sends a notification to the customer
- It responds with `{ message: 'Return approved' }`

**Step 6 — Back in the frontend.**
The `.then()` or `await` after the Axios call receives the response. The UI closes the modal and refreshes the order list. A toast notification confirms success.

You now understand every step of this feature from click to database to UI update.

#### 25.3 Where to Look for Each Type of Question

| Question | Where to Look |
| :--- | :--- |
| What does this page show? | `client/src/pages/*/PageName.tsx` |
| How does navigation work? | `client/src/routes/router.tsx` |
| Who is currently logged in? | `client/src/context/AuthContext.tsx` |
| How is every request authenticated? | `client/src/main.tsx` (Axios interceptor) |
| How does the server route requests? | `server/src/app.ts` |
| What checks run before every route? | `server/src/middleware/` |
| Where is the business logic? | `server/src/routes/feature.routes.ts` |
| What does the database look like? | `server/src/config/db.ts` (connection) + schema SQL |
| What do status numbers mean? | `server/src/constants/dbEnums.ts` |
| Where are images stored? | `server/src/config/cloudinary.ts` |
| What environment values are needed? | `server/.env` and `client/.env` |

#### 25.4 The Five Files You Must Understand Deeply

These five files are the backbone of the entire system. Understanding them fully means understanding the architecture.

**1. `server/src/app.ts`**
Where all middleware and route files are assembled. Read this to understand what runs on every request and which route file handles which URL prefix.

**2. `server/src/middleware/verifyToken.middleware.ts`**
The identity layer. Every protected route runs through this. It is short — read it completely and understand every line before studying any route file.

**3. `server/src/routes/order.routes.ts`**
The most complex file. It handles the entire order lifecycle. If you can read and fully understand this one file, you can understand any route file.

**4. `client/src/context/AuthContext.tsx`**
How the frontend knows who is logged in. Every page that shows user-specific data reads from this context. It also shows how the session is restored on page refresh (`GET /auth/me`).

**5. `client/src/main.tsx`**
Where Axios is configured globally. This is where the auth token is automatically attached to every request. Without understanding this file, the "how does the server know who I am" question seems magical.

#### 25.5 Reading a Route File for the First Time

Every route file in `server/src/routes/` follows the same structure:

1. **Auto-migration block at the top** — ALTER TABLE statements in try/catch blocks that safely add new columns when the server starts. These run once on startup. If the column already exists, MySQL throws and the catch block silently ignores it.
2. **Router definition** — `const router = Router()`
3. **Individual route handlers** — each one is `router.METHOD('/path', ...middleware, async (req, res) => { ... })`
4. **Export** — `export default router`

When reading a handler, always identify:
- What middleware runs (identity check? role check? file upload?)
- What comes from `req.params` (URL segments like `:id`)
- What comes from `req.body` (JSON payload from the browser)
- What comes from `req.user` (decoded JWT — station_id, role, user id)
- What SQL queries run and what they return
- What notification is created, if any
- What the response sends back

#### 25.6 Reading a Page Component for the First Time

Every page component in `client/src/pages/` follows this structure:

1. **State declarations** — `useState` calls at the top define all the data the page holds
2. **Data fetching** — `useEffect` with an empty `[]` dependency array fetches data when the page loads
3. **Event handlers** — functions that call the server (usually `axios.post/put/delete(...)`)
4. **JSX return** — the visual layout: what is shown based on the current state
5. **Sub-components** — modals and other complex pieces are often defined as inner components or inline JSX near the bottom

When reading, follow the data: where does it come from (the `useEffect` fetch), how does it change (the handlers), and where does it appear on screen (the JSX).

---

### 26. Feature Deep-Dives: Recent Additions Explained

This section documents features added during active development that are not yet covered in the main feature sections above. Reading these helps you understand why certain patterns are in the code.

#### 26.1 Per-Item Return Requests

**What it does:** When a customer submits a return request for an order that contains multiple products, they can select which specific items (and how many) they want to return, rather than returning the entire order.

**Why it was built this way:** Customers may want to return a defective container but keep the water jugs from the same order. The system needed to handle partial returns without requiring a schema redesign.

**How it works:**

*Database:* Two columns were added to `order_returns` via auto-migration:
- `return_items_json` (TEXT) — stores a JSON array of the selected items: `[{ product_name, quantity, price, subtotal }]`
- `refund_amount` (DECIMAL) — the calculated total for the returned items

*Customer side* (`client/src/pages/customer/CustomerOrder.tsx`):
The `ReturnModal` shows a checklist of all items in the order. Each item has a checkbox and a quantity input (up to the ordered quantity). The customer selects what to return and submits. The browser calculates and displays the estimated refund before submission.

*Server side* (`server/src/routes/customer.routes.ts`, `POST /orders/:id/return`):
The server receives `{ reason, items }`. It calculates the refund amount from the items array, stores both `return_items_json` and `refund_amount` in the `order_returns` row.

*Admin side* (`client/src/pages/admin/AdminCustomerOrder.tsx`):
The admin's `ReturnModal` parses `return_items_json` and displays the specific items the customer wants to return, along with the refund amount. On approve, the server deducts the `refund_amount` from the order's `total_amount`.

**Stock behavior:** Stock is NOT restored when a return is approved. The assumption is that returned items are defective or unusable. If they need to be restocked, the admin does a manual restock through the inventory management page.

#### 26.2 Per-Item Order Cancellation

**What it does:** Customers can cancel specific items from a multi-item order rather than cancelling the entire order.

**Why it was built this way:** A customer who ordered two types of products may need to cancel one type if it goes out of stock, while keeping the rest of the order.

**How it works:**

*Customer side:* The `CancelModal` works exactly like the `ReturnModal` — checkboxes and quantity selectors for each item.

*Server side* (`server/src/routes/customer.routes.ts`, `PUT /orders/:id/cancel`):

The server receives `{ reason, items }`. For each selected item:
1. Inventory is restored for that product
2. The `order_item` row quantity is reduced (or the row is deleted if the full quantity is cancelled)
3. The `total_amount` on the order is reduced by the cancelled subtotal

**Partial vs full cancellation:**
- If the cancelled items represent the entire order → `order_status = CANCELLED`
- If some items remain → the order stays at `CONFIRMED` with the reduced total, and the remaining items continue through the normal workflow

#### 26.3 Self-Fetching Modals (Mobile Fix)

**The problem:** On slow mobile connections, when a customer tapped "Cancel Order" or "Return Order," the modal opened before the order's item list had been loaded by the parent page. This left the checklist empty.

**The fix:** Both `CancelModal` and `ReturnModal` are now self-sufficient. Each modal contains a `useEffect` that fires when `selections.length === 0` (meaning: the parent did not pass pre-loaded items). It fetches the order data directly from `GET /customer/orders/:id` and builds the checklist from the response.

```typescript
useEffect(() => {
    if (selections.length > 0) return   // Items already loaded, skip
    setLoadingItems(true)
    axios.get(`${API}/customer/orders/${order.order_id}`, { withCredentials: true })
        .then(res => {
            const items = res.data.items ?? []
            setSelections(items.map(item => ({ ...item, selected: true, cancelQty: item.quantity })))
        })
        .catch(() => {})
        .finally(() => setLoadingItems(false))
}, [order.order_id, selections.length])
```

While fetching, a "Loading items..." spinner is shown. Once loaded, the checklist appears. This pattern makes modals reliable regardless of how quickly the parent page loaded its data.

#### 26.4 Auto-Migration Pattern

**What it does:** New database columns are added automatically when the server starts, without requiring manual SQL commands.

**Why it was designed this way:** Running `ALTER TABLE` manually on a cloud database during deployment is error-prone and requires SSH access or a database client. Auto-migration removes this step entirely.

**How it works:** At the top of `server/src/routes/order.routes.ts`, there is a startup block:

```typescript
const migrations = [
    `ALTER TABLE order_returns ADD COLUMN return_items_json TEXT NULL`,
    `ALTER TABLE order_returns ADD COLUMN refund_amount DECIMAL(10,2) NULL DEFAULT 0`,
]
for (const sql of migrations) {
    try { await pool.query(sql) } catch (_) { /* column already exists — safe to ignore */ }
}
```

Each `ALTER TABLE` either succeeds (column did not exist, now it does) or fails with "Duplicate column name" (column already exists). Both outcomes are correct — the catch block silences the expected error.

This pattern is safe to run on every server start. It is not a replacement for a proper migration tool (like Flyway or Liquibase) at scale, but it eliminates manual deployment steps for small schema additions.

#### 26.5 COD/COP Payment Status Flow

**The rule:** Cash on Delivery and Cash on Pickup orders start with `payment_status = PENDING` (the money has not been collected yet). When an admin marks the order as `DELIVERED`, the server automatically sets `payment_status = VERIFIED`.

**Why:** The payment status should reflect the real-world state. For online orders with GCash, the customer sends money upfront and the admin verifies the receipt. For cash orders, the money is only collected when it physically changes hands — on delivery.

**Where in the code:** `server/src/routes/order.routes.ts`, inside the `PUT /orders/:id/status` handler. When `newStatus === ORDER_STATUS.DELIVERED`:

```typescript
// Auto-verify cash payments on delivery
if ([PAYMENT_MODE.COD, PAYMENT_MODE.COP].includes(order.payment_mode)) {
    await pool.query(
        'UPDATE payments SET payment_status = ? WHERE order_id = ?',
        [PAYMENT_STATUS.VERIFIED, id]
    )
}
```

GCash payments require a separate manual verification step because the admin must visually inspect the receipt image.

#### 26.6 Toast Notification System

**What it is:** Small popup messages that appear briefly to confirm an action or report an error. Examples: "Order cancelled successfully," "Payment verified."

**Design decisions:**
- Background: pure white (`bg-white`)
- Shadow: `shadow-md` to float above the content
- Text: dark navy blue (`text-[#0d2a4a]`) — matches the brand color
- No colored borders — the original design had colored borders per status (green for success, red for error) which was removed for a cleaner, consistent look

**Where in the code:** Each page that shows toasts defines a `showToast` function and a `toast` state object:

```typescript
const [toast, setToast] = useState<{ message: string } | null>(null)
const showToast = (message: string) => {
    setToast({ message })
    setTimeout(() => setToast(null), 3000)
}
```

The toast is conditionally rendered in the JSX:
```tsx
{toast && (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-md rounded-xl px-6 py-3 text-[#0d2a4a] text-sm font-medium z-50">
        {toast.message}
    </div>
)}
```

#### 26.7 Inventory Status Modal on Admin Dashboard

**What it does:** A modal accessible from the admin dashboard header that shows the real-time stock levels for every product at the station. Items below `min_stock_level` are highlighted in red.

**Why:** Admins need to see inventory status without navigating away from the dashboard. A modal keeps the context (current sales data) visible.

**How it works:**
- A button in the dashboard header opens the modal via `showInventory` state
- The modal fetches from `GET /inventory` when it opens
- Products are sorted: critically low items first (quantity below min_stock_level), then by quantity ascending
- Each product shows a colored progress bar: red (critical), amber (low), emerald (ok)
- A summary card shows total active products, total quantity, and low stock count
- A refresh button lets the admin reload without closing the modal

**Where in the code:** `client/src/pages/admin/AdminDashboard.tsx` — the `InventoryModal` component and the `showInventory` state variable.
