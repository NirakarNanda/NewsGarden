import type { Metadata } from "next";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/pixelify-sans/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Daily NEXA",
  description: "A cozy AI newsroom",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
