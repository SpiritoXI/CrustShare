"use client";

import { Search, Settings, List, Grid3X3, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardHeaderProps {
  currentFolderName: string;
  searchQuery: string;
  viewMode: "list" | "grid";
  showBackButton: boolean;
  onSearchChange: (value: string) => void;
  onViewModeChange: (mode: "list" | "grid") => void;
  onBack: () => void;
  onSettingsClick: () => void;
}

export function DashboardHeader({
  currentFolderName,
  searchQuery,
  viewMode,
  showBackButton,
  onSearchChange,
  onViewModeChange,
  onBack,
  onSettingsClick,
}: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/20 bg-white/30 px-6 backdrop-blur-sm">
      <div className="flex items-center flex-1">
        {showBackButton && (
          <Button variant="ghost" size="sm" className="mr-2" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
        )}
        <h2 className="text-lg font-semibold mr-4">{currentFolderName}</h2>
        <div className="flex items-center flex-1 max-w-xl">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange("list")}
          className={viewMode === "list" ? "bg-white/50" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange("grid")}
          className={viewMode === "grid" ? "bg-white/50" : ""}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSettingsClick}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
