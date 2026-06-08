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
  themeColor: "#2E1260",
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Trincadores Mundialistas",
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
    url: siteUrl.origin,
    images: [
      {
        url: "/app-icon/120",
        width: 120,
        height: 120,
        type: "image/png",
        alt: "Trincadores Mundialistas",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Trincadores Mundialistas",
    images: ["/app-icon/120"],
  },
  icons: {
    icon: [
      { url: "/app-icon/192", sizes: "192x192", type: "image/png" },
      { url: "/icon", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${archivoBlack.variable} ${brandFont.variable}`}>
      <body className="antialiased touch-manipulation">{children}</body>
    </html>
  );
}
