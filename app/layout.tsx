import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CrustShare - 去中心化文件存储与分享",
  description: "基于Crust Network和IPFS的去中心化文件存储与分享平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
