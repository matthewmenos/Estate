import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Accra Rentals — List and find verified properties in Accra",
  description:
    "A platform for property owners to list rentals and sales in Accra, Ghana, and for renters to find them with confidence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink font-body min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
