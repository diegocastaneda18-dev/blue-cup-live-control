import type { Metadata } from "next";
import { ClientProviders } from "../components/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blue Cup Live Control",
  description: "Tournament control platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

