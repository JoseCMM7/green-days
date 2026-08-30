import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { TopNavigation } from "@/components/top-navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Green Days — Guarda la vida mientras sucede",
  description:
    "Un diario digital privado para guardar los pequeños momentos de cada día.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
          <TopNavigation />
          {children}
        </div>
      </body>
    </html>
  );
}
