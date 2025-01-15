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
          <AnimatedButton href="/game/button-game">Button Game</AnimatedButton>

          <div className="light-sensor-button-container">
            <AnimatedButton className="light-sensor-button">
              Light Sensor Game
            </AnimatedButton>
            <span style={{ display: "block", fontSize: "12px", color: "gray", marginTop: "5px" }}>
              Coming soon!
            </span>
          </div>
        </div>
      </div>
      <div>
        <AnimatedButton href="/game/game-settings" className="blockly-button">
          Game Settings
        </AnimatedButton>
      </div>
    </div>
  );
}
