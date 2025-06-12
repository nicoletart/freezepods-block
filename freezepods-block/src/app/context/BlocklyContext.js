"use client";
import React, { createContext, useState, useContext, useEffect } from "react";

const getStoredValue = (key, defaultValue) => {
  if (typeof window !== "undefined") {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) return defaultValue;

    try {
      return JSON.parse(storedValue);
    } catch (e) {
      return storedValue;
    }
  }
  return defaultValue;
};

const BlocklyContext = createContext();

export const BlocklyProvider = ({ children }) => {
  const [rounds, setRounds] = useState(5);
  const [timerLength, setTimerLength] = useState(5);
  const [button, setButton] = useState("A");
  const [code, setCode] = useState("");
  const [sensorThresholds, setSensorThresholds] = useState({
    accelerometer: 2000,
    lightSensor: 200,
    temperature: 25,
    magnetometer: 200000,
  });
  const [scoreIncrement, setScoreIncrement] = useState(1);

  useEffect(() => {
    const storedRounds = getStoredValue("rounds", 5);
    const storedTimerLength = getStoredValue("timerLength", 5);
    const storedButton = getStoredValue("button", "A");
    const storedThresholds = getStoredValue("sensorThresholds", {
      accelerometer: 2000,
      lightSensor: 200,
      temperature: 25,
      magnetometer: 200000,
    });
    const storedScoreIncrement = getStoredValue("scoreIncrement", 1);
    const code = getStoredValue("code", "");

    setRounds(storedRounds);
    setTimerLength(storedTimerLength);
    setButton(storedButton);
    setSensorThresholds(storedThresholds);
    setScoreIncrement(storedScoreIncrement);
    setCode(code);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rounds", JSON.stringify(rounds));
      localStorage.setItem("timerLength", JSON.stringify(timerLength));
      localStorage.setItem("button", JSON.stringify(button));
      localStorage.setItem(
        "sensorThresholds",
        JSON.stringify(sensorThresholds)
      );
      localStorage.setItem("scoreIncrement", JSON.stringify(scoreIncrement));
      localStorage.setItem("code", JSON.stringify(code));
    }
  }, [rounds, timerLength, button, sensorThresholds, scoreIncrement, code]);

  return (
    <BlocklyContext.Provider
      value={{
        rounds,
        setRounds,
        timerLength,
        setTimerLength,
        button,
        setButton,
        code,
        setCode,
        sensorThresholds,
        setSensorThresholds,
        scoreIncrement,
        setScoreIncrement,
      }}
    >
      {children}
    </BlocklyContext.Provider>
  );
};

export const useBlocklyContext = () => {
  const context = useContext(BlocklyContext);
  return context;
};
