import localFont from "next/font/local";
import "./globals.css";

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata = {
  title: "3DZLABS — AI Tools Command Center",
  description: "A curated hub of AI-powered tools. Navigate the stack.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="impact-site-verification" value="f9b28a66-d4c5-4330-8f46-b1ea072a54a5" />
      </head>
      <body className={`${geistMono.variable} font-mono bg-brand-bg text-brand-green antialiased`}>
        {children}
        <footer className="border-t border-brand-border px-6 py-4 text-center"
                style={{ background: "#0a0a0a" }}>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(120,150,130,0.55)" }}>
            Some links on this site are affiliate or referral links. If you sign up through them,
            we may earn a small commission at no extra cost to you.
          </p>
        </footer>
      </body>
    </html>
  );
}
