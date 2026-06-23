import React, { useState, useRef, useMemo } from "react";
import { 
  Search, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Upload, 
  Calendar, 
  Star, 
  Check, 
  X, 
  Grid3X3, 
  Tv, 
  Sparkle,
  Grid
} from 'lucide-react';
import { LibraryItem, Folder } from "../types";
import { formatBytes } from "../utils/mediaUtils";

interface MediaGridProps {
  items: LibraryItem[];
  folders: Folder[];
  activeFilter: string;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  onDoubleSelectItem: (item: LibraryItem) => void;
  onUploadFile: (payload: { name: string; ext: string; data: string; size: number; width: number; height: number; type: 'image' | 'video'; palette: string[] }) => Promise<void>;
  selectedTag: string | null;
}

type SortField = 'addedAt' | 'name' | 'size' | 'rating';
type SortOrder = 'asc' | 'desc';

export default function MediaGrid({
  items,
  folders,
  activeFilter,
  selectedItemId,
  setSelectedItemId,
  onDoubleSelectItem,
  onUploadFile,
  selectedTag
}: MediaGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(180); // Card width in pixels
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Filter Toolbar States
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterColor, setFilterColor] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common eagle palette list for filters
  const filterColors = [
    { value: "#ef4444", label: "红色" },
    { value: "#f59e0b", label: "橙黄色" },
    { value: "#10b981", label: "绿色" },
    { value: "#00f0ff", label: "青蓝色" },
    { value: "#3b82f6", label: "蓝色" },
    { value: "#8b5cf6", label: "紫色" },
    { value: "#ec4899", label: "粉色" },
    { value: "#ffffff", label: "白色" },
    { value: "#000000", label: "黑色" }
  ];

  // Resolve current active folder/filter title
  const activeTitle = useMemo(() => {
    if (activeFilter === "all") return "全部素材";
    if (activeFilter === "uncategorized") return "未分类素材";
    if (activeFilter === "untagged") return "未标签素材";
    if (activeFilter === "recent") return "最近添加";
    if (activeFilter === "random") return "随机探索模式";
    if (activeFilter === "trash") return "回收站";
    
    if (activeFilter.startsWith("folder-")) {
      const fId = activeFilter.replace("folder-", "");
      const currentFolder = folders.find(f => f.id === fId);
      if (currentFolder) {
        // Construct basic hierarchy path
        const pathArr = [currentFolder.name];
        let pId = currentFolder.parentId;
        let limit = 0;
        while (pId && limit < 5) {
          const pFolder = folders.find(f => f.id === pId);
          if (pFolder) {
            pathArr.unshift(pFolder.name);
            pId = pFolder.parentId;
          } else {
            break;
          }
          limit++;
        }
        return pathArr.join(" / ");
      }
    }
    return "素材空间";
  }, [activeFilter, folders]);

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      alert("仅支持图片(JPEG/PNG/GIF/SVG)或视频(MP4/WebM)格式素材！");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const ext = file.name.split(".").pop() || "png";
      const fileType = isVideo ? "video" : "image";

      // Detect natural dimensions
      let width = 1000;
      let height = 1000;
      let palette: string[] = ["#888888"];

      if (isImage) {
        // Load in image to extract details
        await new Promise<void>((resolve) => {
          const tempImg = new Image();
          tempImg.onload = () => {
            width = tempImg.naturalWidth;
            height = tempImg.naturalHeight;
            resolve();
          };
          tempImg.onerror = () => resolve();
          tempImg.src = base64Data;
        });

        // Sample dominant color palette
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = 10;
            canvas.height = 10;
            const tempImg = new Image();
            await new Promise<void>((resolve) => {
              tempImg.onload = () => {
                ctx.drawImage(tempImg, 0, 0, 10, 10);
                const rgbData = ctx.getImageData(0, 0, 10, 10).data;
                const sampleHexes = new Set<string>();
                for (let px = 0; px < rgbData.length; px += 16) {
                  const r = rgbData[px].toString(16).padStart(2, "0");
                  const g = rgbData[px+1].toString(16).padStart(2, "0");
                  const b = rgbData[px+2].toString(16).padStart(2, "0");
                  sampleHexes.add(`#${r}${g}${b}`.toUpperCase());
                }
                palette = Array.from(sampleHexes).slice(0, 4);
                resolve();
              };
              tempImg.src = base64Data;
            });
          }
        } catch {
          palette = ["#3b82f6", "#ececec"];
        }
      } else {
        width = 1920;
        height = 1080;
        palette = ["#1f1f1f", "#d4af37"];
      }

      await onUploadFile({
        name: file.name,
        ext,
        data: base64Data,
        size: file.size,
        width,
        height,
        type: fileType,
        palette
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      for (const file of files) {
        await processFile(file);
      }
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      for (const file of files) {
        await processFile(file);
      }
    }
  };

  // Convert Hex color to RGB distance to filter approximate colors
  const colorMatches = (itemPalette: string[], targetHex: string) => {
    if (!itemPalette || itemPalette.length === 0) return false;
    
    const hexToRgb = (hex: string) => {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return { r, g, b };
    };

    try {
      const target = hexToRgb(targetHex);
      return itemPalette.some(itemHex => {
        const itemRgb = hexToRgb(itemHex);
        const dist = Math.sqrt(
          Math.pow(itemRgb.r - target.r, 2) +
          Math.pow(itemRgb.g - target.g, 2) +
          Math.pow(itemRgb.b - target.b, 2)
        );
        return dist < 110; // Max visual distance variance threshold
      });
    } catch {
      return false;
    }
  };

  // MAIN FILTER LOGIC
  const filteredItems = useMemo(() => {
    let result = [...items];

    // 1. Sidebar Category filter
    if (activeFilter === "trash") {
      result = result.filter(item => item.isDeleted === true);
    } else {
      result = result.filter(item => item.isDeleted !== true);

      if (activeFilter === "uncategorized") {
        result = result.filter(item => !item.folders || item.folders.length === 0);
      } else if (activeFilter === "untagged") {
        result = result.filter(item => !item.tags || item.tags.length === 0);
      } else if (activeFilter.startsWith("folder-")) {
        const fId = activeFilter.replace("folder-", "");
        
        // Match items inside this folder OR matching its children folders recursively
        const getChildFolderIds = (parentFolderId: string): string[] => {
          const children = folders.filter(f => f.parentId === parentFolderId);
          const childIds = children.map(c => c.id);
          const grandchildrenIds = childIds.reduce((acc, cid) => [...acc, ...getChildFolderIds(cid)], [] as string[]);
          return [parentFolderId, ...childIds, ...grandchildrenIds];
        };

        const matchingFolderIds = getChildFolderIds(fId);
        result = result.filter(item => item.folders && item.folders.some(fRef => matchingFolderIds.includes(fRef)));
      }
    }

    // 2. Sidebar Tag fast-filter selection
    if (selectedTag) {
      result = result.filter(item => item.tags && item.tags.includes(selectedTag));
    }

    // 3. Search query (matches filename, comments, tags)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const nMatch = item.name.toLowerCase().includes(query);
        const aMatch = item.annotation && item.annotation.toLowerCase().includes(query);
        const tMatch = item.tags && item.tags.some(t => t.toLowerCase().includes(query));
        return nMatch || aMatch || tMatch;
      });
    }

    // 4. Format selection (all/image/video)
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }

    // 5. Star Rating filter
    if (filterRating !== null) {
      result = result.filter(item => item.rating === filterRating);
    }

    // 6. Dominant visual color selector matching
    if (filterColor !== null) {
      result = result.filter(item => colorMatches(item.palette, filterColor));
    }

    // Sort items
    if (activeFilter === "random") {
      // Sown random array seeded
      return result; // Kept in state if random triggered, simple slice/sort here
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'addedAt') {
        comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'size') {
        comparison = a.size - b.size;
      } else if (sortField === 'rating') {
        comparison = a.rating - b.rating;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [items, folders, activeFilter, selectedTag, searchQuery, filterType, filterRating, filterColor, sortField, sortOrder]);

  return (
    <div
      id="media-grid-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 bg-[#202024] flex flex-col min-w-0 relative h-full transition-all duration-200 overflow-hidden ${
        isDragging ? "ring-2 ring-blue-500 bg-[#25252b]" : ""
      }`}
    >
      {/* Search Input, Sorting & Filter Header bar */}
      <div className="h-14 border-b border-[#2d2d31] bg-[#1a1a1c]/80 backdrop-blur px-4 flex items-center justify-between gap-4 z-10 flex-shrink-0 select-none">
        
        {/* Breadcrumb path & count */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <h1 className="text-sm font-semibold truncate text-white" title={activeTitle}>{activeTitle}</h1>
          <span className="text-[10px] text-zinc-500 bg-[#2b2b2f] px-2 py-0.5 rounded-full flex-shrink-0">
            {filteredItems.length} 个项目
          </span>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          
          {/* Zoom Slider */}
          <div className="hidden sm:flex items-center gap-2 bg-[#26262a] border border-zinc-800 px-2.5 py-1 rounded-md text-xs">
            <span className="text-zinc-500 text-[10px]">-</span>
            <input
              type="range"
              min="110"
              max="280"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-18 accent-blue-500 h-1 rounded bg-zinc-700 outline-none cursor-ew-resize"
              title="缩略图尺寸"
            />
            <span className="text-zinc-500 text-[10px]">+</span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="搜索名称、备注、#标签"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 sm:w-48 bg-[#252528] border border-zinc-800 focus:border-blue-500 text-[11px] placeholder-zinc-500 text-white rounded-md pl-8 pr-3 py-1.5 focus:outline-none transition-all duration-150"
            />
            {searchQuery && (
              <X 
                size={12} 
                onClick={() => setSearchQuery("")} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer" 
              />
            )}
          </div>

          {/* Sorter Selector */}
          <div className="flex bg-[#252528] border border-zinc-800 rounded-md overflow-hidden text-xs">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-zinc-300 px-2 py-1 outline-none text-[11px] cursor-pointer"
            >
              <option value="addedAt">导入时间</option>
              <option value="name">文件名</option>
              <option value="size">文件大小</option>
              <option value="rating">评分星级</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2 border-l border-zinc-800 hover:text-white text-zinc-400 font-bold transition-colors"
              title={sortOrder === 'asc' ? '升序' : '降序'}
            >
              <ArrowUpDown size={11} />
            </button>
          </div>

          {/* Funnel Filter Options toggler */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-md border flex items-center justify-center transition-colors ${
              showFilters || filterRating || filterColor || filterType !== 'all'
                ? "bg-blue-600/20 border-blue-500 text-blue-400"
                : "bg-[#252528] border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title="筛选栏"
          >
            <SlidersHorizontal size={14} />
          </button>

          {/* Standard manual file click uploader */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden xl:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-md text-white text-xs font-medium cursor-pointer transition-colors shadow-lg shadow-blue-900/20"
          >
            <Upload size={13} />
            导入素材
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleManualUpload}
            multiple
            className="hidden"
            accept="image/*,video/*"
          />
        </div>
      </div>

      {/* FILTER TOOLBAR DRAWER */}
      {showFilters && (
        <div className="bg-[#18181a] border-b border-[#2d2d31] p-3 text-xs select-none space-y-3 z-10 animate-slide-down">
          <div className="flex flex-wrap gap-6 items-center">
            
            {/* Format Categories */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">类型:</span>
              <div className="flex bg-[#252528] rounded border border-zinc-800 p-0.5">
                {(['all', 'image', 'video'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                      filterType === t 
                        ? "bg-zinc-700 text-white" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {t === 'all' ? '全部' : t === 'image' ? '照片' : '视频'}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter Slider */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-500 mr-1.5">评分:</span>
              <button 
                onClick={() => setFilterRating(null)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${filterRating === null ? "bg-[#2563eb] text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
              >
                不限
              </button>
              {[1, 2, 3, 4, 5].map(stars => (
                <button
                  key={stars}
                  onClick={() => setFilterRating(stars)}
                  className={`p-1.5 rounded transition-all duration-100 ${
                    filterRating === stars 
                      ? "text-amber-400 bg-amber-500/10 scale-102" 
                      : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <Star size={11} fill={filterRating !== null && filterRating >= stars ? "currentColor" : "none"} />
                </button>
              ))}
            </div>

            {/* Approximate Color filter selection */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 mr-1">主色调:</span>
              <button 
                onClick={() => setFilterColor(null)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${filterColor === null ? "bg-[#2563eb] text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
              >
                全部
              </button>
              <div className="flex gap-1.5 items-center">
                {filterColors.map(col => (
                  <button
                    key={col.value}
                    onClick={() => setFilterColor(col.value)}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      filterColor === col.value 
                        ? "scale-12 w-5 h-5 ring-1 ring-blue-400 border-white" 
                        : "border-zinc-800 hover:scale-110"
                    }`}
                    style={{ backgroundColor: col.value }}
                    title={col.label}
                  />
                ))}
              </div>
            </div>

            {/* Reset Filters */}
            {(filterType !== 'all' || filterRating !== null || filterColor !== null) && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterRating(null);
                  setFilterColor(null);
                }}
                className="ml-auto text-rose-400 hover:text-rose-300 font-medium text-[11px] flex items-center gap-1 hover:underline"
              >
                <X size={12} /> 清除全部重置
              </button>
            )}

          </div>
        </div>
      )}

      {/* DRAG-AND-DROP FULL SCREEN OVERLAY FEEDBACK */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-600/10 border-4 border-dashed border-blue-500 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white mb-4 animate-bounce shadow-xl shadow-blue-900/30">
            <Upload size={32} />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">拖拽鼠标到此释放</h2>
          <p className="text-zinc-400 text-xs">自动解析并将设计素材直接导入“{activeTitle}”</p>
        </div>
      )}

      {/* ITEMS MATERIAL RENDER GRID CELL SCROLLPORT */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-16 h-16 rounded-2xl bg-[#26262a] border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 animate-pulse">
              <Grid size={24} />
            </div>
            <h3 className="text-white text-sm font-semibold mb-1">未搜索到匹配的素材</h3>
            <p className="text-zinc-500 text-xs max-w-xs mb-6">
              可以在此栏拖入本地的高质量图片和视频文件，系统将全自动计算颜色并提供标签收纳。
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="border border-zinc-700 bg-[#252528] hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              手动导入素材文件
            </button>
          </div>
        ) : (
          <div 
            id="media-grid-layout"
            className="grid gap-6 justify-start items-start"
            style={{ 
              gridTemplateColumns: `repeat(auto-fill, minmax(${zoomLevel}px, 1fr))`,
            }}
          >
            {filteredItems.map(item => {
              const isSelected = selectedItemId === item.id;
              
              return (
                <div
                  key={item.id}
                  id={`media-item-card-${item.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemId(item.id);
                  }}
                  onDoubleClick={() => onDoubleSelectItem(item)}
                  className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer bg-[#18181c] border transition-all duration-150 ${
                    isSelected
                      ? "ring-2 ring-blue-500 border-transparent shadow-lg shadow-blue-950/20"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                  style={{ width: "100%" }}
                >
                  
                  {/* Media Content Stage Section */}
                  <div className="aspect-square bg-[#101012] flex items-center justify-center overflow-hidden relative border-b border-zinc-900 select-none">
                    
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative">
                        <video
                          src={item.path}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                        {/* Video Marker Badge */}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm p-1 rounded text-white flex items-center justify-center shadow-md">
                          <VideoIcon size={11} className="text-blue-400" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.path}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                        loading="lazy"
                      />
                    )}

                    {/* Quick Info Hover Glass Board */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                      <div className="flex justify-end">
                        <span className="text-[9px] font-bold bg-[#1d4ed8] text-white px-1.5 py-0.5 rounded capitalize">
                          {item.ext}
                        </span>
                      </div>

                      {/* Display detailed ratings */}
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-300 font-mono text-[9px] bg-black/70 px-1.5 py-0.5 rounded-full">
                          {item.width} × {item.height}
                        </span>
                        {item.rating > 0 && (
                          <div className="flex gap-0.5 text-amber-400 animate-fade-in bg-black/70 p-1 rounded-full">
                            <Star size={9} fill="currentColor" />
                            <span className="text-[9px] font-bold pr-0.5">{item.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Description Info underneath */}
                  <div className="p-2.5 flex flex-col justify-between min-w-0 flex-1">
                    <span 
                      className="text-[11px] font-medium truncate text-zinc-200 group-hover:text-white" 
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <div className="flex items-center justify-between mt-1 select-none">
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {formatBytes(item.size)}
                      </span>
                      {item.tags && item.tags.length > 0 && (
                        <span className="text-[9px] text-zinc-500 max-w-[60px] truncate" title={item.tags.join(', ')}>
                          #{item.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
