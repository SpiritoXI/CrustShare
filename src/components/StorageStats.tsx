'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileIcon, HardDrive, Folder, Cloud, Cpu } from 'lucide-react';
import useStore from '@/store/useStore';
import { useEffect, useState } from 'react';

interface CrustStorageInfo {
  used: number;
  limit: number;
  available: number;
  formatted: {
    used: string;
    limit: string;
    available: string;
    usagePercent: number;
  };
}

export default function StorageStats() {
  const files = useStore((state) => state.files);
  const [crustInfo, setCrustInfo] = useState<CrustStorageInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // 计算本地统计数据
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const completedFiles = files.filter((file) => file.status === 'completed').length;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 获取 Crust 存储信息
  useEffect(() => {
    fetchCrustStorageInfo();
  }, []);

  const fetchCrustStorageInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crust/storage');
      if (response.ok) {
        const data = await response.json();
        setCrustInfo(data);
      }
    } catch (error) {
      console.error('获取存储信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: '本地文件',
      value: totalFiles,
      icon: FileIcon,
      gradient: 'from-blue-400/80 to-blue-500/80',
      textColor: 'text-blue-500/80',
    },
    {
      title: '已上传',
      value: completedFiles,
      icon: HardDrive,
      gradient: 'from-green-400/80 to-green-500/80',
      textColor: 'text-green-500/80',
    },
    {
      title: '本地大小',
      value: formatFileSize(totalSize),
      icon: Folder,
      gradient: 'from-purple-400/80 to-pink-400/80',
      textColor: 'text-purple-500/80',
    },
    {
      title: 'Crust 存储',
      value: crustInfo ? crustInfo.formatted.used : '-',
      icon: Cloud,
      gradient: 'from-orange-400/80 to-red-400/80',
      textColor: 'text-orange-500/80',
      subtitle: crustInfo ? `${crustInfo.formatted.usagePercent.toFixed(1)}%` : undefined,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="crystal-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
