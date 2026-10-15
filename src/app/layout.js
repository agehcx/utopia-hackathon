import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Bounded",
  description: "Let an AI agent spend your tokens, only inside rules the contract enforces.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${mono.variable} antialiased`}>
      <body className="min-h-screen bg-canvas font-sans text-ink">{children}</body>
    </html>
  );
}
