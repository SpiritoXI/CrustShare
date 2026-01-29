"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { useUIStore } from "@/lib/store";

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: "bg-green-500/90 text-white",
  error: "bg-red-500/90 text-white",
  warning: "bg-yellow-500/90 text-white",
  info: "bg-blue-500/90 text-white",
};

export function Toast() {
  const { toast } = useUIStore();

  if (!toast) return null;

  const Icon = icons[toast.type];

  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -50, x: "-50%" }}
          className={`fixed top-4 left-1/2 z-50 flex items-center space-x-2 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm ${styles[toast.type]}`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
