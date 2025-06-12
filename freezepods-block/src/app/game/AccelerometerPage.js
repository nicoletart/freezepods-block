"use client";

import { useEffect, useState, useRef } from "react";
import { useDevices } from "../context/ConnectedDevicesContext";
import { MicrobitUuid } from "../components/MicrobitUuid";
import AnimatedButton from "../components/AnimatedButton";
import ConnectedDevicesList from "../components/ConnectedDevicesList";
import { lightUpDevice, turnOffDevice } from "../components/LightDevice";
import { useBlocklyContext } from "../context/BlocklyContext";

export default function AccelerometerPage() {
  const { devices } = useDevices();
  const { rounds, timerLength, sensorThresholds, scoreIncrement } =
    useBlocklyContext();

  const [gameState, setGameState] = useState({
    score: 0,
    timer: timerLength || 5,
    round: 1,
    gameStarted: false,
    gameOver: false,
    randomDevice: null,
    server: null,
  });

  const prevCharacteristicRef = useRef(null);
  const previousDeviceRef = useRef(null);
  const localRound = useRef(gameState.round);
  const lastShakeTime = useRef(0);
  const lastShakeValues = useRef({ x: 0, y: 0, z: 0 });
  const deviceIndex = useRef(0);
  const shakeDebounce = 1000;

  const { score, timer, round, gameStarted, gameOver, randomDevice, server } =
    gameState;

  useEffect(() => {
    localRound.current = gameState.round;
  }, [gameState.round]);

  const getRandomDevice = (devices) => {
    if (devices.length === 0) return null;
    deviceIndex.current = (deviceIndex.current + 1) % devices.length;
    return devices[deviceIndex.current];
  };

  const stopNotifications = async () => {
    if (prevCharacteristicRef.current) {
      try {
        await prevCharacteristicRef.current.stopNotifications();
        prevCharacteristicRef.current.removeEventListener(
          "characteristicvaluechanged",
          handleAccelerometerDataChanged
        );
      } catch (error) {
        console.error("Error stopping notifications:", error);
      }
      prevCharacteristicRef.current = null;
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
      deltaX + deltaY + deltaZ > sensorThresholds.accelerometer &&
      localRound.current === gameState.round &&
      now - lastShakeTime.current > shakeDebounce
    ) {
      gameState.round = gameState.round + 1;
      setGameState((prev) => ({
        ...prev,
        score: prev.score + scoreIncrement,
        round: gameState.round,
      }));
      nextRound();
      lastShakeTime.current = now;
    }

    lastShakeValues.current = { x, y, z };
  };

  const startNotifications = async (server) => {
    try {
      await stopNotifications();

      const accelerometerService = await server.getPrimaryService(
        MicrobitUuid.accelerometerService[0]
      );

      const accelerometerDataCharacteristic =
        await accelerometerService.getCharacteristic(
          MicrobitUuid.accelerometerData[0]
        );

      prevCharacteristicRef.current = accelerometerDataCharacteristic;
      await accelerometerDataCharacteristic.startNotifications();
      accelerometerDataCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleAccelerometerDataChanged
      );
    } catch (error) {
      console.error("Error starting notifications:", error);
    }
  };

  const startGame = async () => {
    for (const device of devices) {
      if (device.device.ledOn) {
        await turnOffDevice(device.device);
      }
    }

    const newRandomDevice = getRandomDevice(devices);
    if (!newRandomDevice) {
      console.error("No devices connected");
      return;
    }

    try {
      const server = newRandomDevice.device.server.device.gatt;

      setGameState({
        score: 0,
        timer: timerLength || 5,
        round: 1,
        gameStarted: true,
        gameOver: false,
        randomDevice: newRandomDevice,
        server: server,
      });

      await startNotifications(server);
      await lightUpDevice(newRandomDevice.device);
      previousDeviceRef.current = newRandomDevice;
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const endGame = async () => {
    setGameState((prev) => ({
      ...prev,
      timer: timerLength || 5,
      round: 1,
      gameStarted: false,
      gameOver: true,
      randomDevice: null,
      server: null,
    }));

    if (previousDeviceRef.current) {
      await turnOffDevice(previousDeviceRef.current.device);
      previousDeviceRef.current = null;
    }

    await stopNotifications();
  };

  const nextRound = async () => {
    if (gameState.round > rounds) {
      endGame();
      return;
    }

    const newRandomDevice = getRandomDevice(devices);
    if (!newRandomDevice) return;

    try {
      const server = newRandomDevice.device.server.device.gatt;

      setGameState((prev) => ({
        ...prev,
        timer: timerLength || 5,
        randomDevice: newRandomDevice,
        server: server,
      }));

      await stopNotifications();
      await startNotifications(server);

      if (previousDeviceRef.current) {
        await turnOffDevice(previousDeviceRef.current.device);
      }
      await lightUpDevice(newRandomDevice.device);
      previousDeviceRef.current = newRandomDevice;
    } catch (error) {
      console.error("Error during round setup:", error);
    }
  };

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const countdown =
        timer > 0
          ? setInterval(() => {
              setGameState((prev) => ({ ...prev, timer: prev.timer - 1 }));
            }, 1000)
          : null;

      if (timer === 0) {
        gameState.round = gameState.round + 1;
        setGameState((prev) => ({
          ...prev,
          score: Math.max(0, prev.score - 2),
          round: gameState.round,
        }));
        nextRound();
      }

      return () => {
        if (countdown) clearInterval(countdown);
      };
    }
  }, [timer, gameStarted, gameOver]);

  return (
    <div className="game-container">
      <h1>Accelerometer Game</h1>
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
            <p>Shake the Micro:bit to score points!</p>
          </div>
        </>
      )}
    </div>
  );
}
