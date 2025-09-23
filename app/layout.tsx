import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ground Zero — Quiz + Archetypes",
  description: "Movement Quiz + Archetype Resolver",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
