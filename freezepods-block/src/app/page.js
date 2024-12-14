import Navigation from "./components/Navigation";

export default function Home() {
  return (
    <div>
      <Navigation />
      <div className="welcome-content">
        <h1>Welcome to the Home Page</h1>
      </div>
    </div>
  );
}
