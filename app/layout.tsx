import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LeftRail } from "@/components/layout/left-rail";
import { StickySearchBar } from "@/components/storefront/sticky-search-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://keyassist.shop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Key Assist — Shop from Multiple Marketplaces",
    template: "%s | Key Assist",
  },
  description:
    "Key Assist: shop and track products from Amazon, Apple, Nike, GOAT and more in one cart. Paste a product URL to import it instantly.",
  openGraph: {
    siteName: "Key Assist",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full shop-surface">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <LeftRail />
            <main className="w-full flex-1 pb-[68px] lg:pl-[84px]">{children}</main>
            <Footer />
            <StickySearchBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
