"use client";
import React from "react";
import { useDevices } from "../context/ConnectedDevicesContext";
import ConnectDevice from "./ConnectDevice";   

export default function ConnectedDevices() {
  const { devices, addDevice, resetDevices } = useDevices();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div>
        <h1>Connect to New Micro:bit</h1>
        <ConnectDevice addDevice={addDevice} />
      </div>

      <div>
        <h2>Connected Micro:bits</h2>
        {devices.length === 0 ? (
          <p>No devices connected.</p>
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

