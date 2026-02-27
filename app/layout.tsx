import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";
import { ProcessingProvider } from "@/lib/context/ProcessingContext";
import ProcessingFloatingBar from "@/components/ui/ProcessingFloatingBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "HealthSync APP - Prior Authorization Automation",
  description: "Multi-agent AI system for healthcare prior authorization automation powered by Elasticsearch and Gemini AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HealthSync APP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProcessingProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            {/* pt-14 on mobile for the mobile header bar, lg:pt-0 + lg:ml-64 for desktop sidebar */}
            <main className="flex-1 pt-14 lg:pt-0 lg:ml-64 mesh-gradient min-h-screen">
              {children}
            </main>
          </div>
          <ProcessingFloatingBar />
        </ProcessingProvider>
      </body>
    </html>
  );
}
