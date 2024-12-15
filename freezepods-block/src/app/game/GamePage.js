"use client";

import { useEffect, useState } from "react";
import { useDevices } from "../context/ConnectedDevicesContext";
import LightDevice from "../components/LightDevice";
import { MicrobitUuid } from "../components/MicrobitUuid";
import ReconnectButton from "../components/ReconnectButton";
import AnimatedButton from "../components/AnimatedButton";
import ConnectedDevices from "../components/ConnectedDevices";

export default function GamePage({ gameType }) {
  const { devices, reconnectDevices, ready } = useDevices();
  const [gameState, setGameState] = useState({
    score: 0,
    timer: 5,
    round: 1,
    gameStarted: false,
    gameOver: false,
    randomDevice: null,
    server: null, // Store GATT server here
    services: null,
  });
  const {
    score,
    timer,
    round,
    gameStarted,
    gameOver,
    randomDevice,
    server,
    services,
  } = gameState;

  useEffect(() => {
    const [navigationEntry] = performance.getEntriesByType("navigation");

    if (navigationEntry && navigationEntry.type === "reload" && ready) {
      console.log("Page refreshed. Attempting to reconnect devices...");
      reconnectDevices();
    }
  }, [ready]);

  const getRandomDevice = (devices) => {
    if (!devices || devices.length === 0) return null;
    return devices[Math.floor(Math.random() * devices.length)];
  };

  const enableNotifications = async (characteristic, handler) => {
    try {
      await characteristic.startNotifications();
      characteristic.addEventListener(`${characteristic}valuechanged`, handler);
      console.log("Notifications enabled for:", characteristic.uuid);
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    }
  };

  const subscribeToNotifications = async (services) => {
    try {
      const buttonService = services.find(
        (service) => service.uuid === MicrobitUuid.buttonService[0]
      );
      if (!buttonService) {
        console.log("Button Service not found");
        return;
      }

      const buttonCharacteristic = await buttonService.getCharacteristic(
        MicrobitUuid.buttonAState[0]
      );
      await enableNotifications(buttonCharacteristic, handleButtonStateChanged);

      const lightService = services.find(
        (service) => service.uuid === MicrobitUuid.lightService[0]
      );
      if (!lightService) {
        console.log("Light Service not found");
        return;
      }

      const lightCharacteristic = await lightService.getCharacteristic(
        MicrobitUuid.lightLevel[0]
      );
      await enableNotifications(lightCharacteristic, handleLightStateChanged);
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
    }
  };

  const getServerandServices = async (device) => {
    try {
      console.log("Device:", device);
      console.log("Device Gatt:", device.server.connected);

      // If device is not connected (i.e., gatt is not set or connected), try reconnecting
      if (!device.server.connected) {
        console.log("Device is not connected. Connecting...");
        // await device.gatt.connect();
      } else {
        console.log("Device is already connected.");
      }

      // Retrieve the GATT server and services
      const server = device.server.device.gatt;
      const services = await server.getPrimaryServices();
      return { server, services };
    } catch (error) {
      console.error("Error connecting to device:", error);
    }
  };

  const startGame = async () => {
    const randomDevice = getRandomDevice(devices);
    if (!randomDevice) {
      console.error("No devices connected. Please connect a device");
      return;
    }

    try {
      const { server, services } = await getServerandServices(
        randomDevice.device
      );
      await subscribeToNotifications(services);

      setGameState({
        score: 0,
        timer: 5,
        round: 1,
        gameStarted: true,
        gameOver: false,
        randomDevice,
        server, // Store the GATT server here
        services,
      });

      console.log("Game started. Random device:", randomDevice);
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  };

  const nextRound = () => {
    if (round < 7) {
      const randomDevice = getRandomDevice(devices);

      if (!randomDevice) {
        console.error("No devices connected. Please connect a device");
        return;
      }
      const { server, services } = getServerandServices(randomDevice.device);
      setGameState((prev) => ({
        ...prev,
        round: prev.round + 1,
        timer: 5,
        randomDevice,
        server,
        services,
      }));
    } else {
      setGameState((prev) => ({ ...prev, gameOver: true }));
    }
  };

  const handleButtonStateChanged = (event) => {
    const value = event.target.value.getUint8(0);
    if (value === 1) {
      setGameState((prev) => ({ ...prev, score: prev.score + 1 }));
      nextRound();
    }
  };

  const handleLightStateChanged = (event) => {
    const value = event.target.value.getUint8(0);
    if (value < 10) {
      setGameState((prev) => ({ ...prev, score: prev.score + 1 }));
      nextRound();
    }
  };

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const countdown =
        timer > 0
          ? setInterval(
              () =>
                setGameState((prev) => ({ ...prev, timer: prev.timer - 1 })),
              1000
            )
          : null;

      if (timer === 0) {
        setGameState((prev) => ({ ...prev, score: prev.score - 2 }));
        nextRound();
      }

      return () => clearInterval(countdown);
    }
  }, [timer, gameStarted, gameOver]);

  const handleReconnect = async () => {
    // This function will be triggered by the reconnect button
    if (randomDevice) {
      try {
        const { server, services } = await getServerandServices(
          randomDevice.device
        );
        await subscribeToNotifications(services);
        setGameState((prev) => ({
          ...prev,
          server,
          services,
        }));
      } catch (error) {
        console.error("Error reconnecting to device:", error);
      }
    }
  };

  //   const handleReconnectNew = async () => {
  //     const reconnectedDevices = await reconnectDevices();
  //     console.log("Reconnected Devices:", reconnectedDevices);

  //     // You can now use the `reconnectedDevices` array
  //     // For example, to start the game with the reconnected devices
  //     if (reconnectedDevices.length > 0) {
  //       // Do something with the reconnected devices, like starting the game
  //     }
  //   };

  return (
    <div className="game-container">
      <h2>{gameType === "button" ? "Button Game" : "Light Sensor Game"}</h2>
      <ConnectedDevices />

      {!gameStarted ? (
        <div>
          <AnimatedButton onClick={startGame}>Start Game</AnimatedButton>
        </div>
      ) : gameOver ? (
        <div>
          <h3>Game Over!</h3>
          <p>Final Score: {score}</p>
        </div>
      ) : (
        <>
          <div className="score-board">
            <p>Round: {round} / 7</p>
            <p>Score: {score}</p>
            <p>Time Remaining: {timer}s</p>
          </div>
          <div className="hit-target">
            <p>
              {gameType === "button" ? "Press Button A" : "Cover Light Sensor"}
            </p>
            <p>Hello</p>
            {/* Show the reconnect button when there are no devices */}
            {/* {devices.length === 0 && !gameStarted && (
              <ReconnectButton />
            )} */}
            {/* {randomDevice && <ReconnectButton />} */}
          </div>
        </>
      )}
    </div>
  );
}
