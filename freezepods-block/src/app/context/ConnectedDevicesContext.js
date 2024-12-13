"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ConnectedDevicesContext = createContext();

export function ConnectedDevicesProvider({ children }) {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
      const connectedDevices = JSON.parse(localStorage.getItem("devices"));
      if (connectedDevices) {
        setDevices(connectedDevices);
      }
    
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
        localStorage.setItem("devices", JSON.stringify(devices));
      }
    
  }, [devices]);

  const addDevice = (newDevice) => {
    setDevices((prevDevices) => [...prevDevices, {
      device: {
        id: newDevice.device.id,      
        name: newDevice.device.name,  
      },
      server: newDevice.server,
    }
  ]);
  };

  const resetDevices = () => {
    console.log("Resetting devices...");
    setDevices([]);
    localStorage.removeItem("devices");
    console.log("Devices reset:", devices);
  };

  return (
    <ConnectedDevicesContext.Provider
      value={{ devices, addDevice, resetDevices }}
    >
      {children}
    </ConnectedDevicesContext.Provider>
  );
}

export function useDevices() {
  return useContext(ConnectedDevicesContext);
}
