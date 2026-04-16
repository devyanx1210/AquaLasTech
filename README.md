
# AquaLasTech — System Documentation

A Web-based Order and Inventory Management System for Water Refilling Stations

Developed by Ramnify Development Team


## Table of Contents

1. Project Overview
2. System Architecture
3. Technology Stack
4. Core System Logic
5. Database Design
6. Authentication and Authorization
7. Deployment Setup
8. Environment Variables
9. Developer Operations and Maintenance
10. Team


## 1. Project Overview

AquaLasTech is a full-stack web application designed to modernize the operations of water refilling station businesses. It provides an integrated platform for customers to browse stations and place orders, for station staff to manage inventory and process transactions, and for system administrators to oversee the entire network of stations.

The system supports multiple stations, each managed independently by a super admin, who may also assign regular admin staff under their station. Customers interact with the platform through a mobile-friendly interface accessible via any web browser.


## Completed Enhancements

The following features were implemented as part of the system's final improvements:

**Secure Password Hashing**
Passwords are hashed using SHA-256 on the client before being sent over the network, so plain-text credentials are never visible in browser developer tools. The server applies an additional bcrypt hash on top for secure storage.

**Persistent Customer Session**
Customers who have previously logged in are automatically redirected to their dashboard when they reopen the app, without needing to log in again. This is achieved through localStorage token persistence combined with an HTTP-only cookie. Admin and staff roles are excluded from this behavior for security — they must log in again after closing the browser.

**Station Payment Tracking**
The System Admin panel now includes a Payments page where platform-level administrators can record and monitor software subscription payments from registered water stations. Supports monthly, annual, and one-time payment plans with status tracking (Active, Pending, Overdue, Expired) and a total active revenue summary.


## 2. System Architecture

AquaLasTech follows a separated full-stack architecture where the frontend, backend, and database are independent services that communicate over HTTPS.

The frontend is a Single Page Application (SPA) built with React. It runs entirely in the browser and communicates with the backend through a RESTful API. The backend is a Node.js and Express server that handles all business logic, authentication, file storage coordination, and database operations. The database is a cloud-hosted MySQL instance on Aiven. File uploads (product images, station images, avatars, receipts) are stored on Cloudinary rather than the server filesystem, ensuring persistence across server restarts and redeployments.

In production, the frontend is hosted on Vercel and the backend is hosted on Render. Both services connect to the Aiven MySQL database.


## 3. Technology Stack

**Backend**
- Runtime: Node.js with TypeScript
- Framework: Express.js
- Database: MySQL via mysql2 driver
- Authentication: JSON Web Token (JWT) with cookie and Authorization header support
- File Storage: Cloudinary via multer-storage-cloudinary
- Email: Nodemailer
- Security: Helmet, CORS, bcrypt, express-rate-limit

**Frontend**
- Framework: React with TypeScript
- Build Tool: Vite
- Styling: TailwindCSS
- HTTP Client: Axios with request interceptor
- Routing: React Router v6
- Icons: Lucide React, React Icons


## 4. Core System Logic

**User Roles**

The system defines four user roles stored as TINYINT values in the database.

- Customer (1): Can browse stations, place orders, track order status, and submit GCash payment receipts.
- Admin (2): A station staff account created by a super admin. Can access Inventory, Orders, and Point of Sale for their assigned station. Cannot access the dashboard analytics or settings.
- Super Admin (3): The station owner account. Has full access to all modules including the admin dashboard, sales reports, station settings, and staff management.
- System Admin (4): Platform-level administrator with access to the sysadmin panel for managing all stations and super admin accounts.

**Order Flow**

When a customer places an order, the system determines the initial payment status based on the payment method selected.

For GCash payments, the order is created with a payment status of Pending. The order status is set to Confirmed. On the customer side, a pending GCash order is displayed with a Pending status label until the admin verifies the payment. Only pending orders can be cancelled by the customer.

For Cash on Delivery and Cash on Pickup, the payment is immediately marked as Verified since no digital proof is required. The order is created as Confirmed and the customer cannot cancel it.

Once an admin verifies a GCash payment, the order status progresses through Preparing, Out for Delivery, and finally Delivered. Admins can cancel or mark returns at any stage, but customers can only cancel during the Pending state.

**Inventory Tracking**

Each product is assigned to a station and has a quantity tracked in the inventory table. When an order is placed or a POS transaction is completed, the inventory quantity is decremented via an inventory transaction record. Restock operations add quantity and are also logged. A minimum stock level threshold triggers low-stock alerts visible in the admin dashboard.

**Notification System**

Notifications are separated by type to avoid cross-contamination between customer-facing and admin-facing messages.

- Type 1 (Order Update): Sent to customers when their order status changes.
- Type 2 (Payment Update): Sent to customers when their payment is verified or rejected.
- Type 3 (Inventory Alert): Sent to admins when stock falls below the minimum threshold.
- Type 4 (System Message): Sent to admins for order events such as new orders, cancellations, and returns.

The customer notification feed polls for types 1 and 2 only. The admin notification feed polls for types 3 and 4 only. This ensures admins never see customer-facing messages and vice versa.

**Image Storage**

All uploaded images are stored on Cloudinary and referenced in the database by their full HTTPS URL. The frontend detects whether an image path starts with http and renders it directly without prefixing the API URL. This applies to product images, station images, QR codes, profile avatars, and payment receipt images.


## 5. Database Design

The database follows Third Normal Form (3NF) relational modeling. All relationships are maintained through foreign keys.

**Core Tables**

- users: Stores all user accounts with role, credentials, and profile data.
- admins: Links admin and super admin users to their assigned station.
- customers: Stores customer-specific data such as address and geolocation.
- stations: Each water refilling station with its name, address, coordinates, image, and GCash QR code.
- products: Product catalog entries per station with pricing, unit, and image.
- inventory: Current stock quantity per product per station with minimum stock threshold.
- inventory_transactions: Audit log of all stock changes (restock, deduction, adjustment).
- orders: Customer orders with status, payment mode, and total amount.
- order_items: Individual line items within an order, capturing price at the time of sale.
- payments: Payment records linked to orders with proof image and verification status.
- pos_transactions: Walk-in counter transactions processed through the Point of Sale module.
- notifications: In-app notifications by type, targeted to specific users.
- system_logs: Audit log for login/logout and admin actions.
- password_reset_tokens: Temporary tokens for password recovery via email.
- station_subscriptions: Tracks software subscription and payment records per station, managed by the System Admin. Supports monthly, annual, and one-time payment plans with status tracking (Active, Pending, Overdue, Expired).

**Database SQL File**

The full database schema is located at server/src/aqualastech.sql. This file contains all CREATE TABLE statements and can be used to initialize the database on a new environment.


## 6. Authentication and Authorization

**Password Hashing**

Passwords are hashed on the client side using SHA-256 (via the Web Crypto API) before being sent over the network. The server then applies bcrypt hashing on top of the SHA-256 hash before storing it in the database. This means the plain-text password is never visible in the network tab of browser developer tools. The server compares incoming SHA-256 hashed passwords against the stored bcrypt(SHA-256) hash using bcrypt.compare.

**Token Storage and iOS Compatibility**

The system uses JWT-based authentication. Upon login, the server signs a token with the user ID, role, and station ID, then returns it in both an HTTP-only cookie (for standard browsers) and in the response body.

Apple's Intelligent Tracking Prevention (ITP) blocks cross-site cookies on iOS Safari and Chrome, including during an active session. To handle this, the client stores the token in browser storage as a fallback and attaches it as an Authorization: Bearer header on every request via a global Axios interceptor registered in main.tsx.

Storage behavior differs by role to balance security and convenience:

- Customer: Token is stored in localStorage, which persists across sessions. Customers who close and reopen the app are automatically redirected to their dashboard without needing to log in again.
- Admin, Super Admin, System Admin: Token is stored in sessionStorage, which is cleared when the browser or tab is closed. These roles must log in again after closing the app, ensuring sensitive station operations are protected.

On application startup, the AuthContext calls the /auth/me endpoint to verify the session and refresh the stored token.

The verifyToken middleware on the server accepts the token from either the cookie or the Authorization header, whichever is present.

Protected routes on the frontend use a ProtectedRoute component that waits for the authentication check to complete before rendering. Unauthenticated users are redirected to the login page. Role-based redirects ensure each role lands on their appropriate starting page after login.


## 7. Deployment Setup

This section describes the complete process for deploying the system from scratch. The stack consists of Vercel (frontend), Render (backend), Aiven (database), and Cloudinary (file storage).

**Step 1: Set Up the Aiven MySQL Database**

1. Create a free account at aiven.io.
2. Create a new MySQL service. Select the free tier and a nearby region.
3. Once the service is running, note the following connection details from the service overview: Host, Port, User (avnadmin), Password, and Database name (defaultdb).
4. Import the database schema using a MySQL client such as TablePlus or MySQL Workbench. Connect using the Aiven credentials with SSL enabled. Run the SQL schema file to create all tables.
5. Note: Aiven enforces ssl_require_primary_key. Ensure all CREATE TABLE statements include a PRIMARY KEY definition inline, not via a separate ALTER TABLE statement.

**Step 2: Set Up Cloudinary**

1. Create a free account at cloudinary.com.
2. From the dashboard, note the Cloud Name, API Key, and API Secret.
3. These values will be added as environment variables on Render.

**Step 3: Deploy the Backend on Render**

1. Create an account at render.com and connect your GitHub account.
2. Create a new Web Service and select the repository.
3. Configure the service with the following settings:
   - Root Directory: server
   - Build Command: npm install and npm run build (or configure as a shell command: npm install && npm run build)
   - Start Command: npm start
   - Environment: Node
4. Add the following environment variables in Render's Environment tab:

   NODE_ENV = production
   PORT = 8080
   DB_HOST = (Aiven host)
   DB_PORT = (Aiven port)
   DB_USER = avnadmin
   DB_PASSWORD = (Aiven password)
   DB_NAME = defaultdb
   DB_SSL = true
   JWT_KEY = (a secure random string)
   CLIENT_URL = (your Vercel frontend URL, added after Vercel deployment)
   CLOUDINARY_CLOUD_NAME = (from Cloudinary dashboard)
   CLOUDINARY_API_KEY = (from Cloudinary dashboard)
   CLOUDINARY_API_SECRET = (from Cloudinary dashboard)
   MAIL_USER = (Gmail address for sending emails)
   MAIL_PASS = (Gmail App Password)

5. Save and deploy. Wait for the build to complete and show a green Live status.
6. Copy the Render service URL (e.g. https://yourapp.onrender.com) for use in the next step.

**Step 4: Deploy the Frontend on Vercel**

1. Create an account at vercel.com and connect your GitHub account.
2. Import the repository and set the Root Directory to client.
3. Vercel will auto-detect Vite. Leave the build and output settings as detected.
4. Add the following environment variables in Vercel's Environment Variables settings:

   VITE_API_URL = (your Render backend URL)
   VITE_FB_PAGE_URL = (your Facebook page URL)

5. Deploy. Vercel will build and publish the frontend.
6. Copy the Vercel deployment URL (e.g. https://yourapp.vercel.app).

**Step 5: Link Frontend and Backend**

1. Go back to Render and update the CLIENT_URL environment variable to your Vercel URL.
2. Trigger a manual redeploy on Render so the CORS configuration picks up the new URL.

**Step 6: Migrate Existing Images to Cloudinary**

If migrating from a local development environment with existing images in the server/uploads folder, run the migration script to upload all existing images to Cloudinary and update the database with the new URLs.

Run the following from the server directory, replacing the values with your actual credentials:

   DB_HOST=... DB_PORT=... DB_USER=avnadmin DB_PASSWORD=... DB_NAME=defaultdb DB_SSL=true CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... npm run migrate:images

This script uploads all product images, station images, QR codes, user avatars, and payment receipts to Cloudinary and updates each database record with the new Cloudinary URL.

**Step 7: Create Initial Accounts**

Run the following scripts from the server directory to create the first system admin and super admin accounts:

   npm run admin:create

Follow the interactive prompts to set up credentials. Station creation can be done through:

   npm run station:create


## 8. Environment Variables

**Server (server/.env)**

Variable | Description
---------|------------
PORT | Port the Express server listens on (default 8080)
NODE_ENV | Set to production for deployment. Controls cookie SameSite policy and security settings.
DB_HOST | MySQL database host
DB_PORT | MySQL database port
DB_USER | MySQL username
DB_PASSWORD | MySQL password
DB_NAME | MySQL database name
DB_SSL | Set to true to enable SSL for the database connection (required for Aiven)
JWT_KEY | Secret key for signing and verifying JWT tokens. Use a long random string.
CLIENT_URL | The frontend URL allowed by CORS. Must match the Vercel deployment URL exactly with no trailing slash.
CLOUDINARY_CLOUD_NAME | Cloudinary account cloud name
CLOUDINARY_API_KEY | Cloudinary API key
CLOUDINARY_API_SECRET | Cloudinary API secret
MAIL_USER | Gmail address used to send system emails
MAIL_PASS | Gmail App Password (not the account password)
MAIL_FROM | Display name and email for outgoing mail

**Client (client/.env)**

Variable | Description
---------|------------
VITE_API_URL | Full URL of the backend API (e.g. https://yourapp.onrender.com)
VITE_FB_PAGE_URL | URL of the Facebook page linked on the landing page


## 9. Developer Operations and Maintenance

**Making and Pushing Code Updates**

The project uses a git-based workflow. The main deployment branch is final. Vercel and Render are both connected to this branch and will auto-deploy when new commits are pushed.

The standard workflow for making changes is:

1. Make code changes locally.
2. Test the changes on the local development server.
3. Stage the changed files: git add (specific files)
4. Commit with a descriptive message: git commit -m "description of change"
5. Push to the deployment branch: git push origin final
6. Vercel will auto-deploy the frontend within 1 to 2 minutes.
7. Render will auto-detect the push and start a new backend build. This typically takes 2 to 4 minutes.

To check deployment status, go to the Vercel dashboard for frontend deployments and the Render dashboard for backend deployments. Each should show a green Live or Deploy successful status.

**Running the System Locally**

To run the system on a local machine:

Start the backend server:

   cd server
   npm install
   npm run dev

Start the frontend development server:

   cd client
   npm install
   npm run dev

The frontend will be available at http://localhost:5173 and will proxy API requests to http://localhost:8080.

Ensure the server/.env file has the correct local database credentials and the client/.env file has VITE_API_URL set to http://localhost:8080.

**Render Free Tier Behavior**

Render's free tier automatically spins down the backend service after 15 minutes of inactivity. When a user makes the first request after a period of inactivity, the server takes approximately 30 to 50 seconds to wake up. Subsequent requests respond normally. To prevent this, upgrade to a paid Render plan which keeps the service running continuously.

**Adding a New Station**

New stations are created by running the station creation script from the server directory:

   cd server
   npm run station:create

Follow the prompts to enter the station name, address, and contact details. After creating the station, log into the system admin panel to assign a super admin account to the station.

**Creating and Managing Admin Accounts**

Admin and super admin accounts are created through interactive scripts:

   cd server
   npm run admin:create

To manage existing admin accounts (reset passwords, deactivate, reassign):

   cd server
   npm run admin:manage

**Updating Environment Variables on Render or Vercel**

Environment variable changes on Render take effect on the next deployment. After updating a variable, click Manual Deploy in the Render dashboard and select Deploy latest commit. On Vercel, environment variable changes trigger an automatic redeploy.

**Database Migrations**

Schema changes should be applied directly to the Aiven database using a MySQL client such as TablePlus or MySQL Workbench. Connect using the Aiven SSL credentials and run ALTER TABLE or CREATE TABLE statements as needed.

Always back up the database before applying destructive schema changes.

**Cloudinary Image Uploads**

All new image uploads through the application (product images, station logos, QR codes, profile pictures, payment receipts) are automatically uploaded to Cloudinary through the server's multer-storage-cloudinary integration. The Cloudinary URL is stored in the database. No manual file management is required for new uploads.

If existing local images need to be migrated to Cloudinary, use the migration script described in the Deployment Setup section.

**Monitoring and Logs**

Render provides real-time logs for the backend service. Access them by navigating to your Render service and clicking the Logs tab. This is the primary place to diagnose server-side errors, database connection issues, or failed API requests.

Vercel provides deployment logs and function logs under the Deployments section of your project dashboard.


## 10. Team

**Ramnify Development Team**

Role | Name
-----|-----
Project Manager and System Architect | Mark Levi Arellano Roldan
Full Stack Developer | Noel Christian L. Soberano
UI/UX Designer and Quality Assurance | Rose Ann Paras
Frontend and DevOps | Fam Manahan
