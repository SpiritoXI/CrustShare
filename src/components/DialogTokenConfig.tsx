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
import { AlertCircle, CheckCircle, Key } from 'lucide-react';
import { toast } from 'sonner';

interface TokenConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (token: string) => void;
}

const TOKEN_STORAGE_KEY = 'crustshare_token';

export function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token || null;
}

export function saveTokenToStorage(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearTokenFromStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export default function TokenConfigDialog({
  open,
  onOpenChange,
  onSave,
}: TokenConfigDialogProps) {
  const [token, setToken] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (open) {
      const savedToken = getTokenFromStorage();
      if (savedToken) {
        setToken(savedToken);
        setIsValid(true);
      }
    }
  }, [open]);

  const handleTokenChange = (value: string) => {
    setToken(value);
    // 简单验证：Token 不为空
    setIsValid(value.trim().length > 0);
  };

  const handleSave = () => {
    if (!isValid) {
      toast.error('请输入有效的 Access Token');
      return;
    }

    saveTokenToStorage(token);
    onSave(token);
    onOpenChange(false);
    toast.success('Access Token 已保存');
  };

  const handleClear = () => {
    setToken('');
    setIsValid(false);
    clearTokenFromStorage();
    toast.info('Access Token 已清除');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="crystal-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-500/70" />
            配置 Access Token
          </DialogTitle>
          <DialogDescription>
            为了直接上传到 CrustFiles.io，需要配置您的 Access Token
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 获取 Token 说明 */}
          <div className="crystal-card rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500/70 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">如何获取 Access Token？</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>访问 <a href="https://crustfiles.io/" target="_blank" rel="noopener noreferrer" className="text-purple-600/80 hover:underline">crustfiles.io</a></li>
                  <li>注册或登录您的账户</li>
                  <li>在用户设置中找到 API Access Token</li>
                  <li>复制 Token 并粘贴到下方</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Token 输入 */}
          <div className="space-y-2">
            <Label htmlFor="token">Access Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="请输入您的 Access Token"
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              className="crystal-input"
            />
            {token && (
              <div className="flex items-center gap-2 text-sm">
                {isValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500/70" />
                    <span className="text-green-600/80">Token 格式有效</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-400/70" />
                    <span className="text-red-400/80">Token 不能为空</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 优势说明 */}
          <div className="crystal-card rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">直连上传的优势：</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>绕过 Vercel 的 4.5MB 限制</li>
              <li>支持上传更大文件（根据 CrustFiles.io 限制）</li>
              <li>上传速度更快，不经过代理</li>
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex gap-2">
            {getTokenFromStorage() && (
              <Button variant="outline" onClick={handleClear} className="crystal-card">
                清除 Token
              </Button>
            )}
            <Button onClick={handleSave} disabled={!isValid} className="crystal-button text-white flex-1">
              保存配置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
