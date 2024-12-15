"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ConnectedDevicesContext = createContext();

export function ConnectedDevicesProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      const connectedDevices = JSON.parse(localStorage.getItem("devices"));
      if (connectedDevices) {
        setDevices(connectedDevices);
      }
      setLoading(false);
    };

    fetchDevices();
  }, []);

  // Persist devices to localStorage
  useEffect(() => {
    // Filter out devices that might not have valid properties
    console.log("Devices:", devices);
    const validDevices = devices.filter(
      (device) => device.device?.id && device.device?.name
    );
    console.log("Valid devices:", validDevices);

    // Store only the relevant information (e.g., device id and name)
    const serializedDevices = validDevices.map(({ device }) => ({
      device: {
        id: device.id,
        name: device.name,
        server: device.server,
        services: device.services,
      }, // Only store necessary properties
    }));
    console.log("Serializing devices:", serializedDevices);

    // Store to localStorage
    localStorage.setItem("devices", JSON.stringify(serializedDevices));
    setReady(true);
  }, [devices]);

  const addDevice = async (newDevice) => {
    console.log("Adding device:", newDevice);

    setDevices((prevDevices) => [
      ...prevDevices,
      {
        device: {
          id: newDevice.id,
          name: newDevice.name,
          server: newDevice.server,
          services: newDevice.services,
        },
      },
    ]);
  };

  const removeDevice = (deviceId) => {
    console.log(`Removing device with ID: ${deviceId}`);
    setDevices((prevDevices) =>
      prevDevices.filter((device) => device.device.id !== deviceId)
    );
  };

  const reconnectDevices = async () => {
    console.log("Reconnecting devices:", devices);
    const connectedDevices = [];

    for (const { device } of devices) {
      try {
        // Move requestDevice to ensure it follows a user gesture
        const deviceObj = await navigator.bluetooth.requestDevice({
          filters: [{ name: device.name }],
        });

        if (deviceObj) {
          const server = await deviceObj.gatt.connect();
          const services = await server.getPrimaryServices();
          connectedDevices.push({ device: deviceObj, server, services });
          console.log(`Reconnected to ${deviceObj.name}`);
        }
      } catch (error) {
        console.error(`Failed to reconnect to device ${device.name}`, error);
      }
    }

    return connectedDevices;
  };

  const resetDevices = () => {
    console.log("Resetting devices...");
    setDevices([]);
    localStorage.removeItem("devices");
    console.log("Devices reset.");
  };

  return (
    <ConnectedDevicesContext.Provider
      value={{
        devices,
        loading,
        addDevice,
        removeDevice,
        resetDevices,
        reconnectDevices,
        ready
      }}
    >
      {children}
    </ConnectedDevicesContext.Provider>
  );
}

export function useDevices() {
  return useContext(ConnectedDevicesContext);
}
