import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Slimme AI Agenda</h1>
      <Link href="/calendar" className="inline-block rounded-2xl px-4 py-2 bg-brand text-white hover:bg-brand-hover">
        Open agenda
      </Link>
    </main>
  );
}
