import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
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
        <body
          className={`${inter.variable} font-sans antialiased`}
        >
          <ClerkLoaded>
            {children}
          </ClerkLoaded>
          <ClerkLoading>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fff' }}>
              <p style={{ color: '#000' }}>Loading Application...</p>
            </div>
          </ClerkLoading>
        </body>
      </html>
    </ClerkProvider>
  );
}
