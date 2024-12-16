import Navigation from "./components/Navigation";

export default function Home() {
  return (
    <div>
      <Navigation />
      <div className="welcome-content">
        <h1>Welcome to Freezepods</h1>
      </div>
    </div>
  );
}
