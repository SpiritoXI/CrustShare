"use client";

import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <div className="border-b border-white/20 bg-white/30 px-6 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center">
          <Upload className="h-4 w-4 mr-2 animate-pulse" />
          正在上传...
        </span>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
