"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Modal from "../components/Modal";
import AnimatedButton from "../components/AnimatedButton";
import { useRouter } from "next/navigation";

const ConnectedDevicesContext = createContext();

export function ConnectedDevicesProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [showConnectionOptionModal, setShowConnectionOptionModal] =
    useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const router = useRouter();

  const reconnectSavedDevices = () => {
    setShowReconnectModal(false);
    setShowConnectionOptionModal(false);
    setShowReconnectModal(true);
  };

  const returnToDevices = () => {
    router.push("/devices");
    resetDevices();
    setShowConnectionOptionModal(false);
  };

  useEffect(() => {
    console.log("ConnectedDevicesProvider mounted");
    const fetchDevices = async () => {
      const connectedDevices = JSON.parse(localStorage.getItem("devices"));
      if (connectedDevices) {
        const resetDevices = connectedDevices.map((device) => ({
          ...device,
          reconnected: false,
        }));
        setDevices(resetDevices);
        localStorage.setItem("devices", JSON.stringify(resetDevices));
      }
      setLoading(false);
    };
    console.log("Fetching devices...", devices);

    fetchDevices();
  }, []);

  useEffect(() => {
    console.log("Devices changed:", devices);
    localStorage.setItem("devices", JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    console.log("DEVICES:", devices);

    const devicesToReconnect = devices.filter((device) => {
      const needsReconnect =
        device.device.server && !device.device.server.connected;
      console.log(
        `Device ${device.device?.name || "unknown"} needs reconnect:`,
        needsReconnect
      );
      return needsReconnect;
    });

    console.log("Devices to reconnect:", devicesToReconnect);
    console.log("Number of devices to reconnect:", devicesToReconnect.length);

    if (devicesToReconnect.length > 0 && !showReconnectModal) {
      console.log("Setting showConnectionOptionModal to true");
      setShowConnectionOptionModal(true);
    } else if (devicesToReconnect.length === 0) {
      setShowReconnectModal(false);
      console.log("Final Devices:", devices);
    }
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

  const resetDevices = () => {
    console.log("Resetting devices...");
    setDevices([]);
    localStorage.removeItem("devices");
    console.log("Devices reset.");
  };

  const reconnectDevices = async (savedDevices) => {
    console.log("Saved devices:", savedDevices);
    const reconnectedDevices = [];

    for (let i = 0; i < savedDevices.length; i++) {
      const savedDevice = savedDevices[i].device;
      console.log("savedDevice:", savedDevice);
      console.log(`Reconnecting to ${savedDevice.name}...`);

      if (!savedDevice.name) {
        console.error(`Device name is missing for ${savedDevice}`);
        continue;
      }

      try {
        console.log("TRYING TO RECONNECT TO:", savedDevice.name);
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ name: savedDevice.name }],
          optionalServices: savedDevice.services,
        });
        console.log("next device:", device);
        const server = await device.gatt.connect();
        const services = await Promise.all(
          savedDevice.services.map((uuid) => server.getPrimaryService(uuid))
        );

        reconnectedDevices.push({ device, server, services });
        console.log(`Reconnected to ${device.name}`);
      } catch (error) {
        console.error(`Failed to reconnect to ${savedDevice.name}`, error);
      }
    }

    setDevices(reconnectedDevices);
  };

  const handleReconnectDevice = async (savedDevice) => {
    console.log(`Reconnecting to ${savedDevice.name}...`);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: savedDevice.name }],
        optionalServices: savedDevice.services,
      });

      const server = await device.gatt.connect();
      console.log("New Server:", server);

      console.log(`Reconnected to ${device.name}`);
      console.log("Saved device:", savedDevice);

      setDevices((prevDevices) => {
        const updatedDevices = prevDevices.map((device) => {
          console.log("device:", device.device);
          console.log("savedDevice:", savedDevice);
          if (device.device.id === savedDevice.id) {
            return {
              ...device,
              device: {
                ...device.device,
                server: server,
                ...device.services,
              },
              reconnected: true,
            };
          }
          return device;
        });

        localStorage.setItem("devices", JSON.stringify(updatedDevices));

        return updatedDevices;
      });
    } catch (error) {
      console.error(`Failed to reconnect to ${savedDevice.name}`, error);
    }
  };

  return (
    <ConnectedDevicesContext.Provider
      value={{
        devices,
        loading,
        ready,
        addDevice,
        resetDevices,
        reconnectDevices,
        handleReconnectDevice,
      }}
    >
      {children}

      <Modal
        isOpen={showConnectionOptionModal}
        onClose={returnToDevices}
        label="Reconnect Devices"
      >
        <p>
          Page reloaded. You must reconnect your saved devices OR connect new
          devices
        </p>
        <div
          style={{ display: "flex", flexDirection: "column", width: "auto" }}
        >
          <AnimatedButton onClick={reconnectSavedDevices}>
            Reconnect Previously Saved Micro:bits
          </AnimatedButton>
          <AnimatedButton onClick={returnToDevices}>
            Return to Connect New Micro:bits
          </AnimatedButton>
        </div>
      </Modal>

      <Modal
        isOpen={showReconnectModal}
        onClose={() => setShowReconnectModal(false)}
        label="Reconnect Saved Micro:bits"
      >
        <p>Reconnect saved micro:bits by clicking the below buttons</p>
        <div
          style={{ display: "flex", flexDirection: "column", width: "auto" }}
        >
          {devices.map(
            (device, index) =>
              !device.reconnected && (
                <AnimatedButton
                  key={index}
                  onClick={() => handleReconnectDevice(device.device, index)}
                >
                  Reconnect {device.device.name}
                </AnimatedButton>
              )
          )}
        </div>
      </Modal>
    </ConnectedDevicesContext.Provider>
  );
}

export function useDevices() {
  return useContext(ConnectedDevicesContext);
}
