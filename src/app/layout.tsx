import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Caveat, Geist } from "next/font/google";
import { TopNavigation } from "@/components/top-navigation";
import { getPersonalization } from "@/features/personalization/service";
import { getCurrentUser } from "@/lib/auth/current-user";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const pencilWriting = Caveat({
  variable: "--font-pencil",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Green Days — Guarda la vida mientras sucede",
  description:
    "Un diario digital privado para guardar los pequeños momentos de cada día.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#efe0bd",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const personalization = user
    ? await getPersonalization(user.id).catch(() => null)
    : null;
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${pencilWriting.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a href="#main-content" className="skip-link">Saltar al contenido</a>
        <div
          className={`min-h-screen bg-[var(--cream)] text-[var(--ink)] ${personalization?.reducedMotion ? "motion-reduced" : ""}`}
          style={personalization?.cssVariables as CSSProperties | undefined}
        >
          <TopNavigation />
          <div id="main-content" tabIndex={-1}>{children}</div>
        </div>
      </body>
    </html>
  );
}
