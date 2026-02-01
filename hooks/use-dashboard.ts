"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { uploadApi, api, gatewayApi } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { useFileStore, useGatewayStore, useUIStore } from "@/lib/store";
import { generateId, formatFileSize, copyToClipboard } from "@/lib/utils";
import { isAllowedFileType, isSafeFilename, sanitizeFilename } from "@/lib/security";
import type { FileRecord, Folder } from "@/types";

export function useDashboard() {
  // UI Store
  const { showToast } = useUIStore();

  // File Store
  const {
    files, // 从 store 获取文件
    setFiles, // 从 store 获取 setFiles
    folders, // 从 store 获取文件夹
    setFolders, // 从 store 获取 setFolders
  } = useFileStore();

  // Calculate total size - 确保 size 是数字类型
  const totalSize = files.reduce((acc, file) => acc + (Number(file.size) || 0), 0);

  // Gateway Store
  const {
    gateways, // 从 store 获取 gateways
    setGateways, // 从 store 获取 setGateways
    customGateways, // 从 store 获取 customGateways
  } = useGatewayStore();

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modal States
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [isTestingGateways, setIsTestingGateways] = useState(false);
  const [isFetchingPublicGateways, setIsFetchingPublicGateways] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedFileToMove, setSelectedFileToMove] = useState<FileRecord | null>(null);
  const [addCidModalOpen, setAddCidModalOpen] = useState(false);
  const [newCid, setNewCid] = useState("");
  const [newCidName, setNewCidName] = useState("");
  const [newCidSize, setNewCidSize] = useState("");
  const [isAddingCid, setIsAddingCid] = useState(false);
  const [isDetectingCid, setIsDetectingCid] = useState(false);
  const [detectedCidInfo, setDetectedCidInfo] = useState<{ cid: string; name: string; size: number; isDirectory: boolean; valid: boolean; error?: string } | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedFileForDownload, setSelectedFileForDownload] = useState<FileRecord | null>(null);
  const [addGatewayModalOpen, setAddGatewayModalOpen] = useState(false);
  const [newGatewayName, setNewGatewayName] = useState("");
  const [newGatewayUrl, setNewGatewayUrl] = useState("");
  const [newGatewayRegion, setNewGatewayRegion] = useState<"CN" | "INTL">('CN');
  const [renameFileModalOpen, setRenameFileModalOpen] = useState(false);
  const [selectedFileToRename, setSelectedFileToRename] = useState<FileRecord | null>(null);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // 使用 ref 来防止重复加载
  const dataLoadedRef = useRef(false);

  // Load data and settings from localStorage and server
  useEffect(() => {
    // 如果数据已经加载过，不再重复加载
    if (dataLoadedRef.current) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // 从 localStorage 加载设置
        const savedViewMode = localStorage.getItem("viewMode") as "list" | "grid";
        if (savedViewMode) setViewMode(savedViewMode);

        const savedDarkMode = localStorage.getItem("darkMode");
        if (savedDarkMode !== null) setDarkMode(savedDarkMode === "true");

        const savedItemsPerPage = localStorage.getItem("itemsPerPage");
        if (savedItemsPerPage) setItemsPerPage(parseInt(savedItemsPerPage));

        const savedAutoRefresh = localStorage.getItem("autoRefresh");
        if (savedAutoRefresh !== null) setAutoRefresh(savedAutoRefresh === "true");

        // 从缓存加载网关列表
        const cachedGateways = gatewayApi.getCachedResults();
        if (cachedGateways && cachedGateways.length > 0) {
          setGateways(cachedGateways);
        } else {
          // 如果没有缓存，使用默认网关
          setGateways(CONFIG.DEFAULT_GATEWAYS);
        }

        // 从服务器加载文件列表
        const loadedFiles = await api.loadFiles();
        setFiles(loadedFiles);

        // 从服务器加载文件夹列表
        const loadedFolders = await api.loadFolders();
        setFolders(loadedFolders);

        // 标记数据已加载
        dataLoadedRef.current = true;
      } catch (error) {
        showToast("加载数据失败", "error");
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }

      // 登录后自动检测网关（在后台静默执行，不阻塞文件列表加载）
      // 检查缓存是否过期或是否需要重新检测
      const shouldTestGateways = !cachedGateways ||
        cachedGateways.length === 0 ||
        (cachedGateways[0]?.lastChecked &&
          Date.now() - cachedGateways[0].lastChecked > 5 * 60 * 1000);

      if (shouldTestGateways) {
        setIsTestingGateways(true);
        try {
          const allGateways = CONFIG.DEFAULT_GATEWAYS;
          const results = await gatewayApi.testAllGateways(allGateways);
          setGateways(results);
          gatewayApi.cacheResults(results);
          const availableCount = results.filter(g => g.available).length;
          showToast(`网关检测完成，${availableCount} 个可用`, "success");
        } catch {
          console.error("自动网关检测失败");
        } finally {
          setIsTestingGateways(false);
        }
      }
    };

    loadData();
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const filesArray = Array.from(fileList);
      const validFiles = filesArray.filter((file) => {
        // 文件大小检查
        if (file.size > CONFIG.UPLOAD.MAX_SIZE) {
          showToast(`文件 ${file.name} 超过1GB限制`, "error");
          return false;
        }
        
        // 文件名安全检查
        if (!isSafeFilename(file.name)) {
          showToast(`文件 ${file.name} 包含非法字符`, "error");
          return false;
        }
        
        // MIME 类型检查（如果浏览器提供了类型）
        if (file.type && !isAllowedFileType(file.type)) {
          // 对于未知类型，通过扩展名判断
          const ext = file.name.split('.').pop()?.toLowerCase();
          const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'txt', 'md', 'json', 'mp4', 'webm', 'mp3', 'wav', 'zip', 'rar'];
          if (ext && !allowedExts.includes(ext)) {
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

            // 使用安全的文件名
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

            // 后台快速验证文件完整性
            uploadApi.verifyFile(result.cid).then((verifyResult) => {
              const verifiedFile: FileRecord = {
                ...fileRecord,
                verified: verifyResult.verified,
                verify_status: verifyResult.status,
                verify_message: verifyResult.message,
              };

              // 更新本地状态
              setFiles((prev) =>
                prev.map((f) => (f.id === fileRecord.id ? verifiedFile : f))
              );

              // 保存验证结果到服务器
              api.saveFile(verifiedFile).catch((err) => {
                console.error("保存验证结果失败:", err);
              });

              // 可选：根据验证结果显示提示
              if (verifyResult.verified) {
                console.log(`文件 ${safeName} 完整性验证通过`);
              } else if (verifyResult.status === "failed") {
                console.warn(`文件 ${safeName} 完整性验证失败:`, verifyResult.message);
              }
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
    [currentFolderId, showToast]
  );

  // Handle file delete
  const handleDelete = useCallback(
    async (fileId: string | number) => {
      try {
        await api.deleteFile(fileId.toString());
        // 使用函数式更新，避免依赖外部的 files 数组
        setFiles((prev) => prev.filter((f) => f.id !== fileId.toString()));
        showToast("文件已删除", "success");
      } catch {
        showToast("删除文件失败", "error");
      }
    },
    [showToast]
  );

  // Handle copy CID
  const handleCopyCID = useCallback(
    (cid: string, fileId: string | number) => {
      copyToClipboard(cid);
      setCopiedId(fileId);
      setTimeout(() => setCopiedId(null), 2000);
      showToast("CID 已复制", "success");
    },
    [showToast]
  );

  // Handle rename file
  const handleRenameFile = useCallback(
    (file: FileRecord) => {
      setSelectedFileToRename(file);
      setRenameFileModalOpen(true);
    },
    []
  );

  // Handle submit rename file
  const handleSubmitRenameFile = useCallback(
    async (fileId: string | number, newName: string) => {
      try {
        await api.renameFile(fileId.toString(), newName);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId.toString() ? { ...f, name: newName } : f
          )
        );
        showToast("文件已重命名", "success");
        setRenameFileModalOpen(false);
        setSelectedFileToRename(null);
      } catch {
        showToast("重命名文件失败", "error");
      }
    },
    [setFiles, showToast]
  );

  // Handle preview
  const handlePreview = useCallback(
    (file: FileRecord) => {
      setPreviewFile(file);
      setPreviewOpen(true);
    },
    []
  );

  // Handle close preview
  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewFile(null);
  }, []);

  // Handle test gateways - 打开模态框并执行检测
  const handleTestGateways = useCallback(async () => {
    // 先打开模态框
    setGatewayModalOpen(true);

    // 如果已经在检测中，不重复执行
    if (isTestingGateways) return;

    setIsTestingGateways(true);
    try {
      // 如果 gateways 为空，使用默认网关
      const allGateways = gateways.length > 0 ? [...gateways] : [...CONFIG.DEFAULT_GATEWAYS];
      const results = await gatewayApi.testAllGateways(allGateways);
      setGateways(results);
      gatewayApi.cacheResults(results);
      showToast("网关测试完成", "success");
    } catch {
      showToast("测试网关失败", "error");
    } finally {
      setIsTestingGateways(false);
    }
  }, [gateways, setGateways, showToast, isTestingGateways]);

  // Handle refresh gateways
  const handleRefreshGateways = useCallback(async () => {
    setIsTestingGateways(true);
    try {
      // 如果 gateways 为空，使用默认网关
      const allGateways = gateways.length > 0 ? [...gateways] : [...CONFIG.DEFAULT_GATEWAYS];
      const results = await gatewayApi.testAllGateways(allGateways);
      setGateways(results);
      gatewayApi.cacheResults(results);
    } catch {
      showToast("刷新网关失败", "error");
    } finally {
      setIsTestingGateways(false);
    }
  }, [gateways, setGateways, showToast]);

  // Handle fetch public gateways
  const handleFetchPublicGateways = useCallback(async () => {
    setIsFetchingPublicGateways(true);
    try {
      const publicGateways = await gatewayApi.fetchPublicGateways();

      if (publicGateways.length === 0) {
        showToast("未获取到新的公共网关", "info");
        return;
      }

      // 检测新获取的公共网关
      setIsTestingGateways(true);
      showToast(`获取到 ${publicGateways.length} 个公共网关，正在检测...`, "info");

      const testedPublicGateways = await gatewayApi.testAllGateways(publicGateways);

      // 合并网关，去重
      const allGateways = [...gateways, ...testedPublicGateways];
      const uniqueGateways = allGateways.filter(
        (gateway, index, self) => index === self.findIndex((g) => g.url === gateway.url)
      );

      setGateways(uniqueGateways);
      gatewayApi.cacheResults(uniqueGateways);

      const availableCount = testedPublicGateways.filter(g => g.available).length;
      showToast(`公共网关获取完成，${availableCount} 个可用`, "success");
    } catch {
      showToast("获取公共网关失败", "error");
    } finally {
      setIsFetchingPublicGateways(false);
      setIsTestingGateways(false);
    }
  }, [gateways, setGateways, showToast]);

  // Handle test single gateway
  const handleTestSingleGateway = useCallback(
    async (gateway: any) => {
      try {
        const result = await gatewayApi.testGateway(gateway.url);
        const updatedGateways = gateways.map((g) => {
          if (g.url === gateway.url) {
            return {
              ...g,
              available: result.available,
              latency: result.latency
            };
          }
          return g;
        });
        setGateways(updatedGateways);
      } catch {
        showToast("测试网关失败", "error");
      }
    },
    [gateways, setGateways, showToast]
  );

  // Handle add custom gateway
  const handleAddCustomGateway = useCallback(async () => {
    if (!newGatewayName || !newGatewayUrl) {
      showToast("请填写网关名称和URL", "error");
      return;
    }

    try {
      const newGateway = {
        name: newGatewayName,
        url: newGatewayUrl,
        region: newGatewayRegion || "CN",
        available: true,
        latency: 0,
        isCustom: true,
        icon: "",
        priority: 0
      };

      const updatedGateways = [...gateways, newGateway];
      setGateways(updatedGateways);
      setAddGatewayModalOpen(false);
      setNewGatewayName("");
      setNewGatewayUrl("");
      setNewGatewayRegion('CN');
      showToast("自定义网关已添加", "success");
    } catch {
      showToast("添加网关失败", "error");
    }
  }, [newGatewayName, newGatewayUrl, newGatewayRegion, gateways, setGateways, showToast]);

  // Handle remove custom gateway
  const handleRemoveCustomGateway = useCallback(
    async (gateway: any) => {
      try {
        const updatedGateways = gateways.filter((g) => g.url !== gateway.url);
        setGateways(updatedGateways);
        showToast("网关已删除", "success");
      } catch {
        showToast("删除网关失败", "error");
      }
    },
    [gateways, setGateways, showToast]
  );

  // Handle download
  const handleDownload = useCallback(
    async (cid: string, filename: string) => {
      try {
        const { url } = await gatewayApi.getBestGatewayUrl();
        const downloadUrl = `${url}${cid}?filename=${encodeURIComponent(filename)}&download=true`;
        window.open(downloadUrl, '_blank');
        showToast(`开始下载 ${filename}`, "success");
      } catch {
        showToast(`下载 ${filename} 失败`, "error");
      }
    },
    [showToast]
  );

  // Handle download file record
  const handleDownloadFile = useCallback(
    async (file: FileRecord) => {
      try {
        const { url } = await gatewayApi.getBestGatewayUrl();
        const downloadUrl = `${url}${file.cid}?filename=${encodeURIComponent(file.name)}&download=true`;
        window.open(downloadUrl, '_blank');
        showToast(`开始下载 ${file.name}`, "success");
      } catch {
        showToast(`下载 ${file.name} 失败`, "error");
      }
    },
    [showToast]
  );

  // Handle download with gateway
  const handleDownloadWithGateway = useCallback(
    (cid: string, filename: string, gateway: any) => {
      const downloadUrl = `${gateway.url}${cid}?filename=${encodeURIComponent(filename)}&download=true`;
      window.open(downloadUrl, '_blank');
      showToast(`使用 ${gateway.name} 下载 ${filename}`, "success");
    },
    [showToast]
  );

  // Handle create folder
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) {
      showToast("请输入文件夹名称", "error");
      return;
    }

    try {
      const newFolder = await api.createFolder(newFolderName.trim(), currentFolderId);
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      setFolderModalOpen(false);
      setNewFolderName("");
      showToast("文件夹已创建", "success");
    } catch {
      showToast("创建文件夹失败", "error");
    }
  }, [newFolderName, folders, showToast]);

  // Handle rename folder
  const handleRenameFolder = useCallback(async () => {
    if (!editingFolder || !newFolderName.trim()) {
      showToast("请输入文件夹名称", "error");
      return;
    }

    try {
      await api.renameFolder(editingFolder.id, newFolderName.trim());
      const updatedFolders = folders.map((f) =>
        f.id === editingFolder.id ? { ...f, name: newFolderName.trim() } : f
      );
      setFolders(updatedFolders);
      setFolderModalOpen(false);
      setNewFolderName("");
      setEditingFolder(null);
      showToast("文件夹已重命名", "success");
    } catch {
      showToast("重命名文件夹失败", "error");
    }
  }, [editingFolder, newFolderName, folders, showToast]);

  // Handle delete folder
  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      if (!folderId) return;

      try {
        await api.deleteFolder(folderId);
        const updatedFolders = folders.filter((f) => f.id !== folderId);
        setFolders(updatedFolders);
        if (currentFolderId === folderId) {
          setCurrentFolderId(null);
        }
        showToast("文件夹已删除", "success");
      } catch {
        showToast("删除文件夹失败", "error");
      }
    },
    [currentFolderId, folders, showToast]
  );

  // Handle move file
  const handleMoveFile = useCallback(
    async (targetFolderId: string | null) => {
      if (!selectedFileToMove) return;

      try {
        await api.moveFiles([selectedFileToMove.id], targetFolderId || "default");
        // 使用函数式更新，避免依赖外部的 files 数组
        setFiles((prev) =>
          prev.map((f) =>
            f.id === selectedFileToMove.id ? { ...f, folder_id: targetFolderId || "default" } : f
          )
        );
        setMoveModalOpen(false);
        setSelectedFileToMove(null);
        showToast("文件移动成功", "success");
      } catch {
        showToast("移动文件失败", "error");
      }
    },
    [selectedFileToMove, showToast]
  );

  // Handle detect CID info
  const handleDetectCid = useCallback(async (cid: string) => {
    if (!cid.trim()) return;

    setIsDetectingCid(true);
    try {
      const metadata = await api.fetchCidInfo(cid);
      const metadataWithCid: typeof detectedCidInfo = metadata 
        ? { ...metadata, cid }
        : { cid, name: "", size: 0, isDirectory: false, valid: false, error: "无法获取文件信息" };
      setDetectedCidInfo(metadataWithCid);

      // 如果检测成功且用户没有手动填写，自动填充文件名和大小
      if (metadata?.valid) {
        if (metadata.name && !newCidName) {
          setNewCidName(metadata.name);
        }
        if (metadata.size > 0 && !newCidSize) {
          setNewCidSize(metadata.size.toString());
        }
      }

      // 如果检测有警告信息，显示提示
      if (metadata?.error) {
        showToast(metadata.error, "warning");
      }
    } catch {
      setDetectedCidInfo({
        cid,
        name: "",
        size: 0,
        isDirectory: false,
        valid: false,
        error: "无法自动检测文件信息，请手动填写",
      });
      showToast("无法自动检测文件信息，请手动填写", "warning");
    } finally {
      setIsDetectingCid(false);
    }
  }, [newCidName, newCidSize, showToast]);

  // Handle add CID
  const handleAddCid = useCallback(async () => {
    if (!newCid.trim()) {
      showToast("请输入CID", "error");
      return;
    }

    setIsAddingCid(true);

    try {
      let name = newCidName.trim();
      const userInputSize = newCidSize ? (parseInt(newCidSize) || 0) : 0;
      let size = userInputSize;

      // 使用已检测的信息或重新检测
      let metadata = detectedCidInfo;
      if (!metadata || metadata.cid !== newCid.trim()) {
        setIsDetectingCid(true);
        try {
          const fetchedMetadata = await api.fetchCidInfo(newCid);
          if (fetchedMetadata) {
            metadata = { ...fetchedMetadata, cid: newCid.trim() };
            setDetectedCidInfo(metadata);
          }

          // 如果CID格式无效，显示错误
          if (metadata && !metadata.valid) {
            showToast(metadata.error || "无效的CID格式", "error");
            return;
          }
        } catch {
          // 检测失败但继续添加
        } finally {
          setIsDetectingCid(false);
        }
      }

      // 如果用户没有输入文件名，使用检测到的名称或默认名称
      if (!name) {
        name = metadata?.name || `file-${newCid.slice(0, 8)}`;
      }

      // 如果用户没有输入大小，使用检测到的大小
      if (!userInputSize && metadata?.size) {
        size = metadata.size;
      }

      const fileRecord: FileRecord = {
        id: generateId(),
        name,
        size,
        cid: newCid.trim(),
        date: new Date().toLocaleString(),
        folder_id: currentFolderId || "default",
        hash: "",
        verified: false,
        verify_status: metadata?.valid ? "ok" : "pending",
        uploadedAt: Date.now(),
      };

      await api.saveFile(fileRecord);
      // 使用函数式更新，避免依赖外部的 files 数组
      setFiles((prev) => [fileRecord, ...prev]);
      
      // 重置状态
      setAddCidModalOpen(false);
      setNewCid("");
      setNewCidName("");
      setNewCidSize("");
      setDetectedCidInfo(null);
      showToast("文件已添加", "success");
    } catch {
      showToast("添加文件失败", "error");
    } finally {
      setIsAddingCid(false);
    }
  }, [currentFolderId, newCid, newCidName, newCidSize, showToast, detectedCidInfo]);

  // Handle toggle selection
  const handleToggleSelection = useCallback(
    (fileId: string) => {
      setSelectedFiles((prev) =>
        prev.includes(fileId)
          ? prev.filter((id) => id !== fileId)
          : [...prev, fileId]
      );
    },
    []
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const filteredFiles = files.filter((file) => {
      const matchesSearch =
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.cid.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = currentFolderId
        ? file.folder_id === currentFolderId
        : true;
      return matchesSearch && matchesFolder;
    });

    setSelectedFiles(filteredFiles.map((file) => String(file.id)));
  }, [files, searchQuery, currentFolderId]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // Handle batch move
  const handleBatchMove = useCallback(
    async (targetFolderId: string | null) => {
      if (selectedFiles.length === 0) return;

      try {
        await api.moveFiles(selectedFiles, targetFolderId || "default");
        // 使用函数式更新，避免依赖外部的 files 数组
        setFiles((prev) =>
          prev.map((f) =>
            selectedFiles.includes(String(f.id)) ? { ...f, folder_id: targetFolderId || "default" } : f
          )
        );
        setSelectedFiles([]);
        showToast(`已移动 ${selectedFiles.length} 个文件`, "success");
      } catch {
        showToast("批量移动失败", "error");
      }
    },
    [selectedFiles, showToast]
  );

  // Handle batch delete
  const handleBatchDelete = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      for (const fileId of selectedFiles) {
        await api.deleteFile(fileId);
      }
      setFiles((prev) => prev.filter((f) => !selectedFiles.includes(String(f.id))));
      setSelectedFiles([]);
      showToast(`已删除 ${selectedFiles.length} 个文件`, "success");
    } catch {
      showToast("批量删除失败", "error");
    }
  }, [selectedFiles, setFiles, showToast]);

  // Handle batch copy
  const handleBatchCopy = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    // Batch copy implementation
    showToast(`复制 ${selectedFiles.length} 个文件`, "success");
    setSelectedFiles([]);
  }, [selectedFiles.length, showToast]);

  return {
    // UI State
    searchQuery, setSearchQuery,
    viewMode, setViewMode,
    isLoading, dragOver, setDragOver,
    copiedId, currentFolderId, setCurrentFolderId,
    selectedFiles,

    // Data
    files, folders, totalSize,
    gateways, customGateways,

    // Upload
    isUploading, uploadProgress,

    // Modal States
    gatewayModalOpen, setGatewayModalOpen,
    isTestingGateways, isFetchingPublicGateways,
    folderModalOpen, setFolderModalOpen,
    newFolderName, editingFolder,
    moveModalOpen, setMoveModalOpen, selectedFileToMove, setSelectedFileToMove,
    addCidModalOpen, setAddCidModalOpen,
    newCid, newCidName, newCidSize,
    isAddingCid, isDetectingCid, detectedCidInfo,
    settingsModalOpen, setSettingsModalOpen,
    darkMode, itemsPerPage, autoRefresh,
    downloadModalOpen, setDownloadModalOpen, selectedFileForDownload, setSelectedFileForDownload,
    addGatewayModalOpen, setAddGatewayModalOpen,
    newGatewayName, newGatewayUrl, newGatewayRegion,
    renameFileModalOpen, setRenameFileModalOpen, selectedFileToRename, setSelectedFileToRename,
    previewFile, setPreviewFile, previewOpen, setPreviewOpen,

    // State Setters
    setNewFolderName, setEditingFolder,
    setNewCid, setNewCidName, setNewCidSize,
    setNewGatewayName, setNewGatewayUrl, setNewGatewayRegion,
    setDarkMode, setItemsPerPage, setAutoRefresh,
    setGateways,

    // Handlers
    handleFileUpload,
    handleDelete,
    handleCopyCID,
    handleRenameFile,
    handleSubmitRenameFile,
    handlePreview,
    handleClosePreview,
    handleTestGateways,
    handleRefreshGateways,
    handleFetchPublicGateways,
    handleTestSingleGateway,
    handleAddCustomGateway,
    handleRemoveCustomGateway,
    handleDownload,
    handleDownloadFile,
    handleDownloadWithGateway,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleMoveFile,
    handleAddCid,
    handleDetectCid,
    handleToggleSelection,
    handleSelectAll,
    handleClearSelection,
    handleBatchMove,
    handleBatchDelete,
    handleBatchCopy,
  };
}
