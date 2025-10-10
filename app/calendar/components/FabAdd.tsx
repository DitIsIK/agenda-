"use client";

interface FabAddProps {
  onClick: () => void;
}

export function FabAdd({ onClick }: FabAddProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-soft transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/40"
      aria-label="Nieuw event"
    >
      +
    </button>
  );
}
