"use client";

import React from "react";
import ConnectDevice from "./ConnectDevice";
import { useDevices } from "../context/ConnectedDevicesContext";

export default function ConnectedMicrobits() {
  const { devices, setDevices, resetDevices } = useDevices();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div>
      <h1>Connect to New Micro:bit</h1>
      <ConnectDevice setDevices={setDevices} />
      </div>
      
      <div>
        <h2>Connected Micro:bits</h2>
        {devices.length === 0 ? (
          <p>No devices connected.</p>
        ) : (
          <ul>
            {devices.map(({ device }) => (
              <li key={device.id}>{device.name}</li>
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
