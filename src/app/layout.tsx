import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const brandDisplay = Fraunces({
  variable: "--font-brand-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Enerpages",
    template: "%s · Enerpages",
  },
  description: "Estúdio para criar e publicar landing pages com a cara da sua marca.",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon.ico", sizes: "any" },
      { url: "/brand/icon-light.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/brand/favicon-32.png",
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${brandDisplay.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-geist-sans)]">{children}</body>
    </html>
  );
}
