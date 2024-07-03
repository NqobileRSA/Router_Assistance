import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const BlockedDevices = () => {
  const [blockedDevices, setBlockedDevices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlockedDevices();
  }, []);

  const fetchBlockedDevices = async () => {
    try {
      const response = await axios.get("/api/blocked-devices");
      setBlockedDevices(response.data.blockedDevices);
    } catch (error) {
      toast.error("Failed to fetch blocked devices");
    }
  };

  const handleUnblock = async (macAddress) => {
    try {
      await axios.post("/api/unblock-device", { macAddress });
      toast.success("Device unblocked successfully");
      fetchBlockedDevices();
    } catch (error) {
      toast.error("Failed to unblock device");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Blocked Devices</h2>
      {blockedDevices.length === 0 ? (
        <p>No blocked devices found.</p>
      ) : (
        <div className="list-group">
          {blockedDevices.map((device) => (
            <div
              key={device.macAddress}
              className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">
                  {device.deviceName || "Unknown Device"}
                </h5>
                <p className="mb-1">MAC: {device.macAddress}</p>
              </div>
              <button
                className="btn btn-success"
                onClick={() => handleUnblock(device.macAddress)}>
                <i className="bi bi-unlock me-2"></i>Unblock
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        className="btn btn-primary mt-3"
        onClick={() => navigate("/dashboard")}>
        <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
      </button>
    </div>
  );
};

export default BlockedDevices;
