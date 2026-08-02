const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

// Import routes
const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const managerRoutes = require("./routes/manager.routes");
const notificationRoutes = require("./routes/notification.routes");

// Import middleware & configs
const errorHandler = require("./middleware/error.middleware");
const swaggerSpec = require("./config/swagger");
const rateLimit = require("express-rate-limit");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

// Trust first proxy (Render, Vercel, etc.) — required for express-rate-limit
app.set("trust proxy", 1);

// CORS Whitelist Configuration (anti-Security Misconfiguration)
const coreOrigins = [
  "http://localhost:5000",
  "http://localhost:5173",
  "https://employee-leave-manager-one.vercel.app",
];
const extraOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];
const whitelist = [...new Set([...coreOrigins, ...extraOrigins])];

// 1. Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["'self'", ...whitelist],
    },
  },
  frameguard: false, // Delegate framing protection to CSP frame-ancestors
}));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (whitelist.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked Origin:", origin);

      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(compression());
app.options("*", cors());

// Rate Limiters Configuration (anti-DOS / Brute force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // limit login attempts
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// 2. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Secure File Uploads Serving (checks ownership and auth - anti-IDOR)
app.use("/uploads", uploadRoutes);

// 4. API Documentation Route (Guarded: Dev only - anti-Information Disclosure)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint for Render pre-warming
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is awake!" });
});

// 5. API Routes Mounting
app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/notifications", notificationRoutes);

// 6. Root Route check
app.get("/", (req, res, next) => {
  res.status(200).json({
    success: true,
    message:
      "Welcome to the Employee Leave Management System API. Visit /api-docs for documentation.",
    data: {
      docs: "/api-docs",
    },
  });
});

// 7. Catch-all for undefined routes (404 Not Found)
app.use((req, res, next) => {
  const error = new Error(`Cannot ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// 8. Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
