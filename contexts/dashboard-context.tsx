"use client";

import { createContext, useContext, useCallback, useRef, useState, useEffect, ReactNode, useMemo } from "react";
import { useRouter } from "next/navigation";
import { uploadApi, api, gatewayApi } from "@/lib/api";
import { CONFIG, FILE_EXTENSIONS } from "@/lib/config";
import { useFileStore, useGatewayStore, useUIStore, useAuthStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { isAllowedFileType, isSafeFilename, sanitizeFilename } from "@/lib/utils/security";
import { useGatewayManager } from "@/hooks/use-dashboard-gateway";
import { useFolderManager } from "@/hooks/use-dashboard-folder";
import { useCidManager } from "@/hooks/use-dashboard-cid";
import { useBatchOperations } from "@/hooks/use-dashboard-batch";
import { useFileOperations } from "@/hooks/use-dashboard-file";
import type { FileRecord, Folder, Gateway } from "@/types";

interface DashboardContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: "list" | "grid";
  setViewMode: (mode: "list" | "grid") => void;
  isLoading: boolean;
  dragOver: boolean;
  setDragOver: (drag: boolean) => void;
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  
  files: FileRecord[];
  folders: Folder[];
  totalSize: number;
  gateways: Gateway[];
  customGateways: Gateway[];
  setGateways: (gateways: Gateway[]) => void;
  
  isUploading: boolean;
  uploadProgress: number;
  
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  darkMode: boolean;
  itemsPerPage: number;
  autoRefresh: boolean;
  setDarkMode: (dark: boolean) => void;
  setItemsPerPage: (items: number) => void;
  setAutoRefresh: (auto: boolean) => void;
  downloadModalOpen: boolean;
  setDownloadModalOpen: (open: boolean) => void;
  selectedFileForDownload: FileRecord | null;
  setSelectedFileForDownload: (file: FileRecord | null) => void;
  
  handleFileUpload: (files: FileList | null) => void;
  handleLogout: () => void;
  
  gatewayModalOpen: boolean;
  setGatewayModalOpen: (open: boolean) => void;
  isTestingGateways: boolean;
  isFetchingPublicGateways: boolean;
  isAddingGateway: boolean;
  testProgress: ReturnType<typeof useGatewayManager>["testProgress"];
  healthTrends: ReturnType<typeof useGatewayManager>["healthTrends"];
  addGatewayModalOpen: boolean;
  setAddGatewayModalOpen: (open: boolean) => void;
  newGatewayName: string;
  setNewGatewayName: (name: string) => void;
  newGatewayUrl: string;
  setNewGatewayUrl: (url: string) => void;
  newGatewayRegion: "CN" | "INTL";
  setNewGatewayRegion: (region: "CN" | "INTL") => void;
  handleTestGateways: () => void;
  handleStartTestGateways: () => void;
  handlePauseTestGateways: () => void;
  handleRefreshGateways: () => void;
  handleFetchPublicGateways: () => void;
  handleTestSingleGateway: (gateway: Gateway) => void;
  handleValidateGatewayUrl: (url: string) => { valid: boolean; error?: string; normalizedUrl: string };
  handleAddCustomGateway: () => Promise<{ success: boolean; message: string }>;
  handleRemoveCustomGateway: (gateway: Gateway) => void;
  handleDownload: (cid: string, filename: string) => void;
  handleDownloadFile: (file: FileRecord) => void;
  handleDownloadWithGateway: (cid: string, filename: string, gateway: Gateway) => void;
  
  folderModalOpen: boolean;
  setFolderModalOpen: (open: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  editingFolder: Folder | null;
  setEditingFolder: (folder: Folder | null) => void;
  handleCreateFolder: () => void;
  handleRenameFolder: () => void;
  handleDeleteFolder: (folderId: string) => void;
  
  addCidModalOpen: boolean;
  setAddCidModalOpen: (open: boolean) => void;
  newCid: string;
  setNewCid: (cid: string) => void;
  newCidName: string;
  setNewCidName: (name: string) => void;
  newCidSize: string;
  setNewCidSize: (size: string) => void;
  isAddingCid: boolean;
  isDetectingCid: boolean;
  detectedCidInfo: ReturnType<typeof useCidManager>["detectedCidInfo"];
  handleAddCid: () => void;
  handleDetectCid: (cid: string) => Promise<void>;
  
  selectedFiles: string[];
  handleToggleSelection: (fileId: string) => void;
  handleSelectAll: () => void;
  handleClearSelection: () => void;
  handleBatchMove: (targetFolderId: string | null) => void;
  handleBatchDelete: () => void;
  handleBatchCopy: () => void;
  
  moveModalOpen: boolean;
  setMoveModalOpen: (open: boolean) => void;
  selectedFileToMove: FileRecord | null;
  setSelectedFileToMove: (file: FileRecord | null) => void;
  handleMoveFile: (targetFolderId: string | null) => void;
  
  copiedId: string | number | null;
  handleDelete: (fileId: string | number) => void;
  handleCopyCID: (cid: string, fileId: string | number) => void;
  handleRenameFile: (file: FileRecord) => void;
  handleSubmitRenameFile: (fileId: string | number, newName: string) => void;
  handlePreview: (file: FileRecord) => void;
  handleClosePreview: () => void;
  handleShareFile: (file: FileRecord) => void;
  handleCloseShareModal: () => void;
  
  previewFile: FileRecord | null;
  setPreviewFile: (file: FileRecord | null) => void;
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  
  renameFileModalOpen: boolean;
  setRenameFileModalOpen: (open: boolean) => void;
  selectedFileToRename: FileRecord | null;
  setSelectedFileToRename: (file: FileRecord | null) => void;
  
  shareModalOpen: boolean;
  setShareModalOpen: (open: boolean) => void;
  selectedFileToShare: FileRecord | null;
  setSelectedFileToShare: (file: FileRecord | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { showToast } = useUIStore();
  const { files, setFiles, folders, setFolders } = useFileStore();
  const { gateways, setGateways, customGateways } = useGatewayStore();
  const { isAuthenticated, logout } = useAuthStore();
  
  const totalSize = useMemo(() => 
    files.reduce((acc, file) => acc + (Number(file.size) || 0), 0),
    [files]
  );
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedFileForDownload, setSelectedFileForDownload] = useState<FileRecord | null>(null);
  
  const dataLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  
  useEffect(() => {
    if (dataLoadedRef.current || isLoadingRef.current) return;
    
    const loadData = async () => {
      isLoadingRef.current = true;
      setIsLoading(true);
      try {
        const savedViewMode = localStorage.getItem("viewMode") as "list" | "grid";
        if (savedViewMode) setViewMode(savedViewMode);
        
        const savedDarkMode = localStorage.getItem("darkMode");
        if (savedDarkMode !== null) setDarkMode(savedDarkMode === "true");
        
        const savedItemsPerPage = localStorage.getItem("itemsPerPage");
        if (savedItemsPerPage) setItemsPerPage(parseInt(savedItemsPerPage));
        
        const savedAutoRefresh = localStorage.getItem("autoRefresh");
        if (savedAutoRefresh !== null) setAutoRefresh(savedAutoRefresh === "true");
        
        const cachedGateways = gatewayApi.getCachedResults();
        if (cachedGateways && cachedGateways.length > 0) {
          setGateways(cachedGateways);
        } else {
          setGateways(CONFIG.DEFAULT_GATEWAYS);
        }
        
        const loadedFiles = await api.loadFiles();
        setFiles(loadedFiles);
        
        const loadedFolders = await api.loadFolders();
        setFolders(loadedFolders);
        
        dataLoadedRef.current = true;
      } catch (error) {
        showToast("加载数据失败", "error");
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };
    
    loadData();
  }, [setFiles, setFolders, setGateways, showToast]);
  
  const handleFileUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      
      const filesArray = Array.from(fileList);
      const validFiles = filesArray.filter((file) => {
        if (file.size > CONFIG.UPLOAD.MAX_SIZE) {
          showToast(`文件 ${file.name} 超过1GB限制`, "error");
          return false;
        }
        
        if (!isSafeFilename(file.name)) {
          showToast(`文件 ${file.name} 包含非法字符`, "error");
          return false;
        }
        
        if (file.type && !isAllowedFileType(file.type)) {
          const ext = file.name.split('.').pop()?.toLowerCase();
          if (ext && !FILE_EXTENSIONS.ALLOWED.includes(ext as typeof FILE_EXTENSIONS.ALLOWED[number])) {
            showToast(`文件 ${file.name} 类型不支持`, "error");
            return false;
          }
        }
        
        return true;
      });
      
      if (validFiles.length === 0) return;
      
      setIsUploading(true);
      
      try {
        const token = await api.getToken();
        
        for (const file of validFiles) {
          setUploadProgress(0);
          
          try {
            const result = await uploadApi.uploadToCrust(file, token, (progress) => {
              setUploadProgress(progress);
            });
            
            const safeName = sanitizeFilename(file.name);
            
            const fileRecord: FileRecord = {
              id: generateId(),
              name: safeName,
              size: result.size,
              cid: result.cid,
              date: new Date().toLocaleString(),
              folder_id: currentFolderId || "default",
              hash: result.hash,
              verified: false,
              verify_status: "pending",
              uploadedAt: Date.now(),
            };
            
            await api.saveFile(fileRecord);
            setFiles((prev) => [fileRecord, ...prev]);
            showToast(`文件 ${safeName} 上传成功`, "success");
            
            const uploadedFileId = fileRecord.id;
            const uploadedFileCid = result.cid;
            
            uploadApi.verifyFile(uploadedFileCid).then((verifyResult) => {
              const updates = {
                verified: verifyResult.verified,
                verify_status: verifyResult.status,
                verify_message: verifyResult.message,
              };
              
              setFiles((prev) =>
                prev.map((f) => (f.id === uploadedFileId ? { ...f, ...updates } : f))
              );
              
              api.updateFile(uploadedFileId, updates).catch((err) => {
                console.error("保存验证结果失败:", err);
              });
            }).catch((err) => {
              console.error("文件验证过程出错:", err);
            });
          } catch {
            showToast(`文件 ${file.name} 上传失败`, "error");
          }
        }
      } catch {
        showToast("获取上传令牌失败", "error");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [currentFolderId, showToast, setFiles]
  );
  
  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);
  
  const gatewayManager = useGatewayManager(gateways, setGateways, showToast);
  const folderManager = useFolderManager(folders, setFolders, currentFolderId, setCurrentFolderId, showToast);
  const cidManager = useCidManager(currentFolderId, setFiles, showToast);
  const batchOperations = useBatchOperations(files, setFiles, showToast);
  const fileOperations = useFileOperations(setFiles, showToast);
  
  const handleSelectAll = useCallback(() => {
    batchOperations.createHandleSelectAll(searchQuery, currentFolderId)();
  }, [batchOperations, searchQuery, currentFolderId]);
  
  const handleDownloadFile = useCallback(async (file: FileRecord) => {
    try {
      const { url } = await gatewayApi.getBestGatewayUrl();
      const downloadUrl = `${url}${file.cid}?filename=${encodeURIComponent(file.name)}&download=true`;
      window.open(downloadUrl, '_blank');
      showToast(`开始下载 ${file.name}`, "success");
    } catch {
      showToast(`下载 ${file.name} 失败`, "error");
    }
  }, [showToast]);
  
  const value: DashboardContextValue = {
    searchQuery, setSearchQuery,
    viewMode, setViewMode,
    isLoading, dragOver, setDragOver,
    currentFolderId, setCurrentFolderId,
    
    files, folders, totalSize,
    gateways, customGateways,
    setGateways,
    
    isUploading, uploadProgress,
    
    settingsModalOpen, setSettingsModalOpen,
    darkMode, itemsPerPage, autoRefresh,
    setDarkMode, setItemsPerPage, setAutoRefresh,
    downloadModalOpen, setDownloadModalOpen,
    selectedFileForDownload, setSelectedFileForDownload,
    
    handleFileUpload,
    handleLogout,
    
    ...gatewayManager,
    handleDownloadFile,
    ...folderManager,
    ...cidManager,
    
    selectedFiles: batchOperations.selectedFiles,
    handleToggleSelection: batchOperations.handleToggleSelection,
    handleSelectAll,
    handleClearSelection: batchOperations.handleClearSelection,
    handleBatchMove: batchOperations.handleBatchMove,
    handleBatchDelete: batchOperations.handleBatchDelete,
    handleBatchCopy: batchOperations.handleBatchCopy,
    
    moveModalOpen: fileOperations.moveModalOpen,
    setMoveModalOpen: fileOperations.setMoveModalOpen,
    selectedFileToMove: fileOperations.selectedFileToMove,
    setSelectedFileToMove: fileOperations.setSelectedFileToMove,
    handleMoveFile: fileOperations.handleMoveFile,
    
    copiedId: fileOperations.copiedId,
    handleDelete: fileOperations.handleDelete,
    handleCopyCID: fileOperations.handleCopyCID,
    handleRenameFile: fileOperations.handleRenameFile,
    handleSubmitRenameFile: fileOperations.handleSubmitRenameFile,
    handlePreview: fileOperations.handlePreview,
    handleClosePreview: fileOperations.handleClosePreview,
    handleShareFile: fileOperations.handleShareFile,
    handleCloseShareModal: fileOperations.handleCloseShareModal,
    
    previewFile: fileOperations.previewFile,
    setPreviewFile: fileOperations.setPreviewFile,
    previewOpen: fileOperations.previewOpen,
    setPreviewOpen: fileOperations.setPreviewOpen,
    
    renameFileModalOpen: fileOperations.renameFileModalOpen,
    setRenameFileModalOpen: fileOperations.setRenameFileModalOpen,
    selectedFileToRename: fileOperations.selectedFileToRename,
    setSelectedFileToRename: fileOperations.setSelectedFileToRename,
    
    shareModalOpen: fileOperations.shareModalOpen,
    setShareModalOpen: fileOperations.setShareModalOpen,
    selectedFileToShare: fileOperations.selectedFileToShare,
    setSelectedFileToShare: fileOperations.setSelectedFileToShare,
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
