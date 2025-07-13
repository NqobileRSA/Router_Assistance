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
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
      <div className="container-fluid">
        <ToastContainer />
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">
              <i className="bi bi-router"></i> Router Management
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    Home
                  </Link>
                </li>
                {isLoggedIn ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/dashboard">
                        Dashboard
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/logout">
                        Logout
                      </Link>
                    </li>
                  </>
                ) : (
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Login
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" />
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
            path="/dashboard"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <Dashboard />
              </PrivateRoute>
            }
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

const Home = () => (
  <div className="jumbotron">
    <h1 className="display-4">Welcome to Router Management</h1>
    <p className="lead">
      Manage your devices, WiFi settings, and account details with ease.
    </p>
  </div>
);

const Dashboard = () => {
  return (
    <div className="container">
      <h2 className="text-center mb-4">Dashboard</h2>
      <div className="row">
        <DashboardCard
          title="Connected Devices"
          icon="bi-devices"
          link="/devices"
          description="View and manage connected devices"
        />
        <DashboardCard
          title="WiFi Settings"
          icon="bi-wifi"
          link="/wifi"
          description="Change WiFi password and settings"
        />
        <DashboardCard
          title="Account Settings"
          icon="bi-person-gear"
          link="/account"
          description="Update your account details"
        />
      </div>
    </div>
  );
};

const DashboardCard = ({ title, icon, link, description }) => {
  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100">
        <div className="card-body text-center">
          <i className={`bi ${icon} display-4 mb-3`}></i>
          <h5 className="card-title">{title}</h5>
          <p className="card-text">{description}</p>
          <Link to={link} className="btn btn-primary">
            Go to {title}
          </Link>
        </div>
      </div>
    </div>
  );
};

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
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title text-center mb-4">Login</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
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
      <h2 className="mb-4">Connected Devices</h2>
      {isLoading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          {devices.map((device, index) => (
            <div key={index} className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{device.device}</h5>
                  <p className="card-text">
                    IP: {device.ip}
                    <br />
                    MAC: {device.mac}
                    <br />
                    State: {device.state}
                  </p>
                  <button
                    className="btn btn-danger"
                    onClick={() => blockDevice(device.mac, device.device)}
                    disabled={isLoading}>
                    <i className="bi bi-shield-fill-x me-2"></i>
                    Block
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-5 mb-4">Blocked Devices</h2>
      {isLoading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          {blockedDevices.map((device, index) => (
            <div key={index} className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{device.deviceName}</h5>
                  <p className="card-text">MAC: {device.macAddress}</p>
                  <button
                    className="btn btn-success"
                    onClick={() => unblockDevice(device.macAddress)}
                    disabled={isLoading}>
                    <i className="bi bi-shield-fill-check me-2"></i>
                    Unblock
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title text-center mb-4">
              Change WiFi Password
            </h2>
            <form onSubmit={handleChangeWifiPassword}>
              <div className="mb-3">
                <label htmlFor="currentWifiPassword" className="form-label">
                  Current WiFi Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="currentWifiPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="newWifiPassword" className="form-label">
                  New WiFi Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="newWifiPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"></span>
                    Changing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-wifi me-2"></i>
                    Change WiFi Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
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
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title text-center mb-4">
              Change Login Details
            </h2>
            <form onSubmit={handleChangeLoginDetails}>
              <div className="mb-3">
                <label htmlFor="currentPassword" className="form-label">
                  Current Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label">
                  New Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <h5>Password Requirements:</h5>
                <ul className="list-group">
                  <li className="list-group-item">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    At least 6 characters long
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Contains at least 2 of the following:
                    <ul>
                      <li>Uppercase letters (A-Z)</li>
                      <li>Lowercase letters (a-z)</li>
                      <li>Numbers (0-9)</li>
                      <li>{`Special characters (~!@#$%^&*()-_=+\|[{]};:'"<,>.?/)`}</li>
                    </ul>
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Cannot be the same as the current password
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Cannot be the reverse of the current password
                  </li>
                </ul>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"></span>
                    Changing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-fill-gear me-2"></i>
                    Change Login Details
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
