"use client";

import { use, useEffect, useState, useRef } from "react";
import { useDevices } from "../context/ConnectedDevicesContext";
import { MicrobitUuid } from "../components/MicrobitUuid";
import ReconnectButton from "../components/ReconnectButton";
import AnimatedButton from "../components/AnimatedButton";
import ConnectedDevicesList from "../components/ConnectedDevicesList";
import { lightUpDevice, turnOffDevice } from "../components/LightDevice";
import { useRounds } from "../context/BlocklyContext";

export default function GamePage({ gameType }) {
  const { devices, reconnectDevices, ready } = useDevices();
  let { rounds, timerLength } = useRounds();

  const [gameState, setGameState] = useState({
    score: 0,
    timer: 5,
    round: 1,
    gameStarted: false,
    gameOver: false,
    randomDevice: null,
    server: null,
    services: null,
  });

  const [previousDevice, setPreviousDevice] = useState(null);
  const prevCharacteristicRef = useRef(null);

  let index = 0;

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

  const getRandomDevice = (devices) => {
    if (index === 0) {
      index = 1;
      return devices[1];
    } else {
      index = 0;
      return devices[0];
    }
  };

  useEffect(() => {
    console.log("Previous Characteristic:", prevCharacteristicRef.current);
  }, [prevCharacteristicRef.current]);

  const stopNotifications = async () => {
    if (prevCharacteristicRef.current) {
      console.log(
        "Stopping notifications for characteristic:",
        prevCharacteristicRef.current.uuid
      );
      await prevCharacteristicRef.current.stopNotifications();
      prevCharacteristicRef.current.removeEventListener(
        "characteristicvaluechanged",
        handleButtonStateChanged
      );
    }
  };

  const enableNotifications = async (characteristic, handler) => {
    console.log("Enabling notifications for:", characteristic);
    try {
      if (!characteristic.properties.notify) {
        console.error(
          `Characteristic ${characteristic.uuid} does not support notifications.`
        );
        return;
      }
      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", handler);
      console.log("Notifications enabled for:", characteristic.uuid);
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    }
  };

  const subscribeToNotifications = async (server) => {
    try {
      const buttonService = await server.getPrimaryService(
        MicrobitUuid.buttonService[0]
      );
      const buttonCharacteristic = await buttonService.getCharacteristic(
        MicrobitUuid.buttonAState[0]
      );

      await stopNotifications();

      console.log("Button Characteristic:", buttonCharacteristic);
      if (buttonCharacteristic.properties.notify) {
        prevCharacteristicRef.current = buttonCharacteristic;
        await enableNotifications(
          buttonCharacteristic,
          handleButtonStateChanged
        );
      } else {
        console.warn(
          `Button characteristic ${buttonCharacteristic.uuid} does not support notifications.`
        );
      }
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
    }

    const ledService = await server.getPrimaryService(
      MicrobitUuid.ledService[0]
    );
    if (!ledService) {
      console.error("!!!!LED Service not found");
      return;
    }
    console.log("!!!!LED Service:", ledService);

    const ledMatrixState = await ledService.getCharacteristic(
      MicrobitUuid.ledMatrixState[0]
    );
    console.log("!!!!!!LED Matrix State Characteristic:", ledMatrixState);

    if (ledMatrixState.properties.notify) {
      prevCharacteristicRef.current = ledMatrixState;
      await enableNotifications(ledMatrixState, handleLEDStateChanged);
    } else {
      console.warn(
        `!!!!!!LED matrix state characteristic ${ledMatrixState.uuid} does not support notifications.`
      );
    }
  };

  const getServerAndServices = async (device) => {
    try {
      console.log("Device:", device);
      if (!device.server.connected) {
        console.log("Device is not connected. Connecting...");
      } else {
        console.log("Device is already connected.");
      }

      const server = device.server.device.gatt;
      const services = device.services;
      return { server, services };
    } catch (error) {
      console.error("Error connecting to device:", error);
    }
  };

  const startGame = async () => {
    const newRandomDevice = getRandomDevice(devices);
    if (!newRandomDevice) {
      console.error("No devices connected. Please connect a device");
      return;
    }
    console.log("Random Device selected:", newRandomDevice);

    try {
      const { server, services } = await getServerAndServices(
        newRandomDevice.device
      );
      setGameState({
        score: 0,
        timer: timerLength,
        round: 1,
        gameStarted: true,
        gameOver: false,
        randomDevice: newRandomDevice,
        server,
        services,
      });

      await subscribeToNotifications(server);
      console.log("Game started. Random device:", newRandomDevice);
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  };

  const nextRound = async () => {
    console.log("Next Round", gameState.round, round);
    if (gameState.round > rounds) {
      console.log("Game Over!");
      setGameState((prev) => ({ ...prev, gameOver: true }));
      return;
    }

    const newRandomDevice = getRandomDevice(devices);
    if (!newRandomDevice) {
      console.log("No device found, returning...");
      return;
    }

    setGameState((prev) => ({
      ...prev,
      timer: timerLength,

      randomDevice: newRandomDevice,
      server,
      services,
    }));

    await stopNotifications();

    try {
      const { server, services } = await getServerAndServices(
        newRandomDevice.device
      );
      setGameState((prev) => ({
        ...prev,
        server,
        services,
      }));

      await subscribeToNotifications(server);
    } catch (error) {
      console.error("Error during round setup:", error);
    }
  };

  const handleButtonStateChanged = (event) => {
    const value = event.target.value.getUint8(0);
    if (value === 1) {
      gameState.round = gameState.round + 1;
      setGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        round: gameState.round,
      }));
      nextRound();
    }
  };

  const handleLEDStateChanged = (event) => {
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
        gameState.round = gameState.round + 1;
        setGameState((prev) => ({
          ...prev,
          score: prev.score - 2,
          round: gameState.round,
        }));
        nextRound();
      }

      if (gameOver) {
        clearInterval(countdown);
        setGameState((prev) => ({ ...prev, timer: 0 }));
      }

      return () => {
        if (countdown) clearInterval(countdown);
      };
    }
  }, [timer, gameStarted, gameOver]);

  const handleDeviceState = async () => {
    if (!randomDevice) return;

    console.log("Handling device:", randomDevice.device);

    if (previousDevice) {
      console.log("Turning off previous device:", previousDevice.device);
      await turnOffDevice(previousDevice.device);
    }

    console.log("Lighting up the new device:", randomDevice.device);
    await lightUpDevice(randomDevice.device);
    setPreviousDevice(randomDevice);
  };

  useEffect(() => {
    handleDeviceState();
  }, [randomDevice, previousDevice]);

  return (
    <div className="game-container">
      <h1>{gameType === "button" ? "Button Game" : "Light Sensor Game"}</h1>
      <ConnectedDevicesList />

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
            <p>
              Round: {round} / {rounds}
            </p>
            <p>Score: {score}</p>
            <p>Time Remaining: {timer}s</p>
          </div>
          <div className="hit-target">
            <p>
              {gameType === "button" ? "Press Button A" : "Cover Light Sensor"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
