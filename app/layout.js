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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} font-mono bg-brand-bg text-brand-green antialiased`}>
        {children}
      </body>
    </html>
  );
}
