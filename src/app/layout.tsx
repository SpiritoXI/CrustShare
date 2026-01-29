import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CrustShare - 去中心化文件存储',
    template: '%s | CrustShare',
  },
  description:
    '基于 Crust Network 和 IPFS 的安全、私有、去中心化文件存储解决方案。支持文件上传、分享、下载、版本控制等功能。',
  keywords: [
    'CrustShare',
    '去中心化存储',
    'Crust Network',
    'IPFS',
    '文件存储',
    '文件分享',
    '去中心化',
    'Web3',
    '区块链',
  ],
  authors: [{ name: 'CrustShare Team' }],
  generator: 'CrustShare',
  icons: {
    icon: '/icon.jpg',
    apple: '/icon.jpg',
  },
  openGraph: {
    title: 'CrustShare - 去中心化文件存储平台',
    description:
      '基于 Crust Network 和 IPFS 的安全、私有、去中心化文件存储解决方案',
    url: 'https://github.com/SpiritoXI/crustshare',
    siteName: 'CrustShare',
    locale: 'zh_CN',
    type: 'website',
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
