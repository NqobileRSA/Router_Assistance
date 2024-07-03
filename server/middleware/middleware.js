import puppeteer from "puppeteer";
import { browser } from "../controllers/routerController.js";

// Middleware to ensure the browser is initialized before handling requests
export const ensureBrowserInitialized = async (req, res, next) => {
  if (!browser || !browser.isConnected()) {
    console.log("Browser disconnected, launching new instance");
    try {
      browser = await puppeteer.launch({
        product: "chrome",
        headless: process.env.NODE_ENV === "production",
        defaultViewport: null,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      console.log("Browser launched successfully");
    } catch (error) {
      console.error("Failed to launch browser:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to initialize browser",
        error: process.env.NODE_ENV === "production" ? {} : error,
      });
    }
  }
  next();
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Not authenticated" });
  }
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected error occurred",
    error: process.env.NODE_ENV === "production" ? {} : err,
  });
};
