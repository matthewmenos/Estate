import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accra Rentals — List and find properties in Accra",
  description: "A platform for property owners to list rentals and sales in Accra, Ghana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
