<style>
  p, li, td, th, blockquote { font-size: 10pt; }
  h3 { font-size: 15pt; }
  h4 { font-size: 13pt; }
  h5 { font-size: 11pt; }
  code, pre { font-size: 9pt; }
</style>

# Beginner Guide: Build a To-Do App with Plain HTML, CSS, and JavaScript

> This guide is written for people who know basic HTML, CSS, and JavaScript but have never used React, TypeScript, or any framework. Every concept is explained in plain language before the code is shown. You will build a working login system and task manager step by step.

---

## What You Will Build

A simple web app where users can:
- Create an account (sign up)
- Log in
- Add tasks
- Mark tasks as done
- Delete tasks
- Log out

**No React. No TypeScript. No complex tools.** Just plain HTML, CSS, JavaScript, and a Node.js server.

---

## How It Works (Big Picture)

```
Browser (HTML + CSS + JS files)
    ↕ sends requests using fetch()
Server (server.js — Node.js + Express)
    ↕ reads and writes data
Database (MySQL — stores users and tasks)
```

The browser never talks to the database directly. Everything goes through the server. The server checks who you are, decides if you are allowed, and talks to the database on your behalf.

---

## Project Structure

```
todo-simple/
├── server.js          ← The entire backend (one file)
├── package.json       ← Lists the tools the server needs
├── .env               ← Secret config values (passwords, keys)
└── public/            ← HTML files the browser loads
    ├── signup.html    ← Create account page
    ├── login.html     ← Login page
    └── tasks.html     ← Main tasks page (protected)
```

Everything runs from one command. The server also serves the HTML files, so you only need one terminal window and one URL.

---

## Part 1: Setup

### Step 1 — Install Node.js

Node.js lets JavaScript run on a server (outside the browser).

1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS** version
3. Install it with all default settings
4. Confirm it works — open a terminal and type:
   ```bash
   node -v
   ```
   You should see something like `v20.11.0`

### Step 2 — Install XAMPP (for the database)

XAMPP gives you a MySQL database running on your own computer.

1. Go to [apachefriends.org](https://www.apachefriends.org)
2. Download and install XAMPP
3. Open the XAMPP Control Panel
4. Click **Start** next to **MySQL** — it turns green when running
5. Click **Admin** next to MySQL to open **phpMyAdmin** in your browser

### Step 3 — Create the Database

In phpMyAdmin, click the **SQL** tab at the top and paste this, then click **Go**:

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

This creates two tables:
- `users` — stores accounts (name, email, hashed password)
- `tasks` — stores tasks, each linked to a user

### Step 4 — Create the Project Folder

Open a terminal and run:

```bash
mkdir todo-simple
cd todo-simple
mkdir public
npm init -y
npm install express mysql2 bcrypt jsonwebtoken dotenv cookie-parser
```

What each package does:
| Package | What it does |
| :--- | :--- |
| express | The framework that handles incoming browser requests |
| mysql2 | Connects to the MySQL database and runs queries |
| bcrypt | Hashes passwords so the original is never stored |
| jsonwebtoken | Creates and verifies the identity token (JWT) |
| dotenv | Reads the `.env` file for secret config values |
| cookie-parser | Lets the server read cookies from the browser |

### Step 5 — Create the `.env` File

In the `todo-simple` folder, create a file called `.env` (no extension, just `.env`):

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=todo_app
JWT_KEY=replace_this_with_any_long_random_text_you_want
PORT=8080
```

> If you set a password for MySQL in phpMyAdmin, put it after `DB_PASSWORD=`. For a fresh XAMPP install, leave it empty.

> `JWT_KEY` can be any long random string. It is used to sign identity tokens. Keep it secret.

---

## Part 2: The Server (`server.js`)

Create a file called `server.js` in the `todo-simple` folder. This one file is the entire backend.

Read the comments carefully — every line is explained.

```javascript
// ─── LOAD TOOLS ──────────────────────────────────────────────────────────────
// These lines bring in the packages you installed with npm install.
// Think of them like importing tools from a toolbox.

const express = require('express')           // The web server framework
const mysql = require('mysql2/promise')      // Database connection tool
const bcrypt = require('bcrypt')             // Password hashing tool
const jwt = require('jsonwebtoken')          // Identity token tool
const cookieParser = require('cookie-parser') // Cookie reading tool
const path = require('path')                 // Built-in Node.js tool for file paths
require('dotenv').config()                   // Reads the .env file

// ─── CREATE THE EXPRESS APP ───────────────────────────────────────────────────
// This creates the server. Think of it as turning on the machine.
const app = express()

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
// Middleware is code that runs on EVERY request before it reaches your routes.
// These three lines set up how the server reads incoming data.

// This tells Express to read JSON data from request bodies.
// Without this, req.body would be empty when the browser sends form data.
app.use(express.json())

// This tells Express to read cookies that the browser sends.
// Without this, req.cookies would be empty.
app.use(cookieParser())

// This tells Express to serve files from the 'public' folder automatically.
// When the browser asks for /login.html, Express sends public/login.html.
// This is how one server can serve both the HTML files AND handle API requests.
app.use(express.static(path.join(__dirname, 'public')))

// ─── DATABASE CONNECTION ──────────────────────────────────────────────────────
// A connection pool keeps database connections open and reuses them.
// You just call db.query() whenever you need to read or write data.
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

// Read the JWT secret from .env
const JWT_KEY = process.env.JWT_KEY

// ─── HELPER: VERIFY TOKEN ─────────────────────────────────────────────────────
// This is a guard function. It runs before any protected route.
// It reads the JWT (identity token) from the cookie or the Authorization header.
// If the token is valid, it attaches the user info to req.user and continues.
// If the token is missing or invalid, it sends back "Not logged in" and stops.
function verifyToken(req, res, next) {
    // Check the cookie first, then check the Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]

    // If no token is found, the user is not logged in
    if (!token) return res.status(401).json({ message: 'Not logged in' })

    try {
        // jwt.verify checks that the token was signed by our server and has not expired
        // If it succeeds, it returns the payload: { id, name }
        req.user = jwt.verify(token, JWT_KEY)
        // next() means "continue to the actual route handler"
        next()
    } catch {
        // If verify throws, the token is invalid or expired
        res.status(401).json({ message: 'Session expired. Please log in again.' })
    }
}

// ─── ROUTE: SIGN UP ───────────────────────────────────────────────────────────
// The browser sends: POST /auth/signup
// With body: { full_name, email, password }
// The server creates a new user account.
app.post('/auth/signup', async (req, res) => {
    // req.body contains the data the browser sent
    const { full_name, email, password } = req.body

    // Check that all three fields were provided
    if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    try {
        // bcrypt.hash() converts the plain password into a scrambled string.
        // The number 10 means the algorithm runs 1024 times — more = harder to crack.
        // The original password is NEVER stored anywhere.
        const hash = await bcrypt.hash(password, 10)

        // Save the new user to the database.
        // The ? placeholders prevent SQL injection attacks.
        // Never build SQL strings by concatenating user input directly.
        await db.query(
            'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
            [full_name, email, hash]
        )

        // 201 means "Created" — a new resource was successfully created
        res.status(201).json({ message: 'Account created! You can now log in.' })

    } catch (err) {
        // If the email already exists, MySQL throws a duplicate key error
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'That email is already registered.' })
        }
        console.error(err)
        res.status(500).json({ message: 'Something went wrong. Try again.' })
    }
})

// ─── ROUTE: LOG IN ────────────────────────────────────────────────────────────
// The browser sends: POST /auth/login
// With body: { email, password }
// The server checks the credentials and returns an identity token.
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' })
    }

    try {
        // Look up the user by email
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])

        // If no user was found with that email
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        const user = rows[0]

        // bcrypt.compare() checks if the submitted password matches the stored hash.
        // It does this without ever reversing the hash — that is the whole point of hashing.
        const passwordMatches = await bcrypt.compare(password, user.password_hash)

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        // Create a JWT — a small signed text that proves who this user is.
        // It contains the user's ID and name. It expires after 7 days.
        // It is signed with JWT_KEY — any change to the token breaks the signature.
        const token = jwt.sign(
            { id: user.user_id, name: user.full_name },
            JWT_KEY,
            { expiresIn: '7d' }
        )

        // Send the token as a cookie (httpOnly = JavaScript cannot steal it)
        res.cookie('token', token, { httpOnly: true })

        // Also send the token in the response body so the browser can save it
        res.json({
            message: 'Logged in successfully',
            token,
            user: { id: user.user_id, name: user.full_name }
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Something went wrong. Try again.' })
    }
})

// ─── ROUTE: LOG OUT ───────────────────────────────────────────────────────────
// The browser sends: POST /auth/logout
// The server clears the cookie. The browser will also delete the token it saved.
app.post('/auth/logout', (req, res) => {
    res.clearCookie('token')
    res.json({ message: 'Logged out' })
})

// ─── ROUTE: GET ALL TASKS ─────────────────────────────────────────────────────
// The browser sends: GET /tasks
// verifyToken runs first — if not logged in, the request is rejected here.
// If logged in, req.user.id contains the user's ID from the token.
app.get('/tasks', verifyToken, async (req, res) => {
    try {
        // Only fetch tasks that belong to THIS user.
        // req.user.id comes from the verified JWT — the user cannot fake this.
        const [rows] = await db.query(
            'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        )
        res.json(rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Could not load tasks' })
    }
})

// ─── ROUTE: CREATE A TASK ─────────────────────────────────────────────────────
// The browser sends: POST /tasks
// With body: { title }
app.post('/tasks', verifyToken, async (req, res) => {
    const { title } = req.body

    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Task title is required' })
    }

    try {
        const [result] = await db.query(
            'INSERT INTO tasks (user_id, title) VALUES (?, ?)',
            [req.user.id, title.trim()]
        )
        res.status(201).json({ message: 'Task created', task_id: result.insertId })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Could not create task' })
    }
})

// ─── ROUTE: MARK TASK AS DONE OR UNDONE ──────────────────────────────────────
// The browser sends: PUT /tasks/5  (where 5 is the task_id)
// With body: { is_done: true } or { is_done: false }
app.put('/tasks/:id', verifyToken, async (req, res) => {
    const taskId = req.params.id      // The task ID from the URL
    const { is_done } = req.body      // true or false from the browser

    try {
        // The WHERE clause includes user_id = ? so a user can only update their own tasks.
        // Without this, any logged-in user could update anyone else's task.
        await db.query(
            'UPDATE tasks SET is_done = ? WHERE task_id = ? AND user_id = ?',
            [is_done ? 1 : 0, taskId, req.user.id]
        )
        res.json({ message: 'Task updated' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Could not update task' })
    }
})

// ─── ROUTE: DELETE A TASK ─────────────────────────────────────────────────────
// The browser sends: DELETE /tasks/5  (where 5 is the task_id)
app.delete('/tasks/:id', verifyToken, async (req, res) => {
    const taskId = req.params.id

    try {
        // Again: AND user_id = ? makes sure you can only delete your own tasks
        await db.query(
            'DELETE FROM tasks WHERE task_id = ? AND user_id = ?',
            [taskId, req.user.id]
        )
        res.json({ message: 'Task deleted' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Could not delete task' })
    }
})

// ─── START THE SERVER ─────────────────────────────────────────────────────────
// Tell Express to start listening for requests on port 8080.
// After this runs, open http://localhost:8080/login.html in your browser.
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`Server running! Open http://localhost:${PORT}/login.html`)
})
```

Add this to your `package.json` scripts section:

```json
"scripts": {
    "start": "node server.js"
}
```

---

## Part 3: The Frontend (Plain HTML Files)

These files go inside the `public` folder. The server sends them automatically when the browser asks for them.

### How the Frontend Talks to the Server

Instead of a library like Axios, we use the browser's built-in `fetch()` function. It works the same way — it sends a request to the server and gets a response back.

```javascript
// This is how you send data to the server from plain JavaScript:
const response = await fetch('/auth/login', {
    method: 'POST',                               // POST = sending data
    headers: { 'Content-Type': 'application/json' }, // Tell server it's JSON
    body: JSON.stringify({ email, password }),     // Convert object to text
    credentials: 'include'                         // Include cookies
})
const data = await response.json()                // Read the server's response
```

### `public/signup.html` — Create Account Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up</title>
    <style>
        /* Basic page reset and font */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: Arial, sans-serif;
            background: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        /* The white card in the center */
        .card {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }

        h2 { margin-bottom: 24px; color: #1a1a2e; }

        /* Each label + input pair */
        .field { margin-bottom: 16px; }
        label { display: block; margin-bottom: 6px; font-size: 14px; color: #555; }
        input {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
        }
        input:focus { border-color: #4f8ef7; }

        /* The submit button */
        button {
            width: 100%;
            padding: 12px;
            background: #4f8ef7;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            cursor: pointer;
            margin-top: 8px;
        }
        button:hover { background: #3a78e0; }

        /* Error and success messages */
        .message { margin-top: 16px; padding: 10px; border-radius: 8px; font-size: 14px; text-align: center; }
        .error { background: #fee2e2; color: #b91c1c; }
        .success { background: #dcfce7; color: #166534; }

        /* Link at the bottom */
        .footer { margin-top: 20px; text-align: center; font-size: 14px; color: #777; }
        .footer a { color: #4f8ef7; text-decoration: none; }
    </style>
</head>
<body>

<div class="card">
    <h2>Create Account</h2>

    <!-- The signup form -->
    <form id="signupForm">
        <div class="field">
            <label for="full_name">Full Name</label>
            <input type="text" id="full_name" placeholder="Juan dela Cruz" required>
        </div>
        <div class="field">
            <label for="email">Email Address</label>
            <input type="email" id="email" placeholder="juan@email.com" required>
        </div>
        <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="At least 6 characters" required>
        </div>
        <button type="submit">Sign Up</button>
    </form>

    <!-- This div shows messages to the user. It starts hidden (empty). -->
    <div id="message"></div>

    <div class="footer">
        Already have an account? <a href="/login.html">Log in</a>
    </div>
</div>

<script>
    // Get references to the form and message box
    const form = document.getElementById('signupForm')
    const messageBox = document.getElementById('message')

    // Listen for the form submit event
    form.addEventListener('submit', async function(e) {
        // e.preventDefault() stops the browser from reloading the page.
        // Without this, the form would do a full page reload the old HTML way.
        e.preventDefault()

        // Read the values the user typed into each input field
        const full_name = document.getElementById('full_name').value
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        // Show a loading state while waiting for the server
        messageBox.className = 'message'
        messageBox.textContent = 'Creating account...'

        try {
            // fetch() sends an HTTP request to the server.
            // '/auth/signup' goes to http://localhost:8080/auth/signup
            // because the HTML file is already being served from the same server.
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: {
                    // This tells the server the body is JSON, not a regular HTML form
                    'Content-Type': 'application/json'
                },
                // JSON.stringify converts the object into a text string the server can read
                body: JSON.stringify({ full_name, email, password }),
                // credentials: 'include' allows cookies to be sent and received
                credentials: 'include'
            })

            // response.json() reads the server's response and converts it from text to an object
            const data = await response.json()

            if (response.ok) {
                // response.ok is true when the status code is 200-299
                // Signup succeeded — show success and redirect to login after 1.5 seconds
                messageBox.className = 'message success'
                messageBox.textContent = data.message
                setTimeout(() => { window.location.href = '/login.html' }, 1500)
            } else {
                // Signup failed — show the error message from the server
                messageBox.className = 'message error'
                messageBox.textContent = data.message
            }

        } catch (err) {
            // This catches network errors (server is not running, no internet, etc.)
            messageBox.className = 'message error'
            messageBox.textContent = 'Could not connect to server. Is it running?'
        }
    })
</script>

</body>
</html>
```

---

### `public/login.html` — Log In Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log In</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: Arial, sans-serif;
            background: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .card {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        h2 { margin-bottom: 24px; color: #1a1a2e; }
        .field { margin-bottom: 16px; }
        label { display: block; margin-bottom: 6px; font-size: 14px; color: #555; }
        input {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
        }
        input:focus { border-color: #4f8ef7; }
        button {
            width: 100%;
            padding: 12px;
            background: #4f8ef7;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            cursor: pointer;
            margin-top: 8px;
        }
        button:hover { background: #3a78e0; }
        .message { margin-top: 16px; padding: 10px; border-radius: 8px; font-size: 14px; text-align: center; }
        .error { background: #fee2e2; color: #b91c1c; }
        .footer { margin-top: 20px; text-align: center; font-size: 14px; color: #777; }
        .footer a { color: #4f8ef7; text-decoration: none; }
    </style>
</head>
<body>

<div class="card">
    <h2>Log In</h2>

    <form id="loginForm">
        <div class="field">
            <label for="email">Email Address</label>
            <input type="email" id="email" placeholder="juan@email.com" required>
        </div>
        <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Your password" required>
        </div>
        <button type="submit">Log In</button>
    </form>

    <div id="message"></div>

    <div class="footer">
        No account yet? <a href="/signup.html">Sign up</a>
    </div>
</div>

<script>
    const form = document.getElementById('loginForm')
    const messageBox = document.getElementById('message')

    form.addEventListener('submit', async function(e) {
        e.preventDefault()

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        messageBox.className = 'message'
        messageBox.textContent = 'Logging in...'

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            })

            const data = await response.json()

            if (response.ok) {
                // Login succeeded!
                // Save the token to localStorage so the tasks page can use it.
                // localStorage stores data that survives browser refresh.
                localStorage.setItem('token', data.token)

                // Also save the user's name so we can display it on the tasks page
                localStorage.setItem('userName', data.user.name)

                // Redirect to the tasks page
                window.location.href = '/tasks.html'
            } else {
                messageBox.className = 'message error'
                messageBox.textContent = data.message
            }

        } catch (err) {
            messageBox.className = 'message error'
            messageBox.textContent = 'Could not connect to server. Is it running?'
        }
    })
</script>

</body>
</html>
```

---

### `public/tasks.html` — Main Tasks Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Tasks</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f0f2f5; min-height: 100vh; }

        /* Top navigation bar */
        .navbar {
            background: #1a1a2e;
            color: white;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .navbar span { font-size: 15px; }
        .logout-btn {
            background: transparent;
            color: #aaa;
            border: 1px solid #555;
            padding: 6px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
        }
        .logout-btn:hover { color: white; border-color: white; }

        /* Main content area */
        .container { max-width: 600px; margin: 40px auto; padding: 0 16px; }

        /* Add task form */
        .add-form {
            display: flex;
            gap: 10px;
            margin-bottom: 24px;
        }
        .add-form input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
        }
        .add-form input:focus { border-color: #4f8ef7; }
        .add-form button {
            padding: 12px 20px;
            background: #4f8ef7;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            white-space: nowrap;
        }
        .add-form button:hover { background: #3a78e0; }

        /* Each task card */
        .task {
            background: white;
            padding: 16px 20px;
            border-radius: 10px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 10px;
        }

        /* The checkbox */
        .task input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            flex-shrink: 0;
        }

        /* Task title — strikethrough when done */
        .task-title {
            flex: 1;
            font-size: 15px;
            color: #333;
        }
        .task-title.done {
            text-decoration: line-through;
            color: #aaa;
        }

        /* Delete button */
        .delete-btn {
            background: transparent;
            border: none;
            color: #ccc;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
        }
        .delete-btn:hover { color: #ef4444; background: #fee2e2; }

        /* Empty state message */
        .empty { text-align: center; color: #aaa; margin-top: 40px; font-size: 15px; }

        /* Loading state */
        .loading { text-align: center; color: #888; margin-top: 40px; }
    </style>
</head>
<body>

<!-- Navigation bar at the top -->
<div class="navbar">
    <strong>My Tasks</strong>
    <!-- The user's name will be inserted here by JavaScript -->
    <span id="welcomeText"></span>
    <button class="logout-btn" onclick="logout()">Log out</button>
</div>

<div class="container">

    <!-- Form to add a new task -->
    <form class="add-form" id="addForm">
        <input type="text" id="newTaskInput" placeholder="What do you need to do?" required>
        <button type="submit">Add Task</button>
    </form>

    <!-- The task list will be built here by JavaScript -->
    <div id="taskList">
        <div class="loading">Loading tasks...</div>
    </div>

</div>

<script>
    // ── ON PAGE LOAD ────────────────────────────────────────────────────────────
    // This runs as soon as the page loads.

    // Read the token and user name saved by login.html
    const token = localStorage.getItem('token')
    const userName = localStorage.getItem('userName')

    // If there is no token, this user is not logged in.
    // Redirect them to the login page immediately.
    if (!token) {
        window.location.href = '/login.html'
    }

    // Show the welcome message in the navbar
    if (userName) {
        document.getElementById('welcomeText').textContent = 'Hello, ' + userName
    }

    // Load the tasks from the server when the page first opens
    fetchTasks()

    // ── FETCH ALL TASKS ─────────────────────────────────────────────────────────
    // This function asks the server for all tasks belonging to the logged-in user.
    async function fetchTasks() {
        try {
            const response = await fetch('/tasks', {
                method: 'GET',
                headers: {
                    // Send the token in the Authorization header so the server knows who we are.
                    // The server's verifyToken function reads this header.
                    'Authorization': 'Bearer ' + token
                },
                credentials: 'include'
            })

            if (response.status === 401) {
                // 401 means "not logged in" or "token expired"
                // Clear saved data and send back to login
                localStorage.clear()
                window.location.href = '/login.html'
                return
            }

            const tasks = await response.json()

            // Build the task list HTML
            renderTasks(tasks)

        } catch (err) {
            document.getElementById('taskList').innerHTML =
                '<div class="empty">Could not load tasks. Is the server running?</div>'
        }
    }

    // ── RENDER TASKS ────────────────────────────────────────────────────────────
    // This function takes an array of tasks and turns them into HTML on the page.
    function renderTasks(tasks) {
        const listDiv = document.getElementById('taskList')

        // If there are no tasks, show a helpful empty state message
        if (tasks.length === 0) {
            listDiv.innerHTML = '<div class="empty">No tasks yet. Add one above!</div>'
            return
        }

        // Build HTML for each task
        // tasks.map() goes through every task and returns a piece of HTML for it.
        // .join('') combines all those pieces into one string.
        listDiv.innerHTML = tasks.map(task => `
            <div class="task" id="task-${task.task_id}">
                <input
                    type="checkbox"
                    ${task.is_done ? 'checked' : ''}
                    onchange="toggleTask(${task.task_id}, this.checked)"
                />
                <span class="task-title ${task.is_done ? 'done' : ''}">
                    ${escapeHtml(task.title)}
                </span>
                <button class="delete-btn" onclick="deleteTask(${task.task_id})" title="Delete">
                    ✕
                </button>
            </div>
        `).join('')
    }

    // ── ADD A TASK ──────────────────────────────────────────────────────────────
    document.getElementById('addForm').addEventListener('submit', async function(e) {
        e.preventDefault()

        const input = document.getElementById('newTaskInput')
        const title = input.value.trim()

        if (!title) return

        try {
            const response = await fetch('/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ title }),
                credentials: 'include'
            })

            if (response.ok) {
                // Clear the input field
                input.value = ''
                // Reload the task list to show the new task
                fetchTasks()
            }

        } catch (err) {
            alert('Could not add task. Try again.')
        }
    })

    // ── TOGGLE TASK DONE / UNDONE ───────────────────────────────────────────────
    // Called when the user clicks a checkbox.
    // taskId is the ID of the task. isDone is true (checked) or false (unchecked).
    async function toggleTask(taskId, isDone) {
        try {
            await fetch('/tasks/' + taskId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ is_done: isDone }),
                credentials: 'include'
            })
            // Reload to reflect the change
            fetchTasks()

        } catch (err) {
            alert('Could not update task. Try again.')
        }
    }

    // ── DELETE A TASK ───────────────────────────────────────────────────────────
    async function deleteTask(taskId) {
        // Ask the user to confirm before deleting
        if (!confirm('Delete this task?')) return

        try {
            await fetch('/tasks/' + taskId, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                credentials: 'include'
            })
            fetchTasks()

        } catch (err) {
            alert('Could not delete task. Try again.')
        }
    }

    // ── LOG OUT ─────────────────────────────────────────────────────────────────
    async function logout() {
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
        } catch (_) {}

        // Delete the saved token and name regardless of server response
        localStorage.clear()
        window.location.href = '/login.html'
    }

    // ── HELPER: ESCAPE HTML ─────────────────────────────────────────────────────
    // This prevents XSS attacks. If a task title contains HTML like <script>alert('hacked')</script>,
    // this function converts the < and > into safe text so they display as text, not run as code.
    function escapeHtml(text) {
        const div = document.createElement('div')
        div.appendChild(document.createTextNode(text))
        return div.innerHTML
    }
</script>

</body>
</html>
```

---

## Part 4: Run the App

Make sure MySQL is running in XAMPP, then open a terminal in your `todo-simple` folder and run:

```bash
node server.js
```

You should see:
```
Server running! Open http://localhost:8080/login.html
```

Open your browser and go to:
- `http://localhost:8080/signup.html` — create an account
- `http://localhost:8080/login.html` — log in
- `http://localhost:8080/tasks.html` — view your tasks (automatic after login)

---

## What to Learn Next

Once you are comfortable with this app, here is the path to understanding AquaLasTech:

| Step | What to Learn | Why |
| :--- | :--- | :--- |
| 1 | How `fetch()` works and what HTTP methods are | Every feature in AquaLasTech sends HTTP requests |
| 2 | JavaScript `async/await` and Promises | All server calls are asynchronous |
| 3 | How JWT tokens work | Identity and security in every route |
| 4 | What SQL SELECT, INSERT, UPDATE, DELETE do | Every route reads or writes the database |
| 5 | React basics (components, useState, useEffect) | AquaLasTech's frontend is built in React |
| 6 | TypeScript basics (types and interfaces) | AquaLasTech uses TypeScript on both sides |

The patterns in this simple app are **exactly the same patterns** in AquaLasTech — just with more features, more routes, and React instead of plain HTML. Once you can read and trace this app fully, you can read AquaLasTech.
