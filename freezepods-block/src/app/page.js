import Navigation from "./components/Navigation";
import BlocklyComponent from "./components/BlocklyComponent"; // Import the Blockly component

export default function Home() {
  return (
    <div>
      <Navigation />
      <div className="welcome-content">
        <h1>Welcome to the Home Page</h1>
        <BlocklyComponent />
      </div>
    </div>
  );
}
