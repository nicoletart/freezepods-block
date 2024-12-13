"use client";

import React from "react";
import { useDevices } from "../context/ConnectedDevicesContext";
import ConnectDevice from "./ConnectDevice";

export default function ConnectedDevices() {
  const { devices, loading, addDevice, resetDevices } = useDevices();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div>
        <h2>Connect to New Micro:bit</h2>
        <ConnectDevice addDevice={addDevice} />
      </div>

      <div>
        <h2>Connected Micro:bits</h2>
        {loading ? (
          <p>Loading devices...</p>
        ) : devices.length === 0 ? (
          <p>No devices connected
            
          </p>
        ) : (
          <ul>
            {devices.map(({ device }, index) => (
              <li key={device.id || index}>{device.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2>Reset Devices</h2>
        <button onClick={resetDevices}>Reset Devices</button>
      </div>
    </div>
  );
}
