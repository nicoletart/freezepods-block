"use client";
import React, { createContext, useState, useContext, useEffect } from "react";

const BlocklyContext = createContext();

export const BlocklyProvider = ({ children }) => {
  const [rounds, setRounds] = useState(() => {
    const storedRounds = localStorage.getItem("rounds");
    return storedRounds ? parseInt(storedRounds, 10) : 5;
  });

  const [timerLength, setTimerLength] = useState(() => {
    const storedTimerLength = localStorage.getItem("timerLength");
    return storedTimerLength ? parseInt(storedTimerLength, 10) : 5;
  });

  const [button, setButton] = useState(() => {
    const storedButton = localStorage.getItem("button");
    return storedButton || "A";
  });

  useEffect(() => {
    localStorage.setItem("rounds", rounds);
  }, [rounds]);

  useEffect(() => {
    localStorage.setItem("timerLength", timerLength);
  }, [timerLength]);

  useEffect(() => {
    localStorage.setItem("button", button);
  }, [button]);

  return (
    <BlocklyContext.Provider
      value={{
        rounds,
        setRounds,
        timerLength,
        setTimerLength,
        button,
        setButton,
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