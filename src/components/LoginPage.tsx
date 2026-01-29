'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Shield } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';

// 默认 PIN 码（开发环境）
const DEFAULT_PIN = '123456';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setIsAuthenticated = useStore((state) => state.setIsAuthenticated);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 调用登录 API 进行验证
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('crustshare_auth', 'true');
        toast.success('登录成功');
      } else {
        toast.error(data.error || 'PIN 码错误，请重试');
        setPin('');
      }
    } catch (error) {
      console.error('登录错误:', error);
      toast.error('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length >= 4) {
      handleLogin(e as any);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSg5OSwgMTAyLCAyNDEsIDAuMDUpIi8+PC9zdmc+')] opacity-20" />

      <Card className="relative w-full max-w-md crystal-card crystal-dialog">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/70 to-pink-500/70 text-white shadow-lg">
            <Shield className="h-8 w-8" />
          </div>
          <CardTitle className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 bg-clip-text text-2xl font-bold text-transparent">
            CrustShare
          </CardTitle>
          <CardDescription className="text-base">
            安全的分布式文件存储平台
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">请输入 PIN 码</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="6 位数字 PIN 码"
                  value={pin}
                  onChange={(e) => {
                    // 只允许输入数字，最多 6 位
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPin(value);
                  }}
                  onKeyPress={handleKeyPress}
                  className="crystal-input h-12 text-center text-2xl tracking-widest font-mono pr-12"
                  autoFocus
                  maxLength={6}
                />
                <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* PIN 码输入指示器 */}
              <div className="flex justify-center gap-2 mt-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${
                      pin[index] ? 'bg-purple-500/80 scale-125' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex-1 h-12"
                disabled={!pin}
              >
                清除
              </Button>
              <Button
                type="submit"
                className="crystal-button flex-[2] h-12 text-base font-medium text-white"
                disabled={isLoading || pin.length < 4}
              >
                {isLoading ? '验证中...' : '登录'}
              </Button>
            </div>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
            <p>请输入正确的 PIN 码以继续访问</p>

            <div className="rounded-lg bg-purple-50/60 p-3 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs">默认 PIN 码:</span>
                <code className="text-lg bg-white/60 px-3 py-1 rounded font-mono font-bold">
                  {DEFAULT_PIN}
                </code>
              </div>
            </div>

            <p className="text-xs">
              生产环境请在环境变量中配置 <code className="bg-purple-50/60 px-2 py-1 rounded">PIN_CODE</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
