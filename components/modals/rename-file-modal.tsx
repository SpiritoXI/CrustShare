"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/modal";
import { getFileExtension } from "@/lib/utils";
import type { FileRecord } from "@/types";

interface RenameFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileRecord | null;
  onRename: (fileId: string | number, newName: string) => void;
}

export function RenameFileModal({
  isOpen,
  onClose,
  file,
  onRename,
}: RenameFileModalProps) {
  const [nameWithoutExt, setNameWithoutExt] = useState("");
  const [extension, setExtension] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (file && isOpen) {
      const ext = getFileExtension(file.name);
      const name = ext ? file.name.slice(0, -(ext.length + 1)) : file.name;
      setNameWithoutExt(name);
      setExtension(ext);
      setFullName(file.name);
    }
  }, [file, isOpen]);

  const handleNameChange = (value: string) => {
    setNameWithoutExt(value);
    setFullName(extension ? `${value}.${extension}` : value);
  };

  const handleExtensionChange = (value: string) => {
    setExtension(value);
    setFullName(value ? `${nameWithoutExt}.${value}` : nameWithoutExt);
  };

  const handleSubmit = () => {
    if (file && fullName.trim()) {
      onRename(file.id as string | number, fullName.trim());
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<h3 className="text-lg font-semibold">重命名文件</h3>}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">文件名</label>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="输入文件名"
              value={nameWithoutExt}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              autoFocus
              className="flex-1"
            />
            <span className="text-muted-foreground">.</span>
            <Input
              placeholder="后缀"
              value={extension}
              onChange={(e) => handleExtensionChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              className="w-24"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            完整文件名: {fullName || "(未命名)"}
          </p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-cloudchan-blue to-cloudchan-purple"
            onClick={handleSubmit}
            disabled={!fullName.trim()}
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
