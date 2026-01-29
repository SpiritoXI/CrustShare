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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Trash2, Shield, Globe, Lock } from 'lucide-react';
import useStore, { PermissionType } from '@/store/useStore';
import { toast } from 'sonner';

interface PermissionManagerProps {
  fileId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PermissionManager({
  fileId,
  fileName,
  open,
  onOpenChange,
}: PermissionManagerProps) {
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  const users = useStore((state) => state.users);
  const file = useStore((state) => state.files.find((f) => f.id === fileId));
  const currentUser = useStore((state) => state.currentUser);
  const isPublic = file?.isPublic || false;

  const addUser = useStore((state) => state.addUser);
  const addFilePermission = useStore((state) => state.addFilePermission);
  const removeFilePermission = useStore((state) => state.removeFilePermission);
  const updateFilePermission = useStore((state) => state.updateFilePermission);
  const togglePublic = useStore((state) => state.togglePublic);

  const permissions = file?.permissions || [];

  const handleAddUser = () => {
    if (!newUserName || !newUserEmail) {
      toast.error('请填写完整用户信息');
      return;
    }

    const newUserId = `user-${Date.now()}`;
    const newUser = {
      id: newUserId,
      name: newUserName,
      email: newUserEmail,
    };

    addUser(newUser);

    // 默认给予读取权限
    addFilePermission(fileId, {
      userId: newUserId,
      permissions: [PermissionType.READ],
    });

    toast.success(`已添加用户 ${newUserName}`);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleRemoveUser = (userId: string) => {
    if (confirm('确定要移除该用户的访问权限吗？')) {
      removeFilePermission(fileId, userId);
      toast.success('已移除用户权限');
    }
  };

  const handleTogglePermission = (
    userId: string,
    permission: PermissionType
  ) => {
    const userPermissions = permissions.find((p) => p.userId === userId);
    if (!userPermissions) return;

    const newPermissions = userPermissions.permissions.includes(permission)
      ? userPermissions.permissions.filter((p) => p !== permission)
      : [...userPermissions.permissions, permission];

    updateFilePermission(fileId, userId, newPermissions);
  };

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const permissionLabels: Record<PermissionType, string> = {
    [PermissionType.READ]: '查看',
    [PermissionType.WRITE]: '编辑',
    [PermissionType.DELETE]: '删除',
    [PermissionType.SHARE]: '分享',
  };

  const permissionColors: Record<PermissionType, string> = {
    [PermissionType.READ]: 'crystal-badge crystal-badge-primary',
    [PermissionType.WRITE]: 'crystal-badge crystal-badge-warning',
    [PermissionType.DELETE]: 'crystal-badge crystal-badge-danger',
    [PermissionType.SHARE]: 'crystal-badge crystal-badge-success',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="crystal-dialog sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500/70" />
            <span className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 bg-clip-text text-transparent">
              权限管理
            </span>
          </DialogTitle>
          <DialogDescription>
            管理 {fileName} 的访问权限
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 公开访问开关 */}
          <div className="p-4 crystal-card rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="h-5 w-5 text-green-500/70" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-500/70" />
                )}
                <div>
                  <p className="font-medium">公开访问</p>
                  <p className="text-xs text-muted-foreground">
                    {isPublic
                      ? '所有人都可以查看此文件'
                      : '只有授权用户可以访问此文件'}
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={() => togglePublic(fileId)} />
            </div>
          </div>

          {/* 添加用户 */}
          <div className="p-4 crystal-card rounded-lg">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              添加用户
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="用户名"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="crystal-input flex-1"
              />
              <Input
                placeholder="邮箱"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="crystal-input flex-1"
              />
              <Button onClick={handleAddUser} className="crystal-button text-white">
                添加
              </Button>
            </div>
          </div>

          {/* 权限列表 */}
          <div className="crystal-card rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-purple-100/30">
                  <TableHead>用户</TableHead>
                  <TableHead>权限</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.length === 0 && !isPublic ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>暂无授权用户</p>
                      <p className="text-sm mt-1">添加用户以授予访问权限</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((permission) => {
                    const user = getUserById(permission.userId);
                    if (!user) return null;

                    return (
                      <TableRow key={user.id} className="crystal-table-row border-b border-purple-50/30">
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.values(PermissionType).map((perm) => (
                              <Badge
                                key={perm}
                                className={`cursor-pointer transition-all ${
                                  permission.permissions.includes(perm)
                                    ? permissionColors[perm]
                                    : 'bg-gray-100/60 text-gray-500 border border-gray-200/60'
                                }`}
                                onClick={() =>
                                  handleTogglePermission(user.id, perm)
                                }
                              >
                                {permissionLabels[perm]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.id !== currentUser.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveUser(user.id)}
                              className="h-8 w-8 crystal-icon text-red-400/80 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
