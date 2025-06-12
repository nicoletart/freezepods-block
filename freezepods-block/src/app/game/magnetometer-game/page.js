import BackButton from "@/app/components/BackButton";
import MagnetometerPage from "../MagnetometerPage";

export default function MagnetometerGame() {
  return (
    <div>
      <BackButton />
      <div className="welcome-content">
       <MagnetometerPage />
      </div>
    </div>
  );
}