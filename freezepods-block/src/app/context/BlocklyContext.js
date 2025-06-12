"use client";
import React, { createContext, useState, useContext, useEffect } from "react";

// Function to handle client-side localStorage
const getStoredValue = (key, defaultValue) => {
  if (typeof window !== "undefined") {  // Ensure code only runs in the browser
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) return defaultValue;  // No value in localStorage, return default

    try {
      return JSON.parse(storedValue);  // Try parsing the stored value
    } catch (e) {
      // If parsing fails, return the raw value (for strings/numbers)
      return storedValue;
    }
  }
  return defaultValue;
};

const BlocklyContext = createContext();

export const BlocklyProvider = ({ children }) => {
  const [rounds, setRounds] = useState(5);  // Default 5 rounds
  const [timerLength, setTimerLength] = useState(5);  // Default 5 seconds
  const [button, setButton] = useState("A");  // Default button A
  const [code, setCode] = useState("");  // Default empty code

  // This effect runs only once after the component is mounted in the browser
  useEffect(() => {
    const storedRounds = getStoredValue("rounds", 5);
    const storedTimerLength = getStoredValue("timerLength", 5);
    const storedButton = getStoredValue("button", "A");
    const code = getStoredValue("code", "");

    setRounds(storedRounds);
    setTimerLength(storedTimerLength);
    setButton(storedButton);
    setCode(code);
    console.log("new code", code);
  }, []); // Empty dependency array ensures it only runs on mount

  // Sync with localStorage whenever the values change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rounds", JSON.stringify(rounds));
      localStorage.setItem("timerLength", JSON.stringify(timerLength));
      localStorage.setItem("button", JSON.stringify(button));
      localStorage.setItem("code", JSON.stringify(code));
    }
  }, [rounds, timerLength, button]);

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
