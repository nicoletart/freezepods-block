"use client";

import React, { createContext, useContext, useState } from "react";

const ConnectedDevicesContext = createContext();

export function ConnectedDevicesProvider({ children }) {
  const [devices, setDevices] = useState([]);

  const resetDevices = () => {
    console.log("Resetting devices...");
    setDevices([]);
    console.log("Devices reset:", devices);
  };

  return (
    <ConnectedDevicesContext.Provider
      value={{ devices, setDevices, resetDevices }}
    >
      {children}
    </ConnectedDevicesContext.Provider>
  );
}

export function useDevices() {
  return useContext(ConnectedDevicesContext);
}
