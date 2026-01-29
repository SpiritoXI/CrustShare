'use client';

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VirtualFileListProps {
  files: any[];
  children: (file: any, index: number) => React.ReactNode;
  itemHeight?: number;
  visibleItems?: number;
}

export default function VirtualFileList({
  files,
  children,
  itemHeight = 60,
  visibleItems = 10,
}: VirtualFileListProps) {
  const containerHeight = itemHeight * visibleItems;

  // 只渲染可见区域的文件
  const visibleFiles = useMemo(() => {
    // 如果文件数量少，直接全部渲染
    if (files.length <= visibleItems) {
      return files;
    }
    // 否则只渲染前 N 个（简化版虚拟列表）
    return files.slice(0, visibleItems);
  }, [files, visibleItems]);

  return (
    <div
      style={{
        height: containerHeight,
        overflowY: 'auto',
      }}
      className="rounded-lg overflow-hidden crystal-card"
    >
      <Table>
        <TableHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10">
          <TableRow className="border-b border-purple-100/30">
            <TableHead className="w-[50px]">选择</TableHead>
            <TableHead>文件名</TableHead>
            <TableHead className="hidden sm:table-cell">大小</TableHead>
            <TableHead className="hidden md:table-cell">上传日期</TableHead>
            <TableHead className="hidden md:table-cell">CID</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="w-[70px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleFiles.map((file, index) => (
            <TableRow
              key={file.id}
              className="crystal-table-row border-b border-purple-50/30"
              style={{ height: itemHeight }}
            >
              {children(file, index)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
