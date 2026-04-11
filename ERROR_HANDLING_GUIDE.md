# Error Handling Guide: When the Panel Breaks the System

This guide tells you exactly where to look and what to do when something breaks during or after a panel session. Follow the steps in order — do not skip ahead.

---

## The First 10 Seconds

When something breaks, ask two questions immediately:

1. What exactly happened? (white screen, button did nothing, data wrong, app froze)
2. Is it the frontend or the backend? (can you still see the page, or is it completely blank?)

This tells you where to start looking.

---

## Where to See Errors

### 1. Browser DevTools — Frontend errors

Press **F12** on any browser. Three tabs matter:

**Console tab**
This is where JavaScript and React errors print. Look for red text. It will usually say the file name and line number where it crashed.

```
Uncaught TypeError: Cannot read properties of undefined (reading 'map')
    at AdminCustomerOrder.tsx:892
```

That tells you exactly which file and line to open.

**Network tab**
Filter by `Fetch/XHR`. This shows every API request the browser made. A red request means it failed. Click it, go to the **Response** tab — the server's error message is right there.

```json
{ "message": "No station assigned" }
```

Also check the **Status** column:

| Status | Meaning |
| :--- | :--- |
| 200 | Success |
| 400 | Bad request — wrong data sent |
| 401 | Not logged in or token expired |
| 403 | Logged in but not allowed |
| 404 | Route does not exist |
| 500 | Server crashed — check Render logs |

**Application tab**
Go to Storage → Local Storage → your app URL. Check if `authToken` exists. If it is missing, the user is not logged in and every protected request will return 401.

---

### 2. Render Dashboard — Backend (Server) errors

Go to [render.com](https://render.com) → your service → **Logs** tab.

This is where every server crash prints. When a 500 error happens, the full error and stack trace appears here. This is the single most important place to look for backend bugs.

The log shows real-time output. You can see requests coming in and errors as they happen.

Example of what a server crash looks like in Render logs:

```
GET /orders 500
TypeError: Cannot read properties of null (reading 'order_id')
    at /app/src/routes/order.routes.ts:142
```

---

### 3. Aiven — Database issues

Log into [aiven.io](https://aiven.io) → your MySQL service → **Query** tab.

Use this when data looks wrong or is missing. Run the SQL directly to confirm whether the data is actually in the database or whether the insert never happened.

```sql
-- Check if a specific order exists
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Check stock levels
SELECT p.product_name, i.quantity, i.min_stock_level
FROM inventory i JOIN products p ON p.product_id = i.product_id
WHERE i.station_id = 3;

-- Check if notifications were created
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

---

## The Debugging Loop

Go through this in order. Do not skip steps.

```
Step 1: Reproduce the exact error
         — what did the panel click? what were they doing?

Step 2: Open F12 → Console
         — any red error? read it, note the file and line number

Step 3: Open F12 → Network
         — find the red/failed request
         — click it → Response tab → read the error message
         — note the status code (401, 403, 404, 500)

Step 4: If status is 500 → go to Render Logs
         — find the crash message and stack trace
         — it tells you which file and which line on the server

Step 5: If data is wrong or missing → run SQL on Aiven
         — check if the row exists in the database
         — check if the insert/update actually ran

Step 6: Fix the one specific thing the error points to
         — do not change unrelated code
         — test the exact same action again

Step 7: If fixed → git add, commit, push to final and main
```

---

## Common Errors and Exact Fixes

### White screen, nothing loads

**Check:** F12 → Console → red error

Most common cause: a React component tried to call `.map()` or access a property on something that is `null` or `undefined`. The console will show the file and line. Add a null check:

```typescript
// Before (crashes if orders is null)
orders.map(o => ...)

// After (safe)
(orders ?? []).map(o => ...)
```

---

### "Unauthorized" on every request (401)

**Check:** F12 → Application → Local Storage → look for `authToken`

If missing: the user needs to log in again. The token expired or was cleared.

If present: paste the token value at [jwt.io](https://jwt.io) and check the `exp` field. If it is in the past, the token is expired. Log out and back in.

---

### Order placed but not showing in admin list

**Check in order:**
1. Is the admin on the **Active** tab? New orders only show there.
2. Is any filter active? Clear all filters and search.
3. F12 → Network → click the `GET /orders` request → check the station_id in the request matches the station the customer ordered from.
4. If all fine: Render logs → look for errors on `GET /orders`.

---

### Stock did not deduct after an order

**Check:** Aiven → run:

```sql
SELECT quantity FROM inventory WHERE product_id = ? AND station_id = ?;
```

If quantity did not change: the order transaction failed and rolled back. Check Render logs for the error during `POST /customer/orders`.

---

### Image not loading (profile, QR, product photo)

**Check:** F12 → Network → click the broken image request → check the URL. It should start with `https://res.cloudinary.com`. If it is a relative path like `/uploads/...`, the Cloudinary upload failed and the file was saved to the wrong location. Check Render logs for the upload error.

---

### App works locally but broken on Vercel

**Check:** Vercel Dashboard → your project → **Settings → Environment Variables**. All `VITE_` variables must be set. If you add or change one, you must **redeploy** — Vite bakes them into the bundle at build time, so changing them in the dashboard has no effect until the next build.

To force a fresh redeploy without a code change:

```bash
git commit --allow-empty -m "force redeploy"
git push origin final:main
```

---

### CORS error in the browser console

```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Check:** Render → your service → Environment Variables → `CLIENT_URL`. It must exactly match the Vercel URL of the frontend including `https://` and without a trailing slash.

---

### Render server is not responding (first request takes 30-50 seconds)

The free tier spins down after 15 minutes of inactivity. The first request wakes it up. This is normal behavior, not a bug. Wake the server up 5 minutes before the demo by opening the app and logging in.

---

## During a Live Panel Session

Keep these three tabs open at all times:

| Tab | URL |
| :--- | :--- |
| The live app | Your Vercel URL |
| Render logs | render.com → service → Logs |
| Browser DevTools | F12 (always open) |

When something breaks:
1. Do not close or refresh the page immediately — read the console first.
2. Screenshot the error message before doing anything.
3. Check the Network tab for the failed request and its response.
4. If it is a 500, go to Render logs.
5. Fix, push, wait for Vercel/Render to redeploy (usually 1-2 minutes).

---

## Git Recovery Commands

**See all recent commits:**
```bash
git log --oneline
```

**See exactly what changed in a specific commit:**
```bash
git show abc1234
```

**Restore one file to how it was in a past commit:**
```bash
git checkout abc1234 -- client/src/pages/admin/AdminCustomerOrder.tsx
```

**Undo the last commit but keep the changes:**
```bash
git reset --soft HEAD~1
```

**Discard all local changes and go back to last commit:**
```bash
git reset --hard HEAD
```

**Go back to a specific commit completely (nuclear option):**
```bash
git reset --hard abc1234
git push origin final --force
git push origin final:main --force
```

> Only use `--force` if the deployment is completely broken and you need to roll back. Confirm with the team before running this.

---

## Which File Controls What

| Something is wrong with... | Open this file |
| :--- | :--- |
| A page not loading or routing | `client/src/routes/router.tsx` |
| Admin order list | `client/src/pages/admin/AdminCustomerOrder.tsx` |
| Inventory page | `client/src/pages/admin/AdminInventory.tsx` |
| Dashboard / reports | `client/src/pages/admin/AdminDashboard.tsx` |
| Point of Sale | `client/src/pages/admin/PointOfSale.tsx` |
| Customer ordering flow | `client/src/pages/customer/CustomerOrder.tsx` |
| Login / logout | `client/src/pages/LoginPage.tsx` + `server/src/routes/auth.routes.ts` |
| Order status updates | `server/src/routes/order.routes.ts` |
| Customer placing an order | `server/src/routes/customer.routes.ts` |
| Inventory stock changes | `server/src/routes/inventory.routes.ts` |
| Notifications | `server/src/routes/order.routes.ts` (search: INSERT INTO notifications) |
| POS transactions | `server/src/routes/pos.routes.ts` |
| Settings / station config | `server/src/routes/settings.routes.ts` |
| Role access / who can do what | `server/src/middleware/role.middleware.ts` |
| Token verification | `server/src/middleware/verifyToken.middleware.ts` |
| Database connection | `server/src/config/db.ts` |
| Image uploads | `server/src/config/cloudinary.ts` |
