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

export default function ReactionPage({ gameType }) {
  const { devices } = useDevices();
  let { rounds, timerLength, button, code } = useBlocklyContext();
  console.log("Code:", code);
  const rankings = useRef([]);
  const topThreeRankings = useRef({ button: [], accelerometer: [] });
  console.log(
    "Rounds:",
    rounds,
    "Timer Length:",
    timerLength,
    "Button:",
    button
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
  const startTime = useRef(null);
  const shakeThreshold = 4500;
  const shakeDebounce = 1000;
  const lastShakeValues = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeTime = useRef(0);

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

  const formatTime = (time) => {
    return time < 1000 ? `${time} ms` : `${(time / 1000).toFixed(2)} s`;
  };

  useEffect(() => {
    topThreeRankings.current = JSON.parse(
      localStorage.getItem("topThreeRankings")
    ) || {
      button: [],
      accelerometer: [],
    };
  }, []);

  useEffect(() => {
    console.log("Rankings:", rankings.current);
    if (rankings.current.length > 0) {
      const lastTime = rankings.current[rankings.current.length - 1];
      console.log("Last Time:", lastTime);
      if (
        topThreeRankings.current[gameType].length < 3 ||
        lastTime < Math.max(...topThreeRankings.current[gameType])
      ) {
        topThreeRankings.current[gameType] = [
          ...topThreeRankings.current[gameType],
          lastTime,
        ]
          .sort((a, b) => a - b)
          .slice(0, 3);
        localStorage.setItem(
          "topThreeRankings",
          JSON.stringify(topThreeRankings.current)
        );
        console.log(
          `Top 3 Rankings for :${gameType}`,
          topThreeRankings.current[gameType]
        );
      }
    }
  }, [rankings.current.length]);

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

  const eventHandler = (event, code) => {
    const runCode = new Function('event', code);
    runCode(event);
  };

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
      if (gameType === "button") {
        const buttonService = await server.getPrimaryService(
          MicrobitUuid.buttonService[0]
        );
        if (!buttonService) {
          console.error("Button Service not found");
          return;
        }
        const buttonCharacteristic = await buttonService.getCharacteristic(
          buttonState
        );
        console.log("Button Characteristic:", buttonCharacteristic);

        await enableNotificationsForService(
          buttonCharacteristic,
          handleButtonStateChanged
        );
      }

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
      lastShakeValues.current = { x: 0, y: 0, z: 0 };

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
    rankings.current = [];
    localRound.current = 1;
    startTime.current = null;
    lastShakeValues.current = { x: 0, y: 0, z: 0 };
    console.log("Game Over!");
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
      console.log("ss:", startTime.current);
      if (startTime.current) {
        const reactionTime = Date.now() - startTime.current;
        console.log("Reaction Time:", reactionTime);
        rankings.current.push(reactionTime);
        gameState.round = gameState.round + 1;
        setGameState((prev) => ({
          ...prev,
          score: prev.score + 1,
          round: gameState.round,
        }));
        startTime.current = null;
        console.log("Button pressed. About to call next round");
        nextRound();
      }
    }
  };

  const calculateShake = (x, y, z) => {
    return Math.abs(x - lastShakeValues.current.x) + Math.abs(y - lastShakeValues.current.y) + Math.abs(z - lastShakeValues.current.z);
  };

  const handleAccelerometerDataChanged = (event) => {
    const data = event.target.value;
    const x = data.getInt16(0, true);
    const y = data.getInt16(2, true);
    const z = data.getInt16(4, true);
    
    const now = Date.now();
    const shake = calculateShake(x, y, z);
    
    // Only process shake if we're waiting for a reaction
    if (startTime.current && shake > shakeThreshold && localRound.current === gameState.round) {
      console.log("Shake detected!");
      const reactionTime = now - startTime.current;
      rankings.current.push(reactionTime);
      gameState.round = gameState.round + 1;

      setGameState((prev) => ({
        ...prev,
        score: prev.score + 1,
        round: gameState.round,
      }));
      startTime.current = null;
      lastShakeValues.current = { x, y, z };
      nextRound();
    }
    
    lastShakeValues.current = { x, y, z };
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
    const randomTimeout = Math.floor(Math.random() * 5000) + 1000;

    console.log(
      `Waiting for ${randomTimeout}ms before lighting up the device...`
    );
    await new Promise((resolve) => setTimeout(resolve, randomTimeout));

    console.log("Lighting up the new device:", randomDevice.device);
    await lightUpDevice(randomDevice.device);
    startTime.current = Date.now();
    previousDeviceRef.current = randomDevice;
  };

  useEffect(() => {
    handleDeviceState();
  }, [randomDevice]);

  return (
    <div className="game-container">
      <h1>Reaction Time</h1>
      <ConnectedDevicesList />

      {gameOver ? (
        <div>
          <h3>Game Over!</h3>
          <>
            <strong>All Time Top 3 Best Times For {gameType} Mode: </strong>
            <p>
              {topThreeRankings.current[gameType]
                .slice(0, 3)
                .map((time, _) => formatTime(time))
                .join(", ")}
            </p>
          </>

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
              <strong>Round:</strong> {round} / {rounds}
            </p>
            {rankings.current.length > 0 && (
              <>
                <p>
                  <strong>Reaction Time:</strong>{" "}
                  {formatTime(rankings.current[rankings.current.length - 1])}
                </p>
                {rankings.current.length > 1 && (
                  <>
                    <p>
                      <strong>Best Time (Round):</strong>{" "}
                      {formatTime(Math.min(...rankings.current))}
                    </p>
                    <p>
                      <strong>Worst Time (Round):</strong>{" "}
                      {formatTime(Math.max(...rankings.current))}
                    </p>
                    <p>
                      <strong>Average Time:</strong>{" "}
                      {formatTime(
                        rankings.current.reduce((a, b) => a + b, 0) /
                          rankings.current.length
                      )}
                    </p>
                  </>
                )}
              </>
            )}
          </div>
          <div className="hit-target">
            <p>
              {!startTime.current ? (
                "Wait for the device to light up..."
              ) : gameType === "button" ? (
                `Quickly press Button ${button} when the light appears!`
              ) : gameType === "accelerometer" ? (
                "Quickly shake the device when the light appears!"
              ) : (
                "Get ready..."
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
