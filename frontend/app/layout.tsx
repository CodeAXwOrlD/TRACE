import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://trace-security.vercel.app"),
  title: {
    default: "TRACE — AI-Assisted Financial Fraud Investigation & Case Intelligence",
    template: "%s | TRACE Fraud Intelligence",
  },
  description:
    "TRACE is an AI-assisted financial fraud investigation and case intelligence platform. It analyzes multi-hop transaction graphs, correlates shared devices, calibrates fraud probability against raw risk scores, and delivers defensible block/escalate decisions.",
  keywords: [
    "financial fraud investigation",
    "transaction graph intelligence",
    "agentic AI fraud detection",
    "card-not-present fraud",
    "device fingerprinting",
    "fraud probability calibration",
    "graph neural networks",
    "defensible fraud decisions",
    "fintech security console",
  ],
  authors: [{ name: "TRACE Intelligence Team" }],
  creator: "TRACE",
  publisher: "TRACE Security",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://trace-security.vercel.app",
    title: "TRACE — AI-Assisted Financial Fraud Investigation & Case Intelligence",
    description:
      "Evidence-based fraud investigation platform that explores transaction graphs, identifies shared fraud patterns across cards and devices, and produces defensible decisions.",
    siteName: "TRACE Fraud Intelligence",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "TRACE AI-Assisted Fraud Investigation Console",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TRACE — AI-Assisted Financial Fraud Investigation",
    description:
      "Follow the card, not the score. Multi-hop transaction graph intelligence and agentic reasoning for fraud operations.",
    images: ["/logo.png"],
    creator: "@trace_intel",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TRACE",
  operatingSystem: "All (Modern Web Browser)",
  applicationCategory: "SecurityApplication",
  headline: "AI-assisted financial fraud investigation and case intelligence console",
  description:
    "Investigates flagged transactions by traversing multi-hop transaction graphs, correlating shared devices, and generating defensible evidence-based decisions.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Interactive 2-hop WebGL transaction graph visualization",
    "Real-time streaming agentic reasoning with Server-Sent Events",
    "Risk Score vs Calibrated Fraud Probability divergence engine",
    "Defensible audit trails with attached graph evidence and policy rules",
    "Simulated high-frequency card testing & account takeover detection",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
