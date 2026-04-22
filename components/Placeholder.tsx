import Link from 'next/link';

export default function Placeholder({
  title,
  backHref,
  backLabel,
}: {
  title: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <main className="min-h-[100dvh] bg-black text-white p-6 max-w-lg mx-auto">
      <Link href={backHref} className="text-xs text-zinc-500">
        ← {backLabel}
      </Link>
      <div className="mt-20 text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h1 className="text-xl font-serif">{title}</h1>
        <p className="text-sm text-zinc-500 mt-2">Phase 2 功能 · 建设中</p>
      </div>
    </main>
  );
}
