import React, { useState, useEffect } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Copy, 
  Maximize, 
  Sliders, 
  CornerUpLeft, 
  Minimize2,
  Check,
  Eye,
  Calendar,
  Layers,
  Image as ImageIcon
} from "lucide-react";
import { LibraryItem } from "../types";

interface DetailViewProps {
  items: LibraryItem[]; // Current active list items shown (for prev/next sliding)
  currentItem: LibraryItem;
  onClose: () => void;
  onNavigate: (item: LibraryItem) => void;
}

export default function DetailView({
  items,
  currentItem,
  onClose,
  onNavigate
}: DetailViewProps) {
  const [zoom, setZoom] = useState(100); // Zoom scale percentage (e.g., 100%)
  const [rotation, setRotation] = useState(0); // Rotation degrees (0, 90, 180, 270)
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard navigation overrides (Left/Right arrow for prev/next item, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, currentItem]);

  // Find index of current item in active list
  const currentIndex = items.findIndex(item => item.id === currentItem.id);
  const totalCount = items.length;

  const handlePrev = () => {
    if (currentIndex > 0) {
      onNavigate(items[currentIndex - 1]);
      setZoom(100);
      setRotation(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      onNavigate(items[currentIndex + 1]);
      setZoom(100);
      setRotation(0);
    }
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Copy item link to clipboard
  const handleCopyLink = () => {
    const fullUrl = window.location.origin + currentItem.path;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Double click image resets zoom to 100% or zoom into 200%
  const handleDoubleClickImg = () => {
    if (zoom === 100) {
      setZoom(200);
    } else {
      setZoom(100);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#141416] z-50 flex flex-col text-zinc-300 select-none animate-fade-in font-sans">
      
      {/* Immersive Top Navigation Toolbar */}
      <div className="h-14 border-b border-[#2d2d31] bg-[#1a1a1c] px-4 flex items-center justify-between z-10">
        
        {/* Left Side: Back Arrow and Breadcrumb Index (e.g., < 6 / 28) */}
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#2c2c30] text-zinc-400 hover:text-white rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
            title="返回网格"
          >
            <ChevronLeft size={16} />
            <span>返回网格</span>
          </button>
          
          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Index Counter */}
          <div className="flex items-center gap-2 font-mono text-zinc-400 text-xs">
            <span className="text-zinc-500 font-bold">{currentIndex + 1}</span>
            <span className="text-zinc-700">/</span>
            <span>{totalCount}</span>
          </div>
        </div>

        {/* Center: Zoom percentage slider (exactly matching second screenshot) */}
        <div className="flex items-center gap-3 text-xs bg-[#252528] px-3 py-1.5 rounded-lg border border-zinc-800/80">
          <button onClick={() => setZoom(prev => Math.max(10, prev - 15))} className="p-1 hover:text-white text-zinc-500" title="缩小">
            <ZoomOut size={12} />
          </button>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="400"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-32 sm:w-44 accent-blue-500 h-1 bg-zinc-700 outline-none cursor-ew-resize"
            />
            <span className="font-mono text-[10px] text-zinc-400 min-w-[32px] text-right">
              {zoom}%
            </span>
          </div>
          <button onClick={() => setZoom(prev => Math.min(400, prev + 15))} className="p-1 hover:text-white text-zinc-500" title="放大">
            <ZoomIn size={12} />
          </button>
          
          <div className="h-3 w-[1px] bg-zinc-800 mx-1" />
          
          <button 
            onClick={() => { setZoom(100); setRotation(0); }} 
            className="text-[10px] text-zinc-400 hover:text-white hover:underline font-medium"
            title="恢复 1:1"
          >
            重置
          </button>
        </div>

        {/* Right Side: Toolbar action buttons */}
        <div className="flex items-center gap-3">
          
          {/* Rotate counterwise */}
          <button
            onClick={handleRotate}
            className="p-1.5 bg-[#252528] rounded border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold"
            title="旋转"
          >
            <RotateCw size={12} />
            <span>旋转</span>
          </button>

          {/* Copy URL */}
          <button
            onClick={handleCopyLink}
            className="p-1.5 bg-[#252528] rounded border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer text-[10px] flex items-center gap-1.5"
            title="复制图床链接"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400 animate-fade-in" />
                <span className="text-emerald-400">已复制</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>复制链接</span>
              </>
            )}
          </button>

          {/* Full Scale / Max Mode */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                setIsFullscreen(true);
              } else if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
              }
            }}
            className="p-1.5 bg-[#252528] rounded border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            title="全屏模式 (F11)"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize size={13} />}
          </button>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Close exit focal */}
          <button
            onClick={onClose}
            className="p-1.5 bg-rose-600 hover:bg-rose-500 rounded border border-rose-700 text-white transition-colors cursor-pointer"
            title="退出聚焦查看 (Esc)"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Main Focus Canvas stage */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden h-full">
        
        {/* Background Canvas grids to show trans-grid checkerboards */}
        <div className="absolute inset-0 bg-zinc-950 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0" }} />

        {/* Hover Slider Left Arrow controller */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-11 h-11 bg-zinc-900/60 dark:hover:bg-zinc-800 hover:text-white border border-zinc-800 flex items-center justify-center rounded-full transition-all duration-150 shadow-2xl ${
              currentIndex === 0 
                ? "opacity-20 cursor-not-allowed" 
                : "opacity-60 hover:opacity-100 cursor-pointer"
            }`}
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Hover Slider Right Arrow controller */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={handleNext}
            disabled={currentIndex === totalCount - 1}
            className={`w-11 h-11 bg-zinc-900/60 dark:hover:bg-zinc-800 hover:text-white border border-zinc-800 flex items-center justify-center rounded-full transition-all duration-150 shadow-2xl ${
              currentIndex === totalCount - 1 
                ? "opacity-20 cursor-not-allowed" 
                : "opacity-60 hover:opacity-100 cursor-pointer"
            }`}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Center Stage Display Card */}
        <div 
          className="flex items-center justify-center transition-all duration-150 ease-out p-12 max-w-full max-h-full overflow-auto scrollbar-thin"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          }}
          onDoubleClick={handleDoubleClickImg}
        >
          {currentItem.type === "video" ? (
            <video 
              src={currentItem.path} 
              autoPlay 
              controls 
              loop 
              playsInline 
              className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-zinc-800 shadow-black"
            />
          ) : (
            <img
              src={currentItem.path}
              alt={currentItem.name}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-zinc-800 shadow-black pointer-events-none select-none"
            />
          )}
        </div>

        {/* Floating properties specs details overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-4 py-2 border border-zinc-800 rounded-full text-[10px] font-mono text-zinc-400 flex items-center gap-4 shadow-2xl">
          <div className="flex items-center gap-1.5">
            <ImageIcon size={10} className="text-blue-400" />
            <span className="text-zinc-200 font-bold truncate pr-2 max-w-[150px]">{currentItem.name}</span>
          </div>
          <div className="h-2 w-[1px] bg-zinc-800" />
          <span>尺寸: {currentItem.width} × {currentItem.height}</span>
          <div className="h-2 w-[1px] bg-zinc-800" />
          <span>类型: {currentItem.ext.toUpperCase()}</span>
          <div className="h-2 w-[1px] bg-zinc-800" />
          <span className="flex items-center gap-1">类型: {currentItem.type === 'video' ? '视频' : '图像'}</span>
        </div>

      </div>

    </div>
  );
}
