import React, { useState } from "react";
import { 
  Folder as FolderIcon, 
  FolderPlus, 
  Trash2, 
  Layers, 
  Tag, 
  Clock, 
  HelpCircle, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Check, 
  X, 
  Filter, 
  FolderTree, 
  Sparkles,
  LayoutGrid,
  Bookmark,
  CheckSquare
} from "lucide-react";
import { Folder, LibraryItem } from "../types";

interface SidebarProps {
  items: LibraryItem[];
  folders: Folder[];
  activeFilter: string; // "all" | "uncategorized" | "untagged" | "recent" | "random" | "trash" | "folder-{id}"
  setActiveFilter: (filter: string) => void;
  onCreateFolder: (name: string, parentId: string | null, color?: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onUpdateFolderColor: (id: string, color: string) => void;
  activeTags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}

export default function Sidebar({
  items,
  folders,
  activeFilter,
  setActiveFilter,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onUpdateFolderColor,
  activeTags,
  selectedTag,
  setSelectedTag
}: SidebarProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [newFolderColor, setNewFolderColor] = useState("#3b82f6");

  // Editing folder states
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [expandedFoldersList, setExpandedFoldersList] = useState(true);

  // Pre-defined folder color palette
  const colorsList = [
    "#a1a1aa", // gray
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // yellow
    "#ec4899", // pink
    "#8b5cf6", // purple
    "#ef4444", // red
    "#14b8a6"  // teal
  ];

  // Group folders by their parent ID
  const foldersByParent = React.useMemo(() => {
    const groups: Record<string, Folder[]> = { root: [] };
    folders.forEach(f => {
      if (!f.parentId) {
        groups.root.push(f);
      } else {
        if (!groups[f.parentId]) {
          groups[f.parentId] = [];
        }
        groups[f.parentId].push(f);
      }
    });
    return groups;
  }, [folders]);

  // Count helper functions
  const getItemCounts = React.useMemo(() => {
    const activeItems = items.filter(item => !item.isDeleted);
    const deletedItems = items.filter(item => item.isDeleted);

    const counts: Record<string, number> = {
      all: activeItems.length,
      uncategorized: activeItems.filter(item => !item.folders || item.folders.length === 0).length,
      untagged: activeItems.filter(item => !item.tags || item.tags.length === 0).length,
      trash: deletedItems.length,
    };

    // Calculate folder counts (including items in nested child folders)
    const getFolderItemCount = (folderId: string): number => {
      // Find items directly in this folder
      const directCount = activeItems.filter(item => item.folders?.includes(folderId)).length;
      
      // Find subfolders
      const children = folders.filter(f => f.parentId === folderId);
      const childrenCount = children.reduce((acc, child) => acc + getFolderItemCount(child.id), 0);
      
      return directCount + childrenCount;
    };

    folders.forEach(f => {
      counts[`folder-${f.id}`] = getFolderItemCount(f.id);
    });

    return counts;
  }, [items, folders]);

  const toggleFolderCollapse = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleStartRename = (f: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(f.id);
    setEditingName(f.name);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFolderId && editingName.trim()) {
      onRenameFolder(editingFolderId, editingName.trim());
      setEditingFolderId(null);
    }
  };

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderParentId, newFolderColor);
      setNewFolderName("");
      setNewFolderParentId(null);
      setShowNewFolderModal(false);
    }
  };

  // Render a folder row recursively to handle nested levels
  const renderFolderNode = (folder: Folder, depth: number = 0) => {
    const hasChildren = foldersByParent[folder.id] && foldersByParent[folder.id].length > 0;
    const isCollapsed = collapsedFolders[folder.id] || false;
    const isSelected = activeFilter === `folder-${folder.id}`;
    const childFolders = foldersByParent[folder.id] || [];

    return (
      <div key={folder.id} className="select-none text-xs">
        {/* Folder Item Container */}
        <div
          id={`sidebar-folder-${folder.id}`}
          onClick={() => setActiveFilter(`folder-${folder.id}`)}
          className={`group flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer transition-colors duration-150 relative ${
            isSelected
              ? "bg-[#2563eb] text-white"
              : "text-zinc-300 hover:bg-[#2c2c30]"
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <div className="flex items-center min-w-0 flex-1 gap-1.5">
            {/* Collapse toggle arrow */}
            <span
              onClick={(e) => hasChildren ? toggleFolderCollapse(folder.id, e) : null}
              className={`w-4 h-4 flex items-center justify-center rounded hover:bg-[#3f3f46] text-zinc-400 hover:text-white transition-transform ${
                !hasChildren ? "opacity-0 cursor-default" : "cursor-pointer"
              }`}
            >
              {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </span>

            {/* Folder Icon with Custom Color */}
            <FolderIcon
              size={14}
              className="flex-shrink-0"
              style={{ color: folder.color || "#3b82f6" }}
              fill={folder.color || "#3b82f6"}
              fillOpacity={0.15}
            />

            {editingFolderId === folder.id ? (
              <form onSubmit={handleSaveRename} className="flex-1 flex items-center gap-1 min-w-0" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="bg-[#18181b] border border-blue-500 rounded px-1 py-0.5 text-white text-xs w-full focus:outline-none"
                  autoFocus
                  onBlur={() => setEditingFolderId(null)}
                />
                <button type="submit" className="text-emerald-400 hover:text-emerald-300">
                  <Check size={12} />
                </button>
              </form>
            ) : (
              <span className="truncate pr-4">{folder.name}</span>
            )}
          </div>

          {/* Counts & Action Menu */}
          {editingFolderId !== folder.id && (
            <div className="flex items-center gap-1.5 flex-shrink-0 pl-1 text-[10px]">
              <span className={`px-1.5 py-0.5 rounded-full ${isSelected ? "bg-[#1d4ed8]" : "bg-[#2d2d30] text-zinc-400"}`}>
                {getItemCounts[`folder-${folder.id}`] || 0}
              </span>

              {/* Action Buttons visible on hover */}
              <div className="hidden group-hover:flex items-center gap-1 absolute right-2 bg-[#2c2c30] p-0.5 rounded border border-zinc-700 shadow-md">
                {/* Color Palette Picker */}
                <div className="relative group/colors">
                  <button className="p-1 hover:text-blue-400 rounded hover:bg-zinc-700" title="修改图标颜色">
                    <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: folder.color || "#3b82f6" }} />
                  </button>
                  <div className="hidden group-hover/colors:grid grid-cols-4 gap-1 absolute bottom-full left-0 m-1 p-1 bg-[#18181b] border border-zinc-700 rounded shadow-xl z-50">
                    {colorsList.map(c => (
                      <span
                        key={c}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateFolderColor(folder.id, c);
                        }}
                        className="w-3.5 h-3.5 rounded-full cursor-pointer hover:scale-110 active:scale-95 duration-100"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewFolderParentId(folder.id);
                    setShowNewFolderModal(true);
                  }}
                  className="p-1 text-zinc-300 hover:text-white rounded hover:bg-zinc-700"
                  title="添加子文件夹"
                >
                  <Plus size={11} />
                </button>
                <button
                  onClick={(e) => handleStartRename(folder, e)}
                  className="p-1 text-zinc-300 hover:text-white rounded hover:bg-zinc-700"
                  title="重命名"
                >
                  <Edit2 size={11} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`确定要删除文件夹 "${folder.name}" 吗？子文件夹将被移至根目录，内部素材会被解绑。`)) {
                      onDeleteFolder(folder.id);
                    }
                  }}
                  className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-zinc-700"
                  title="删除"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Child Nodes Nested */}
        {hasChildren && !isCollapsed && (
          <div className="border-l border-zinc-800 ml-3">
            {childFolders.map(child => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="sidebar-container" className="w-56 bg-[#18181c] border-r border-[#26262a] flex flex-col h-full flex-shrink-0 text-zinc-300">
      
      {/* Top Header Selector - Brand Library */}
      <div className="p-4 border-b border-[#26262a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#2563eb] flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-900/30">
            测
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">测试设计素材库</h2>
            <p className="text-[10px] text-zinc-500">本地磁盘库 (v1.2)</p>
          </div>
        </div>
        <ChevronDown size={14} className="text-zinc-500 hover:text-white cursor-pointer" />
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        
        {/* Category Filters Area */}
        <div className="space-y-1">
          <div
            id="sidebar-item-all"
            onClick={() => { setActiveFilter("all"); setSelectedTag(null); }}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
              activeFilter === "all" && !selectedTag
                ? "bg-[#2563eb] text-white"
                : "hover:bg-[#222226] text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className={activeFilter === "all" && !selectedTag ? "text-white" : "text-[#4f46e5]"} />
              <span className="text-xs font-medium">全部素材</span>
            </div>
            <span className="text-[10px] bg-[#2a2a2e] text-zinc-400 px-2 py-0.5 rounded-full">
              {getItemCounts.all}
            </span>
          </div>

          <div
            id="sidebar-item-uncategorized"
            onClick={() => { setActiveFilter("uncategorized"); setSelectedTag(null); }}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
              activeFilter === "uncategorized"
                ? "bg-[#2563eb] text-white"
                : "hover:bg-[#222226] text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderIcon size={14} className={activeFilter === "uncategorized" ? "text-white" : "text-[#10b981]"} />
              <span className="text-xs font-medium">未分类</span>
            </div>
            <span className="text-[10px] bg-[#2a2a2e] text-zinc-400 px-2 py-0.5 rounded-full">
              {getItemCounts.uncategorized}
            </span>
          </div>

          <div
            id="sidebar-item-untagged"
            onClick={() => { setActiveFilter("untagged"); setSelectedTag(null); }}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
              activeFilter === "untagged"
                ? "bg-[#2563eb] text-white"
                : "hover:bg-[#222226] text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag size={13} className={activeFilter === "untagged" ? "text-white" : "text-[#ec4899]"} />
              <span className="text-xs font-medium">未标签</span>
            </div>
            <span className="text-[10px] bg-[#2a2a2e] text-zinc-400 px-2 py-0.5 rounded-full">
              {getItemCounts.untagged}
            </span>
          </div>

          <div
            id="sidebar-item-recent"
            onClick={() => { setActiveFilter("recent"); setSelectedTag(null); }}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
              activeFilter === "recent"
                ? "bg-[#2563eb] text-white"
                : "hover:bg-[#222226] text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={14} className={activeFilter === "recent" ? "text-white" : "text-[#eab308]"} />
              <span className="text-xs font-medium">最近使用</span>
            </div>
          </div>

          <div
            id="sidebar-item-random"
            onClick={() => { setActiveFilter("random"); setSelectedTag(null); }}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
              activeFilter === "random"
                ? "bg-[#2563eb] text-white"
                : "hover:bg-[#222226] text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className={activeFilter === "random" ? "text-white" : "text-amber-400"} />
              <span className="text-xs font-medium">随机探索</span>
            </div>
          </div>

          <div
            id="sidebar-item-trash"
            onClick={() => { setActiveFilter("trash"); setSelectedTag(null); }}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
              activeFilter === "trash"
                ? "bg-[#ef4444] text-white"
                : "hover:bg-[#222226] hover:text-red-400 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Trash2 size={14} className={activeFilter === "trash" ? "text-white" : "text-zinc-400"} />
              <span className="text-xs font-medium">回收站</span>
            </div>
            <span className="text-[10px] bg-[#2a2a2e] text-zinc-400 px-2 py-0.5 rounded-full">
              {getItemCounts.trash}
            </span>
          </div>
        </div>

        {/* Hierarchical Folders Area */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-2 text-zinc-400 hover:text-white">
            <div 
              className="flex items-center gap-2 cursor-pointer text-xs font-semibold uppercase tracking-wider"
              onClick={() => setExpandedFoldersList(!expandedFoldersList)}
            >
              {expandedFoldersList ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span className="flex items-center gap-1.5"><FolderTree size={12} fill="#71717a" /> 文件夹</span>
            </div>
            <button
              id="sidebar-add-folder-btn"
              onClick={() => {
                setNewFolderParentId(null);
                setShowNewFolderModal(true);
              }}
              className="p-1 hover:bg-[#2c2c30] text-zinc-400 hover:text-white rounded transition-colors"
              title="新建根目录"
            >
              <FolderPlus size={14} />
            </button>
          </div>

          {/* Collapsible recursively rendered folder lists */}
          {expandedFoldersList && (
            <div className="space-y-0.5 pl-1">
              {foldersByParent.root.length === 0 ? (
                <div className="text-zinc-600 text-[11px] px-3 py-4 text-center border-dashed border border-zinc-800 rounded">
                  暂无文件夹目录
                </div>
              ) : (
                foldersByParent.root.map(rootFolder => renderFolderNode(rootFolder, 0))
              )}
            </div>
          )}
        </div>

        {/* Unique Tag Filter List Cloud */}
        {activeTags.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="px-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={12} />
              <span>标签快选Cloud</span>
            </div>
            <div className="flex flex-wrap gap-1 px-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {activeTags.map(tag => {
                const isSelected = selectedTag === tag;
                return (
                  <span
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`text-[10px] px-2 py-1 rounded cursor-pointer transition-all duration-100 ${
                      isSelected
                        ? "bg-[#2563eb] text-white font-medium scale-102"
                        : "bg-[#242428] text-zinc-400 hover:bg-[#323236] hover:text-white"
                    }`}
                  >
                    #{tag}
                  </span>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Footer Info Workspace */}
      <div className="p-3 bg-[#131316] border-t border-[#26262a] text-[10px] text-zinc-500 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>存储状态</span>
          <span className="text-zinc-400">本地 SQLite + FS</span>
        </div>
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#2563eb] h-full rounded-full" style={{ width: "35%" }} />
        </div>
        <div className="flex justify-between items-center text-[9px] mt-1 text-zinc-600">
          <span>库大小: 124.5 MB</span>
          <span>可用: 50.0 GB</span>
        </div>
      </div>

      {/* Create Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f1f23] border border-zinc-800 rounded-xl max-w-sm w-full p-5 shadow-2xl animate-fade-in text-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FolderPlus size={16} className="text-[#3b82f6]" />
                {newFolderParentId ? "新建子文件夹" : "新建根文件夹"}
              </h3>
              <button 
                onClick={() => setShowNewFolderModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewFolder} className="space-y-4">
              <div>
                <label className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-1.5">文件夹名称</label>
                <input
                  type="text"
                  placeholder="如: 甘栗仁包装, 2026年素材等"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-[#141416] border border-zinc-700 focus:border-blue-500 rounded px-3 py-2 text-xs text-white focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              {/* Icon Color Picker option */}
              <div>
                <label className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-1.5">图标标记颜色</label>
                <div className="flex gap-2">
                  {colorsList.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        newFolderColor === c ? "ring-2 ring-white scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium shadow-lg shadow-blue-900/30 transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
