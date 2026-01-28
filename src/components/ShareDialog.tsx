'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Share2, Copy, CheckCircle, Clock, Lock } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';

interface ShareDialogProps {
  fileId: string;
  onClose: () => void;
}

interface ShareConfig {
  duration: string;
  password: string;
  passwordEnabled: boolean;
  maxViews: number;
}

export default function ShareDialog({ fileId, onClose }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<ShareConfig>({
    duration: '1day',
    password: '',
    passwordEnabled: false,
    maxViews: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const files = useStore((state) => state.files);
  const file = files.find((f) => f.id === fileId);

  useEffect(() => {
    if (file) {
      generateShareLink();
    }
  }, [file, config]);

  const generateShareLink = async () => {
    if (!file) return;

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 生成分享链接（模拟）
    const shareId = Math.random().toString(36).substring(2, 15);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/share/${shareId}`;

    setShareUrl(url);
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('分享链接已复制到剪贴板');

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  const getDurationText = (duration: string): string => {
    switch (duration) {
      case '1hour':
        return '1 小时';
      case '1day':
        return '1 天';
      case '7days':
        return '7 天';
      case '30days':
        return '30 天';
      case 'permanent':
        return '永久';
      default:
        return '1 天';
    }
  };

  if (!file) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="crystal-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              分享文件
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            为文件 {file.name} 创建分享链接
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 分享链接 */}
          <div className="space-y-2">
            <Label>分享链接</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="crystal-input flex-1"
                placeholder="正在生成分享链接..."
              />
              <Button
                onClick={handleCopy}
                disabled={!shareUrl || isGenerating}
                className="crystal-button text-white"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 分享设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  有效期
                </Label>
                <p className="text-xs text-muted-foreground">
                  设置分享链接的有效时长
                </p>
              </div>
              <Select value={config.duration} onValueChange={(value) => setConfig({ ...config, duration: value })}>
                <SelectTrigger className="crystal-card w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="crystal-dialog">
                  <SelectItem value="1hour">1 小时</SelectItem>
                  <SelectItem value="1day">1 天</SelectItem>
                  <SelectItem value="7days">7 天</SelectItem>
                  <SelectItem value="30days">30 天</SelectItem>
                  <SelectItem value="permanent">永久</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  密码保护
                </Label>
                <p className="text-xs text-muted-foreground">
                  需要密码才能访问分享文件
                </p>
              </div>
              <Switch
                checked={config.passwordEnabled}
                onCheckedChange={(checked) => setConfig({ ...config, passwordEnabled: checked })}
              />
            </div>

            {config.passwordEnabled && (
              <div className="space-y-2">
                <Label>访问密码</Label>
                <Input
                  type="text"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  className="crystal-input"
                  placeholder="设置访问密码"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>访问次数限制</Label>
                <p className="text-xs text-muted-foreground">
                  0 表示无限制
                </p>
              </div>
              <Select
                value={config.maxViews.toString()}
                onValueChange={(value) => setConfig({ ...config, maxViews: parseInt(value) })}
              >
                <SelectTrigger className="crystal-card w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="crystal-dialog">
                  <SelectItem value="0">无限制</SelectItem>
                  <SelectItem value="1">1 次</SelectItem>
                  <SelectItem value="5">5 次</SelectItem>
                  <SelectItem value="10">10 次</SelectItem>
                  <SelectItem value="50">50 次</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 分享信息 */}
          <div className="p-4 crystal-card rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Share2 className="h-4 w-4 text-purple-600" />
              <span className="font-medium">分享信息</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">有效期：</span>
                <span className="font-medium ml-1">{getDurationText(config.duration)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">密码保护：</span>
                <span className="font-medium ml-1">{config.passwordEnabled ? '是' : '否'}</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="crystal-card">
              关闭
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!shareUrl || isGenerating}
              className="crystal-button text-white"
            >
              <Copy className="mr-2 h-4 w-4" />
              复制链接
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
