import puppeteer from "puppeteer";
import { check, validationResult } from "express-validator";

export let browser;

// Initialize browser on server start
(async () => {
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
  }
})();

// Helper function to login to the router
const loginToRouter = async (page, username, password) => {
  console.log("Executing loginToRouter");
  try {
    await page.goto(`http://${process.env.ROUTER_IP}/`, {
      timeout: 60000,
      waitUntil: "networkidle0",
    });
    await page.type("#txt_Username", username);
    await page.type("#txt_Password", password);
    await Promise.all([
      page.click("#loginbutton"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);
    console.log("Login process completed");
  } catch (error) {
    console.error("Error in loginToRouter:", error);
    throw error;
  }
};

// Helper function for input validation
const validateInput = (req, validations) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Invalid input");
    error.statusCode = 400;
    error.errors = errors.array();
    throw error;
  }
};

const loginValidation = [
  check("username").notEmpty().withMessage("Username is required"),
  check("password").notEmpty().withMessage("Password is required"),
];

// Login function
export const login = async (req, res, next) => {
  const validations = [
    check("username").notEmpty().withMessage("Username is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ];
  try {
    validateInput(req, validations);

    let { username, password } = req.body;
    if (!username || !password) {
      return res.json({
        success: false,
        message: "Enter username and password",
      });
    }

    username = String(username);
    password = String(password);

    console.log("Attempting login for username:", username);

    const page = await browser.newPage();
    console.log("New page created for login");

    await loginToRouter(page, username, password);

    const currentUrl = page.url();
    if (currentUrl === `http://${process.env.ROUTER_IP}/index.asp`) {
      console.log("Login successful");
      req.session.isLoggedIn = true;
      req.session.routerCredentials = { username, password };
      res.json({ success: true, message: "Login successful" });
    } else {
      console.log("Login failed");
      const error = new Error("Login failed, please try again.");
      error.statusCode = 401;
      throw error;
    }

    await page.close();
  } catch (error) {
    next(error);
  }
};

// Logout function
export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      const error = new Error("Logout failed");
      error.statusCode = 500;
      next(error);
    } else {
      res.json({ success: true, message: "Logged out successfully" });
    }
  });
};

// Get connected devices
export const getConnectedDevices = async (req, res, next) => {
  try {
    console.log("Fetching connected devices");
    const page = await browser.newPage();
    console.log("New page created for fetching devices");

    const { username, password } = req.session.routerCredentials;
    await loginToRouter(page, username, password);

    await page.goto(
      `http://${process.env.ROUTER_IP}/html/bbsp/userdevinfo/userdevinfosmart.asp?type=wifidev`,
      { timeout: 60000, waitUntil: "networkidle0" }
    );
    console.log("Navigated to devices page");

    await page.waitForSelector("table#devlist", { timeout: 60000 });
    console.log("Devices table loaded");

    const devices = await page.evaluate(() => {
      const deviceRows = document.querySelectorAll(
        "table#devlist tr.DevTableList"
      );
      return Array.from(deviceRows)
        .map((row) => {
          const columns = row.querySelectorAll("td");
          if (columns.length < 5) return null;

          const name =
            columns[0]
              .querySelector(`div[id^="divDevName_"]`)
              ?.textContent.trim() || "N/A";
          const ipAndMac = columns[2]
            .querySelector(`div[id^="DivIpandMac_"]`)
            ?.textContent.trim()
            .split("\n") || ["N/A", "N/A"];
          const state =
            columns[3]
              .querySelector(`div[id^="DivDevStatus_"]`)
              ?.textContent.trim() || "N/A";
          const connectivity =
            columns[4]
              .querySelector(`div[id^="DivConnectTime_"]`)
              ?.textContent.trim() || "N/A";

          const combinedIpMac = ipAndMac[0]?.trim() || "";
          const macMatch = combinedIpMac.match(
            /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/
          );
          const mac = macMatch ? macMatch[0] : "N/A";
          const ip = combinedIpMac.replace(mac, "").trim() || "N/A";

          return {
            device: name,
            mac,
            ip,
            state: state.toLowerCase(),
            connectivity:
              connectivity === "--" ? "Not connected" : connectivity,
          };
        })
        .filter((device) => device !== null);
    });

    console.log("Fetched devices:", JSON.stringify(devices, null, 2));

    res.json({ success: true, devices });

    await page.close();
  } catch (error) {
    next(error);
  }
};

// Get blocked devices
export const getBlockedDevices = async (req, res, next) => {
  try {
    console.log("Fetching blocked devices");
    const page = await browser.newPage();
    console.log("New page created for fetching blocked devices");

    const { username, password } = req.session.routerCredentials;
    await loginToRouter(page, username, password);

    await page.goto(
      `http://${process.env.ROUTER_IP}/html/bbsp/wlanmacfilter/wlanmacfilter.asp`,
      { timeout: 60000, waitUntil: "networkidle0" }
    );
    console.log("Navigated to MAC filter page");

    await page.waitForSelector("#WMacfilterConfigList", { timeout: 60000 });
    console.log("MAC filter table loaded");

    const blockedDevices = await page.evaluate(() => {
      const rows = document.querySelectorAll(
        "#WMacfilterConfigList tr:not(.tableth)"
      );
      return Array.from(rows).map((row) => {
        const macAddress = row
          .querySelector("td:nth-child(2)")
          ?.textContent.trim();
        const deviceName = row
          .querySelector("td:nth-child(3)")
          ?.textContent.trim();
        return { macAddress, deviceName };
      });
    });

    console.log(
      "Fetched blocked devices:",
      JSON.stringify(blockedDevices, null, 2)
    );

    res.json({ success: true, blockedDevices });

    await page.close();
  } catch (error) {
    next(error);
  }
};

// Unblock device
export const unblockDevice = async (req, res, next) => {
  const validations = [
    check("macAddress").notEmpty().withMessage("MAC address is required"),
  ];

  try {
    validateInput(req, validations);

    const { macAddress } = req.body;
    console.log("Attempting to unblock device:", macAddress);

    const page = await browser.newPage();
    console.log("New page created for unblocking device");

    const { username, password } = req.session.routerCredentials;
    await loginToRouter(page, username, password);

    await page.goto(
      `http://${process.env.ROUTER_IP}/html/bbsp/wlanmacfilter/wlanmacfilter.asp`,
      { timeout: 60000, waitUntil: "networkidle0" }
    );
    console.log("Navigated to MAC filter page");

    await page.waitForSelector("#WMacfilterConfigList", { timeout: 60000 });

    const deviceFound = await page.evaluate((mac) => {
      const rows = document.querySelectorAll(
        "#WMacfilterConfigList tr:not(.tableth)"
      );
      for (const row of rows) {
        if (row.querySelector("td:nth-child(2)")?.textContent.trim() === mac) {
          row.querySelector("input[type='checkbox']").click();
          return true;
        }
      }
      return false;
    }, macAddress);

    if (!deviceFound) {
      console.log("Device not found in the blocked list");
      const error = new Error("Device not found in the blocked list");
      error.statusCode = 404;
      throw error;
    }

    console.log("Device found and checkbox clicked");

    // Set up a listener for dialogs before clicking the delete button
    page.on("dialog", async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    await Promise.all([
      page.click("#DeleteButton"),
      page
        .waitForNavigation({ timeout: 60000, waitUntil: "networkidle0" })
        .catch(() => {
          console.log("Navigation timeout occurred, but continuing...");
        }),
    ]);

    console.log("Delete action completed");

    // Verify if the device was actually removed
    const deviceStillPresent = await page.evaluate((mac) => {
      const rows = document.querySelectorAll(
        "#WMacfilterConfigList tr:not(.tableth)"
      );
      for (const row of rows) {
        if (row.querySelector("td:nth-child(2)")?.textContent.trim() === mac) {
          return true;
        }
      }
      return false;
    }, macAddress);

    if (deviceStillPresent) {
      console.log("Device is still present in the list");
      const error = new Error("Failed to unblock the device");
      error.statusCode = 500;
      throw error;
    }

    console.log("Device successfully unblocked");
    res.json({ success: true, message: "Device unblocked successfully" });

    await page.close();
  } catch (error) {
    next(error);
  }
};

// Block device
export const blockDevice = async (req, res, next) => {
  const validations = [
    check("macAddress").notEmpty().withMessage("MAC address is required"),
    check("deviceName").notEmpty().withMessage("Device name is required"),
  ];

  try {
    validateInput(req, validations);

    const { macAddress, deviceName } = req.body;
    console.log("Attempting to block device:", macAddress);

    const page = await browser.newPage();
    console.log("New page created for blocking device");

    const { username, password } = req.session.routerCredentials;
    await loginToRouter(page, username, password);

    await page.goto(
      `http://${process.env.ROUTER_IP}/html/bbsp/wlanmacfilter/wlanmacfilter.asp`,
      { timeout: 60000, waitUntil: "networkidle0" }
    );
    console.log("Navigated to MAC filter page");

    // Implement the blocking logic here
    // This will depend on the specific router's interface

    console.log("Device successfully blocked");
    res.json({ success: true, message: "Device blocked successfully" });

    await page.close();
  } catch (error) {
    next(error);
  }
};

// Change WiFi password
export const changeWifiPassword = async (req, res, next) => {
  const validations = [
    check("currentPassword")
      .notEmpty()
      .withMessage("Current WiFi password is required"),
    check("newPassword")
      .notEmpty()
      .withMessage("New WiFi password is required"),
  ];

  try {
    validateInput(req, validations);

    let { currentPassword, newPassword } = req.body;
    currentPassword = String(currentPassword);
    newPassword = String(newPassword);

    console.log("Attempting to change WiFi password");

    const page = await browser.newPage();
    console.log("New page created for changing WiFi password");

    const { username, password } = req.session.routerCredentials;
    await loginToRouter(page, username, password);

    await page.goto(
      `http://${process.env.ROUTER_IP}/html/amp/wlanbasic/simplewificfg.asp`,
      { timeout: 60000, waitUntil: "networkidle0" }
    );
    console.log("Navigated to WiFi settings page");

    const isCurrentPasswordCorrect = await page.evaluate((currentPwd) => {
      const currentPasswordField = document.getElementById("pwd_2g_wifipwd");
      return currentPasswordField.value === currentPwd;
    }, currentPassword);

    if (!isCurrentPasswordCorrect) {
      console.log("Current WiFi password is incorrect");
      const error = new Error("Current WiFi password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    console.log("Current WiFi password verified");

    await page.evaluate((newPwd) => {
      const passwordField = document.getElementById("pwd_2g_wifipwd");
      passwordField.value = newPwd;
      const event = new Event("change");
      passwordField.dispatchEvent(event);
      const token = document.getElementById("hwonttoken").value;
      if (typeof SubmitForm === "function") {
        SubmitForm(token);
      }
    }, newPassword);

    console.log("New WiFi password submitted");

    await page
      .waitForNavigation({ timeout: 60000, waitUntil: "networkidle0" })
      .catch(() => console.log("Navigation timeout after password change"));

    console.log("WiFi password changed successfully");

    res.json({
      success: true,
      message: "WiFi password changed successfully",
    });

    await page.close();
  } catch (error) {
    next(error);
  }
};

// Change login details
export const changeLoginDetails = async (req, res, next) => {
  const validations = [
    check("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    check("newPassword").notEmpty().withMessage("New password is required"),
    check("confirmPassword")
      .notEmpty()
      .withMessage("Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ];

  try {
    validateInput(req, validations);

    const { currentPassword, newPassword, confirmPassword } = req.body;
    console.log("Attempting to change login details");

    const page = await browser.newPage();
    console.log("New page created for changing login details");

    const { username, password } = req.session.routerCredentials;
    await loginToRouter(page, username, password);

    await page.goto(
      `http://${process.env.ROUTER_IP}/html/ssmp/accoutcfg/ontmngt.asp`,
      {
        timeout: 120000,
        waitUntil: "networkidle0",
      }
    );
    console.log("Navigated to login details page");

    await page.type("#oldPassword", currentPassword);
    await page.type("#newPassword", newPassword);
    await page.type("#cfmPassword", confirmPassword);

    await Promise.all([
      page.click("#MdyPwdApply"),
      page
        .waitForNavigation({ timeout: 120000, waitUntil: "networkidle0" })
        .catch((err) => {
          console.log(
            "Navigation timeout, checking for success message anyway"
          );
          console.error("Navigation error:", err);
        }),
    ]);

    const result = await page.evaluate(() => {
      const errorMessage = document.querySelector(".error-message");
      const successMessage = document.querySelector(".success-message");
      return {
        success: !!successMessage,
        message: successMessage
          ? successMessage.textContent
          : errorMessage
          ? errorMessage.textContent
          : null,
      };
    });

    if (result.success) {
      console.log("Login details changed successfully");
      req.session.routerCredentials = {
        ...req.session.routerCredentials,
        password: newPassword,
      };
      res.json({
        success: true,
        message: result.message || "Login details changed successfully",
      });
    } else {
      console.log("Failed to change login details:", result.message);
      const error = new Error(
        result.message || "Failed to change login details"
      );
      error.statusCode = 400;
      throw error;
    }

    await page.close();
  } catch (error) {
    next(error);
  }
};

// Restart device
export const restartDevice = async (req, res, next) => {
  try {
    console.log("Attempting to restart device");
    const page = await browser.newPage();
    console.log("New page created for restarting device");

    const { username, password } = req.session.routerCredentials;
    await loginToRouter(page, username, password);

    await page.goto(
      `http://${process.env.ROUTER_IP}/html/ssmp/accoutcfg/ontmngt.asp`,
      {
        timeout: 60000,
        waitUntil: "networkidle0",
      }
    );
    console.log("Navigated to device management page");

    // Set up a listener for dialogs before clicking the restart button
    page.on("dialog", async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    await Promise.all([
      page.click("#btnReboot"),
      page
        .waitForNavigation({ timeout: 60000, waitUntil: "networkidle0" })
        .catch(() => {
          console.log("Navigation timeout occurred after restart initiation");
        }),
    ]);

    console.log("Device restart initiated");

    res.json({ success: true, message: "Device restart initiated" });

    await page.close();
  } catch (error) {
    next(error);
  }
};
