import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { PWARegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";

// Pin server functions to Mumbai (bom1) so they sit next to the MongoDB Atlas
// cluster (AWS ap-south-1 / Mumbai). On Vercel's default US-East region every
// DB query crossed the globe (~250ms each) — co-locating cuts that to ~1ms.
// All routes inherit this from the root layout unless they override it.
export const preferredRegion = "bom1";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budget Tracker",
  description: "Fast, simple personal budget tracking.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Budget", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen pb-24">{children}</main>
          <BottomNav />
          <Toaster position="top-center" />
          <PWARegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
