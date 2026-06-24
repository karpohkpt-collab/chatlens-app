import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatLens",
  description: "Turn chat exports into a searchable, AI-summarized digest.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
