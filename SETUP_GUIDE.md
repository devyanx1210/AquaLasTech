# AquaLasTech — Complete Team Setup Guide

> This guide covers everything from zero — exporting the database, forking the repo, installing the project, and running it. Follow every step in order.

---

## Part 1 — For the Database Owner (Ian)

> Only the person who has the working database needs to do Part 1. Everyone else skips to Part 2.

#### Step 1 — Export the Database from phpMyAdmin

1. Open your browser and go to `http://localhost/phpmyadmin`
2. On the left sidebar, click the database named **`aqualastech`**
3. Click the **Export** tab at the top

   ![export tab is at the top navigation bar]

4. Under **Export method**, select **Custom**

5. In the **Tables** section, make sure all tables are selected (they should be by default)

6. Scroll down to **Output** — make sure it says:
   - Format: **SQL**
   - Compression: **None**

7. Scroll down to **Object creation options** and check ALL of the following:
   - ✅ Add DROP TABLE / VIEW / PROCEDURE / FUNCTION / EVENT / TRIGGER statement
   - ✅ Add CREATE DATABASE / USE statement
   - ✅ Add IF NOT EXISTS (safer for re-importing)

8. Scroll down to **Data creation options** and make sure:
   - ✅ INSERT INTO is selected (not REPLACE or UPDATE)

9. Click the **Export** button at the bottom

10. A file called `aqualastech.sql` will be downloaded to your computer

11. **Copy that `aqualastech.sql` file into the `server/src/` folder of the project**

12. Rename it to `aqualastech_schema.sql` so the guide refers to it consistently

13. Commit and push it:

```bash
git add server/src/aqualastech_schema.sql
git commit -m "Add database schema export"
git push origin aqualastech
```

> Now every team member has the database file inside the repo and can import it themselves.

---

## Part 2 — For Every Team Member

> Start here. Do every step in order.

---

#### Step 1 — Install Required Software

Download and install all three of these before doing anything else.

##### Node.js (v20 or higher)

1. Go to https://nodejs.org
2. Download the **LTS** version (the left button)
3. Run the installer — click Next on everything, keep all defaults
4. When done, open a terminal and run: `node -v`
5. It should print something like `v20.x.x`

##### MySQL (via XAMPP — easiest for beginners)

1. Go to https://www.apachefriends.org
2. Download **XAMPP for Windows**
3. Run the installer — during component selection make sure **MySQL** and **phpMyAdmin** are checked
4. Install it (default path is `C:\xampp`)
5. Open **XAMPP Control Panel** (search for it in Start menu)
6. Click **Start** next to **MySQL**
7. The status should turn green

> If you already have standalone MySQL installed, you can skip XAMPP. Just make sure MySQL is running.

##### Git

1. Go to https://git-scm.com/download/win
2. Download and run the installer
3. Click Next on everything — keep all defaults
4. When done, open a terminal and run: `git --version`
5. It should print `git version 2.x.x`

##### Verify everything is installed

Open a terminal (Command Prompt or PowerShell) and run all four:

```bash
node -v
npm -v
git --version
mysql --version
```

All four must return a version number. If any say "not recognized" or "command not found", that tool is not installed correctly.

---

#### Step 2 — Fork the Repository on GitHub

1. Go to the AquaLasTech repository on GitHub (Ian will share the link)
2. Click the **Fork** button at the top right of the page
3. Under "Owner", select **your own GitHub account**
4. Click **Create fork**
5. You now have your own copy of the repo at `https://github.com/YOUR-USERNAME/repo-name`

---

#### Step 3 — Clone YOUR Fork to Your Computer

Open a terminal. Navigate to the folder where you want to put the project. For example:

```bash
cd Documents
```

Then clone:

```bash
git clone https://github.com/YOUR-USERNAME/AquaLasTech.git
cd AquaLasTech
```

Replace `YOUR-USERNAME` with your actual GitHub username.

---

#### Step 4 — Connect to the Original Repository (Upstream)

This lets you pull updates from Ian's repo later.

```bash
git remote add upstream https://github.com/devyanx1210/AquaLasTech.git
```

Replace `IANS-USERNAME` with Ian's actual GitHub username.

Verify it was added:

```bash
git remote -v
```

You should see two remotes:

```
origin    https://github.com/YOUR-USERNAME/AquaLasTech.git (fetch)
origin    https://github.com/YOUR-USERNAME/AquaLasTech.git (push)
upstream  https://github.com/devyanx1210/AquaLasTech.git (fetch)
upstream  https://github.com/devyanx1210/AquaLasTech.git (push)
```

---

#### Step 5 — Checkout the Project Branch

```bash
git fetch upstream
git checkout -b final upstream/final
```

> **Important:** The flag is `-b` (create a new branch). Do NOT use `-D` which deletes a branch.

Confirm you are on the correct branch:

```bash
git branch
```

The output should show `* final` with an asterisk next to it.

---

#### Step 6 — Set Up the Database

##### 6a — Open phpMyAdmin

1. Open **XAMPP Control Panel**
2. Make sure **MySQL** is running (green status)
3. Click **Admin** next to MySQL — this opens phpMyAdmin in your browser
4. Or go to `http://localhost/phpmyadmin` directly

##### 6b — Create the database

1. In phpMyAdmin, click **New** on the left sidebar
2. In the "Database name" field, type: `aqualastech`
3. Set the collation to: `utf8mb4_general_ci`
4. Click **Create**

##### 6c — Import the schema

1. Click on **`aqualastech`** in the left sidebar to select it
2. Click the **Import** tab at the top
3. Click **Choose File**
4. Navigate to your project folder → `server/src/` → select `aqualastech_schema.sql`
5. Scroll down and click **Import**
6. Wait for it to finish — you should see a green success message

##### 6d — Verify the import

On the left sidebar, click the arrow next to `aqualastech` to expand it. You should see tables including:

- `users`
- `stations`
- `orders`
- `order_items`
- `inventory`
- `inventory_transactions`
- `products`
- `notifications`
- `payments`
- `pos_transactions`
- `system_logs`

If `notifications` is missing, run this manually. Click the **SQL** tab in phpMyAdmin and paste:

```sql
CREATE TABLE IF NOT EXISTS notifications (
    notification_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    message           VARCHAR(500) NOT NULL,
    notification_type TINYINT DEFAULT 1,
    is_read           TINYINT(1) DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

Click **Go**.

---

#### Step 7 — Create the Server Environment File

Open the project in **VS Code** (or any text editor).

Inside the `server/` folder, create a new file named exactly: `.env`

> In VS Code: right-click the `server` folder → New File → type `.env` → Enter

Paste this content into it:

```env
PORT=8080
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=aqualastech
JWT_KEY=aqualastech_secret_key_2024
CLIENT_URL=http://localhost:5173
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_FROM=AquaLasTech <your_gmail@gmail.com>
```

**Fill in your values:**

| Variable | What to put |
| --- | --- |
| `DB_PASSWORD` | Your MySQL root password. If using XAMPP default, leave it **empty**: `DB_PASSWORD=` |
| `DB_USER` | `root` for XAMPP default |
| `JWT_KEY` | Must be the **same string** across all team members. Ask Ian for the exact value. |
| `CLIENT_URL` | Leave as `http://localhost:5173` — do not change this |
| `MAIL_USER` | A Gmail address (can be any team member's Gmail) |
| `MAIL_PASS` | Gmail **App Password** — NOT your regular Gmail password. See below. |

##### How to get a Gmail App Password:

1. Go to your Google Account → https://myaccount.google.com
2. Click **Security** on the left
3. Under "How you sign in to Google", click **2-Step Verification** (enable it if not on)
4. Scroll to the bottom → click **App passwords**
5. Select app: **Mail** → Select device: **Windows Computer**
6. Click **Generate**
7. Copy the 16-character password shown and paste it as `MAIL_PASS`

---

#### Step 8 — Create the Client Environment File

Inside the `client/` folder, create a new file named exactly: `.env`

Paste:

```env
VITE_API_URL=http://localhost:8080
VITE_FB_PAGE_URL=https://www.facebook.com/
VITE_CONTACT_EMAIL=aqualastech@gmail.com
VITE_CONTACT_PHONE=09000000000
```

Do not change `VITE_API_URL`. It must point to `http://localhost:8080`.

---

#### Step 9 — Install Project Dependencies

Open a terminal inside the `AquaLasTech` folder.

##### Install server dependencies:

```bash
cd server
npm install
```

Wait until it finishes. You will see a `node_modules` folder appear inside `server/`.

##### Install client dependencies:

```bash
cd ../client
npm install
```

Wait until it finishes. You will see a `node_modules` folder appear inside `client/`.

---

#### Step 10 — Run the Application

You need **two terminal windows** open at the same time.

##### Terminal 1 — Run the server:

```bash
cd server
npm run dev
```

Wait until you see:

```
Server running on port 8080
```

If you see any errors here, check the Troubleshooting section at the bottom.

##### Terminal 2 — Run the client:

Open a second terminal window, then:

```bash
cd client
npm run dev
```

Wait until you see:

```
  VITE v7.x.x  ready

  ➜  Local:   http://localhost:5173/
```

> **The port must say 5173.** If it says 5174, there is already something using port 5173. See the Troubleshooting section.

---

#### Step 11 — Open the Application

Open your browser and go to:

```
http://localhost:5173
```

You should see the AquaLasTech landing page with the logo and Order Water Now button.

---

#### Step 12 — Create the First Admin Account

The database starts empty — no accounts exist yet. You must create the first one using the command line.

##### To create a Station + Super Admin (do this first):

Make sure the server is running (Terminal 1), then open a **third terminal**:

```bash
cd server
npm run station:create
```

It will ask you questions one by one. Fill in:
- Station name
- Station address
- Station contact number
- GPS coordinates (you can enter 0 for now)
- Super admin full name
- Super admin email
- Super admin password

After it finishes, go to `http://localhost:5173/login` and log in with the super admin email and password you just entered.

##### To create a System Admin:

```bash
cd server
npm run admin:create
```

Follow the prompts.

---

## Part 3 — Getting Updates From the Team

When Ian or a teammate pushes new code, pull it into your local copy:

```bash
git fetch upstream
git merge upstream/final
```

If there are conflicts, VS Code will highlight them. Resolve them and then:

```bash
git add .
git commit -m "Merge upstream changes"
```

After pulling, always reinstall dependencies in case `package.json` changed:

```bash
cd server && npm install
cd ../client && npm install
```

Then restart both terminals.

---

## Troubleshooting

#### "Server error" on the login or signup page

This is a CORS or connection issue. Check in order:

1. Is the server running in Terminal 1? It must show `Server running on port 8080`
2. Is the client running on port **5173** (not 5174)?
3. Does `client/.env` have `VITE_API_URL=http://localhost:8080`?
4. Does `server/.env` have `CLIENT_URL=http://localhost:5173`?
5. Restart both terminals after any `.env` change

#### Notifications not showing / notification error

The `notifications` table may be missing from the import. Go to phpMyAdmin → select `aqualastech` → SQL tab → paste and run:

```sql
CREATE TABLE IF NOT EXISTS notifications (
    notification_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    message           VARCHAR(500) NOT NULL,
    notification_type TINYINT DEFAULT 1,
    is_read           TINYINT(1) DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

Then restart the server.

#### Client running on port 5174 instead of 5173

Something else is already using port 5173. Find and kill it:

```bash
netstat -ano | findstr :5173
```

Look at the last column (the PID number), then:

```bash
taskkill /PID 1234 /F
```

Replace `1234` with the actual PID. Then restart the client.

#### "Access denied for user root" in the server terminal

Your MySQL password in `server/.env` is wrong.

- If using XAMPP, the default root password is **empty** — set `DB_PASSWORD=`
- If you set a password during MySQL installation, use that

#### "Cannot find module" error in server terminal

Run:

```bash
cd server
npm install
```

Then restart.

#### The page loads but shows a blank white screen

Open your browser, press **F12**, go to the **Console** tab. The error message there will tell you exactly what is wrong.

#### phpMyAdmin import failed / tables are missing

The SQL file may have had an error. Try:

1. Go to phpMyAdmin → click `aqualastech` → Operations tab → Delete the database
2. Create it again (Step 6b)
3. Re-import (Step 6c) making sure you selected the correct `.sql` file

---

## Quick Reference — Daily Startup

Every day when you want to work on the project:

```bash
# Pull latest code first
git fetch upstream
git merge upstream/final

# Terminal 1 — start server
cd server
npm run dev

# Terminal 2 — start client
cd client
npm run dev

# Open browser
# http://localhost:5173
```

---

*The `.env` files are never committed to Git — they are in `.gitignore`. Every team member must create their own `server/.env` and `client/.env` manually following Steps 7 and 8 of this guide.*
