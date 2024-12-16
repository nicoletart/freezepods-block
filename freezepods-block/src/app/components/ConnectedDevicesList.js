"use client";

import React from "react";
import { useDevices } from "../context/ConnectedDevicesContext";

export default function ConnectedDevicesList() {
  const { devices, loading } = useDevices();
  return (
    <div>
      <h2>Connected Micro:bits</h2>
      {loading ? (
        <p>Loading devices...</p>
      ) : devices.length === 0 ? (
        <p>No devices connected</p>
      ) : (
        <ul>
          {devices.map(({ device }, index) => {
            if (!device || !device.name) {
              return null;
            }
            return <li key={device.id || index}>{device.name}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
