import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FileRecord, Folder, Gateway, ViewMode, StorageStats } from "@/types";

interface AuthState {
  isAuthenticated: boolean;
  password: string | null;
  csrfToken: string | null;
  loginAttempts: number;
  lockedUntil: number | null;
  login: (password: string) => boolean;
  logout: () => void;
  generateCsrfToken: () => string;
  isLocked: () => boolean;
  recordFailedAttempt: () => void;
}

interface ShareInfo {
  cid: string;
  filename?: string;
  size?: number;
  expiry?: string;
  createdAt: number;
  hasPassword: boolean;
}

interface FileState {
  files: FileRecord[];
  folders: Folder[];
  shares: ShareInfo[];
  selectedFolder: string | null;
  selectedFiles: string[];
  viewMode: ViewMode;
  searchQuery: string;
  currentPage: number;
  itemsPerPage: number;
  isLoading: boolean;
  storageStats: StorageStats;
  setFiles: (files: FileRecord[] | ((prev: FileRecord[]) => FileRecord[])) => void;
  setFolders: (folders: Folder[] | ((prev: Folder[]) => Folder[])) => void;
  setShares: (shares: ShareInfo[] | ((prev: ShareInfo[]) => ShareInfo[])) => void;
  addFile: (file: FileRecord) => void;
  updateFile: (id: string | number, updates: Partial<FileRecord>) => void;
  deleteFile: (id: string | number) => void;
  setSelectedFolder: (folderId: string | null) => void;
  setSelectedFiles: (files: string[] | ((prev: string[]) => string[])) => void;
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  setIsLoading: (loading: boolean) => void;
  updateStorageStats: () => void;
}

interface GatewayState {
  gateways: Gateway[];
  customGateways: Gateway[];
  hideUnavailable: boolean;
  isTesting: boolean;
  lastTestTime: number | null;
  setGateways: (gateways: Gateway[]) => void;
  addCustomGateway: (gateway: Gateway) => void;
  removeCustomGateway: (name: string) => void;
  updateGateway: (name: string, updates: Partial<Gateway>) => void;
  setHideUnavailable: (hide: boolean) => void;
  setIsTesting: (testing: boolean) => void;
  setLastTestTime: (time: number) => void;
  getAllGateways: () => Gateway[];
  getAvailableGateways: () => Gateway[];
  getBestGateway: () => Gateway | null;
}

interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  uploadQueue: File[];
  currentFile: File | null;
  setIsUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  addToQueue: (files: File[]) => void;
  removeFromQueue: (file: File) => void;
  setCurrentFile: (file: File | null) => void;
  clearQueue: () => void;
}

interface UIState {
  isSidebarOpen: boolean;
  isUploadModalOpen: boolean;
  isGatewayModalOpen: boolean;
  isAddCidModalOpen: boolean;
  isShareModalOpen: boolean;
  shareCid: string | null;
  toast: {
    message: string;
    type: "success" | "error" | "info" | "warning";
    visible: boolean;
  } | null;
  setSidebarOpen: (open: boolean) => void;
  setUploadModalOpen: (open: boolean) => void;
  setGatewayModalOpen: (open: boolean) => void;
  setAddCidModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean, cid?: string) => void;
  showToast: (message: string, type: "success" | "error" | "info" | "warning") => void;
  hideToast: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      password: null,
      csrfToken: null,
      loginAttempts: 0,
      lockedUntil: null,

      login: (password: string) => {
        const state = get();
        if (state.isLocked()) {
          return false;
        }
        set({
          isAuthenticated: true,
          password,
          csrfToken: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          loginAttempts: 0,
          lockedUntil: null,
        });
        return true;
      },

      logout: () => {
        set({
          isAuthenticated: false,
          password: null,
          csrfToken: null,
        });
      },

      generateCsrfToken: () => {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        set({ csrfToken: token });
        return token;
      },

      isLocked: () => {
        const { lockedUntil } = get();
        if (!lockedUntil) return false;
        return Date.now() < lockedUntil;
      },

      recordFailedAttempt: () => {
        const state = get();
        const newAttempts = state.loginAttempts + 1;
        const updates: Partial<AuthState> = { loginAttempts: newAttempts };

        if (newAttempts >= 5) {
          updates.lockedUntil = Date.now() + 30 * 60 * 1000;
        }

        set(updates);
      },
    }),
    {
      name: "crustshare-auth",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        password: state.password,
        csrfToken: state.csrfToken,
        loginAttempts: state.loginAttempts,
        lockedUntil: state.lockedUntil,
      }),
    }
  )
);

export const useFileStore = create<FileState>()((set, get) => ({
  files: [],
  folders: [],
  shares: [],
  selectedFolder: null,
  selectedFiles: [],
  viewMode: "list",
  searchQuery: "",
  currentPage: 1,
  itemsPerPage: 10,
  isLoading: false,
  storageStats: { totalFiles: 0, totalFolders: 0, totalSize: 0 },

  setFiles: (files) => {
    if (typeof files === "function") {
      set((state) => {
        const newFiles = files(state.files);
        // 基于 CID 去重，保留最新的文件
        const uniqueFiles = Array.from(
          new Map(newFiles.map((f) => [f.cid, f])).values()
        );
        return { files: uniqueFiles };
      });
    } else {
      // 基于 CID 去重，保留最新的文件
      const uniqueFiles = Array.from(
        new Map(files.map((f) => [f.cid, f])).values()
      );
      set({ files: uniqueFiles });
    }
    get().updateStorageStats();
  },

  setFolders: (folders) => {
    if (typeof folders === "function") {
      set((state) => {
        const newFolders = folders(state.folders);
        return { folders: newFolders };
      });
    } else {
      set({ folders });
    }
    get().updateStorageStats();
  },

  setShares: (shares) => {
    if (typeof shares === "function") {
      set((state) => {
        const newShares = shares(state.shares);
        return { shares: newShares };
      });
    } else {
      set({ shares });
    }
  },

  addFile: (file) => {
    set((state) => ({ files: [file, ...state.files] }));
    get().updateStorageStats();
  },

  updateFile: (id, updates) => {
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  },

  deleteFile: (id) => {
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
      selectedFiles: state.selectedFiles.filter((fid) => fid !== String(id)),
    }));
    get().updateStorageStats();
  },

  setSelectedFolder: (folderId) => set({ selectedFolder: folderId, currentPage: 1 }),

  setSelectedFiles: (files) => {
    if (typeof files === 'function') {
      set((state) => ({ selectedFiles: files(state.selectedFiles) }));
    } else {
      set({ selectedFiles: files });
    }
  },

  toggleFileSelection: (fileId) => {
    set((state) => ({
      selectedFiles: state.selectedFiles.includes(fileId)
        ? state.selectedFiles.filter((id) => id !== fileId)
        : [...state.selectedFiles, fileId],
    }));
  },

  selectAllFiles: () => {
    const { files, selectedFolder } = get();
    const filteredFiles = selectedFolder
      ? files.filter((f) => f.folder_id === selectedFolder)
      : files;
    set({ selectedFiles: filteredFiles.map((f) => String(f.id)) });
  },

  clearSelection: () => set({ selectedFiles: [] }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

  setCurrentPage: (page) => set({ currentPage: page }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  updateStorageStats: () => {
    const { files, folders } = get();
    const totalSize = files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
    set({
      storageStats: {
        totalFiles: files.length,
        totalFolders: folders.length,
        totalSize,
      },
    });
  },
}));

export const useGatewayStore = create<GatewayState>()(
  persist(
    (set, get) => ({
      gateways: [],
      customGateways: [],
      hideUnavailable: false,
      isTesting: false,
      lastTestTime: null,

      setGateways: (gateways) => set({ gateways }),

      addCustomGateway: (gateway) => {
        set((state) => ({
          customGateways: [...state.customGateways, gateway],
        }));
      },

      removeCustomGateway: (name) => {
        set((state) => ({
          customGateways: state.customGateways.filter((g) => g.name !== name),
        }));
      },

      updateGateway: (name, updates) => {
        set((state) => ({
          gateways: state.gateways.map((g) => (g.name === name ? { ...g, ...updates } : g)),
        }));
      },

      setHideUnavailable: (hide) => set({ hideUnavailable: hide }),

      setIsTesting: (testing) => set({ isTesting: testing }),

      setLastTestTime: (time) => set({ lastTestTime: time }),

      getAllGateways: () => {
        const { gateways, customGateways } = get();
        return [...customGateways, ...gateways];
      },

      getAvailableGateways: () => {
        const all = get().getAllGateways();
        return all.filter((g) => g.available);
      },

      getBestGateway: () => {
        const available = get().getAvailableGateways();
        if (available.length === 0) return null;
        return available.reduce((best, current) =>
          (current.latency || Infinity) < (best.latency || Infinity) ? current : best
        );
      },
    }),
    {
      name: "crustshare-gateways",
      partialize: (state) => ({
        gateways: state.gateways,
        customGateways: state.customGateways,
        hideUnavailable: state.hideUnavailable,
        lastTestTime: state.lastTestTime,
      }),
    }
  )
);

export const useUploadStore = create<UploadState>()((set) => ({
  isUploading: false,
  uploadProgress: 0,
  uploadQueue: [],
  currentFile: null,

  setIsUploading: (uploading) => set({ isUploading: uploading }),

  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  addToQueue: (files) => {
    set((state) => ({
      uploadQueue: [...state.uploadQueue, ...files],
    }));
  },

  removeFromQueue: (file) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((f) => f !== file),
    }));
  },

  setCurrentFile: (file) => set({ currentFile: file }),

  clearQueue: () => set({ uploadQueue: [], currentFile: null, uploadProgress: 0 }),
}));

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: true,
  isUploadModalOpen: false,
  isGatewayModalOpen: false,
  isAddCidModalOpen: false,
  isShareModalOpen: false,
  shareCid: null,
  toast: null,

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),

  setGatewayModalOpen: (open) => set({ isGatewayModalOpen: open }),

  setAddCidModalOpen: (open) => set({ isAddCidModalOpen: open }),

  setShareModalOpen: (open, cid) => set({ isShareModalOpen: open, shareCid: cid || null }),

  showToast: (message, type) => {
    set({ toast: { message, type, visible: true } });
    setTimeout(() => {
      set((state) => ({
        toast: state.toast?.message === message ? null : state.toast,
      }));
    }, 3000);
  },

  hideToast: () => set({ toast: null }),
}));
