import BackButton from "@/app/components/BackButton";
import ReactionPage from "../ReactionPage";

export default function ReactionGame() {
  return (
    <div>
      <BackButton />
      <div className="welcome-content">
        <ReactionPage gameType="button" />
      </div>
    </div>
  );
}
