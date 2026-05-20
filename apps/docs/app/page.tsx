import Link from "next/link";

const title = "Better Auth Docs Discord Bot";
const description = "Discord bot for better auth";

export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link href="/docs">Open docs</Link>
    </main>
  );
}
