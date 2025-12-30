import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "robopost.ai - AI-Powered Content Automation",
  description: "Automate content creation across industries with AI-powered RSS aggregation and synthesis",
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

