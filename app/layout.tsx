import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // 确保你创建了这个 CSS 文件

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Availability | 2026 Schedule",
  description: "Check my real-time availability for meetings and interviews.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased bg-[#F8F9FA]`}>
        {children}
      </body>
    </html>
  );
}