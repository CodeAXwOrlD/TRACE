import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRACE — AI-assisted fraud investigation",
  description:
    "TRACE is an AI-assisted financial fraud investigation and case intelligence console: evidence, not alarms.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="atmo" aria-hidden="true" />
        <div className="gridfx" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
