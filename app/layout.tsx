import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./fonts.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saint Stephen's Admissions Quiz",
  description:
    "Share your family's priorities and discover the Saint Stephen's stories, teachers, and programs that fit best.",
  openGraph: {
    title: "Saint Stephen's Admissions Quiz",
    description:
      "Share your family's priorities and discover the Saint Stephen's stories, teachers, and programs that fit best.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Saint Stephen's Admissions Quiz",
    description:
      "Share your family's priorities and discover the Saint Stephen's stories, teachers, and programs that fit best.",
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
        {children}
      </body>
    </html>
  );
}
