# Employee Leave Management System Backend

A production-ready REST API backend for an Employee Leave Management System built using Node.js, Express, and PostgreSQL (configured for Supabase). It features JWT authentication, role-based authorization, automated leave balance deductions, transaction rollback handling, file uploads, in-app notifications, and Swagger OpenAPI documentation.

---

## Technical Stack

- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase) accessed via standard connection pooling (`pg` package)
- **Authentication**: Custom JWT Middleware & bcrypt password hashing
- **Input Validation**: `express-validator` middleware
- **File Upload**: `multer` middleware (storing local uploads securely in the `/uploads` directory)
- **API Documentation**: Swagger (OpenAPI 3.0 via `swagger-ui-express` and `swagger-jsdoc`)
- **Security Headers & Compression**: `helmet`, `cors`, and `compression`

---

## Project Structure

This project strictly adheres to the Model-View-Controller (MVC) architectural pattern:

```text
├── src/
│   ├── config/
│   │   ├── db.js          # PostgreSQL Connection Pool configuration
│   │   └── swagger.js     # Swagger API Docs compiler configuration
│   ├── controllers/
│   │   ├── auth.controller.js          # User Registration and Login Controller
│   │   ├── employee.controller.js      # Profile, Leave apply, and Leave history Controller
│   │   ├── manager.controller.js       # Employee list and Leave updates Controller
│   │   └── notification.controller.js  # Fetching and marking in-app notifications read
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT Validation and Role Authorization guards
│   │   ├── error.middleware.js         # Centralized error handler (hides stack traces in production)
│   │   ├── upload.middleware.js        # Multer disk-storage rules for file uploads
│   │   └── validation.middleware.js    # Express-validation collector & file cleanup on errors
│   ├── models/
│   │   ├── user.model.js               # Database operations for users and profiles
│   │   ├── leave.model.js              # Database transactions for applying/updating leave requests
│   │   └── notification.model.js       # Notification querying and updating
│   ├── routes/
│   │   ├── auth.routes.js              # Authentication routing (/api/auth)
│   │   ├── employee.routes.js          # Employee routing (/api/employee)
│   │   ├── manager.routes.js           # Manager routing (/api/manager)
│   │   └── notification.routes.js      # Notifications routing (/api/notifications)
│   ├── validators/
│   │   ├── auth.validator.js           # Validation rules for login & register
│   │   └── leave.validator.js          # Validation rules for leave applications and updates
│   ├── app.js             # Express app setup and middleware registration
│   └── server.js          # Bootstraps database pool and starts HTTP server listener
├── uploads/               # Holds uploaded supporting documents securely
├── schema.sql             # SQL Script for DDL structures and manager pre-seeding
├── .env.example           # Reference environmental variables
└── package.json           # Node project config & dependency listing
```

---

## Installation & Setup Instructions

### 1. Prerequisites
- **Node.js**: Verify installation with `node -v` (version >= 18 is required)
- **PostgreSQL Database**: Access to a PostgreSQL instance (e.g. Supabase connection details)

### 2. Install Dependencies
Clone the repository and run:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root folder based on `.env.example`:
```bash
cp .env.example .env
```
Update the parameters inside `.env` to match your local setup or Supabase PostgreSQL parameters:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[db]
JWT_SECRET=yoursupersecuresecretkey
JWT_EXPIRES_IN=24h
```

### 4. Database Initialization
Run the DDL statements in the `schema.sql` file on your Supabase SQL editor or local PostgreSQL console.
This will create:
- `users` table
- `leave_balances` table (automatically pre-seeded when an employee registers)
- `leave_requests` table (includes constraint checks to ensure `end_date >= start_date`)
- `notifications` table (stores unread in-app alerts)
- Pre-seeded **Manager** credentials.

---

## Pre-seeded Manager Credentials
For demonstration and portal access:
- **Username**: `manager@gcu.in`
- **Password**: `ZollidMngr#Leave99`

*Note: No register endpoint exposes manager creation for security. This account is seeded using a secure bcrypt hash.*

---

## API Endpoints List

### Authentication
- `POST /api/auth/register` - Register a new employee (Default leave balance: 15 Annual, 10 Sick, 10 Casual)
- `POST /api/auth/login` - Login to receive a JWT access token

### Employee Portal (Requires Employee JWT)
- `GET /api/employee/profile` - Fetch profile data and remaining leave balances
- `POST /api/employee/leave` - Apply for leave. Form-data accepts body fields and a supporting file (`document` field)
- `GET /api/employee/leave` - View personal leave application history

### Manager Portal (Requires Manager JWT)
- `GET /api/manager/employees` - List all registered employees and their leave balances
- `GET /api/manager/leaves` - View all leave applications across the entire system
- `PATCH /api/manager/leaves/:id` - Approve or Reject a leave request (Requires body status payload: `Approved` or `Rejected` and optional `managerRemarks`)

### In-App Notifications (Requires Employee JWT)
- `GET /api/notifications` - Retrieve unread alerts on approved/rejected leave requests
- `PATCH /api/notifications/:id/read` - Mark alert as read

---

## API Documentation (Swagger)

A beautiful interactive Swagger UI is built directly into the server. Start the server and navigate to:
[http://localhost:5000/api-docs](http://localhost:5000/api-docs)

To run the server in development mode (auto-reload):
```bash
npm run dev
```

To run in production mode:
```bash
npm start
```
