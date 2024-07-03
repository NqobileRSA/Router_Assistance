import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const apiUrl = "http://localhost:3000/api";
axios.defaults.withCredentials = true;

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      await axios.get(`${apiUrl}/connected-devices`);
      setIsLoggedIn(true);
    } catch (error) {
      setIsLoggedIn(false);
    }
  };

  return (
    <Router>
      <div>
        <ToastContainer />
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            {isLoggedIn ? (
              <>
                <li>
                  <Link to="/devices">Devices</Link>
                </li>
                <li>
                  <Link to="/wifi">WiFi Settings</Link>
                </li>
                <li>
                  <Link to="/account">Account Settings</Link>
                </li>
                <li>
                  <Link to="/logout">Logout</Link>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login">Login</Link>
              </li>
            )}
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to="/" />
              ) : (
                <Login setIsLoggedIn={setIsLoggedIn} />
              )
            }
          />
          <Route
            path="/logout"
            element={<Logout setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/devices"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <Devices />
              </PrivateRoute>
            }
          />
          <Route
            path="/wifi"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <WiFiSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/account"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <AccountSettings />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

const PrivateRoute = ({ children, isLoggedIn }) => {
  return isLoggedIn ? children : <Navigate to="/login" />;
};

const Home = () => <h1>Welcome to Router Management</h1>;

const Login = ({ setIsLoggedIn }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/login`, {
        username,
        password,
      });
      setIsLoggedIn(true);
      toast.success(response.data.message);
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

const Logout = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await axios.post(`${apiUrl}/logout`);
        setIsLoggedIn(false);
        toast.success("Logged out successfully");
        navigate("/login");
      } catch (error) {
        toast.error(error.response?.data?.message || "Logout failed");
      }
    };
    performLogout();
  }, [setIsLoggedIn, navigate]);

  return null;
};

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [blockedDevices, setBlockedDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchBlockedDevices();
  }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/connected-devices`);
      setDevices(response.data.devices);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch devices");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlockedDevices = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/blocked-devices`);
      setBlockedDevices(response.data.blockedDevices);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch blocked devices"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const blockDevice = async (macAddress, deviceName) => {
    setIsLoading(true);
    try {
      await axios.post(`${apiUrl}/block-device`, { macAddress, deviceName });
      toast.success("Device blocked successfully");
      fetchDevices();
      fetchBlockedDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block device");
    } finally {
      setIsLoading(false);
    }
  };

  const unblockDevice = async (macAddress) => {
    setIsLoading(true);
    try {
      await axios.post(`${apiUrl}/unblock-device`, { macAddress });
      toast.success("Device unblocked successfully");
      fetchDevices();
      fetchBlockedDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock device");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Connected Devices</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {devices.map((device, index) => (
            <li key={index}>
              {device.device} - IP: {device.ip}, MAC: {device.mac}, State:{" "}
              {device.state}
              <button
                onClick={() => blockDevice(device.mac, device.device)}
                disabled={isLoading}>
                Block
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Blocked Devices</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {blockedDevices.map((device, index) => (
            <li key={index}>
              {device.deviceName} - MAC: {device.macAddress}
              <button
                onClick={() => unblockDevice(device.macAddress)}
                disabled={isLoading}>
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const WiFiSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeWifiPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/change-wifi-password`, {
        currentPassword,
        newPassword,
      });
      toast.success(response.data.message);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to change WiFi password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Change WiFi Password</h2>
      <form onSubmit={handleChangeWifiPassword}>
        <input
          type="password"
          placeholder="Current WiFi Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New WiFi Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Changing..." : "Change WiFi Password"}
        </button>
      </form>
    </div>
  );
};

const AccountSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password) => {
    const minLength = 6;
    const specialChars = `~!@#$%^&*()-_=+\\|[{]};:'"<,>.?/`;
    const containsDigit = /\d/;
    const containsUppercase = /[A-Z]/;
    const containsLowercase = /[a-z]/;
    const containsSpecialChar = new RegExp(
      `[${specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}]`
    );

    if (password.length < minLength) return false;

    let combinations = 0;
    if (containsDigit.test(password)) combinations++;
    if (containsUppercase.test(password)) combinations++;
    if (containsLowercase.test(password)) combinations++;
    if (containsSpecialChar.test(password)) combinations++;

    return combinations >= 2;
  };

  const handleChangeLoginDetails = async (e) => {
    e.preventDefault();
    if (!validatePassword(newPassword)) {
      toast.error("Password does not meet the requirements");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("New password cannot be the same as the current password");
      return;
    }
    if (newPassword === currentPassword.split("").reverse().join("")) {
      toast.error("New password cannot be the reverse of the current password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/change-login-details`, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success(response.data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to change login details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Change Login Details</h2>
      <form onSubmit={handleChangeLoginDetails}>
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Changing..." : "Change Login Details"}
        </button>
      </form>
    </div>
  );
};

export default App;
