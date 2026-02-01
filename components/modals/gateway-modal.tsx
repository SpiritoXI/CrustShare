"use client";

import { motion } from "framer-motion";
import { Globe, RefreshCw, Plus, ExternalLink, Trash2, Zap, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/modal";
import type { Gateway } from "@/types";

interface GatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateways: Gateway[];
  customGateways: Gateway[];
  isTesting: boolean;
  isFetchingPublic: boolean;
  onRefresh: () => void;
  onAdd: () => void;
  onTest: (gateway: Gateway) => void;
  onRemove: (name: string) => void;
  onUpdate: (gateways: Gateway[]) => void;
  onFetchPublic: () => void;
  onCancelTest?: () => void;
}

export function GatewayModal({
  isOpen,
  onClose,
  gateways,
  customGateways,
  isTesting,
  isFetchingPublic,
  onRefresh,
  onAdd,
  onTest,
  onRemove,
  onUpdate,
  onFetchPublic,
  onCancelTest,
}: GatewayModalProps) {
  const title = (
    <div>
      <h3 className="text-lg font-semibold flex items-center">
        <Globe className="h-5 w-5 mr-2" />
        网关可用性检测
      </h3>
      <p className="text-sm text-muted-foreground">
        可用: {gateways.filter((g) => g.available).length} / 总数: {gateways.length}
        {customGateways.length > 0 && ` (含 ${customGateways.length} 个自定义)`}
      </p>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="xl">
      <div className="flex items-center justify-end space-x-2 mb-4">
        <Button variant="outline" size="sm" onClick={onFetchPublic} disabled={isFetchingPublic || isTesting}>
          <Download className={`h-4 w-4 mr-1 ${isFetchingPublic ? "animate-spin" : ""}`} />
          获取公共网关
        </Button>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" />
          添加网关
        </Button>
        {isTesting && onCancelTest ? (
          <Button variant="outline" size="sm" onClick={onCancelTest} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <X className="h-4 w-4 mr-1" />
            取消检测
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isTesting}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isTesting ? "animate-spin" : ""}`} />
            重新检测
          </Button>
        )}
      </div>

      {isTesting && gateways.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-8 w-8 animate-spin text-cloudchan-purple" />
          <span className="ml-2">正在检测网关...</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {gateways.map((gateway, index) => (
            <motion.div
              key={gateway.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                gateway.available
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{gateway.icon}</span>
                <div>
                  <p className="font-medium text-sm">{gateway.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                    {gateway.url}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {gateway.available ? (
                  <>
                    <span className="text-xs text-green-600 font-medium">
                      {gateway.latency}ms
                    </span>
                    <Zap className="h-4 w-4 text-green-500" />
                  </>
                ) : (
                  <span className="text-xs text-red-500">不可用</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onTest(gateway)}
                  title="测试此网关"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <a
                  href={gateway.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                {customGateways.find((cg) => cg.name === gateway.name) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onRemove(gateway.name)}
                    title="删除自定义网关"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Modal>
  );
}
