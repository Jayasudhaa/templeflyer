import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI MITRA Flyer Editor",
  description: "Create beautiful event flyers with AI assistance and multi-language support",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
