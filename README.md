<p align="center">
  <img src="./client/public/assets/aqualastech-logo.png" width="180"/>
</p>

<h1 align="center">AquaLasTech</h1>
<p align="center">
A Web-based Order and Inventory Management System
</p>

<p align="center">
  <img src="./client/public/assets/team-logo.png" width="90"/>
</p>
<h3 align="center">Ramnify</h3>

---

## 🌊 About AquaLasTech

A modern water refilling station management platform designed to automate business operations including ordering, inventory tracking, POS transactions, payment verification, and sales reporting.

The system provides an integrated solution for customers, station administrators, and operational staff.

---

## 🏗️ System Architecture

The system follows a **separated full-stack architecture**:

### Backend Layer
- Node.js + Express  
- TypeScript  
- MySQL Database  
- JWT Authentication  
- RESTful API Design  

### Frontend Layer
- React + Vite  
- TypeScript  
- TailwindCSS  
- Axios HTTP Client  

---

## ⚡ Core Features

### 👤 Authentication & Authorization
- User registration and login  
- Role-based access control  
- Station-scoped administration  

### 🛒 Customer Ordering System
- Station browsing  
- Product catalog  
- Shopping cart management  
- Checkout processing  
- Order tracking  

### 🏪 Station Management Module
- Inventory monitoring  
- Stock restocking  
- POS transaction processing  
- Payment verification workflow  

### 📊 Reporting System
- Daily, weekly, monthly, and yearly sales analytics  

---

## 🧠 Database Design Philosophy

The system follows **Third Normal Form (3NF)** relational modeling.

Primary Entities:

- Users  
- Stations  
- Products  
- Orders  
- Order Items  
- Inventory  
- Payments  
- POS Transactions  
- Notifications  
- Reports Snapshot  

Key Principles:

- Maintain referential integrity  
- Avoid data duplication  
- Use normalized relational structures  
- Implement audit-friendly transaction tracking  

---

## 🛠️ Technology Stack

### Backend
- Node.js  
- Express.js  
- TypeScript  
- MySQL  
- JSON Web Token (JWT)  
- CORS Middleware  

### Frontend
- React  
- Vite  
- TypeScript  
- TailwindCSS  
- Axios  

---

## 📂 Project Structure

aqulastech/
│
├── server/ → Backend API Source Code
├── client/ → Frontend Application
├── database/ → SQL Schema / ERD Scripts
└── README.md


---

## 🚀 Installation Guide

### Backend Setup

```bash
cd server
npm install
npm run dev

🔐 Environment Configuration

Create .env files inside:

server/

client/

⚠️ Never commit sensitive credentials or secrets.
```

📌 Development Status

🟢 Active Development Phase

💡 Design Principles
- Referential database integrity
- Modular backend services
- Role-based authorization
- Input validation before persistence
- Clean separation of business logic and routing layers

⭐ Future Enhancements
- Chatbot

👥 Development Team – Ramnify

Project Manager / System Architect:
Mark Levi Arellano Roldan

<div align="center">

### Full Stack Developer  
**Noel Christian L. Soberano**

### UI/UX Designer & Quality Assurance  
**Rose Ann Paras**

### Frontend / DevOps  
**Fam Manahan**

<br>

<p>Made with Love by Ramnify Development Team ❤️</p>

</div>
