import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StokeDash — AI Stock Analysis Dashboard",
  description: "AI-powered stock analysis dashboard with composite scoring, technical analysis, sentiment, and deep-dive reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
