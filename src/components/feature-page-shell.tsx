import type { ReactNode } from "react";

type FeaturePageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function FeaturePageShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: FeaturePageShellProps) {
  return (
    <main className="pb-28 pt-9 lg:pb-14 lg:pt-14">
      <div className="mx-auto w-full max-w-[92rem] px-5 sm:px-8 lg:px-12">
        <header className="mb-9 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
          <div className="max-w-3xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brown)]">
              {eyebrow}
            </p>
            <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              {description}
            </p>
          </div>
          {action}
        </header>

        {children}
      </div>
    </main>
  );
}
