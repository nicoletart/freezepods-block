import React from "react";
import { MicrobitUuid } from "./MicrobitUuid.js";

export default function ConnectDevice({ addDevice }) {   
  const connect = async () => {
    if (!navigator.bluetooth) {
      console.error("Bluetooth not available in this browser or computer.");
      alert("Bluetooth not available in this browser or computer.");
      return;
    }

    let server;
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
        console.log("No device selected or user canceled.");
        alert("Canceled action. Please press Connect to try again");
        return;
      }

      server = await device.gatt.connect();
      if (!server) {
        console.error("Server not available");
        alert("Could not connect to the Micro:bit");
        return;
      }

      device.addEventListener("gattserverdisconnected", () => {
        console.log(`${device.name} disconnected`);
        addDevice((prevDevices) =>
          prevDevices.filter((d) => d.device.id !== device.id)
        );
      });

      console.log("Connected:", device.name);

      const services = await server.getPrimaryServices();
      services.forEach((service) => {
        console.log(service.uuid);
      });

      
      addDevice({ device, server });
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

  return <button onClick={connect}>Connect to Micro:bit</button>;
}

