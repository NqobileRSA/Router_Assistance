import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import router from "./routes/routes.js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import winston from "winston";
import expressWinston from "express-winston";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

// Apply security middleware
app.use(helmet());

// Configure logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Add console logging for non-production environments
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Use expressWinston for request logging
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false,
  })
);

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Configure session management
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Parse JSON request bodies
app.use(express.json());

// Use the router for all routes
app.use("/", router);

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}\nStack: ${err.stack}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected error occurred",
    error: process.env.NODE_ENV === "production" ? {} : err,
  });
});

// Start the server
app.listen(port, () => {
  logger.info(`API server running on port ${port}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Optionally, you can choose to exit the process here
  // process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  // It's generally recommended to exit the process on uncaught exceptions
  process.exit(1);
});
