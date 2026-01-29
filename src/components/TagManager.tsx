'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Tag, Plus, Trash2, Palette } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import { Tag as TagType } from '@/store/useStore';

interface TagManagerProps {
  fileId?: string;
  onClose: () => void;
}

const TAG_COLORS = [
  { name: '红色', value: 'bg-red-500/20 text-red-700 border-red-500/30' },
  { name: '蓝色', value: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
  { name: '绿色', value: 'bg-green-500/20 text-green-700 border-green-500/30' },
  { name: '黄色', value: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' },
  { name: '紫色', value: 'bg-purple-500/20 text-purple-700 border-purple-500/30' },
  { name: '粉色', value: 'bg-pink-500/20 text-pink-700 border-pink-500/30' },
  { name: '橙色', value: 'bg-orange-500/20 text-orange-700 border-orange-500/30' },
  { name: '青色', value: 'bg-cyan-500/20 text-cyan-700 border-cyan-500/30' },
];

export default function TagManager({ fileId, onClose }: TagManagerProps) {
  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tags = useStore((state) => state.tags);
  const addTag = useStore((state) => state.addTag);
  const deleteTag = useStore((state) => state.deleteTag);
  const addTagToFile = useStore((state) => state.addTagToFile);
  const removeTagFromFile = useStore((state) => state.removeTagFromFile);

  const file = fileId
    ? useStore.getState().files.find((f) => f.id === fileId)
    : null;
  const fileTagIds = file?.tags || [];

  const handleCreateTag = () => {
    if (!tagName.trim()) {
      toast.error('标签名称不能为空');
      return;
    }

    const newTag: TagType = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: tagName.trim(),
      color: TAG_COLORS[selectedColor].value,
    };

    addTag(newTag);

    if (fileId) {
      addTagToFile(fileId, newTag.id);
      toast.success('标签已创建并添加到文件');
    } else {
      toast.success('标签已创建');
    }

    setTagName('');
  };

  const handleDeleteTag = (tagId: string) => {
    deleteTag(tagId);
    toast.success('标签已删除');
  };

  const handleToggleFileTag = (tagId: string) => {
    if (fileId) {
      if (fileTagIds.includes(tagId)) {
        removeTagFromFile(fileId, tagId);
        toast.success('标签已从文件移除');
      } else {
        addTagToFile(fileId, tagId);
        toast.success('标签已添加到文件');
      }
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="crystal-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              标签管理
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {fileId ? '为文件管理标签' : '管理所有标签'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 创建标签 */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="输入标签名称"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                className="crystal-input flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagName.trim()) {
                    handleCreateTag();
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="crystal-card"
                title="选择颜色"
              >
                <Palette className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleCreateTag}
                disabled={!tagName.trim()}
                className="crystal-button text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showColorPicker && (
              <div className="flex gap-2 flex-wrap">
                {TAG_COLORS.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(index)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === index
                        ? 'border-purple-600 scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: color.value.split(' ')[0].replace('bg-', ''),
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 标签列表 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {fileId ? '可用标签' : '所有标签'}
            </h4>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无标签
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {fileId && (
                        <input
                          type="checkbox"
                          checked={fileTagIds.includes(tag.id)}
                          onChange={() => handleToggleFileTag(tag.id)}
                          className="rounded"
                        />
                      )}
                      <span
                        className={`crystal-badge px-3 py-1 rounded-full text-xs font-medium ${tag.color}`}
                      >
                        {tag.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end">
            <Button onClick={onClose} className="crystal-button text-white">
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
