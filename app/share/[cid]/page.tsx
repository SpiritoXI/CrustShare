import SharePageClient from './SharePage';

// 为静态导出生成参数 - 生成一个占位符页面
export function generateStaticParams() {
  return [{ cid: '_placeholder_' }];
}

export default function SharePage() {
  return <SharePageClient />;
}
