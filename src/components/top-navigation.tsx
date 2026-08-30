"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

type IconName = "home" | "calendar" | "capsule" | "albums";

const navigation: { label: string; icon: IconName; href: string }[] = [
  { label: "Mi día", icon: "home", href: "/" },
  { label: "Calendario", icon: "calendar", href: "/calendar" },
  { label: "Cápsulas", icon: "capsule", href: "/capsules" },
  { label: "Álbumes", icon: "albums", href: "/albums" },
];

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <path d="m3.5 10.3 8.5-7 8.5 7v9.2a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-9.2Z" />,
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

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(244,226,187,0.92)] shadow-[0_8px_30px_rgba(91,59,32,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex h-[5.25rem] w-full max-w-[92rem] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          <BrandMark />

          <nav className="hidden lg:block" aria-label="Navegación principal">
            <ul className="flex items-center gap-1.5">
              {navigation.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      pathname === item.href
                        ? "bg-[var(--yellow)] text-[var(--brown-dark)] shadow-[0_7px_18px_rgba(179,120,26,0.16)]"
                        : "text-[var(--brown)] hover:bg-[var(--paper)] hover:text-[var(--brown-dark)]"
                    }`}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--brown-light)] bg-[var(--paper)] text-sm font-bold text-[var(--brown-dark)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--yellow-soft)]"
            aria-label="Abrir perfil"
          >
            JM
          </button>
        </div>
      </header>

      <nav className="fixed right-3 bottom-3 left-3 z-30 rounded-[1.35rem] border border-[var(--brown-light)] bg-[rgba(249,237,208,0.95)] p-1.5 shadow-[0_16px_45px_rgba(65,42,25,0.2)] backdrop-blur-xl lg:hidden" aria-label="Navegación móvil">
        <ul className="grid grid-cols-4">
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
