import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Suitora — AI Fashion Compatibility",
    template: "%s — Suitora",
  },
  description:
    "Know if it suits you before you buy. Upload your photo and a clothing item to get AI-powered fashion compatibility analysis, virtual try-on, and personalized style recommendations.",
  keywords: [
    "fashion",
    "AI fashion",
    "virtual try-on",
    "style analysis",
    "clothing compatibility",
    "fashion assistant",
  ],
  authors: [{ name: "Suitora" }],
  openGraph: {
    title: "Suitora — AI Fashion Compatibility",
    description:
      "Know if it suits you before you buy. AI-powered fashion analysis and virtual try-on.",
    url: "https://suitora.app",
    siteName: "Suitora",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Suitora — AI Fashion Compatibility",
    description:
      "Know if it suits you before you buy. AI-powered fashion analysis and virtual try-on.",
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
