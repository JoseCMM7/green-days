import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div className="absolute -top-28 -left-24 size-96 rounded-full bg-[var(--yellow)]/25 blur-3xl" />
      <div className="absolute -right-24 -bottom-24 size-[30rem] rounded-full bg-[var(--brown)]/15 blur-3xl" />
      <div className="relative w-full max-w-md rounded-[2.25rem] border border-[var(--line)] bg-[rgba(249,237,209,0.94)] p-6 shadow-[0_30px_90px_rgba(80,52,28,0.18)] backdrop-blur sm:p-9">
        <BrandMark />
        <p className="mt-9 text-xs font-bold uppercase tracking-[0.18em] text-[var(--ochre)]">
          {eyebrow}
        </p>
        <h1 className="font-display mt-2 text-4xl leading-tight font-semibold tracking-[-0.04em]">
          {title}
        </h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{description}</p>
        {children}
        <p className="mt-6 text-center text-xs text-[var(--muted)]"><Link href="/showcase" className="font-bold underline decoration-[var(--yellow)] underline-offset-4">Conocer el proyecto antes de entrar</Link></p>
      </div>
    </main>
  );
}
