import Navigation from "./components/Navigation";

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Navigation />
      <div
        className="welcome-content"
        style={{ textAlign: "center", maxWidth: "500px", gap: "20px" }}
      >
        <h1>Welcome to Freezepods</h1>
        <p>
          Freezepods is an interactive platform where students are able to
          design and build custom games using Blockly and Micro:bits. The
          application provides a fun and educational way to learn coding while
          interacting with new electronic devices.
        </p>
      </div>
    </div>
  );
}
