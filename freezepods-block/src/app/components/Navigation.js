import Link from "next/link";

export default function Navigation() {
  return (
    <div className="navigation">
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/profile">Profile</Link>
    </div>
  );
}
