import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { HtmlLangSync } from "@/components/html-lang-sync";
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
    default: "Vaxt — uyğun vaxtı seç, sürətli rezerv et",
    template: "%s · Vaxt",
  },
  description:
    "Fotoqraflar, DJ-lər, restoranlar, barberlər və salonlar. Bir klik — və birbaşa WhatsApp-da yazırsan.",
  openGraph: {
    siteName: "Vaxt",
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
        <Header />
        {children}
      </body>
    </html>
  );
}
