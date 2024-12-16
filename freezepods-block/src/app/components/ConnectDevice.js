import React from "react";
import { MicrobitUuid } from "./MicrobitUuid.js";
import AnimatedButton from "./AnimatedButton.js";
import { useDevices } from "../context/ConnectedDevicesContext.js";

export default function ConnectDevice() {
  const { devices, addDevice } = useDevices();

  const connect = async () => {
    if (!navigator.bluetooth) {
      console.error("Bluetooth not available in this browser or computer.");
      alert("Bluetooth not available in this browser or computer.");
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "BBC micro:bit" }],
        optionalServices: [
          MicrobitUuid.genericAccess[0],
          MicrobitUuid.ledService[0],
          MicrobitUuid.accelerometerService[0],
          MicrobitUuid.buttonService[0],
          MicrobitUuid.ioPinService[0],
          MicrobitUuid.temperatureService[0],
          MicrobitUuid.magnetometerService[0],
          MicrobitUuid.uartService[0],
        ],
      });

      if (!device) {
        alert("Canceled action. Please press Connect to try again");
        return;
      }

      if (devices.some((d) => d.device.id === device.id)) {
        alert(`${device.name} is already connected`);
        return;
      }

      const server = await device.gatt.connect();

      if (!server) {
        alert("Could not connect to the Micro:bit");
        return;
      }

      // Handle disconnection
      device.addEventListener("gattserverdisconnected", () => {
        console.log(`${device.name} disconnected`);
        addDevice((prevDevices) =>
          prevDevices.filter((d) => d.device.id !== device.id)
        );
      });

      console.log("Connected:", device.name);

      // Fetch and log all services
      const services = await server.getPrimaryServices();
      console.log("Discovered services:");
      services.forEach((service, index) => {
        console.log(`Service ${index}:`, service.uuid);
      });

      // Add device to the context with its services and server
      console.log("DD:", device);
      addDevice({
        id: device.id,
        name: device.name,
        server: server,
        services: services.map((service) => service.uuid)
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        console.warn("No devices found", error);
        alert("No devices found. Make sure your Micro:bit is in pairing mode");
      } else if (error.name === "NetworkError") {
        console.error("Network error during GATT connection:", error);
        alert("Failed to connect. Try restarting the Micro:bit");
      } else {
        console.error("Unexpected error:", error);
        alert("An unexpected error occurred");
      }
    }
  };

  return (
    <AnimatedButton onClick={connect}> Connect to Micro:bit </AnimatedButton>
  );
}
