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

const getButtonCharacteristic = (buttonType) => {
  switch (buttonType) {
    case "A":
      return MicrobitUuid.buttonAState[0];
    case "B":
      return MicrobitUuid.buttonBState[0];
    default:
      return MicrobitUuid.buttonAState[0];
  }
};

const getSensorCharacteristic = (sensorType, button = null) => {
  switch (sensorType) {
    case "button":
      return button === "B"
        ? MicrobitUuid.buttonBState[0]
        : MicrobitUuid.buttonAState[0];
    case "accelerometer":
      return MicrobitUuid.accelerometerData[0];
    case "magnetometer":
      return MicrobitUuid.magnetometerData[0];
    case "temperature":
      return MicrobitUuid.temperature[0];
    case "lightSensor":
      return MicrobitUuid.uartTxCharacteristic[0];
    default:
      return MicrobitUuid.buttonAState[0];
  }
};

const getSensorService = (sensorType) => {
  switch (sensorType) {
    case "button":
      return MicrobitUuid.buttonService[0];
    case "accelerometer":
      return MicrobitUuid.accelerometerService[0];
    case "magnetometer":
      return MicrobitUuid.magnetometerService[0];
    case "temperature":
      return MicrobitUuid.temperatureService[0];
    case "lightSensor":
      return MicrobitUuid.uartService[0];
    default:
      return MicrobitUuid.buttonService[0];
  }
};

const getHandlerForSensor = (sensorType, handlers) => {
  const {
    handleButtonStateChanged,
    handleAccelerometerDataChanged,
    handleMagnetometerDataChanged,
    handleTemperatureChanged,
    handleUARTTxStateChanged,
  } = handlers;

  switch (sensorType) {
    case "button":
      return handleButtonStateChanged;
    case "accelerometer":
      return handleAccelerometerDataChanged;
    case "magnetometer":
      return handleMagnetometerDataChanged;
    case "temperature":
      return handleTemperatureChanged;
    case "lightSensor":
      return handleUARTTxStateChanged;
    default:
      return handleButtonStateChanged;
  }
};

export default function GamePage({ gameType }) {
  const { devices } = useDevices();
  let { timerLength, rounds, button, code } = useBlocklyContext();
  console.log(
    "Rounds:",
    rounds,
    "Timer Length:",
    timerLength,
    "Button:",
    button,
    "Code:",
    code
  );
  const [buttonState, setButtonState] = useState(MicrobitUuid.buttonAState[0]);
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

  useEffect(() => {
    try {
      if (!code) return;

      const thresholds = {
        accelerometer:
          code.match(/getaccelerometerValue\(\)\s*>=\s*(\d+)/)?.[1] || 2000,
        lightSensor: code.match(/getLightLevel\(\)\s*>\s*(\d+)/)?.[1] || 200,
        temperature: code.match(/getTemperature\(\)\s*>\s*(\d+)/)?.[1] || 25,
        magnetometer:
          code.match(/getMagnetometerValue\(\)\s*>\s*(\d+)/)?.[1] || 200000,
      };

      const scoreIncrement =
        code.match(/gameSetScore\(gameGetScore\(\)\s*\+\s*(\d+)\)/)?.[1] || 1;

      window.gameConfig = {
        thresholds,
        scoreIncrement: parseInt(scoreIncrement),
        rounds,
        timerLength,
        gameType,
      };

      window.gameSetScore = (score) => {
        setGameState((prev) => ({ ...prev, score }));
      };

      window.gameNextRound = () => {
        gameState.round = gameState.round + 1;
        setGameState((prev) => ({
          ...prev,
          round: gameState.round,
        }));
        nextRound();
      };

      window.gameGetRound = () => gameState.round;
      window.gameGetType = () => gameType;

      console.log("Game configuration set successfully", window.gameConfig);
    } catch (error) {
      console.error("Error parsing game configuration:", error);

      window.gameConfig = {
        thresholds: {
          accelerometer: 2000,
          lightSensor: 200,
          temperature: 25,
          magnetometer: 200000,
        },
        scoreIncrement: 1,
        rounds,
        timerLength,
        gameType,
      };
    }

    return () => {
      delete window.gameSetScore;
      delete window.gameNextRound;
      delete window.gameGetRound;
      delete window.gameGetType;
      delete window.gameConfig;
    };
  }, [code]);

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
            handleButtonStateChanged
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

  const handleSensorEvent = (event) => {
    if (
      !gameStarted ||
      gameOver ||
      localRound.current !== gameState.round ||
      !window.gameConfig
    )
      return;

    const config = window.gameConfig;
    let thresholdMet = false;

    switch (gameType) {
      case "accelerometer": {
        const accValue = event.target.value;
        const x = accValue.getInt16(0, true);
        const y = accValue.getInt16(2, true);
        const z = accValue.getInt16(4, true);
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        thresholdMet = magnitude > config.thresholds.accelerometer;
        break;
      }
      case "magnetometer": {
        const magValue = event.target.value;
        const magX = magValue.getInt16(0, true);
        const magY = magValue.getInt16(2, true);
        const magZ = magValue.getInt16(4, true);
        const magMagnitude = Math.sqrt(magX * magX + magY * magY + magZ * magZ);
        thresholdMet = magMagnitude > config.thresholds.magnetometer;
        break;
      }
      case "temperature": {
        const temp = event.target.value.getInt8(0);
        thresholdMet = temp > config.thresholds.temperature;
        break;
      }
      case "button": {
        const buttonValue = event.target.value.getUint8(0);
        thresholdMet = buttonValue === 1;
        break;
      }
      case "lightSensor": {
        const value = new TextDecoder().decode(event.target.value);
        const lightLevel = parseInt(value.trim(), 10);
        thresholdMet = lightLevel > config.thresholds.lightSensor;
        break;
      }
    }

    if (thresholdMet) {
      gameState.round = gameState.round + 1;
      setGameState((prev) => ({
        ...prev,
        score: prev.score + config.scoreIncrement,
        round: gameState.round,
      }));
      nextRound();
    }
  };

  const updateGameScore = () => {
    gameState.round = gameState.round + 1;
    setGameState((prev) => ({
      ...prev,
      score: prev.score + 1,
      round: gameState.round,
    }));
    nextRound();
  };

  const startNotifications = async (server, gameType) => {
    try {
      await stopNotifications();
      console.log("Game type:", gameType);

      if (gameType === "button") {
        const buttonService = await server.getPrimaryService(
          MicrobitUuid.buttonService[0]
        );
        if (!buttonService) {
          console.error("Button Service not found");
          return;
        }
        const buttonCharacteristic = await buttonService.getCharacteristic(
          getButtonCharacteristic(button)
        );
        console.log("Button Characteristic:", buttonCharacteristic);

        await enableNotificationsForService(
          buttonCharacteristic,
          handleButtonStateChanged
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
        console.log("UART Tx Characteristic:", uartTxCharacteristic);
        console.log("UART Rx Characteristic:", uartRxCharacteristic);

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
    const value = event.target.value;
    const x = value.getInt16(0, true);
    const y = value.getInt16(2, true);
    const z = value.getInt16(4, true);

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    if (magnitude > 2000 && localRound.current === gameState.round) {
      gameState.round = gameState.round + 1;
      setGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        round: gameState.round,
      }));
      nextRound();
    }
  };

  const handleMagnetometerDataChanged = (event) => {
    const value = event.target.value;
    const x = value.getInt16(0, true);
    const y = value.getInt16(2, true);
    const z = value.getInt16(4, true);

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    if (magnitude > 200000 && localRound.current === gameState.round) {
      gameState.round = gameState.round + 1;
      setGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        round: gameState.round,
      }));
      nextRound();
    }
  };

  const handleTemperatureChanged = (event) => {
    const value = event.target.value;
    const temperature = value.getInt8(0);

    if (temperature > 25 && localRound.current === gameState.round) {
      gameState.round = gameState.round + 1;
      setGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        round: gameState.round,
      }));
      nextRound();
    }
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
      console.log("Light sensor triggered. About to call next round");
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
      <h1>
        {gameType === "button"
          ? "Button Game"
          : gameType === "lightSensor"
          ? "Light Sensor Game"
          : gameType === "accelerometer"
          ? "Accelerometer Game"
          : gameType === "magnetometer"
          ? "Magnetometer Game"
          : gameType === "temperature"
          ? "Temperature Game"
          : "Sensor Game"}
      </h1>
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
              {gameType === "button"
                ? `Press Button ${button}`
                : gameType === "lightSensor"
                ? "Cover Light Sensor"
                : gameType === "accelerometer"
                ? "Shake the Micro:bit"
                : gameType === "magnetometer"
                ? "Move Near Magnet"
                : gameType === "temperature"
                ? "Warm the Sensor"
                : "Trigger the Sensor"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
