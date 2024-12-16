import BackButton from "@/app/components/BackButton";
import GamePage from "../GamePage";

export default function ButtonGame() {
  return (
    <div>
      <BackButton />
      <div className="welcome-content">
        <GamePage gameType="button" />
      </div>
    </div>
  );
}
