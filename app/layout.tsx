import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HtmlLangSync } from "@/components/html-lang-sync";
import { ScrollProgress } from "@/components/client/scroll-progress";
import { BackToTop } from "@/components/client/back-to-top";
import { CommandPalette } from "@/components/ui/command-palette";
import { ToastProvider } from "@/components/ui/toast";
import { PageTransition } from "@/components/ui/page-transition";
import { FirebaseAuthSync } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BRONELE — uyğun vaxtı seç, sürətli rezerv et",
    template: "%s · BRONELE",
  },
  description:
    "Fotoqraflar, DJ-lər, restoranlar, barberlər və salonlar. Bir klik — və birbaşa WhatsApp-da yazırsan.",
  openGraph: {
    siteName: "BRONELE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="az"
      className={`${inter.variable} ${fraunces.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-bg text-ink-700 antialiased font-sans">
        <HtmlLangSync />
        <FirebaseAuthSync />
        <ScrollProgress />
        <ToastProvider>
          <Header />
          <PageTransition>{children}</PageTransition>
          <Footer />
          <BackToTop />
          <CommandPalette />
        </ToastProvider>
      </body>
    </html>
  );
}
