import SharePageClient from './SharePage';

// 为静态导出生成参数
export function generateStaticParams() {
  // 返回一个占位符，实际内容将在客户端加载
  return [{ cid: 'placeholder' }];
}

// 静态导出配置
export const dynamic = 'force-static';

export default function SharePage() {
  return <SharePageClient />;
}
