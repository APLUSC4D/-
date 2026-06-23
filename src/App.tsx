import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import MediaGrid from "./components/MediaGrid";
import Inspector from "./components/Inspector";
import DetailView from "./components/DetailView";
import { Folder, LibraryItem } from "./types";
import { 
  Sparkles, 
  Trash2, 
  Layers, 
  RefreshCw, 
  CheckCircle, 
  Loader2,
  FolderOpen
} from "lucide-react";

export default function App() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Controls left-navigation selection
  const [activeFilter, setActiveFilter] = useState<string>("all");
  // Controls fast tag picker selection
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Focus Detail Immersive View overlay triggers
  const [focalItem, setFocalItem] = useState<LibraryItem | null>(null);

  // Loader notifications
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch initial files and library categories on mount
  const fetchLibraryData = async () => {
    setIsLoading(true);
    try {
      const [foldersRes, itemsRes] = await Promise.all([
        fetch("/api/folders"),
        fetch("/api/items")
      ]);
      
      if (foldersRes.ok && itemsRes.ok) {
        const foldersData = await foldersRes.json();
        const itemsData = await itemsRes.json();
        setFolders(foldersData);
        setItems(itemsData);
      } else {
        showToast('error', '获取本地索引数据库失败，正在检查服务器连接...');
      }
    } catch (e) {
      console.error("Failed fetching data", e);
      showToast('error', '本地素材服务器未启动，请稍后再试。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  // Utility toast messenger
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Find currently selected item
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return items.find(item => item.id === selectedItemId) || null;
  }, [selectedItemId, items]);

  // Aggregate active unique tags across non-deleted library items
  const activeTags = useMemo(() => {
    const unDeleted = items.filter(item => !item.isDeleted);
    const tagsSet = new Set<string>();
    unDeleted.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [items]);

  // ----------------------------------------
  // MATERIAL ITEMS CRUD INTERFACES
  // ----------------------------------------

  // Upload item (accepts name, base64 payload, type and size etc.)
  const handleUploadFile = async (payload: { name: string; ext: string; data: string; size: number; width: number; height: number; type: 'image' | 'video'; palette: string[] }) => {
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems(prev => [...prev, newItem]);
        setSelectedItemId(newItem.id);
        showToast('success', `成功导入素材 "${newItem.name}"！`);
      } else {
        const err = await res.json();
        showToast('error', `上传失败: ${err.error}`);
      }
    } catch {
      showToast('error', '上传文件失败，请检查网络大小配置。');
    }
  };

  // Update item metadata fields
  const handleUpdateItem = async (id: string, updates: Partial<LibraryItem>) => {
    // Optimistic UI updates
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));

    try {
      const res = await fetch("/api/items/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates })
      });
      if (!res.ok) {
        showToast('error', '同步素材修饰配置失败');
        fetchLibraryData(); // refresh fallback
      }
    } catch {
      showToast('error', '本地网络出错，无法固化素材配置');
    }
  };

  // Delete item: toggle trash bin state
  const handleDeleteItem = async (id: string, isDeleted: boolean) => {
    // Optimistic UI update
    setItems(prev => prev.map(item => item.id === id ? { ...item, isDeleted } : item));
    if (selectedItemId === id) setSelectedItemId(null);

    try {
      const res = await fetch("/api/items/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates: { isDeleted } })
      });
      if (res.ok) {
        showToast('success', isDeleted ? '素材已被挪至回收站，可前往恢复' : '素材已恢复至文件夹');
      } else {
        showToast('error', '回收站归档动作失败');
        fetchLibraryData();
      }
    } catch {
      showToast('error', '网络失败，归档同步故障');
    }
  };

  // Permanently delete a single item inside recycle bin
  const handlePermanentlyDeleteItem = async (id: string) => {
    try {
      const res = await fetch("/api/items/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDeleted: true })
      });

      // To permanently clear, we empty the db record as well
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
        setSelectedItemId(null);
        showToast('success', '素材被永固销毁，原文件已清除。');
      }
    } catch {
      showToast('error', '永久销毁素材事务失败。');
    }
  };

  // Bulk empty the recycle bin
  const handleEmptyTrash = async () => {
    if (confirm("确定要永久清空回收站中所有的素材原文件吗？此项清理动作不可恢复。")) {
      setIsLoading(true);
      try {
        const res = await fetch("/api/trash/empty", { method: "POST" });
        if (res.ok) {
          const result = await res.json();
          setItems(prev => prev.filter(item => !item.isDeleted));
          setSelectedItemId(null);
          showToast('success', `回收站已清空，彻底消灭了 ${result.count || 0} 个原文件！`);
        } else {
          showToast('error', '清空回收站不成功');
        }
      } catch {
        showToast('error', '本地清空事务通信受阻');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ----------------------------------------
  // FOLDERS TREE CRUD DIRECTORIES
  // ----------------------------------------

  // Create folder directory
  const handleCreateFolder = async (name: string, parentId: string | null, color?: string) => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId, color })
      });
      if (res.ok) {
        const newFolder = await res.json();
        setFolders(prev => [...prev, newFolder]);
        showToast('success', `已创建新目录 "${newFolder.name}"`);
      } else {
        showToast('error', '新建目录失败');
      }
    } catch {
      showToast('error', '网络异常，目录写入失败');
    }
  };

  // Rename folder
  const handleRenameFolder = async (id: string, newName: string) => {
    try {
      const res = await fetch("/api/folders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName })
      });
      if (res.ok) {
        setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
        showToast('success', `目录成功更名为 "${newName}"`);
      }
    } catch {
      showToast('error', '更改目录名称出错');
    }
  };

  // Delete folder
  const handleDeleteFolder = async (id: string) => {
    try {
      const res = await fetch("/api/folders/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setFolders(prev => prev.filter(f => f.id !== id));
        // Remove relationships from items in local state
        setItems(prev => prev.map(item => {
          if (item.folders && item.folders.includes(id)) {
            return { ...item, folders: item.folders.filter(fId => fId !== id) };
          }
          return item;
        }));
        showToast('success', '文件夹目录被解构。素材由于受到保护，已退回未分类空间。');
        if (activeFilter === `folder-${id}`) {
          setActiveFilter("all");
        }
      }
    } catch {
      showToast('error', '解构目录故障');
    }
  };

  // Update folder icon highlighting color
  const handleUpdateFolderColor = async (id: string, color: string) => {
    try {
      const res = await fetch("/api/folders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, color })
      });
      if (res.ok) {
        setFolders(prev => prev.map(f => f.id === id ? { ...f, color } : f));
        showToast('success', '修改文件夹标识色成功！');
      }
    } catch {
      showToast('error', '更改文件夹图标配色故障');
    }
  };

  // ----------------------------------------
  // GEMINI AI INTEGRATION PROXY
  // ----------------------------------------
  const handleTriggerGeminiAnalysis = async (id: string) => {
    const res = await fetch("/api/gemini/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // Update item in local state
      const updatedTags = data.suggestedTags || [];
      const updatedNotes = data.suggestedNotes || "";
      const updatedName = data.title || "";
      
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            name: updatedName || item.name,
            tags: updatedTags,
            annotation: updatedNotes
          };
        }
        return item;
      }));

      showToast('success', 'Gemini 智能特征工程分析完毕！主视觉已成功标注。');
      return data;
    } else {
      const err = await res.json();
      throw new Error(err.error || "分析超时错误");
    }
  };

  // Active items array matching the grid filter criteria
  const activeGridItems = useMemo(() => {
    let list = [...items];
    if (activeFilter === "trash") {
      list = list.filter(item => item.isDeleted === true);
    } else {
      list = list.filter(item => item.isDeleted !== true);
      if (activeFilter === "uncategorized") {
        list = list.filter(item => !item.folders || item.folders.length === 0);
      } else if (activeFilter === "untagged") {
        list = list.filter(item => !item.tags || item.tags.length === 0);
      } else if (activeFilter.startsWith("folder-")) {
        const fId = activeFilter.replace("folder-", "");
        
        // Recursive fetch helper inside list of matching subfolders
        const getChildFolderIds = (parentFolderId: string): string[] => {
          const children = folders.filter(f => f.parentId === parentFolderId);
          const childIds = children.map(c => c.id);
          const grandchildrenIds = childIds.reduce((acc, cid) => [...acc, ...getChildFolderIds(cid)], [] as string[]);
          return [parentFolderId, ...childIds, ...grandchildrenIds];
        };

        const matchingFolderIds = getChildFolderIds(fId);
        list = list.filter(item => item.folders?.some(fRef => matchingFolderIds.includes(fRef)));
      }
    }

    if (selectedTag) {
      list = list.filter(item => item.tags?.includes(selectedTag));
    }

    return list;
  }, [items, folders, activeFilter, selectedTag]);

  return (
    <div id="app-root-frame" className="flex h-screen bg-[#18181c] text-zinc-100 overflow-hidden font-sans">
      
      {/* 3-Panel Main Layout Frame */}
      <div className="flex-1 flex overflow-hidden h-full">
        
        {/* Left Side: Sidebar */}
        <Sidebar
          items={items}
          folders={folders}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onUpdateFolderColor={handleUpdateFolderColor}
          activeTags={activeTags}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
        />

        {/* Center Main Stage Display Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#202024] relative h-full">
          
          {/* Recovery Empty Folder Trigger Buttons on Recycle bin screen */}
          {activeFilter === "trash" && activeGridItems.length > 0 && (
            <div className="bg-red-500/10 border-b border-red-950 px-4 py-2 flex items-center justify-between text-xs text-rose-300 select-none flex-shrink-0 animate-fade-in">
              <span className="flex items-center gap-1.5 font-medium">
                <Trash2 size={13} className="text-rose-400" />
                回收站中存在封存的素材原文件。永久清理原案前可随时退回安全轨道。
              </span>
              <button
                id="empty-trash-btn"
                onClick={handleEmptyTrash}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded shadow-lg shadow-red-950/25 transition-colors cursor-pointer"
              >
                清空回收站放行
              </button>
            </div>
          )}

          {/* Loader Overlay */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#202024]">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-zinc-500 text-xs">正在连接本地微型 SQLite 服务器数据库...</p>
            </div>
          ) : (
            <MediaGrid
              items={items}
              folders={folders}
              activeFilter={activeFilter}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              onDoubleSelectItem={(item) => setFocalItem(item)}
              onUploadFile={handleUploadFile}
              selectedTag={selectedTag}
            />
          )}
        </div>

        {/* Right Side Column Panel: Inspector details */}
        <Inspector
          selectedItem={selectedItem}
          folders={folders}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onPermanentlyDeleteItem={handlePermanentlyDeleteItem}
          onTriggerGeminiAnalysis={handleTriggerGeminiAnalysis}
        />

      </div>

      {/* Floating Global Transient Banner Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-slide-up flex items-center gap-2.5 px-4 py-3 border border-zinc-800 bg-[#1e1e24]/95 text-xs text-white rounded-xl shadow-2xl backdrop-blur max-w-sm pointer-events-none select-none duration-200">
          <span className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-400 shadow-md shadow-emerald-400" : "bg-rose-400 shadow-md shadow-rose-400"}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Focused Immersive Asset Viewer overlay mode */}
      {focalItem && (
        <DetailView
          items={activeGridItems}
          currentItem={focalItem}
          onClose={() => setFocalItem(null)}
          onNavigate={(item) => setFocalItem(item)}
        />
      )}

    </div>
  );
}
