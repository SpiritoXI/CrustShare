"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Cloud, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore, useUIStore } from "@/lib/store";
import { hashPassword } from "@/lib/utils";
import { CONFIG } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLocked, recordFailedAttempt, lockedUntil } = useAuthStore();
  const { showToast } = useUIStore();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (lockedUntil && lockedUntil > Date.now()) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      setCountdown(remaining);
      const timer = setInterval(() => {
        const newRemaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        setCountdown(newRemaining);
        if (newRemaining <= 0) {
          clearInterval(timer);
          setCountdown(0);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked()) {
      showToast(`账户已锁定，请${countdown}秒后重试`, "error");
      return;
    }

    if (!password || password.length < CONFIG.SECURITY.PASSWORD_MIN_LENGTH) {
      showToast(`密码至少需要${CONFIG.SECURITY.PASSWORD_MIN_LENGTH}位字符`, "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: hashPassword(password) }),
      });

      if (response.ok) {
        login(password);
        showToast("登录成功", "success");
        router.push("/dashboard");
      } else {
        recordFailedAttempt();
        const remainingAttempts = 5 - useAuthStore.getState().loginAttempts;
        showToast(
          remainingAttempts > 0
            ? `密码错误，还剩${remainingAttempts}次尝试机会`
            : "密码错误次数过多，账户已锁定30分钟",
          "error"
        );
      }
    } catch {
      showToast("登录失败，请稍后重试", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="absolute inset-0 bg-black/30"
        style={{ backdropFilter: "blur(0px)" }}
      />
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cloudchan-blue to-cloudchan-purple"
            >
              <Cloud className="h-10 w-10 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold gradient-text">
              CrustShare
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              去中心化文件存储与分享平台
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="请输入管理员密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading || countdown > 0}
                  />
                </div>
                {countdown > 0 && (
                  <p className="text-center text-sm text-destructive">
                    账户已锁定，请 {countdown} 秒后重试
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cloudchan-blue to-cloudchan-purple"
                disabled={isLoading || countdown > 0}
                loading={isLoading}
              >
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </form>

            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>SHA-256加密</span>
              </div>
              <div className="flex items-center space-x-1">
                <Lock className="h-3 w-3" />
                <span>安全会话</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          基于 Crust Network · IPFS · Cloudflare Edge
        </motion.p>
      </motion.div>
    </div>
  );
}
