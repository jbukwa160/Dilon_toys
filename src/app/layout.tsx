import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { site } from "@/config/site";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export function generateMetadata(): Metadata {
  const s = getSettings();
  return {
    metadataBase: new URL(site.url),
    title: { default: `${s.name} — ${s.tagline}`, template: `%s | ${s.name}` },
    description: s.description,
    openGraph: { siteName: s.name, locale: "bg_BG", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#f0503a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg" className={nunito.variable}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
