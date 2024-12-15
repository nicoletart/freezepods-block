import BackButton from "@/app/components/BackButton";
import GamePage from "../GamePage";

export default function ButtonGame() {
  return (
    <div>
      <BackButton />
      <div className="welcome-content">
        <h1>Button Game Page</h1>
        <p>This is the Button Game page.</p>
        <GamePage gameType="button" />;
      </div>
    </div>
  );
}
