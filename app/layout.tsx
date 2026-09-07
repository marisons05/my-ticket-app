import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TheMix",
  description: "Discover live music events in Riga",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceMono.variable} h-full antialiased`}
    >
<head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col">{children}<Footer /><Analytics /></body>
    </html>
  );
}
