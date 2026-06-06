import type { Metadata, Viewport } from "next";
import { Archivo_Black, Barlow_Semi_Condensed, Space_Grotesk } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const brandFont = Barlow_Semi_Condensed({
  weight: "900",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-brand-src",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2A1058",
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Trincadores Mundialistas",
  description: "Porra privada Mundial 2026",
  applicationName: "Trincadores",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Trincadores",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Trincadores Mundialistas",
    title: "Trincadores Mundialistas",
    description: "Porra privada Mundial 2026",
    url: siteUrl.origin,
  },
  twitter: {
    card: "summary_large_image",
    title: "Trincadores Mundialistas",
    description: "Porra privada Mundial 2026",
  },
  icons: {
    icon: [
      { url: "/icons/logo.png", sizes: "708x708", type: "image/png" },
      { url: "/icons/logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/logo.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${archivoBlack.variable} ${brandFont.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
