# Possible Technical Panel Questions and Answers

These are technical questions about the system architecture, technology choices, and implementation decisions. Business workflow questions are not included here.

---

## Technology Stack

**1. Why did you use Node.js with Express instead of other backend frameworks like Django or Laravel?**

Node.js uses JavaScript, which is the same language the frontend uses. This means the team only needs to know one language for both the server and the browser. Express is minimal and unopinionated, which gives full control over how the server is structured without unnecessary conventions being imposed. It is also well-suited for REST APIs, which is exactly what this system needs.

---

**2. Why TypeScript instead of plain JavaScript?**

TypeScript adds static type checking on top of JavaScript. If a function expects a number and a string is passed instead, TypeScript catches this before the code even runs. In a system with many interconnected parts — orders, inventory, payments, notifications — this prevents a large class of runtime bugs that would otherwise only appear in production. Both the client and server use TypeScript, so the same type definitions can be reasoned about consistently across the full stack.

---

**3. Why React for the frontend instead of Vue or Angular?**

React has the largest ecosystem, the most community support, and the most available packages for the specific tools used here such as React Router, Axios integration, and Leaflet map bindings. Its component model fits the structure of this app well — the order list, product cards, modals, and sidebar are all naturally separate components. React's unidirectional data flow also makes state management easier to reason about compared to two-way binding frameworks.

---

**4. Why Vite instead of Create React App?**

Create React App is no longer actively maintained. Vite is significantly faster for both local development (hot module replacement is near-instant) and production builds. It also has first-class TypeScript support out of the box without additional configuration.

---

**5. Why MySQL instead of MongoDB or PostgreSQL?**

The data in this system is highly relational. Orders link to users, users link to stations, orders link to payments, order items link to products, and products link to inventory. MySQL handles these relationships natively through foreign keys and JOIN queries, and enforces data integrity through constraints. A document database like MongoDB would require handling these relationships manually in application code, which introduces more places for bugs. PostgreSQL was a valid alternative but MySQL was chosen because of XAMPP familiarity for local development and broad hosting support.

---

**6. Why TailwindCSS instead of plain CSS or a component library like Material UI?**

TailwindCSS utility classes allow styles to be written directly in the component file, eliminating the need to switch between HTML and CSS files. This speeds up development and makes it immediately clear what styles apply to each element. Unlike component libraries, Tailwind does not impose design opinions, so the UI can be fully custom. The tradeoff is longer class name strings in the JSX, which is acceptable given the development speed gained.

---

**7. Why Axios instead of the native fetch API?**

Axios supports interceptors, which is the key feature used in this system. An interceptor is a function that runs before every request automatically. The Axios interceptor in `main.tsx` reads the JWT from localStorage and attaches it to every outgoing request as an Authorization header. Implementing the same with the native fetch API requires wrapping every single request call manually. Axios also automatically parses JSON responses and handles errors more predictably than fetch.

---

**8. Why was the frontend deployed to Vercel and the backend to Render separately instead of one server?**

Separating them follows the standard practice of deploying static assets and server processes independently. Vercel is a CDN-backed static host optimized for frontend frameworks — it serves the React app from edge nodes globally, making it fast for any device. Render is a container-based host for long-running server processes. Putting both on the same server would mean every code change to the frontend triggers a full server restart, and the server would need to handle both static file serving and API processing, which is unnecessarily complex.

---

**9. Why Aiven for the database instead of running MySQL locally or on Render?**

Aiven provides a managed cloud MySQL instance with automated backups, SSL encryption, and high availability. Render's free tier does not support persistent disk storage — any files saved to the server are deleted when it restarts. Running a database on Render is therefore not viable. Aiven's free tier provides enough storage and connections for a system of this scale.

---

**10. Why Cloudinary for image storage instead of saving images to the server disk?**

Render's free tier uses an ephemeral file system — any file saved to the server's disk is permanently deleted when the server restarts or redeploys. Cloudinary is a cloud image hosting service that stores images permanently and returns a public URL. The server streams uploaded files directly to Cloudinary without saving anything locally, then stores only the URL in the database. The browser loads images directly from Cloudinary, which also reduces server load.

---

## Authentication and Security

**11. Why JWT instead of session-based authentication?**

Session-based authentication requires the server to store session data in memory or a database and look it up on every request. JWT is stateless — the token contains all the necessary information (user ID, role, station ID) and is verified by checking the cryptographic signature. The server does not need to store anything. This is simpler to implement, works better with a separate frontend and backend on different domains, and scales horizontally without shared session storage.

---

**12. Why is the JWT sent both as a cookie and in the response body?**

iOS Safari implements Intelligent Tracking Prevention, which blocks cross-site cookies in certain scenarios. If only a cookie was used, logged-in iOS users would be sent back to the login page on every refresh because Safari silently blocked the cookie. Sending the token in the response body as well allows the frontend to save it to localStorage and attach it via the Authorization header on every request, which iOS does not block. The cookie serves desktop browsers; the header serves iOS.

---

**13. Why bcrypt for password hashing and not SHA256 or MD5?**

MD5 and SHA256 are general-purpose hashing algorithms designed to be fast. Fast hashing is dangerous for passwords because it means an attacker who obtains the database can test billions of guesses per second. Bcrypt is deliberately slow and includes a salt automatically. The salt rounds parameter (set to 10 in this system) means the algorithm runs 1,024 iterations internally, making brute-force attacks computationally expensive. Bcrypt is the industry standard specifically for password storage.

---

**14. How does the system prevent one station's admin from seeing another station's data?**

Three-layer enforcement. First, the frontend route guards prevent unauthorized pages from rendering. Second, backend middleware rejects requests from users with the wrong role. Third, every database query that returns station-specific data includes `WHERE station_id = ?` where the station ID comes from the JWT payload, not from the request parameters. Even if someone crafted a raw HTTP request to the API, the query would only return data belonging to their station.

---

**15. What prevents a customer from sending a fake station_id when placing an order?**

The station_id sent by the customer in the order body is used to look up products and deduct inventory. The products and inventory queries are scoped to that station_id. If a customer sends a fake station_id that does not match any real station, the product lookup returns no rows and the inventory check fails, preventing the order from being created. The server does not trust the client — it validates all inputs against the database before proceeding.

---

## Architecture and Design

**16. Why is the codebase structured as a monorepo with separate client and server folders?**

A monorepo keeps both projects in one repository, which simplifies version control — a single commit can change both the frontend and backend together. It also makes it easier for the team to see the full picture of the system. The client and server remain completely independent in terms of their dependencies and deployment, but the shared repository makes coordination simpler.

---

**17. Why are numeric codes stored for status fields instead of strings?**

Storing the string `"confirmed"` in a database row takes 9 bytes. Storing the number `1` using a TINYINT takes 1 byte. Across thousands of orders with multiple status fields each, this difference compounds. TINYINT columns are also faster to index and filter than VARCHAR columns. The server converts the number to a human-readable string before sending data to the frontend, so the user always sees text labels, never raw numbers.

---

**18. What is a connection pool and why is one used instead of a single connection?**

A connection pool is a set of database connections kept open and ready to be reused. Opening a new database connection for every incoming HTTP request involves a TCP handshake, authentication, and session setup — this takes 10-50 milliseconds each time. A pool keeps several connections open and hands one out instantly when a query needs to run, then returns it to the pool when finished. MySQL2's `createPool()` handles this automatically. Without a pool, the server would be noticeably slower under concurrent load.

---

**19. Why does the system use polling instead of WebSockets for real-time updates?**

WebSockets require a persistent bidirectional connection between the browser and server. Render's free tier uses container instances that can be restarted at any time, and maintaining persistent connections across restarts requires additional infrastructure. Polling at 5-second intervals is simpler to implement, requires no server-side changes, and is sufficient for the update frequency this system needs. For a water station management system, a 5-second delay between an order being placed and an admin seeing it is acceptable. WebSockets would be the right choice if sub-second latency were required.

---

**20. Why is soft delete used for orders instead of hard delete?**

When an admin deletes orders from the history view, the data must still be counted in sales reports and revenue calculations. Permanently deleting rows would corrupt the financial history. Soft delete sets a `hidden_at` timestamp on the row. The order list query filters out rows where `hidden_at` is not null, so the admin does not see them. The reports queries do not filter by `hidden_at`, so deleted orders still count toward all totals. The financial record is never altered by a display cleanup action.

---

**21. How does the system handle race conditions when multiple customers order the same low-stock item simultaneously?**

The inventory deduction inside `POST /customer/orders` uses a database transaction with row locking. When the stock check runs, it uses `SELECT ... FOR UPDATE` which locks that inventory row until the transaction completes. If two requests arrive at the same moment, one waits for the other's transaction to finish before it can read the stock. If the first order depletes the stock, the second order's stock check returns zero and the order is rejected. The transaction is atomic — if any step fails, all changes are rolled back.

---

**22. Why is the price snapshot stored in order_items instead of looking up the current product price?**

Product prices can change over time. If an order stored only the product ID and quantity, looking up the price later would return the current price, not the price at the time of ordering. This would make historical revenue calculations wrong. The `price_snapshot` column in `order_items` captures the exact price at the moment the order was placed. Past orders always reflect what the customer actually paid, regardless of subsequent price changes.

---

**23. What is middleware and how is it used in this system?**

Middleware is a function that runs on every incoming request before the route handler executes. In Express, middleware is registered with `app.use()`. This system uses several middleware layers: `express.json()` parses the request body, `cookieParser()` reads cookies, `helmet()` adds security headers, `cors()` enforces allowed origins, `verifyToken` checks the JWT and rejects unauthenticated requests, and `requireSuperAdmin` blocks non-admin access to restricted routes. Middleware enables these cross-cutting concerns to be defined once and applied consistently across all routes without repeating the logic in every handler.

---

**24. How does the system prevent SQL injection?**

All database queries use parameterized queries through MySQL2. Instead of building SQL strings by concatenating user input directly, the query uses `?` placeholders and passes values as a separate array. MySQL2 escapes the values before substituting them into the query. This means user input can never be interpreted as SQL syntax. For example, `db.query('SELECT * FROM users WHERE email = ?', [email])` is safe regardless of what the user submits as their email.

---

**25. Why does the system have four roles instead of just admin and customer?**

The four roles reflect real-world responsibilities in a water station franchise. A customer interacts with the ordering interface only. Staff handles daily operations but should not configure the station or see financial reports. The Store Owner needs full operational access plus financial visibility and station configuration. The System Admin manages the entire platform across all stations and should not be able to interfere with individual station operations. Collapsing these into two roles would either give too much access to operational staff or too little access to the platform operator.

---

**26. How does the system handle the case where a GCash payment is rejected?**

When an admin marks a GCash payment as rejected, the server does the following atomically: updates the payment status to rejected, updates the order status to cancelled, loops through all items in the order and restores their quantities to inventory, and sends a notification to the customer explaining that the payment was rejected and the order was cancelled. This is handled entirely server-side in `PUT /orders/:id/payment`. The customer does not need to take any action — the cancellation and stock restore happen automatically.

---

**27. Why are environment variables used instead of hardcoding credentials in the code?**

Hardcoded credentials in source code become permanently part of the git history. Even if they are removed in a later commit, anyone with access to the repository can see them by reading old commits. Environment variables keep sensitive values completely out of the codebase. The `.env` file is listed in `.gitignore` so it is never committed. On the hosting platforms, environment variables are set through the dashboard and injected into the running process. This also makes it easy to use different values for development and production without changing any code.
