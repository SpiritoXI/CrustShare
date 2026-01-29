'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, FileIcon, Folder, Tag as TagIcon, Settings, LogOut } from 'lucide-react';

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" className="crystal-card">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="crystal-dialog w-72">
        <div className="flex flex-col space-y-4 mt-8">
          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setOpen(false)}
            >
              <FileIcon className="mr-2 h-4 w-4" />
              文件列表
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setOpen(false)}
            >
              <Folder className="mr-2 h-4 w-4" />
              文件夹
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setOpen(false)}
            >
              <TagIcon className="mr-2 h-4 w-4" />
              标签
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setOpen(false)}
            >
              <Settings className="mr-2 h-4 w-4" />
              设置
            </Button>
          </nav>

          <div className="border-t border-purple-100/30 pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500/80 hover:text-red-600"
              onClick={() => setOpen(false)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
