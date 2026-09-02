"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

type IconName = "home" | "book" | "calendar" | "capsule" | "albums";

const navigation: { label: string; icon: IconName; href: string }[] = [
  { label: "Inicio", icon: "home", href: "/" },
  { label: "Mi libro", icon: "book", href: "/journal/today" },
  { label: "Calendario", icon: "calendar", href: "/calendar" },
  { label: "Cápsulas", icon: "capsule", href: "/capsules" },
  { label: "Álbumes", icon: "albums", href: "/albums" },
];

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <path d="m3.5 10.3 8.5-7 8.5 7v9.2a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-9.2Z" />,
    book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H11v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z" /><path d="M20 4.5A2.5 2.5 0 0 0 17.5 2H13v18h4.5a2.5 2.5 0 0 1 2.5 2.5v-18Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    capsule: <><path d="M8 3h8M8 21h8M9 3c0 4 1.2 5.7 3 7 1.8-1.3 3-3 3-7M9 21c0-4 1.2-5.7 3-7 1.8 1.3 3 3 3 7" /><path d="M10.2 17.7h3.6" /></>,
    albums: <><rect x="4" y="5" width="14" height="15" rx="2" /><path d="M8 5V3h12v15h-2M7.5 15l2.7-2.6a1.5 1.5 0 0 1 2 0l2.8 2.7" /><circle cx="9" cy="9" r="1" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export function TopNavigation() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth") || pathname.startsWith("/journal/")) {
    return null;
  }

  if (pathname === "/showcase") {
    return (
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#f0dfb9]">
        <div className="mx-auto flex h-[5.25rem] w-full max-w-[92rem] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <BrandMark />
          <div className="flex items-center gap-2"><Link href="/auth/login" className="rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-4 py-2 text-xs font-bold sm:text-sm">Entrar</Link><Link href="/auth/sign-up" className="rounded-full bg-[var(--yellow)] px-4 py-2 text-xs font-bold sm:text-sm">Crear mi diario</Link></div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#f0dfb9]">
        <div className="mx-auto flex h-[5.25rem] w-full max-w-[92rem] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          <BrandMark />

          <nav className="hidden lg:block" aria-label="Navegación principal">
            <ul className="flex items-center gap-1.5">
              {navigation.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                      pathname === item.href
                        ? "border-[var(--ochre)] text-[var(--brown-dark)]"
                        : "border-transparent text-[var(--brown)] hover:border-[var(--brown-light)] hover:text-[var(--brown-dark)]"
                    }`}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            href="/account"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--brown-light)] bg-[var(--paper)] text-sm font-bold text-[var(--brown-dark)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--yellow-soft)]"
            aria-label="Abrir mi cuenta"
          >
            Yo
          </Link>
        </div>
      </header>

      <nav className="fixed right-3 bottom-3 left-3 z-30 border border-[var(--brown-light)] bg-[#f9edd0] p-1.5 shadow-[0.25rem_0.35rem_0_#8f6b42] lg:hidden" aria-label="Navegación móvil">
        <ul className="grid grid-cols-5">
          {navigation.map((item) => (
            <li key={item.label}>
              <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.6rem] font-semibold ${pathname === item.href ? "bg-[var(--yellow)] text-[var(--brown-dark)]" : "text-[var(--brown)]"}`}>
                <NavIcon name={item.icon} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
