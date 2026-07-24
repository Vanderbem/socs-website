import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';
// @ts-ignore: allow importing global css without type declarations
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOCS4AI - Computational Thinking Lessons",
  description: "A collection of CT lesson plans to integrate computational thinking into K-5 classrooms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <Script id="iframe-escape" strategy="beforeInteractive">
            {`
              if (window.self !== window.top) {
                window.top.location.href = window.location.href;
              }
            `}
          </Script>
        </head>
        <body
          className={`${inter.variable} font-sans antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
