import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cycle Companion",
    template: "%s | Cycle Companion",
  },
  description:
    "A privacy-first cycle-aware fitness and food companion for tracking patterns across energy, symptoms, workouts, nutrition, and recovery.",
  applicationName: "Cycle Companion",
  openGraph: {
    description:
      "Privacy-first wellness dashboard for cycle, food, workout, energy, symptom, and recovery patterns.",
    images: [
      {
        alt: "Cycle Companion dashboard",
        height: 720,
        url: "/og-dashboard.png",
        width: 1280,
      },
    ],
    title: "Cycle Companion",
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Privacy-first wellness dashboard for cycle, food, workout, energy, symptom, and recovery patterns.",
    images: ["/og-dashboard.png"],
    title: "Cycle Companion",
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
      className={`${inter.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
