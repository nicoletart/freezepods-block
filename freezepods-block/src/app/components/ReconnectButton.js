import React from "react";
import { useDevices } from "../context/ConnectedDevicesContext.js";
import AnimatedButton from "./AnimatedButton.js";

function ReconnectButton() {
  const { devices } = useDevices();
  console.log("Devices!!!!:", devices);

  

  return (
    <div>
      {devices.length > 0 && (
        <AnimatedButton onClick={reconnectDevices}>
          Reconnect Devices
        </AnimatedButton>
      )}
    </div>
  );
}

export default ReconnectButton;
