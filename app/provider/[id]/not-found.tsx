import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl text-ink-900 mb-3">404</h1>
      <p className="text-ink-500 mb-6">Bu icraçı tapılmadı.</p>
      <Link href="/" className="text-caspian-600 hover:underline">
        ← Kataloga qayıt
      </Link>
    </main>
  );
}
