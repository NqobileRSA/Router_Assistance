import express from "express";
import {
  login,
  logout,
  getConnectedDevices,
  changeWifiPassword,
  getBlockedDevices,
  unblockDevice,
  blockDevice,
  restartDevice,
  changeLoginDetails,
} from "../controllers/routerController.js";
import {
  ensureBrowserInitialized,
  isAuthenticated,
} from "../middleware/middleware.js";

const router = express.Router();

// Public routes
router.post("/api/login", ensureBrowserInitialized, login);
router.post("/api/logout", ensureBrowserInitialized, logout);

// Protected routes (require authentication)
router.get(
  "/api/connected-devices",
  isAuthenticated,
  ensureBrowserInitialized,
  getConnectedDevices
);
router.post(
  "/api/change-wifi-password",
  isAuthenticated,
  ensureBrowserInitialized,
  changeWifiPassword
);
router.get(
  "/api/blocked-devices",
  isAuthenticated,
  ensureBrowserInitialized,
  getBlockedDevices
);
router.post(
  "/api/unblock-device",
  isAuthenticated,
  ensureBrowserInitialized,
  unblockDevice
);
router.post(
  "/api/block-device",
  isAuthenticated,
  ensureBrowserInitialized,
  blockDevice
);
router.post(
  "/api/restart-device",
  isAuthenticated,
  ensureBrowserInitialized,
  restartDevice
);

router.post(
  "/api/change-login-details",
  isAuthenticated,
  ensureBrowserInitialized,
  changeLoginDetails
);

export default router;
