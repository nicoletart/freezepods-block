"use client";

import { use, useEffect, useState, useRef } from "react";
import { useDevices } from "../context/ConnectedDevicesContext";
import { MicrobitUuid } from "../components/MicrobitUuid";
import AnimatedButton from "../components/AnimatedButton";
import ConnectedDevicesList from "../components/ConnectedDevicesList";
import {
  lightUpDevice,
  turnOffDevice,
  readLightLevel,
} from "../components/LightDevice";
import { useBlocklyContext } from "../context/BlocklyContext";

export default function AccelerometerPage({ gameType }) {
  gameType = "accelerometer";
  const { devices } = useDevices();
  let { rounds, timerLength, button } = useBlocklyContext();
  console.log(
    "Rounds:",
    rounds,
    "Timer Length:",
    timerLength,
    "Button:",
    button
  );
  const [buttonState, setButtonState] = useState(MicrobitUuid.buttonAState[0]);
  const shakeThreshold = 2500;
  const shakeDebounce = 1000;
  const lastShakeValues = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeTime = useRef(0);

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

  const prevCharacteristicRef = useRef(null);
  const previousDeviceRef = useRef(null);
  const localRound = useRef(gameState.round);

  let deviceIndex = useRef(0);

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
    if (devices.length === 0) return null;

    deviceIndex.current = (deviceIndex.current + 1) % devices.length;
    return devices[deviceIndex.current];
  };

  useEffect(() => {
    console.log("Previous Characteristic:", prevCharacteristicRef.current);
  }, [prevCharacteristicRef.current]);

  useEffect(() => {
    setButtonState(
      button === "A"
        ? MicrobitUuid.buttonAState[0]
        : button === "B"
        ? MicrobitUuid.buttonBState[0]
        : MicrobitUuid.buttonAState[0]
    );
  }, [button]);

  useEffect(() => {
    localRound.current = gameState.round;
  }, [gameState.round]);

  const stopNotifications = async () => {
    if (prevCharacteristicRef.current) {
      console.log(
        "Stopping notifications for:",
        prevCharacteristicRef.current.uuid
      );
      try {
        await prevCharacteristicRef.current.stopNotifications();
        if (prevCharacteristicRef.current) {
          prevCharacteristicRef.current.removeEventListener(
            "characteristicvaluechanged",
            handleAccelerometerDataChanged
          );
          console.log("Notifications stopped and listener removed.");
        }
      } catch (error) {
        console.error("Error stopping notifications:", error);
      }
      prevCharacteristicRef.current = null;
    }
  };

  const enableNotifications = async (characteristic, handler) => {
    console.log(
      "Enabling notifications for characteristic:",
      characteristic.uuid
    );
    try {
      if (
        !(
          characteristic.properties.notify || characteristic.properties.indicate
        )
      ) {
        console.error(
          `Characteristic ${characteristic.uuid} does not support notifications.`
        );
        return;
      }
      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", handler);
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    }
  };

  const enableNotificationsForService = async (state, handler) => {
    console.log("Notifications:", state.properties);
    if (state.properties.notify || state.properties.indicate) {
      prevCharacteristicRef.current = state;
      await enableNotifications(state, handler);
      console.log(`Notifications enabled for ${state.uuid}`);
    } else {
      console.warn(`${state.uuid} does not support notifications.`);
    }
  };

  const startNotifications = async (server, gameType) => {
    try {
      await stopNotifications();
      console.log("GGame type:", gameType);
      if (gameType === "accelerometer") {
        const accelerometerService = await server.getPrimaryService(
          MicrobitUuid.accelerometerService[0]
        );
        if (!accelerometerService) {
          console.error("Accelerometer Service not found");
          return;
        }
        console.log("Accelerometer Service:", accelerometerService);
        const accelerometerDataCharacteristic =
          await accelerometerService.getCharacteristic(
            MicrobitUuid.accelerometerData[0]
          );
        console.log(
          "Accelerometer Data Characteristic:",
          accelerometerDataCharacteristic
        );
        await enableNotificationsForService(
          accelerometerDataCharacteristic,
          handleAccelerometerDataChanged
        );
      }

      if (gameType === "lightSensor") {
        const uartService = await server.getPrimaryService(
          MicrobitUuid.uartService[0]
        );
        if (!uartService) {
          console.error("UART Service not found");
          return;
        }
        console.log("UART Service:", uartService);

        const uartTxCharacteristic = await uartService.getCharacteristic(
          MicrobitUuid.uartTxCharacteristic[0]
        );

        const uartRxCharacteristic = await uartService.getCharacteristic(
          MicrobitUuid.uartRxCharacteristic[0]
        );
        console.log(
          "uartTxCharacteristic Characteristic:",
          uartTxCharacteristic
        );
        console.log(
          "uartRxCharacteristic Characteristic:",
          uartRxCharacteristic
        );

        await enableNotificationsForService(
          uartTxCharacteristic,
          handleUARTTxStateChanged
        );
      }
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
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
    for (const device of devices) {
      if (device.device.ledOn) {
        console.log("Turning off device:", device.device);
        await turnOffDevice(device.device);
      }
    }
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

      await startNotifications(server, gameType);
      console.log("Game started. Random device:", newRandomDevice);
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  };

  const endGame = async () => {
    setGameState((prev) => ({
      ...prev,
      timer: 5,
      round: 1,
      gameStarted: false,
      gameOver: true,
      randomDevice: null,
      server: null,
      services: null,
    }));
    if (previousDeviceRef.current) {
      console.log(
        "Turning off previous device:",
        previousDeviceRef.current.device
      );
      await turnOffDevice(previousDeviceRef.current.device);
    }
    previousDeviceRef.current = null;
    await stopNotifications();
  };

  const nextRound = async () => {
    console.log("Next Round", gameState.round, round);
    if (gameState.round > rounds) {
      console.log("Game Over!");
      endGame();
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

      await startNotifications(server, gameType);
    } catch (error) {
      console.error("Error during round setup:", error);
    }
  };

  const handleButtonStateChanged = (event) => {
    const value = event.target.value.getUint8(0);
    console.log("Button State Changed:", value);
    console.log("Local Round:", localRound.current);
    console.log("Game Round:", gameState.round);
    if (value === 1 && localRound.current === gameState.round) {
      gameState.round = gameState.round + 1;
      setGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        round: gameState.round,
      }));
      console.log("Button pressed. About to call next round");
      nextRound();
    }
  };

  const handleAccelerometerDataChanged = (event) => {
    const data = event.target.value;

    const x = data.getInt16(0, true);
    const y = data.getInt16(2, true);
    const z = data.getInt16(4, true);

    const deltaX = Math.abs(x - lastShakeValues.current.x);
    const deltaY = Math.abs(y - lastShakeValues.current.y);
    const deltaZ = Math.abs(z - lastShakeValues.current.z);
    const now = Date.now();

    if (
      deltaX + deltaY + deltaZ > shakeThreshold &&
      localRound.current === gameState.round &&
      now - lastShakeTime.current > shakeDebounce
    ) {
      console.log("Shake detected!");
      gameState.round = gameState.round + 1;

      setGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        round: gameState.round,
      }));
      nextRound();
      lastShakeTime.current = now;
    }
    lastShakeValues.current = { x, y, z };

    console.log(`X: ${x}, Y: ${y}, Z: ${z}`);
  };

  const handleUARTTxStateChanged = (event) => {
    const value = new TextDecoder().decode(event.target.value);
    const lightLevel = parseInt(value.trim(), 10);
    console.log("Light Level:", lightLevel);
    if (lightLevel > 200 && localRound.current === gameState.round) {
      gameState.round = gameState.round + 1;
      setGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        round: gameState.round,
      }));
      console.log("UART lit. About to call next round");
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
        console.log("Timer ran out. About to call next round");
        nextRound();
      }
      return () => {
        if (countdown) clearInterval(countdown);
      };
    }
  }, [timer, gameStarted, gameOver]);

  const handleDeviceState = async () => {
    if (!randomDevice) return;

    console.log("Handling device:", randomDevice.device);
    if (previousDeviceRef.current) {
      console.log(
        "Turning off previous device:",
        previousDeviceRef.current.device
      );
      await turnOffDevice(previousDeviceRef.current.device);
    }

    console.log("Lighting up the new device:", randomDevice.device);
    await lightUpDevice(randomDevice.device);
    previousDeviceRef.current = randomDevice;
  };

  useEffect(() => {
    handleDeviceState();
  }, [randomDevice]);

  return (
    <div className="game-container">
      <h1>{gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game</h1>
      <ConnectedDevicesList />

      {gameOver ? (
        <div>
          <h3>Game Over!</h3>
          <p>Final Score: {score}</p>
          <AnimatedButton onClick={startGame}>Start Game</AnimatedButton>
        </div>
      ) : !gameStarted ? (
        <div>
          <AnimatedButton onClick={startGame}>Start Game</AnimatedButton>
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
              Shake the Micro:bit to score points!
            </p>
          </div>
        </>
      )}
    </div>
  );
}
