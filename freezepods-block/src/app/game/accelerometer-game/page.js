import BackButton from "@/app/components/BackButton";
import AccelerometerPage from "../AccelerometerPage";

export default function ButtonGame() {
  return (
    <div>
      <BackButton />
      <div className="welcome-content">
        <AccelerometerPage />
      </div>
    </div>
  );
}
