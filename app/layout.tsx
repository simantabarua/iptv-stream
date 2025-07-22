import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPTV Website",
  description: "A simple IPTV website built with Next.js and React",
  generator: "Next.js",
  applicationName: "IPTV Website",
  keywords: ["IPTV", "Next.js", "React", "Video Streaming"],
  authors: [{ name: "Simanta" }],
  creator: "Simanta",
  openGraph: {
    title: "IPTV Website",
    description: "A simple IPTV website built with Next.js and React",
    url: "https://iptv-website.example.com",
    siteName: "IPTV Website",
    images: [
      {
        url: "https://iptv-website.example.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "IPTV Website Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
