"use client";
import React, { createContext, useState, useContext } from "react";

const BlocklyContext = createContext();

export const BlocklyProvider = ({ children }) => {
  const [rounds, setRounds] = useState(5);
  const [timerLength, setTimerLength] = useState(5);

  return (
    <BlocklyContext.Provider value={{ rounds, setRounds, timerLength, setTimerLength }}>
      {children}
    </BlocklyContext.Provider>
  );
};

export const useRounds = () => useContext(BlocklyContext);
