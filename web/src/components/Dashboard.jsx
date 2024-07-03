import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const Dashboard = () => {
  const [connectedDevices, setConnectedDevices] = useState([]);

  useEffect(() => {
    fetchConnectedDevices();
  }, []);

  const fetchConnectedDevices = async () => {
    try {
      const response = await axios.get("/api/connected-devices");
      setConnectedDevices(response.data.devices);
    } catch (error) {
      toast.error("Failed to fetch connected devices");
    }
  };

  const handleBlockUnblock = async (macAddress, isBlocked) => {
    try {
      if (isBlocked) {
        await axios.post("/api/unblock-device", { macAddress });
        toast.success("Device unblocked successfully");
      } else {
        await axios.post("/api/block-device", {
          macAddress,
          deviceName: "Unknown",
        });
        toast.success("Device blocked successfully");
      }
      fetchConnectedDevices();
    } catch (error) {
      toast.error("Failed to block/unblock device");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Connected Devices</h2>
      <div className="list-group">
        {connectedDevices.map((device) => (
          <div
            key={device.mac}
            className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">{device.device}</h5>
              <p className="mb-1">MAC: {device.mac}</p>
              <small>IP: {device.ip}</small>
            </div>
            <button
              className={`btn ${
                device.state === "blocked" ? "btn-success" : "btn-danger"
              }`}
              onClick={() =>
                handleBlockUnblock(device.mac, device.state === "blocked")
              }>
              <i
                className={`bi ${
                  device.state === "blocked" ? "bi-unlock" : "bi-lock"
                } me-2`}></i>
              {device.state === "blocked" ? "Unblock" : "Block"}
            </button>
          </div>
        ))}
      </div>
      <nav className="navbar fixed-bottom navbar-light bg-light">
        <div className="container-fluid justify-content-around">
          <Link to="/change-password" className="btn btn-outline-primary">
            <i className="bi bi-key me-2"></i>Change Password
          </Link>
          <Link to="/blocked-devices" className="btn btn-outline-secondary">
            <i className="bi bi-shield-lock me-2"></i>Blocked Devices
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
