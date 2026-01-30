"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Folder } from "@/types";

interface BatchToolbarProps {
  selectedCount: number;
  folders: Folder[];
  onClearSelection: () => void;
  onBatchMove: (targetFolderId: string | null) => void;
  onBatchCopy: (targetFolderId: string | null) => void;
  onBatchDelete: () => void;
}

export function BatchToolbar({
  selectedCount,
  folders,
  onClearSelection,
  onBatchMove,
  onBatchCopy,
  onBatchDelete,
}: BatchToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="border-b border-white/20 bg-cloudchan-purple/10 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">已选择 {selectedCount} 个文件</span>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            取消选择
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <select
            className="text-sm border rounded px-2 py-1 bg-white"
            onChange={(e) => {
              const folderId = e.target.value;
              if (folderId) {
                onBatchMove(folderId === "default" ? null : folderId);
                e.target.value = "";
              }
            }}
            value=""
          >
            <option value="" disabled>
              移动到...
            </option>
            <option value="default">根目录</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <select
            className="text-sm border rounded px-2 py-1 bg-white"
            onChange={(e) => {
              const folderId = e.target.value;
              if (folderId) {
                onBatchCopy(folderId === "default" ? null : folderId);
                e.target.value = "";
              }
            }}
            value=""
          >
            <option value="" disabled>
              复制到...
            </option>
            <option value="default">根目录</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <Button variant="destructive" size="sm" onClick={onBatchDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </Button>
        </div>
      </div>
    </div>
  );
}
