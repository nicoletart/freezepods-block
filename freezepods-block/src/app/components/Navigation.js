"use client";
import Link from "next/link";
import { useDevices } from "../context/ConnectedDevicesContext";

export default function Navigation() {
  const { devices } = useDevices();
  const isGameEnabled = devices.length >= 2;

  return (
    <div className="navigation">
      <Link href="/">Home</Link>
      <Link href="/devices">Devices</Link>
      <Link href="/profile">Profile</Link>

      <div className="game-link-container">
        <Link
          href="/game"
          className={`game-link ${!isGameEnabled ? "disabled" : ""}`}
        >
          Game
        </Link>
        {!isGameEnabled && (
          <span className="tooltip">
            Connect to at least 2 Micro:bits to play
          </span>
        )}
      </div>
    </div>
  );
}
