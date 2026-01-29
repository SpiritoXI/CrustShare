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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';

interface AddCidDialogProps {
  onClose: () => void;
}

// CID 格式验证（简化版）
const isValidCID = (cid: string): boolean => {
  // 简单验证：以 Qm 开头，后面跟着至少 44 个字符
  const cidPattern = /^Qm[a-zA-Z0-9]{44,}$/;
  return cidPattern.test(cid.trim());
};

export default function AddCidDialog({ onClose }: AddCidDialogProps) {
  const [singleCid, setSingleCid] = useState('');
  const [batchCids, setBatchCids] = useState('');
  const [activeTab, setActiveTab] = useState('single');

  const addFile = useStore((state) => state.addFile);

  const handleSingleAdd = () => {
    const trimmedCid = singleCid.trim();

    if (!trimmedCid) {
      toast.error('请输入 CID');
      return;
    }

    if (!isValidCID(trimmedCid)) {
      toast.error('CID 格式不正确');
      return;
    }

    // 添加到文件列表
    addFile({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `文件-${trimmedCid.substring(2, 10)}`,
      size: 0,
      type: 'application/octet-stream',
      uploadDate: new Date().toISOString(),
      cid: trimmedCid,
      status: 'completed',
    });

    toast.success('CID 添加成功');
    setSingleCid('');
    onClose();
  };

  const handleBatchAdd = () => {
    const lines = batchCids.split('\n').filter((line) => line.trim());
    const validCids: string[] = [];
    const invalidCids: string[] = [];

    lines.forEach((line) => {
      if (isValidCID(line)) {
        validCids.push(line.trim());
      } else {
        invalidCids.push(line.trim());
      }
    });

    if (validCids.length === 0) {
      toast.error('没有有效的 CID');
      return;
    }

    // 添加所有有效的 CID
    validCids.forEach((cid) => {
      addFile({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `文件-${cid.substring(2, 10)}`,
        size: 0,
        type: 'application/octet-stream',
        uploadDate: new Date().toISOString(),
        cid: cid,
        status: 'completed',
      });
    });

    if (invalidCids.length > 0) {
      toast.warning(
        `已添加 ${validCids.length} 个 CID，${invalidCids.length} 个无效的 CID 被跳过`
      );
    } else {
      toast.success(`成功添加 ${validCids.length} 个 CID`);
    }

    setBatchCids('');
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="crystal-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              添加 CID
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            通过 CID 添加文件到存储列表
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">单个添加</TabsTrigger>
            <TabsTrigger value="batch">批量添加</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="single-cid">CID</Label>
              <Input
                id="single-cid"
                placeholder="例如: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
                value={singleCid}
                onChange={(e) => setSingleCid(e.target.value)}
                className="crystal-input font-mono"
              />
              <p className="text-xs text-muted-foreground">
                输入有效的 IPFS CID（以 Qm 开头，至少 44 个字符）
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} className="crystal-card">
                取消
              </Button>
              <Button onClick={handleSingleAdd} disabled={!singleCid.trim()} className="crystal-button text-white">
                <Plus className="mr-2 h-4 w-4" />
                添加
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-cids">CID 列表</Label>
              <Textarea
                id="batch-cids"
                placeholder="每行一个 CID&#10;QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG&#10;QmXxx..."
                value={batchCids}
                onChange={(e) => setBatchCids(e.target.value)}
                className="crystal-input font-mono min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                每行输入一个 CID，空行会被自动忽略
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} className="crystal-card">
                取消
              </Button>
              <Button onClick={handleBatchAdd} disabled={!batchCids.trim()} className="crystal-button text-white">
                <Plus className="mr-2 h-4 w-4" />
                批量添加
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
