"use client";
import Navigation from "../components/Navigation";
import AnimatedButton from "../components/AnimatedButton";

export default function Game() {
  return (
    <div className="welcome-content" style={{ gap: "40px" }}>
      <Navigation />
      <div>
        <h2>Choose Your Game</h2>

        <div className="game-buttons">
          <AnimatedButton href="/button-game">Button Game</AnimatedButton>
          <AnimatedButton href="/light-sensor-game">
            Light Sensor Game
          </AnimatedButton>
        </div>
      </div>
      <div>
        <h2>Game Settings</h2>
        <AnimatedButton href="/blockly-workspace" className="blockly-button">
          Blockly Workspace
        </AnimatedButton>
      </div>
    </div>
  );
}
