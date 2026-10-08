import type { Metadata } from "next";
import { DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Wesbite | Ye explores spaces",
  description:
    "Wesbite is Ye's spatial intelligence interface for autonomous systems.",
  openGraph: {
    title: "Wesbite | Ye explores spaces",
    description:
      "Wesbite is Ye's realtime orchestration layer for autonomous infrastructure.",
    type: "website",
  },
  other: {
    "theme-color": "#000000",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSerif.variable} dark`}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
