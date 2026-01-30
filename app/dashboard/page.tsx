"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

import { useDashboard } from "@/hooks/use-dashboard";
import { useAuthStore } from "@/lib/store";

import { Sidebar } from "@/components/sidebar";
import { FileList } from "@/components/file-list";
import { ShareModal } from "@/components/modals/share-modal";
import { GatewayModal } from "@/components/modals/gateway-modal";
import { FolderModal } from "@/components/modals/folder-modal";
import { MoveModal } from "@/components/modals/move-modal";
import { AddCidModal } from "@/components/modals/add-cid-modal";
import { SettingsModal } from "@/components/modals/settings-modal";
import { DownloadModal } from "@/components/modals/download-modal";
import { AddGatewayModal } from "@/components/modals/add-gateway-modal";
import { RenameFileModal } from "@/components/modals/rename-file-modal";
import {
  BatchToolbar,
  UploadProgress,
  DashboardHeader,
  PreviewModal,
} from "@/components/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    // UI State
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    isLoading,
    dragOver,
    setDragOver,
    copiedId,
    currentFolderId,
    setCurrentFolderId,
    isRecentUploads,
    selectedFiles,

    // Data
    files,
    folders,
    totalSize,
    gateways,
    customGateways,

    // Upload
    isUploading,
    uploadProgress,

    // Modal States
    shareModalOpen,
    setShareModalOpen,
    selectedFileForShare,
    setSelectedFileForShare,
    shareUrl,
    sharePassword,
    shareExpiry,
    gatewayModalOpen,
    setGatewayModalOpen,
    isTestingGateways,
    isFetchingPublicGateways,
    folderModalOpen,
    setFolderModalOpen,
    newFolderName,
    editingFolder,
    moveModalOpen,
    setMoveModalOpen,
    selectedFileToMove,
    setSelectedFileToMove,
    addCidModalOpen,
    setAddCidModalOpen,
    newCid,
    newCidName,
    newCidSize,
    isAddingCid,
    isDetectingCid,
    settingsModalOpen,
    setSettingsModalOpen,
    darkMode,
    itemsPerPage,
    autoRefresh,
    downloadModalOpen,
    setDownloadModalOpen,
    selectedFileForDownload,
    setSelectedFileForDownload,
    addGatewayModalOpen,
    setAddGatewayModalOpen,
    newGatewayName,
    newGatewayUrl,
    newGatewayRegion,
    renameFileModalOpen,
    setRenameFileModalOpen,
    selectedFileToRename,
    setSelectedFileToRename,
    previewFile,
    setPreviewFile,
    previewOpen,
    setPreviewOpen,

    // Handlers
    handleFileUpload,
    handleDelete,
    handleCopyCID,
    handleShare,
    handleRenameFile,
    handleSubmitRenameFile,
    handlePreview,
    handleClosePreview,
    handleCopyShareLink,
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
    handleToggleSelection,
    handleSelectAll,
    handleClearSelection,
    handleBatchMove,
    handleBatchDelete,
    handleBatchCopy,
    setNewFolderName,
    setEditingFolder,
    setNewCid,
    setNewCidName,
    setNewCidSize,
    setNewGatewayName,
    setNewGatewayUrl,
    setNewGatewayRegion,
    setSharePassword,
    setShareExpiry,
    setDarkMode,
    setItemsPerPage,
    setAutoRefresh,
    setGateways,
  } = useDashboard();

  // Computed values
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.cid.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = currentFolderId
      ? file.folder_id === currentFolderId
      : !file.folder_id || file.folder_id === "default";
    const isRecent = isRecentUploads
      ? file.uploadedAt && Date.now() - file.uploadedAt < 7 * 24 * 60 * 60 * 1000
      : true;
    return matchesSearch && matchesFolder && isRecent;
  });

  const currentFolderName = isRecentUploads
    ? "最近上传"
    : currentFolderId
      ? folders.find((f) => f.id === currentFolderId)?.name || "全部文件"
      : "全部文件";

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Sidebar */}
      <Sidebar
        totalSize={totalSize}
        filesCount={files.length}
        foldersCount={folders.length}
        folders={folders}
        currentFolderId={currentFolderId}
        isUploading={isUploading}
        isTestingGateways={isTestingGateways}
        onUploadClick={() => fileInputRef.current?.click()}
        onAddCidClick={() => setAddCidModalOpen(true)}
        onTestGateways={handleTestGateways}
        onFolderSelect={setCurrentFolderId}
        onCreateFolder={() => {
          setEditingFolder(null);
          setNewFolderName("");
          setFolderModalOpen(true);
        }}
        onEditFolder={(folder) => {
          setEditingFolder(folder);
          setNewFolderName(folder.name);
          setFolderModalOpen(true);
        }}
        onDeleteFolder={handleDeleteFolder}
        onLogout={() => {
          logout();
          router.push("/");
        }}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <DashboardHeader
          currentFolderName={currentFolderName}
          searchQuery={searchQuery}
          viewMode={viewMode}
          showBackButton={!!currentFolderId}
          onSearchChange={setSearchQuery}
          onViewModeChange={setViewMode}
          onBack={() => setCurrentFolderId(null)}
          onSettingsClick={() => setSettingsModalOpen(true)}
        />

        {/* Batch Operations Toolbar */}
        <BatchToolbar
          selectedCount={selectedFiles.length}
          folders={folders}
          onClearSelection={handleClearSelection}
          onBatchMove={handleBatchMove}
          onBatchCopy={handleBatchCopy}
          onBatchDelete={handleBatchDelete}
        />

        {/* Upload Progress */}
        {isUploading && <UploadProgress progress={uploadProgress} />}

        {/* File List */}
        <div
          className={`h-[calc(100vh-4rem)] overflow-auto p-6 ${dragOver ? "bg-cloudchan-purple/10" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileUpload(e.dataTransfer.files);
          }}
        >
          <FileList
            files={filteredFiles}
            viewMode={viewMode}
            isLoading={isLoading}
            copiedId={copiedId}
            selectedFiles={selectedFiles}
            onCopyCid={handleCopyCID}
            onShare={handleShare}
            onDownload={(cid, filename) => handleDownload(cid, filename)}
            onDownloadWithGateway={(cid, filename, gatewayUrl) => handleDownloadWithGateway(cid, filename, gatewayUrl)}
            onDownloadMenu={(file) => {
              setSelectedFileForDownload(file);
              setDownloadModalOpen(true);
            }}
            onMove={(file) => {
              setSelectedFileToMove(file);
              setMoveModalOpen(true);
            }}
            onDelete={handleDelete}
            onPreview={handlePreview}
            onRename={handleRenameFile}
            onToggleSelection={handleToggleSelection}
            onSelectAll={handleSelectAll}
            gateways={gateways}
          />
        </div>
      </main>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Modals */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        file={selectedFileForShare}
        shareUrl={shareUrl}
        sharePassword={sharePassword}
        shareExpiry={shareExpiry}
        onPasswordChange={setSharePassword}
        onExpiryChange={setShareExpiry}
        onCopyLink={handleCopyShareLink}
        onCopyCid={() =>
          selectedFileForShare && handleCopyCID(selectedFileForShare.cid, selectedFileForShare.id)
        }
      />

      <GatewayModal
        isOpen={gatewayModalOpen}
        onClose={() => setGatewayModalOpen(false)}
        gateways={gateways}
        customGateways={customGateways}
        isTesting={isTestingGateways}
        isFetchingPublic={isFetchingPublicGateways}
        onRefresh={handleRefreshGateways}
        onAdd={() => setAddGatewayModalOpen(true)}
        onTest={handleTestSingleGateway}
        onRemove={handleRemoveCustomGateway}
        onUpdate={setGateways}
        onFetchPublic={handleFetchPublicGateways}
      />

      <FolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        folderName={newFolderName}
        isEditing={!!editingFolder}
        onNameChange={setNewFolderName}
        onSubmit={editingFolder ? handleRenameFolder : handleCreateFolder}
      />

      <MoveModal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        file={selectedFileToMove}
        folders={folders}
        onMove={handleMoveFile}
      />

      <AddCidModal
        isOpen={addCidModalOpen}
        onClose={() => setAddCidModalOpen(false)}
        cid={newCid}
        name={newCidName}
        size={newCidSize}
        isAdding={isAddingCid}
        isDetecting={isDetectingCid}
        onCidChange={setNewCid}
        onNameChange={setNewCidName}
        onSizeChange={setNewCidSize}
        onSubmit={handleAddCid}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        darkMode={darkMode}
        itemsPerPage={itemsPerPage}
        autoRefresh={autoRefresh}
        filesCount={files.length}
        foldersCount={folders.length}
        totalSize={totalSize}
        onDarkModeChange={setDarkMode}
        onItemsPerPageChange={setItemsPerPage}
        onAutoRefreshChange={setAutoRefresh}
      />

      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        file={selectedFileForDownload}
        gateways={gateways}
        customGateways={customGateways}
        onDownload={handleDownload}
        onDownloadWithGateway={handleDownloadWithGateway}
        onTestGateways={handleRefreshGateways}
      />

      <AddGatewayModal
        isOpen={addGatewayModalOpen}
        onClose={() => setAddGatewayModalOpen(false)}
        name={newGatewayName}
        url={newGatewayUrl}
        region={newGatewayRegion}
        onNameChange={setNewGatewayName}
        onUrlChange={setNewGatewayUrl}
        onRegionChange={setNewGatewayRegion}
        onSubmit={handleAddCustomGateway}
      />

      <RenameFileModal
        isOpen={renameFileModalOpen}
        onClose={() => {
          setRenameFileModalOpen(false);
          setSelectedFileToRename(null);
        }}
        file={selectedFileToRename}
        onRename={handleSubmitRenameFile}
      />

      {/* Preview Modal */}
      <PreviewModal
        file={previewFile}
        isOpen={previewOpen}
        gateways={gateways}
        onClose={handleClosePreview}
      />
    </div>
  );
}
