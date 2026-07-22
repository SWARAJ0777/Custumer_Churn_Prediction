import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navigation } from "@/components/ui/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChurnGuard | Customer Churn Prediction Platform",
  description:
    "Professional customer churn prediction and analytics platform powered by explainable AI.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Navigation />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </body>
    </html>
  );
}
