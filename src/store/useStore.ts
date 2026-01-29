import { create } from 'zustand';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  cid?: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  folderId?: string | null;
  tags?: string[];
}

interface StoreState {
  isAuthenticated: boolean;
  password: string;
  files: FileItem[];
  folders: Folder[];
  tags: Tag[];
  currentFolderId: string | null;
  searchTerm: string;
  selectedFiles: string[];
  setIsAuthenticated: (value: boolean) => void;
  setPassword: (value: string) => void;
  addFile: (file: FileItem) => void;
  updateFile: (id: string, updates: Partial<FileItem>) => void;
  deleteFile: (id: string) => void;
  setSearchTerm: (term: string) => void;
  toggleFileSelection: (id: string) => void;
  clearSelection: () => void;
  fileExists: (name: string) => boolean;
  getFileByName: (name: string) => FileItem | undefined;
  // 文件夹相关
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  setCurrentFolder: (folderId: string | null) => void;
  getFolderById: (id: string) => Folder | undefined;
  getFoldersByParent: (parentId: string | null) => Folder[];
  // 标签相关
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  addTagToFile: (fileId: string, tagId: string) => void;
  removeTagFromFile: (fileId: string, tagId: string) => void;
  getTagsByFile: (fileId: string) => Tag[];
}

const useStore = create<StoreState>((set, get) => ({
  isAuthenticated: false,
  password: '',
  files: [],
  folders: [],
  tags: [],
  currentFolderId: null,
  searchTerm: '',
  selectedFiles: [],
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setPassword: (value) => set({ password: value }),
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  updateFile: (id, updates) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, ...updates } : file
      ),
    })),
  deleteFile: (id) =>
    set((state) => ({ files: state.files.filter((file) => file.id !== id) })),
  setSearchTerm: (term) => set({ searchTerm: term }),
  toggleFileSelection: (id) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.includes(id)
        ? state.selectedFiles.filter((fileId) => fileId !== id)
        : [...state.selectedFiles, id],
    })),
  clearSelection: () => set({ selectedFiles: [] }),
  fileExists: (name: string): boolean => {
    const state = get();
    return state.files.some((file: FileItem) => file.name === name);
  },
  getFileByName: (name: string): FileItem | undefined => {
    const state = get();
    return state.files.find((file: FileItem) => file.name === name);
  },
  // 文件夹相关
  addFolder: (folder: Folder) =>
    set((state) => ({ folders: [...state.folders, folder] })),
  updateFolder: (id, updates) =>
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id ? { ...folder, ...updates } : folder
      ),
    })),
  deleteFolder: (id) =>
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== id),
      files: state.files.map((file) =>
        file.folderId === id ? { ...file, folderId: null } : file
      ),
    })),
  setCurrentFolder: (folderId) => set({ currentFolderId: folderId }),
  getFolderById: (id) => {
    const state = get();
    return state.folders.find((folder: Folder) => folder.id === id);
  },
  getFoldersByParent: (parentId) => {
    const state = get();
    return state.folders.filter(
      (folder: Folder) => folder.parentId === parentId
    );
  },
  // 标签相关
  addTag: (tag: Tag) =>
    set((state) => ({ tags: [...state.tags, tag] })),
  updateTag: (id, updates) =>
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    })),
  deleteTag: (id) =>
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
      files: state.files.map((file) => ({
        ...file,
        tags: file.tags?.filter((tagId) => tagId !== id) || [],
      })),
    })),
  addTagToFile: (fileId, tagId) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === fileId
          ? { ...file, tags: [...(file.tags || []), tagId] }
          : file
      ),
    })),
  removeTagFromFile: (fileId, tagId) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === fileId
          ? { ...file, tags: (file.tags || []).filter((id) => id !== tagId) }
          : file
      ),
    })),
  getTagsByFile: (fileId) => {
    const state = get();
    const file = state.files.find((f) => f.id === fileId);
    if (!file || !file.tags) return [];
    return state.tags.filter((tag) => file.tags?.includes(tag.id));
  },
}));

export default useStore;
