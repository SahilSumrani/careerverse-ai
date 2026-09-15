import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { ReticleDev } from "./reticle-dev";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const instrument = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
  title: {
    default: "CareerVerse AI — Discover the right candidates to hire",
    template: "%s · CareerVerse AI",
  },
  description:
    "Parse CVs, score talent with explainable AI, run voice interviews, and keep your hiring flow moving in one recruiting OS.",
  openGraph: {
    title: "CareerVerse AI",
    description: "AI scoring, voice interviews, and automated hiring workflows.",
    type: "website",
    url: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${instrument.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {process.env.NODE_ENV === "development" ? <ReticleDev /> : null}
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
