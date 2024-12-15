"use client";

import React from "react";
import { useDevices } from "../context/ConnectedDevicesContext";
import ConnectDevice from "./ConnectDevice";
import AnimatedButton from "./AnimatedButton";

export default function ConnectedDevices() {
  const { devices, loading, resetDevices } = useDevices();

  return (
    <div className="page-layout">
      <div>
        <h2>Connect to New Micro:bit</h2>
        <ConnectDevice />
      </div>

      <div>
        <h2>Connected Micro:bits</h2>
        {loading ? (
          <p>Loading devices...</p>
        ) : devices.length === 0 ? (
          <p>No devices connected</p>
        ) : (
          <ul>
            {devices.map(({ device }, index) => {
              console.log("device:", device);
              // Check if the device object is valid
              if (!device || !device.name) {
                return null; // Skip rendering this device if it's invalid
              }
              return <li key={device.id || index}>{device.name}</li>;
            })}
          </ul>
        )}
      </div>

      <div>
        <h2>Reset Devices</h2>
        <AnimatedButton onClick={resetDevices}>Reset Devices</AnimatedButton>
      </div>
    </div>
  );
}
