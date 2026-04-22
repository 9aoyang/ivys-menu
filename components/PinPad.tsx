'use client';

export default function PinPad({ onKey }: { onKey: (d: string) => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {keys.map((k, i) => (
        <button
          key={i}
          disabled={!k}
          onClick={() => k && onKey(k)}
          className={`aspect-[1.5/1] rounded-xl text-xl font-mono ${
            k ? 'bg-zinc-800 active:bg-zinc-700 text-white' : 'opacity-0'
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  );
}
