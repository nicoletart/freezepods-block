"use client";

import React from "react";
import { useDevices } from "../context/ConnectedDevicesContext";
import ConnectDevice from "./ConnectDevice";
import AnimatedButton from "./AnimatedButton";
import ConnectedDevicesList from "./ConnectedDevicesList";

export default function ConnectedDevices() {
  const { resetDevices } = useDevices();

  return (
    <div className="page-layout">
      <div>
        <h2>Connect to New Micro:bit</h2>
        <ConnectDevice />
      </div>

      <ConnectedDevicesList />

      <div>
        <h2>Reset Devices</h2>
        <AnimatedButton onClick={resetDevices}>Reset Devices</AnimatedButton>
      </div>
    </div>
  );
}
