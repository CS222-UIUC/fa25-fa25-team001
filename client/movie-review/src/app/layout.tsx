import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/SessionProvider";
import GoogleSignInMeta from "@/components/GoogleSignInMeta";
import "./globals.css";
import Header from "../components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Media Review",
  description: "Media Review is a platform for reviewing and sharing your thoughts on movies, TV shows, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Providers>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleSignInMeta />
        <Script
          src="https://apis.google.com/js/platform.js"
          strategy="afterInteractive"
          async
          defer
        />
        {children}
      </body>
      </Providers>
    </html>
  );
}
