import React, { useState, useEffect } from "react";
import { 
  Star, 
  Trash2, 
  Link as LinkIcon, 
  Tag as TagIcon, 
  Folder as FolderIcon,
  Plus, 
  X, 
  Layers, 
  Download, 
  Sparkles, 
  ArrowRight,
  Info,
  Calendar,
  Image as ImageIcon,
  Clock,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { LibraryItem, Folder } from "../types";
import { formatBytes, formatDate } from "../utils/mediaUtils";

interface InspectorProps {
  selectedItem: LibraryItem | null;
  folders: Folder[];
  onUpdateItem: (id: string, updates: Partial<LibraryItem>) => Promise<void>;
  onDeleteItem: (id: string, isDeleted: boolean) => Promise<void>;
  onPermanentlyDeleteItem: (id: string) => Promise<void>;
  onTriggerGeminiAnalysis: (id: string) => Promise<{ title: string; suggestedTags: string[]; suggestedNotes: string[] }>;
}

export default function Inspector({
  selectedItem,
  folders,
  onUpdateItem,
  onDeleteItem,
  onPermanentlyDeleteItem,
  onTriggerGeminiAnalysis
}: InspectorProps) {
  const [name, setName] = useState("");
  const [annotation, setAnnotation] = useState("");
  const [url, setUrl] = useState("");
  const [newTag, setNewTag] = useState("");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  
  // Gemini Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Folder selector popover
  const [showFolderSelector, setShowFolderSelector] = useState(false);

  // Sync state with selected item
  useEffect(() => {
    if (selectedItem) {
      setName(selectedItem.name);
      setAnnotation(selectedItem.annotation || "");
      setUrl(selectedItem.url || "");
      setAiError(null);
    }
  }, [selectedItem]);

  if (!selectedItem) {
    return (
      <div id="inspector-empty" className="w-68 bg-[#18181c] border-l border-[#26262a] flex-shrink-0 flex flex-col justify-center items-center text-center p-6 text-zinc-500 select-none">
        <Info size={28} className="text-zinc-700 mb-3" />
        <h3 className="text-xs font-semibold text-zinc-400 mb-1">未选中素材项目</h3>
        <p className="text-[10px] text-zinc-600 max-w-[180px]">双击可全屏模式浏览高级预览，单击任何卡片加载详细属性及标签色谱。</p>
      </div>
    );
  }

  // Handle updates on loss of focus (blur)
  const handleBlurUpdate = (field: 'name' | 'annotation' | 'url', value: string) => {
    if (selectedItem[field] !== value) {
      onUpdateItem(selectedItem.id, { [field]: value });
    }
  };

  // Add tag
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newTag.trim().replace("#", "");
    if (cleanTag && selectedItem.tags && !selectedItem.tags.includes(cleanTag)) {
      const updatedTags = [...selectedItem.tags, cleanTag];
      onUpdateItem(selectedItem.id, { tags: updatedTags });
      setNewTag("");
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedItem.tags.filter(t => t !== tagToRemove);
    onUpdateItem(selectedItem.id, { tags: updatedTags });
  };

  // Toggle rating
  const handleSetRating = (stars: number) => {
    const finalRating = selectedItem.rating === stars ? 0 : stars; // toggle off if click same
    onUpdateItem(selectedItem.id, { rating: finalRating });
  };

  // Copy Color Hex
  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  // Toggle item folder association
  const handleToggleFolderRelation = (fId: string) => {
    let currentFolders = selectedItem.folders ? [...selectedItem.folders] : [];
    if (currentFolders.includes(fId)) {
      currentFolders = currentFolders.filter(id => id !== fId);
    } else {
      currentFolders.push(fId);
    }
    onUpdateItem(selectedItem.id, { folders: currentFolders });
  };

  // Trigger server AI analysis
  const runAiEngine = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const data = await onTriggerGeminiAnalysis(selectedItem.id);
      setName(data.title);
      setAnnotation(data.suggestedNotes);
    } catch (err: any) {
      setAiError(err.message || "AI 提取失败");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download directly
  const handleDownloadFile = () => {
    const link = document.createElement("a");
    link.href = selectedItem.path;
    link.download = selectedItem.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="inspector-panel" className="w-[280px] bg-[#18181c] border-l border-[#26262a] flex flex-col h-full flex-shrink-0 text-xs overflow-y-auto scrollbar-thin select-none">
      
      {/* 1. Header Media Thumbnail previewer */}
      <div className="p-4 border-b border-[#26262a] flex flex-col gap-3">
        <div className="aspect-square bg-[#0c0c0e] rounded-lg overflow-hidden flex items-center justify-center relative border border-zinc-800 shadow-inner">
          {selectedItem.type === "video" ? (
            <video src={selectedItem.path} className="w-full h-full object-contain" muted controls />
          ) : (
            <img src={selectedItem.path} alt={selectedItem.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          )}
          
          <span className="absolute top-2 left-2 bg-[#2563eb] text-white px-1.5 py-0.5 rounded font-mono text-[9px] uppercase font-bold shadow">
            {selectedItem.ext}
          </span>
        </div>

        {/* 2. CIRCULAR DOMINANT COLOR PALETTE SPECTRA */}
        {selectedItem.palette && selectedItem.palette.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">色彩分析 (单击复制Hex)</span>
            <div className="flex gap-1.5 flex-wrap items-center">
              {selectedItem.palette.map((color, idx) => (
                <div key={idx} className="relative group/color-pip">
                  <button
                    onClick={() => handleCopyColor(color)}
                    className="w-7 h-7 rounded-full border border-zinc-950 focus:scale-110 hover:scale-105 active:scale-95 duration-100 relative cursor-pointer shadow-lg"
                    style={{ backgroundColor: color }}
                    title={`复制 ${color}`}
                  />
                  {copiedColor === color ? (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] font-sans px-1 rounded shadow -mb-1 animate-fade-in z-20 flex items-center gap-0.5 whitespace-nowrap">
                      <Check size={8} /> COPIED
                    </span>
                  ) : (
                    <span className="hidden group-hover/color-pip:block absolute bottom-full left-1/2 -translate-x-1/2 bg-[#2a2a2e] text-zinc-300 text-[8px] font-mono px-1 rounded shadow -mb-1 z-20">
                      {color}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. SCROLL BODY PROPERTIES */}
      <div className="p-4 flex-1 space-y-4">
        
        {/* Gemini AI smart extractor */}
        <div className="bg-[#212128]/75 border border-zinc-800/80 rounded-xl p-3 text-zinc-100 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-[#a855f7] tracking-wide text-[11px]">
              <Sparkles size={12} fill="#a855f7" /> Gemini AI 智能打标
            </span>
            <button
              onClick={runAiEngine}
              disabled={isAnalyzing}
              className={`px-2.5 py-1 text-[10px] rounded-md font-semibold text-white cursor-pointer shadow transition-all flex items-center gap-1 ${
                isAnalyzing 
                  ? "bg-purple-900/40 text-purple-300 cursor-not-allowed" 
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/30"
              }`}
            >
              {isAnalyzing ? "分析中..." : "一键分析"}
              <ArrowRight size={10} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            自动辨识图像风格、计算主色，提取多重中文标签，并撰写专业的艺术设计评说。
          </p>
          {aiError && (
            <span className="text-[9px] text-rose-400 bg-rose-950/20 px-2 py-1 rounded border border-rose-900/20 leading-tight">
              {aiError}
            </span>
          )}
        </div>

        {/* Name input */}
        <div className="space-y-1">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">标题名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlurUpdate('name', name)}
            placeholder="未命名素材"
            className="w-full bg-[#141416] border border-zinc-800 focus:border-blue-500 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600 text-[11px]"
          />
        </div>

        {/* Star Rating Section */}
        <div className="space-y-1">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">星级评分</label>
          <div className="flex gap-1.5 items-center">
            {[1, 2, 3, 4, 5].map(stars => (
              <button
                key={stars}
                onClick={() => handleSetRating(stars)}
                className={`p-1 hover:scale-110 active:scale-95 duration-100 rounded transition-colors ${
                  selectedItem.rating >= stars 
                    ? "text-amber-400" 
                    : "text-zinc-700 hover:text-zinc-500"
                }`}
                title={`标准评级 ${stars} 🌟`}
              >
                <Star size={16} fill={selectedItem.rating >= stars ? "currentColor" : "none"} />
              </button>
            ))}
            <span className="text-[10px] font-bold text-zinc-500 ml-1">
              {selectedItem.rating > 0 ? `${selectedItem.rating}星` : "未评分"}
            </span>
          </div>
        </div>

        {/* Text Annotation comments */}
        <div className="space-y-1">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">设计注释</label>
          <textarea
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
            onBlur={() => handleBlurUpdate('annotation', annotation)}
            placeholder="在这添加灵感纪实、排版设想或材质标注..."
            rows={4}
            className="w-full bg-[#141416] border border-zinc-800 focus:border-blue-500 rounded px-2.5 py-1.5 text-zinc-300 focus:outline-none resize-none placeholder-zinc-700 leading-relaxed text-[10px]"
          />
        </div>

        {/* Target Import Link URL */}
        <div className="space-y-1">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">来源网址 (URL)</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => handleBlurUpdate('url', url)}
              placeholder="http://..."
              className="flex-1 bg-[#141416] border border-zinc-800 focus:border-blue-500 rounded px-2.5 py-1 text-zinc-300 focus:outline-none text-[10px] font-mono leading-none"
            />
            {selectedItem.url && (
              <a
                href={selectedItem.url}
                target="_blank"
                rel="noreferrer"
                className="bg-[#242428] border border-zinc-800 hover:text-white hover:bg-zinc-700 p-1.5 rounded flex items-center justify-center text-zinc-400"
                title="跳转到网页"
              >
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Directory Connection mapping */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">所属文件夹</label>
            <button
              onClick={() => setShowFolderSelector(!showFolderSelector)}
              className="text-[#3b82f6] hover:text-blue-400 font-bold flex items-center gap-0.5 text-[10px]"
            >
              <Plus size={10} /> 分配
            </button>
          </div>

          {/* Connected Folders badges list */}
          <div className="flex flex-wrap gap-1">
            {(!selectedItem.folders || selectedItem.folders.length === 0) ? (
              <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded italic">未绑定任何文件夹</span>
            ) : (
              selectedItem.folders.map(fId => {
                const folder = folders.find(f => f.id === fId);
                return (
                  <span
                    key={fId}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] border border-zinc-700/50"
                  >
                    <FolderIcon size={9} style={{ color: folder?.color || "#3b82f6" }} fill={folder?.color || "#3b82f6"} fillOpacity={0.15} />
                    <span>{folder?.name || "未识别目录"}</span>
                    <button onClick={() => handleToggleFolderRelation(fId)} className="hover:text-rose-400 text-zinc-500">
                      <X size={8} />
                    </button>
                  </span>
                )
              })
            )}
          </div>

          {/* Directory checkover popover */}
          {showFolderSelector && (
            <div className="border border-zinc-800 bg-[#212125] p-2.5 rounded-lg max-h-48 overflow-y-auto space-y-1.5 select-none text-[10px] shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
                <span className="text-zinc-400 font-semibold flex items-center gap-1">
                  <FoldersIcon size={9} />关联映射目录
                </span>
                <button onClick={() => setShowFolderSelector(false)} className="text-zinc-500 hover:text-white">
                  <X size={10} />
                </button>
              </div>
              
              {folders.length === 0 ? (
                <div className="text-zinc-600 text-[9px] py-2 text-center">暂无文件夹，请在左侧侧栏中创建</div>
              ) : (
                <div className="space-y-1">
                  {folders.map(f => {
                    const isChecked = selectedItem.folders?.includes(f.id);
                    return (
                      <label key={f.id} className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleFolderRelation(f.id)}
                          className="accent-blue-500 rounded border-zinc-700 bg-zinc-900 w-3 h-3 focus:outline-none"
                        />
                        <FolderIcon size={10} style={{ color: f.color || "#3b82f6" }} fill={f.color} fillOpacity={0.15} />
                        <span className="truncate">{f.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Managed Tag Lists badges */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">管理标签</label>
          <div className="flex flex-wrap gap-1.5">
            {selectedItem.tags && selectedItem.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 bg-[#252528] hover:bg-[#323236] border border-zinc-800 text-zinc-300 rounded px-2 py-0.5 text-[10px] font-medium duration-100"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-zinc-500 hover:text-rose-400"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddTag} className="flex gap-1.5 mt-1.5">
            <input
              type="text"
              placeholder="+ 添加标签（回车键存盘）"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 bg-[#141416] border border-zinc-800 focus:border-blue-500 rounded px-2 py-1 text-zinc-300 focus:outline-none text-[10px] placeholder-zinc-700 font-sans"
            />
          </form>
        </div>

        {/* 4. TECHNICAL BASIC SPECIFICATIONS FIELDS */}
        <div className="pt-4 border-t border-zinc-800 space-y-2.5 text-[10px] text-zinc-500">
          <span className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">文件属性信息</span>
          
          <div className="flex justify-between items-center">
            <span>素材尺寸</span>
            <span className="font-mono text-zinc-300">{selectedItem.width} × {selectedItem.height} 像素</span>
          </div>

          <div className="flex justify-between items-center">
            <span>文件格式</span>
            <span className="text-zinc-300 uppercase font-bold">{selectedItem.ext}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>占用体积</span>
            <span className="font-mono text-zinc-300">{formatBytes(selectedItem.size)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>导入本地</span>
            <span className="font-mono text-zinc-300">{formatDate(selectedItem.addedAt)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>初始创建</span>
            <span className="font-mono text-zinc-300">{formatDate(selectedItem.createdAt)}</span>
          </div>

          <div className="flex justify-between items-center flex-wrap">
            <span>素材类型</span>
            <span className="text-zinc-300 capitalize">{selectedItem.type === 'video' ? '多媒体视频' : '图形设计图'}</span>
          </div>
        </div>

      </div>

      {/* 5. Bottom Operation Actions Area */}
      <div className="p-3 bg-[#131316] border-t border-[#26262a] flex gap-2.5 flex-shrink-0 select-none">
        <button
          onClick={handleDownloadFile}
          className="flex-1 border border-zinc-800 bg-[#252528] text-zinc-400 hover:text-white hover:bg-zinc-700 py-1.5 rounded flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer"
          title="导出物理原文件"
        >
          <Download size={13} />
          <span>导出原文件</span>
        </button>

        {selectedItem.isDeleted ? (
          <button
            onClick={() => {
              if (confirm("确定要永久删除此素材原文件吗？操作不可恢复。")) {
                onPermanentlyDeleteItem(selectedItem.id);
              }
            }}
            className="flex-1 bg-red-950/20 hover:bg-rose-900 border border-red-900 text-rose-400 hover:text-white py-1.5 rounded flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer"
            title="永久删除"
          >
            <Trash2 size={13} />
            <span>彻底删除</span>
          </button>
        ) : (
          <button
            onClick={() => onDeleteItem(selectedItem.id, true)}
            className="border border-red-950 text-rose-500/80 hover:text-white bg-red-950/10 hover:bg-rose-950/60 p-2 rounded flex items-center justify-center transition-colors cursor-pointer"
            title="扔至回收站"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

    </div>
  );
}

// Subcomponent Folder tree helper icon
function FoldersIcon(props: { className?: string; size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size} 
      height={props.size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={props.className}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
    </svg>
  );
}
