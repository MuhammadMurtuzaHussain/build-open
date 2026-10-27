import type { Metadata, Viewport } from "next";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Build Open · Hacktoberfest Hack Day Galway",
  description:
    "Build Open: Hacktoberfest Hack Day Galway x Cybersecurity Society, University of Galway. Thursday 29 October 2026, The Cube, Áras na Mac Léinn.",
};

export const viewport: Viewport = {
  themeColor: "#14060e",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IE">
      <body>{children}</body>
    </html>
  );
}
