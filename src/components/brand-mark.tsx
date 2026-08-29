export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid size-10 shrink-0 place-items-center rounded-[0.9rem] bg-[var(--yellow)] shadow-[0_8px_22px_rgba(173,109,28,0.22)]">
        <svg aria-hidden="true" viewBox="0 0 28 28" className="size-6" fill="none">
          <path d="M21.65 5.76C14.4 5.9 9.07 9.72 8.2 16.41c-.37 2.85 1.8 5.33 4.65 5.02 6.62-.72 9.15-7.39 8.8-15.67Z" fill="#496747" />
          <path d="M6.35 8.4c4.36.12 7.53 2.43 8.04 6.45.21 1.72-1.09 3.21-2.8 3.02-3.98-.44-5.48-4.45-5.24-9.47Z" fill="#789271" />
          <path d="M7.4 22.3c2.6-5.03 5.92-8.16 10.62-10.64" stroke="#35533b" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <div>
          <p className="font-display text-[1.65rem] leading-none font-semibold tracking-[-0.045em]">Green Days</p>
          <p className="mt-1 text-[0.67rem] font-semibold tracking-[0.13em] text-[var(--muted)] uppercase">Guarda la vida</p>
        </div>
      )}
    </div>
  );
}
