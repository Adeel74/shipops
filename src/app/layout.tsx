import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShipOps — COD Order Verification & RTO Recovery for Shopify",
  description: "ShipOps is the operations command center for Shopify COD merchants in Pakistan. Confirm orders via WhatsApp, dispatch through TCS/Leopards/Trax, resolve exceptions with AI, and recover RTOs with evidence.",
  keywords: ["ShipOps", "Shopify", "COD", "RTO", "Pakistan", "TCS", "Leopards", "order verification", "courier"],
  authors: [{ name: "ShipOps" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
