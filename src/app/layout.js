import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "../lib/site";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: { default: `${BRAND}: the spending limit for AI agents`, template: `%s · ${BRAND}` },
  description: "A policy vault on Avalanche: AI agents propose spends, a contract enforces the ceiling you set. Testnet prototype.",
  openGraph: { images: ["/og-placeholder.svg"] },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${mono.variable} antialiased`}>
      <body className="min-h-screen bg-canvas font-sans text-ink">{children}</body>
    </html>
  );
}
