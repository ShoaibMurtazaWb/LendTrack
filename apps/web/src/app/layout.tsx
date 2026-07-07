import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const interHeading = Inter({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LendTrack — Neighborhood Lending Tracker",
  description: "Track what you lend. Remember what you borrow.",
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${interHeading.variable} h-full scroll-smooth antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </QueryProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
