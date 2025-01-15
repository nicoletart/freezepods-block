"use client";

import React from "react";
import { useDevices } from "../context/ConnectedDevicesContext";
import AnimatedButton from "./AnimatedButton";

export default function ConnectedDevicesList({
  showRemoveDevicesOption = false,
}) {
  const { devices, loading, handleRemoveDevice } = useDevices();
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
            return (
              <li
                key={device.id || index}
                className="connected-devices-list-item"
              >
                <p>{device.name}</p>
                {showRemoveDevicesOption && (
                  <AnimatedButton
                    onClick={() => handleRemoveDevice(device)}
                    className="remove-button"
                  >
                    &#x2715;
                  </AnimatedButton>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
