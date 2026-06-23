import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

let myFilename = "";
let myDirname = "";

try {
  // @ts-ignore
  if (typeof import.meta !== "undefined" && import.meta.url) {
    // @ts-ignore
    myFilename = fileURLToPath(import.meta.url);
    myDirname = path.dirname(myFilename);
  } else {
    myFilename = typeof __filename !== "undefined" ? __filename : "";
    myDirname = typeof __dirname !== "undefined" ? __dirname : "";
  }
} catch (e) {
  myFilename = typeof __filename !== "undefined" ? __filename : "";
  myDirname = typeof __dirname !== "undefined" ? __dirname : "";
}


const app = express();
const PORT = 3000;

// Body size limit configurations to support high-quality base64 image and video uploads
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ limit: "60mb", extended: true }));

const LIBRARY_DIR = path.join(process.cwd(), "library");
const FILES_DIR = path.join(LIBRARY_DIR, "files");
const METADATA_PATH = path.join(LIBRARY_DIR, "metadata.json");

// Define basic directories
if (!fs.existsSync(LIBRARY_DIR)) {
  fs.mkdirSync(LIBRARY_DIR, { recursive: true });
}
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Seed mock data if metadata doesn't exist
const initialFolders = [
  { id: "folder-2026", name: "2026", parentId: null, color: "#a1a1aa" },
  { id: "folder-2026-01", name: "1月", parentId: "folder-2026", color: "#3b82f6" },
  { id: "folder-2026-02", name: "2月", parentId: "folder-2026", color: "#10b981" },
  { id: "folder-2026-03", name: "3月", parentId: "folder-2026", color: "#f59e0b" },
  { id: "folder-sucai", name: "素材库", parentId: null, color: "#6366f1" },
  { id: "folder-sucai-guangxiao", name: "光效叠加", parentId: "folder-sucai", color: "#ec4899" },
  { id: "folder-sucai-faxian", name: "法线背景", parentId: "folder-sucai", color: "#8b5cf6" },
  { id: "folder-sucai-minimal", name: "极简产品", parentId: "folder-sucai", color: "#14b8a6" }
];

const mockItemsTemplate = [
  {
    name: "Vitamin Bottle",
    url: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=1000",
    ext: "jpg",
    tags: ["保健品", "包装", "产品", "橙色", "极简"],
    folders: ["folder-2026-01", "folder-sucai-minimal"],
    rating: 5,
    palette: ["#E2824C", "#FFFFFF", "#3D3A3B", "#BAC5C6"],
    annotation: "这是一款极简风格的褪黑色素维他命包装设计。白色的底子配上柔和的橙色，显得很有亲和力。",
    type: "image" as const
  },
  {
    name: "Cosmetic Soap Jar",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1000",
    ext: "jpg",
    tags: ["化妆品", "材质", "水蓝色", "精选"],
    folders: ["folder-2026-01", "folder-sucai-minimal"],
    rating: 4,
    palette: ["#86AEB3", "#FFFFFF", "#CADBD9", "#415053"],
    annotation: "奢华护肤肥皂包装设计。色调为高级的水蓝色与白色。适合用于极简风格的化妆品排版。",
    type: "image" as const
  },
  {
    name: "Glass Perfume Bottle",
    url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1000",
    ext: "jpg",
    tags: ["香水", "玻璃", "精致", "光效"],
    folders: ["folder-2026-02", "folder-sucai-guangxiao"],
    rating: 5,
    palette: ["#A18C7E", "#2B1D28", "#E6DFD9", "#58484B"],
    annotation: "背光下的高端香水玻璃瓶。带有细腻的水雾质感与温和的金黄色背景光，表现力极强。",
    type: "image" as const
  },
  {
    name: "Matte Black Headphones",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000",
    ext: "jpg",
    tags: ["数码", "耳机", "暗黑风", "摄影"],
    folders: ["folder-2026-02", "folder-sucai-faxian"],
    rating: 4,
    palette: ["#1F2022", "#E8A33B", "#8C8C8C", "#B8B5B1"],
    annotation: "哑光黑的高保真无线物理降噪耳机，配亮黄色圆环点缀，极富街头运动科技感。",
    type: "image" as const
  },
  {
    name: "Retro Style Sunglasses",
    url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1000",
    ext: "jpg",
    tags: ["眼镜", "极简", "高对比", "配件"],
    folders: ["folder-2026-03", "folder-sucai-minimal"],
    rating: 5,
    palette: ["#EAD750", "#1E1E1E", "#FCFCFC", "#808285"],
    annotation: "复古黄色粗框墨镜。在强光白色背景下呈现清晰分明的硬核轮廓，非常适合作现代潮牌设计参考。",
    type: "image" as const
  },
  {
    name: "Studio Ceramic Vase",
    url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1000",
    ext: "jpg",
    tags: ["家居", "陶瓷", "植物", "静物"],
    folders: ["folder-2026-03", "folder-sucai-minimal"],
    rating: 3,
    palette: ["#CAD7C4", "#526B50", "#FFFFFF", "#1B221A"],
    annotation: "莫兰迪绿薄荷色陶瓷花盆，搭配极简生长的空气凤梨，展示柔和清新的居家美学。",
    type: "image" as const
  },
  {
    name: "Gold Coin Spin Loop",
    url: "https://assets.mixkit.co/videos/preview/mixkit-spinning-gold-coin-on-black-background-41712-large.mp4",
    ext: "mp4",
    tags: ["3D", "金币", "动画", "循环", "黑色背景"],
    folders: ["folder-sucai-faxian"],
    rating: 5,
    palette: ["#000000", "#F6D14B", "#68531A", "#858586"],
    annotation: "3D渲染金币在黑色背景下平滑旋转的循环视频。极具质感，适合用于金融概念及动效界面设计。",
    type: "video" as const
  },
  {
    name: "Neon Laser Tunnel Loop",
    url: "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-42171-large.mp4",
    ext: "mp4",
    tags: ["霓虹", "光效", "科幻", "循环"],
    folders: ["folder-sucai-guangxiao"],
    rating: 4,
    palette: ["#000000", "#FF007F", "#00F0FF", "#3F185E"],
    annotation: "粉红与冰蓝交驳的霓虹激光隧道穿梭视频，可循环，常用于电音节大屏幕及赛博朋克风格素材叠加。",
    type: "video" as const
  }
];

// Read/write functions
function getMetadata() {
  if (fs.existsSync(METADATA_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8"));
    } catch (e) {
      console.error("Error reading metadata, resetting file", e);
    }
  }
  const defaultState = { items: [], folders: initialFolders };
  fs.writeFileSync(METADATA_PATH, JSON.stringify(defaultState, null, 2), "utf-8");
  return defaultState;
}

function saveMetadata(data: any) {
  fs.writeFileSync(METADATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Background seed loader
async function seedLibrary() {
  const meta = getMetadata();
  if (meta.items.length > 0) {
    return; // Already initialized
  }

  console.log("Seeding library template with beautiful default imagery and video elements...");
  const seededItems: any[] = [];

  for (let i = 0; i < mockItemsTemplate.length; i++) {
    const orig = mockItemsTemplate[i];
    const localId = `seeded-${i}-${Date.now()}`;
    const filename = `${localId}.${orig.ext}`;
    const targetFilePath = path.join(FILES_DIR, filename);

    try {
      console.log(`Downloading seed item ${i+1}/${mockItemsTemplate.length}: ${orig.name}`);
      const res = await fetch(orig.url);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(targetFilePath, buffer);

      seededItems.push({
        id: localId,
        name: `${orig.name}.${orig.ext}`,
        ext: orig.ext,
        url: orig.url,
        annotation: orig.annotation,
        tags: orig.tags,
        folders: orig.folders,
        isDeleted: false,
        rating: orig.rating,
        palette: orig.palette,
        width: orig.type === 'image' ? 1000 : 1920,
        height: orig.type === 'image' ? 1000 : 1080,
        size: buffer.length,
        createdAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000).toISOString(),
        addedAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000).toISOString(),
        type: orig.type,
        path: `/library/files/${filename}`
      });
    } catch (e) {
      console.error(`Failed to download seed item ${orig.name}:`, e);
      // Fallback: Write a tiny mock image or text
      const fallbackText = `Fallback content for ${orig.name}`;
      fs.writeFileSync(targetFilePath, Buffer.from(fallbackText));
      
      seededItems.push({
        id: localId,
        name: `${orig.name}.${orig.ext}`,
        ext: orig.ext,
        url: orig.url,
        annotation: `[本地网络故障 - 占位符] ${orig.annotation}`,
        tags: orig.tags,
        folders: orig.folders,
        isDeleted: false,
        rating: orig.rating,
        palette: orig.palette,
        width: 800,
        height: 600,
        size: fallbackText.length,
        createdAt: new Date().toISOString(),
        addedAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        type: orig.type,
        path: `/library/files/${filename}`
      });
    }
  }

  meta.items = seededItems;
  saveMetadata(meta);
  console.log(`Completed seeding. ${seededItems.length} design files loaded on startup disk.`);
}

// Trigger Seeding in the background so Express starts quickly
seedLibrary().catch(err => console.error("Error seeding library:", err));

// Serve Library Uploaded Files
app.use("/library/files", express.static(FILES_DIR));

// ----------------------------------------
// API ENDPOINTS
// ----------------------------------------

// GET folders
app.get("/api/folders", (req, res) => {
  const meta = getMetadata();
  res.json(meta.folders);
});

// POST create folder
app.post("/api/folders", (req, res) => {
  const { name, parentId, color } = req.body;
  if (!name) {
    return res.status(400).json({ error: "目录名称为必填项" });
  }

  const meta = getMetadata();
  const newFolder = {
    id: `folder-${Date.now()}`,
    name,
    parentId: parentId || null,
    color: color || "#a1a1aa"
  };

  meta.folders.push(newFolder);
  saveMetadata(meta);
  res.json(newFolder);
});

// POST edit folder (rename / recolor / change parenting hierarchy)
app.post("/api/folders/update", (req, res) => {
  const { id, name, parentId, color } = req.body;
  if (!id) return res.status(400).json({ error: "Folder ID required" });

  const meta = getMetadata();
  const folder = meta.folders.find((f: any) => f.id === id);
  if (!folder) return res.status(404).json({ error: "Folder not found" });

  if (name !== undefined) folder.name = name;
  if (parentId !== undefined) folder.parentId = parentId || null;
  if (color !== undefined) folder.color = color;

  saveMetadata(meta);
  res.json(folder);
});

// POST delete folder
app.post("/api/folders/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Folder ID required" });

  const meta = getMetadata();
  // Filter out the folder itself
  meta.folders = meta.folders.filter((f: any) => f.id !== id);

  // For subfolders, either delete them or unparent them
  meta.folders.forEach((f: any) => {
    if (f.parentId === id) {
      f.parentId = null; // Unparent
    }
  });

  // For items, remove this folder reference
  meta.items.forEach((item: any) => {
    item.folders = item.folders.filter((fId: string) => fId !== id);
  });

  saveMetadata(meta);
  res.json({ success: true, deletedId: id });
});

// GET items list
app.get("/api/items", (req, res) => {
  const meta = getMetadata();
  res.json(meta.items);
});

// POST upload file (Accept base64 body)
app.post("/api/upload", (req, res) => {
  const { name, ext, data, size, type, width, height, palette } = req.body;
  if (!name || !data) {
    return res.status(400).json({ error: "文件名和数据内容为必填项" });
  }

  const cleanBase64 = data.replace(/^data:.*?;base64,/, "");
  const binaryBuffer = Buffer.from(cleanBase64, "base64");

  const cleanExt = ext || name.split(".").pop() || "png";
  const itemId = `item-${Date.now()}`;
  const localFileName = `${itemId}.${cleanExt.toLowerCase()}`;
  const targetPath = path.join(FILES_DIR, localFileName);

  fs.writeFileSync(targetPath, binaryBuffer);

  const meta = getMetadata();
  const newItem = {
    id: itemId,
    name: name,
    ext: cleanExt.toLowerCase(),
    url: "",
    annotation: "",
    tags: [],
    folders: [],
    isDeleted: false,
    rating: 0,
    palette: palette || ["#888888"],
    width: width || 800,
    height: height || 600,
    size: size || binaryBuffer.length,
    createdAt: new Date().toISOString(),
    addedAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    type: type === "video" ? ("video" as const) : ("image" as const),
    path: `/library/files/${localFileName}`
  };

  meta.items.push(newItem);
  saveMetadata(meta);

  res.json(newItem);
});

// POST update item metadata
app.post("/api/items/update", (req, res) => {
  const { id, updates } = req.body;
  if (!id || !updates) {
    return res.status(400).json({ error: "Missing ID or update payload" });
  }

  const meta = getMetadata();
  const index = meta.items.findIndex((item: any) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  const currentItem = meta.items[index];
  const fields = ["name", "annotation", "rating", "tags", "folders", "palette", "url", "isDeleted"];

  fields.forEach(field => {
    if (updates[field] !== undefined) {
      currentItem[field] = updates[field];
    }
  });

  currentItem.modifiedAt = new Date().toISOString();
  meta.items[index] = currentItem;
  saveMetadata(meta);

  res.json(currentItem);
});

// POST toggle bulk/single item deleting
app.post("/api/items/delete", (req, res) => {
  const { id, isDeleted } = req.body;
  if (!id) return res.status(400).json({ error: "Item ID required" });

  const meta = getMetadata();
  const index = meta.items.findIndex((item: any) => item.id === id);
  if (index === -1) return res.status(404).json({ error: "Item not found" });

  meta.items[index].isDeleted = isDeleted !== undefined ? isDeleted : true;
  meta.items[index].modifiedAt = new Date().toISOString();

  saveMetadata(meta);
  res.json(meta.items[index]);
});

// POST empty trash bin (Permanently delete static file on disk)
app.post("/api/trash/empty", (req, res) => {
  const meta = getMetadata();
  const toDelete = meta.items.filter((item: any) => item.isDeleted === true);
  const toKeep = meta.items.filter((item: any) => item.isDeleted !== true);

  let successCount = 0;
  toDelete.forEach((item: any) => {
    const filename = path.basename(item.path);
    const diskPath = path.join(FILES_DIR, filename);
    try {
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
      successCount++;
    } catch (err) {
      console.error(`Error deleting disk file ${filename}:`, err);
    }
  });

  meta.items = toKeep;
  saveMetadata(meta);
  res.json({ success: true, count: successCount });
});

// POST Gemini Smart Analysis Endpoint
app.post("/api/gemini/analyze", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Item ID required" });

  const meta = getMetadata();
  const item = meta.items.find((item: any) => item.id === id);
  if (!item) return res.status(404).json({ error: "Item not found in library" });

  if (!ai) {
    return res.json({
      fallback: true,
      error_message: "No Gemini API key supplied in Settings > Secrets. Using client-side basic tagging.",
      suggestedTags: ["精选", item.ext.toUpperCase(), item.type === "video" ? "循环动效" : "图像素材"],
      suggestedNotes: `这是一个 ${item.type === 'video' ? '视频' : '图片'} 原文件。要启用高科技 AI 自动打标签和背景分析功能，请在 Settings > Secrets 菜单配置 GEMINI_API_KEY。`
    });
  }

  const filename = path.basename(item.path);
  const filePath = path.join(FILES_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Disk file not found" });
  }

  try {
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString("base64");

    let prompt = "";
    let contents: any;

    if (item.type === "image") {
      prompt = `
      你是一个专门为创意素材管理器（类似 Eagle）服务的 AI 标注助手。
      请仔细分析以下上传的产品/素材图片，并提供以下字段的JSON返回：
      1. title (string): 为该图片起一个优美、精炼、贴切的中文名称（如“橙味褪黑色素瓶包装设计”）
      2. tags (array of strings): 5-10个最贴合该图片类别、色彩、材质、应用场景、风格的中文标签（单个标签不超过6个字，如“化妆品”, “极简设计”, “哑光质感”, “3D渲染”, “复古黄”）
      3. notes (string): 一段 50-100 字的精美设计评说或细节标注。

      必须严格以 JSON 格式返回，包含 title, tags, 和 notes 字段。
      `;

      contents = {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: `image/${item.ext === 'jpg' ? 'jpeg' : item.ext}`
            }
          },
          { text: prompt }
        ]
      };
    } else {
      // For videos, describe conceptually
      prompt = `
      你是一个创意多媒体助手。以下是视频素材的文件名："${item.name}"，标签为：${JSON.stringify(item.tags)}。
      请为该视频生成：
      1. title: 合适的精美中文命名。
      2. tags: 5-8个高级多媒体视频技术和视觉风格标签。
      3. notes: 该视频的场景用途建议。
      请返回 JSON 格式，包含 title, tags, notes。
      `;
      contents = prompt;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            notes: { type: Type.STRING }
          },
          required: ["title", "tags", "notes"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);

    res.json({
      success: true,
      title: data.title || item.name,
      suggestedTags: data.tags || [],
      suggestedNotes: data.notes || ""
    });
  } catch (err: any) {
    console.error("Gemini analysis error:", err);
    res.status(500).json({ error: "AI 分析服务暂时不可用: " + err.message });
  }
});

// Vite & Static Client server pipeline setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted up and running on http://localhost:${PORT}`);
  });
}

startServer();
