import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poker Pal - Home Game Helper",
  description: "Track your poker home games, calculate equity, and split side pots",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark bg-zinc-950 min-h-screen`}
      >
        <div className="flex min-h-screen items-start justify-center px-4 pt-8 pb-28">
          {children}
        </div>
        <Navigation />
      </body>
    </html>
  );
}
