import BackButton from "@/app/components/BackButton";
import BlocklyComponent from "@/app/components/BlocklyComponent";

export default function GameSettings() {
  return (
    <div>
      <BackButton />
      <div className="welcome-content" style={{ gap: "10px" }}>
        <h1>
          Choose the game settings using <b>Blockly</b>
        </h1>
        <BlocklyComponent />
      </div>
    </div>
  );
}
