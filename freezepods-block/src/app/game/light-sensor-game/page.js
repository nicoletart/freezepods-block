import BackButton from "@/app/components/BackButton";
import GamePage from "../GamePage";

export default function LightSensorGame() {
  return (
    <div>
      <BackButton />
      <div className="welcome-content">
        <GamePage gameType="light-sensor" />
      </div>
    </div>
  );
}
