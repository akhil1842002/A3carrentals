# 🚗 A3 Car Rentals — Complete Car Rental & Fleet Management System

A full-stack, enterprise-grade Car Rental & Fleet Management Platform featuring a modern Customer Web Portal, a comprehensive Executive Admin Dashboard, and a robust Express.js REST API.

---

## 🌟 Key Features

### 👤 Customer Portal (`/frontend/user`)
* **Seamless Authentication:**
  * ⚡ **Google One-Tap / 1-Click Sign In** for instant frictionless booking.
  * 🔐 **Manual Registration with 6-Digit Email OTP** verification to prevent fake accounts.
  * 🔑 **Email-Only Password Recovery** via secure time-limited OTP tokens.
* **Vehicle Discovery & Booking:**
  * Real-time car inventory browsing with category filters, transmission, fuel type, and seat capacity.
  * Interactive booking modal with automatic daily rate calculations, security deposit handling, and pickup/return date validations.
  * Multiple payment preferences: **Cash on Pickup**, **Direct UPI**, **Bank Transfer**, and **WhatsApp Confirmation**.
* **Customer Dashboard:**
  * View active reservations, past trip history, download invoices, and manage profile settings.

### 🛡️ Admin Management Suite (`/frontend/admin`)
* **Executive Overview:**
  * Real-time revenue metrics, booking conversion rate, fleet utilization, and quick action shortcuts.
* **Fleet Management:**
  * Add, edit, and organize rental vehicles with multi-image support, specifications, and maintenance statuses.
  * Automated background vehicle status synchronization based on active rental schedules.
* **Bookings & Trip Workflow:**
  * Full reservation lifecycle management: *Pending → Confirmed → Driver Assigned → Ongoing → Completed / Cancelled*.
  * Pre-rental and post-rental inspection reports (odometer reading, fuel level checks, scratch/damage tracking).
  * Security deposit management with deduction ledger and refund tracking.
* **Driver & Operations Dispatch:**
  * Assign verified drivers to specific client bookings with one click.
* **System Settings & Configuration:**
  * Master control for rental pricing tiers, tax rates, business details, and contact numbers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Node.js, Express.js, MongoDB (Mongoose), JWT Auth, Nodemailer (SMTP), Fast2SMS / Twilio |
| **User Frontend** | React 18, Vite, React Router, React Icons, CSS3 Modern Design System |
| **Admin Frontend** | React 18, Vite, Lucide React, Modern Executive Dashboard Components |
| **Database** | MongoDB (Local & MongoDB Atlas Ready) |

---

## 🚀 Quick Start Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/) (running locally on port `27017` or MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/akhil1842002/A3carrentals.git
cd A3carrentals
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend` folder based on `.env.example`:
```bash
cd backend
cp .env.example .env
```
Update the keys in `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/carbook
JWT_SECRET=your_super_secret_jwt_key
WHATSAPP_NUMBER=919876543210

# Real Email OTP (Gmail App Password or SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_business_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="A3 Car Rentals" <noreply@a3carrentals.com>
```

### 3. Install & Run Backend
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### 4. Install & Run User Frontend
```bash
cd ../frontend/user
npm install
npm run dev
# User site runs on http://localhost:5175
```

### 5. Install & Run Admin Frontend
```bash
cd ../frontend/admin
npm install
npm run dev
# Admin portal runs on http://localhost:5174
```

---

## 📁 Project Architecture

```
A3carrentals/
├── backend/
│   ├── config/             # Database and server configs
│   ├── middleware/         # JWT and Admin authorization middlewares
│   ├── models/             # Mongoose schemas (Car, Booking, User, Driver, Settings)
│   ├── routes/             # RESTful Express routes
│   ├── services/           # OTP & Email dispatch services
│   └── server.js           # Main Express server entry point
├── frontend/
│   ├── user/               # Customer portal (React + Vite)
│   └── admin/              # Executive Admin portal (React + Vite)
├── .gitignore              # Git ignore rules protecting secrets & dependencies
└── README.md               # Project documentation
```

---

## 🔒 Security & Best Practices
* **No Leaked Secrets:** Environment files (`.env`) are strictly ignored in `.gitignore`.
* **Verified Accounts:** Prevents spam and bot accounts through 6-digit OTP verification.
* **Role-Based Access Control:** Strict JWT separation between regular users and administrative staff.

---

## 📄 License
This project is licensed under the MIT License.
